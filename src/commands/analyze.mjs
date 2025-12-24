/**
 * analyze command - Step 1: Analyze code workflow
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
} from '../lib/config.mjs';
import {
  readWorkflow,
  startWorkflow,
  updateStep,
  STATUS,
  MODE,
  getStepInfo,
  isWorkflowIncomplete,
  getWorkflowProgress,
} from '../lib/workflow.mjs';
import { getModeLabel, formatModeInfo } from '../lib/mode-utils.mjs';
import { getNextVersion } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  printError,
  prompt,
  confirm,
} from '../lib/terminal.mjs';

const STEP_NUMBER = 1;

/**
 * Search for a file in the archives directory
 * @param {string} projectRoot - Project root path
 * @param {string} fileName - File name to search
 * @returns {string|null} - Full path if found, null otherwise
 */
function findInArchives(projectRoot, fileName) {
  const archivesDir = path.join(projectRoot, INCSPEC_DIR, DIRS.archives);
  if (!fs.existsSync(archivesDir)) {
    return null;
  }

  // Recursive search: archives/ -> YYYY-MM/ -> [module/] -> files
  const monthDirs = fs.readdirSync(archivesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
    .reverse(); // Prioritize recent months

  for (const month of monthDirs) {
    const monthPath = path.join(archivesDir, month);

    // Check files directly in month directory
    const directPath = path.join(monthPath, fileName);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    // Check module subdirectories
    const subDirs = fs.readdirSync(monthPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const subDir of subDirs) {
      const subPath = path.join(monthPath, subDir.name, fileName);
      if (fs.existsSync(subPath)) {
        return subPath;
      }
    }
  }

  return null;
}

/**
 * Execute analyze command
 * @param {Object} ctx - Command context
 */
export async function analyzeCommand(ctx) {
  const { cwd, args, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Handle --complete flag as independent mode (skip all interactive flows)
  if (options.complete) {
    const workflow = readWorkflow(projectRoot);
    if (!workflow?.currentWorkflow) {
      printError('没有活跃的工作流，无法标记完成。');
      process.exit(1);
    }
    const output = typeof options.output === 'string' ? options.output : null;
    if (!output) {
      printError('请通过 --output 指定输出文件名。');
      process.exit(1);
    }
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, output);
    printSuccess(`步骤 ${STEP_NUMBER} 已标记为完成: ${output}`);
    return;
  }

  // Handle --baseline option: use existing baseline report
  if (options.baseline) {
    const baselineFile = typeof options.baseline === 'string' ? options.baseline : '';
    if (!baselineFile) {
      printError('请指定基准报告文件名');
      process.exit(1);
    }

    const baselinesDir = path.join(projectRoot, INCSPEC_DIR, DIRS.baselines);
    const baselinePath = path.join(baselinesDir, baselineFile);
    let fromArchive = false;

    // 1. First check baselines directory
    if (!fs.existsSync(baselinePath)) {
      // 2. Search in archives directory
      const archivePath = findInArchives(projectRoot, baselineFile);
      if (!archivePath) {
        printError(`基准文件不存在: ${baselineFile}`);
        printInfo('已搜索 baselines/ 和 archives/ 目录');
        process.exit(1);
      }

      // 3. Move to baselines directory
      fs.renameSync(archivePath, baselinePath);
      fromArchive = true;
      printInfo(`已从归档恢复: ${path.relative(projectRoot, archivePath)}`);
    }

    // Infer module name from filename (xxx-baseline-vN.md -> xxx)
    let moduleName = typeof options.module === 'string' ? options.module : '';
    if (!moduleName) {
      const match = baselineFile.match(/^(.+)-baseline-v\d+\.md$/);
      moduleName = match ? match[1] : path.basename(baselineFile, '.md');
    }

    // Handle workflow state
    let workflow = readWorkflow(projectRoot);
    const mode = options.minimal ? MODE.MINIMAL : 
                 options.quick || options.q ? MODE.QUICK : MODE.FULL;
    if (!workflow?.currentWorkflow) {
      const workflowName = typeof options.workflow === 'string' ? options.workflow : `analyze-${moduleName}`;
      workflow = startWorkflow(projectRoot, workflowName, { mode });
      const modeLabel = getModeLabel(mode);
      printSuccess(`已创建新工作流: ${workflowName} ${modeLabel}`);
    }

    // Mark step as completed
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, baselineFile);
    print('');
    printSuccess(`已使用现有基准报告: ${baselineFile}`);
    printInfo(`运行 'incspec status' 查看进度`);
    return;
  }

  // Get source path
  let sourcePath = args[0];
  if (!sourcePath) {
    sourcePath = await prompt('请输入要分析的源代码路径', 'src');
  }

  // Get module name
  let moduleName = typeof options.module === 'string' ? options.module : '';
  if (!moduleName) {
    moduleName = path.basename(sourcePath);
  }

  // Get workflow state
  let workflow = readWorkflow(projectRoot);
  const mode = options.minimal ? MODE.MINIMAL : 
               options.quick || options.q ? MODE.QUICK : MODE.FULL;

  // Check if starting new workflow
  if (!workflow?.currentWorkflow) {
    let workflowName = typeof options.workflow === 'string' ? options.workflow : '';
    if (!workflowName) {
      const modeLabel = getModeLabel(mode);
      workflowName = await prompt(`请输入工作流名称 ${modeLabel}`, `analyze-${moduleName}`);
    }
    workflow = startWorkflow(projectRoot, workflowName, { mode });
    const modeLabel = getModeLabel(mode);
    printSuccess(`已创建新工作流: ${workflowName} ${modeLabel}`);
  } else if (isWorkflowIncomplete(workflow)) {
    // Current workflow is incomplete, ask for confirmation
    const progress = getWorkflowProgress(workflow);
    print('');
    printWarning(`当前工作流 "${workflow.currentWorkflow}" 未完成 (${progress.completed}/${progress.total})`);
    print(colorize(`  最后完成步骤: ${progress.lastCompletedStep || '无'}`, colors.dim));
    print('');

    const shouldArchive = await confirm('是否归档当前工作流并开始新工作流?');

    if (!shouldArchive) {
      printInfo('已取消。继续当前工作流。');
      print('');
    } else {
      let workflowName = typeof options.workflow === 'string' ? options.workflow : '';
      if (!workflowName) {
        const modeLabel = getModeLabel(mode);
        workflowName = await prompt(`请输入新工作流名称 ${modeLabel}`, `analyze-${moduleName}`);
      }
      workflow = startWorkflow(projectRoot, workflowName, { mode });
      const modeLabel = getModeLabel(mode);
      printSuccess(`已归档旧工作流，创建新工作流: ${workflowName} ${modeLabel}`);
    }
  }

  // Calculate output file name
  const version = getNextVersion(projectRoot, 'baselines', moduleName);
  const outputFile = `${moduleName}-baseline-v${version}.md`;
  const outputPath = path.join(INCSPEC_DIR, DIRS.baselines, outputFile);

  print('');
  print(colorize('步骤 1: 代码流程分析', colors.bold, colors.cyan));
  print(colorize('─────────────────────', colors.dim));
  print('');

  // Show mode info
  if (mode !== MODE.FULL) {
    print(colorize(formatModeInfo(mode), colors.yellow));
    print('');
  }

  print(colorize('配置:', colors.bold));
  print(colorize(`  源代码路径: ${sourcePath}`, colors.dim));
  print(colorize(`  模块名称: ${moduleName}`, colors.dim));
  print(colorize(`  输出文件: ${outputPath}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');
  print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-analyze ${sourcePath} --module=${moduleName}`, colors.bold, colors.white));
  print('');
  print(colorize('或在 Claude Code 中使用斜杠命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-analyze ${sourcePath} --module=${moduleName}`, colors.bold, colors.white));
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Provide command to mark as complete
  print(colorize('完成分析后，运行以下命令标记完成:', colors.dim));
  print(colorize(`  incspec analyze --complete --output=${outputFile}`, colors.dim));
  print('');
}
