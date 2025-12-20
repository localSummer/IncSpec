/**
 * archive command - Archive spec files
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
} from '../lib/config.mjs';
import { archiveSpec, getSpecInfo } from '../lib/spec.mjs';
import { archiveWorkflow, readWorkflow, STATUS, isQuickMode, MODE } from '../lib/workflow.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printError,
  confirm,
} from '../lib/terminal.mjs';

// Full mode: steps 1, 2, 3, 4, 6 (0-based: 0, 1, 2, 3, 5)
const FULL_MODE_ARCHIVABLE_INDEXES = [0, 1, 2, 3, 5];
// Quick mode: steps 1, 2, 6 (0-based: 0, 1, 5)
const QUICK_MODE_ARCHIVABLE_INDEXES = [0, 1, 5];

/**
 * Get archivable step indexes based on workflow mode
 * @param {Object} workflow
 * @returns {number[]}
 */
function getArchivableStepIndexes(workflow) {
  if (isQuickMode(workflow)) {
    return QUICK_MODE_ARCHIVABLE_INDEXES;
  }
  return FULL_MODE_ARCHIVABLE_INDEXES;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOutputName(outputFile) {
  if (!outputFile || typeof outputFile !== 'string') {
    return outputFile;
  }

  if (!/[\\/]/.test(outputFile)) {
    return outputFile;
  }

  const parts = outputFile.split(/[/\\]+/);
  return parts[parts.length - 1] || outputFile;
}

function collectArchivedFiles(projectRoot) {
  const archiveRoot = path.join(projectRoot, INCSPEC_DIR, DIRS.archives);
  if (!fs.existsSync(archiveRoot)) {
    return [];
  }

  const files = [];
  
  // Helper to collect .md files from a directory
  const collectMdFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({ name: entry.name, mtime: fs.statSync(entryPath).mtime });
      }
    });
  };
  
  // Traverse: archives/ -> YYYY-MM/ -> [module/] -> files
  const topEntries = fs.readdirSync(archiveRoot, { withFileTypes: true });
  topEntries.forEach(entry => {
    const entryPath = path.join(archiveRoot, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md')) {
      // Legacy: files directly in archives/
      files.push({ name: entry.name, mtime: fs.statSync(entryPath).mtime });
      return;
    }

    if (!entry.isDirectory()) {
      return;
    }

    // Level 1: YYYY-MM directory
    const subEntries = fs.readdirSync(entryPath, { withFileTypes: true });
    subEntries.forEach(subEntry => {
      const subPath = path.join(entryPath, subEntry.name);
      if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
        // Legacy: files directly in YYYY-MM/
        files.push({ name: subEntry.name, mtime: fs.statSync(subPath).mtime });
        return;
      }

      if (subEntry.isDirectory()) {
        // Level 2: module directory - collect files inside
        collectMdFiles(subPath);
      }
    });
  });

  return files;
}

function parseWorkflowTime(value) {
  if (!value || value === '-') {
    return null;
  }

  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isOutputArchived(archivedFiles, outputFile, completedAt) {
  const ext = path.extname(outputFile);
  const base = path.basename(outputFile, ext);
  const pattern = new RegExp(`^${escapeRegExp(base)}(-copy\\d+)?${escapeRegExp(ext)}$`);
  return archivedFiles.some(file => pattern.test(file.name) && file.mtime >= completedAt);
}

function getArchivableOutputs(workflow) {
  if (!workflow?.currentWorkflow || !workflow.steps?.length) {
    return null;
  }

  const archivableIndexes = getArchivableStepIndexes(workflow);
  const outputs = [];

  for (const index of archivableIndexes) {
    const step = workflow.steps[index];
    if (!step || step.status !== STATUS.COMPLETED || !step.output || step.output === '-') {
      return null;
    }

    const completedAt = parseWorkflowTime(step.completedAt);
    if (!completedAt) {
      return null;
    }

    outputs.push({ name: normalizeOutputName(step.output), completedAt, index });
  }

  return outputs;
}

function getOutputDirForStepIndex(stepIndex) {
  if (stepIndex === 0 || stepIndex === 5) {
    return DIRS.baselines;
  }

  if (stepIndex === 1 || stepIndex === 2) {
    return DIRS.requirements;
  }

  if (stepIndex === 3) {
    return DIRS.increments;
  }

  return null;
}

function getOutputPath(projectRoot, output) {
  const dir = getOutputDirForStepIndex(output.index);
  if (!dir) {
    return null;
  }

  return path.join(projectRoot, INCSPEC_DIR, dir, output.name);
}

function shouldArchiveWorkflow(projectRoot, workflow) {
  const outputs = getArchivableOutputs(workflow);
  if (!outputs || outputs.length === 0) {
    return false;
  }

  const archivedFiles = collectArchivedFiles(projectRoot);
  if (archivedFiles.length === 0) {
    return false;
  }

  return outputs.every(output => isOutputArchived(archivedFiles, output.name, output.completedAt));
}

/**
 * Execute archive command
 * @param {Object} ctx - Command context
 */
export async function archiveCommand(ctx) {
  const { cwd, args, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  print('');
  print(colorize('  incspec 归档管理', colors.bold, colors.cyan));
  print(colorize('  ────────────────', colors.dim));
  print('');

  const keepOriginal = options.keep || options.k;
  const skipConfirm = options.yes || options.y;
  const archiveCurrentWorkflow = options.workflow || !args[0];

  if (archiveCurrentWorkflow) {
    if (options.workflow && args[0]) {
      printWarning('已忽略文件参数，按当前工作流归档。');
    }

    const workflow = readWorkflow(projectRoot);
    if (!workflow?.currentWorkflow) {
      printError('没有活跃工作流，无法归档当前工作流产出。');
      print(colorize('如需归档单文件，请提供 file-path。', colors.dim));
      return;
    }

    const outputs = getArchivableOutputs(workflow);
    if (!outputs || outputs.length === 0) {
      printError('当前工作流尚未产出完整的可归档文件。');
      print(colorize('请先完成工作流产出，或使用 file-path 归档单文件。', colors.dim));
      return;
    }

    const archivedFiles = collectArchivedFiles(projectRoot);
    const targets = [];
    const skipped = [];
    const missing = [];

    outputs.forEach(output => {
      const outputPath = getOutputPath(projectRoot, output);
      if (outputPath && fs.existsSync(outputPath)) {
        targets.push({ path: outputPath, name: output.name });
        return;
      }

      if (isOutputArchived(archivedFiles, output.name, output.completedAt)) {
        skipped.push(output.name);
        return;
      }

      missing.push(output.name);
    });

    if (missing.length > 0) {
      printError(`以下产出文件未找到: ${missing.join(', ')}`);
      return;
    }

    if (targets.length > 0) {
      print(colorize('将归档以下文件:', colors.dim));
      targets.forEach(target => print(colorize(`  - ${target.name}`, colors.dim)));
      print('');
    }

    if (skipped.length > 0) {
      printWarning(`以下文件已归档，跳过: ${skipped.join(', ')}`);
    }

    if (targets.length > 0 && !skipConfirm) {
      const action = keepOriginal ? '复制' : '移动';
      const shouldProceed = await confirm(`确认${action}当前工作流的 ${targets.length} 个文件到归档目录?`);
      if (!shouldProceed) {
        print(colorize('已取消。', colors.dim));
        return;
      }
    }

    try {
      const workflowModule = workflow.currentWorkflow;
      for (const target of targets) {
        const archivePath = archiveSpec(projectRoot, target.path, !keepOriginal, workflowModule);
        printSuccess(`文件已${keepOriginal ? '复制' : '移动'}到: ${archivePath}`);
      }

      const refreshed = readWorkflow(projectRoot);
      if (refreshed?.currentWorkflow && shouldArchiveWorkflow(projectRoot, refreshed)) {
        const workflowName = refreshed.currentWorkflow;
        archiveWorkflow(projectRoot);
        printSuccess(`工作流 "${workflowName}" 已记录为归档。`);
      }
    } catch (e) {
      printError(`归档失败: ${e.message}`);
    }

    return;
  }

  // Get file to archive
  let filePath = args[0];

  if (!filePath) {
    printError('请提供要归档的文件路径。');
    return;
  }

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    // Try to resolve relative path
    const possiblePaths = [
      path.join(projectRoot, filePath),
      path.join(projectRoot, INCSPEC_DIR, filePath),
      path.join(projectRoot, INCSPEC_DIR, DIRS.baselines, filePath),
      path.join(projectRoot, INCSPEC_DIR, DIRS.increments, filePath),
      path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, filePath),
    ];

    const found = possiblePaths.find(p => fs.existsSync(p));
    if (found) {
      filePath = found;
    } else {
      printError(`文件不存在: ${filePath}`);
      return;
    }
  }

  const fileName = path.basename(filePath);
  const info = getSpecInfo(filePath);

  print(colorize(`文件: ${fileName}`, colors.bold));
  print(colorize(`类型: ${info.type}`, colors.dim));
  if (info.version) {
    print(colorize(`版本: v${info.version}`, colors.dim));
  }
  print('');

  // Confirm
  const action = keepOriginal ? '复制' : '移动';

  if (!skipConfirm) {
    const shouldProceed = await confirm(`确认${action}文件到归档目录?`);
    if (!shouldProceed) {
      print(colorize('已取消。', colors.dim));
      return;
    }
  }

  // Archive (default: move, with --keep: copy)
  try {
    const workflow = readWorkflow(projectRoot);
    const workflowModule = workflow?.currentWorkflow || null;
    const archivePath = archiveSpec(projectRoot, filePath, !keepOriginal, workflowModule);
    printSuccess(`文件已${action}到: ${archivePath}`);

    if (workflow?.currentWorkflow && shouldArchiveWorkflow(projectRoot, workflow)) {
      const workflowName = workflow.currentWorkflow;
      archiveWorkflow(projectRoot);
      printSuccess(`工作流 "${workflowName}" 已记录为归档。`);
    }
  } catch (e) {
    printError(`归档失败: ${e.message}`);
  }
}
