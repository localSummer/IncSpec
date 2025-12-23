/**
 * merge command - Step 6: Merge to baseline
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
} from '../lib/config.mjs';
import {
  readWorkflow,
  updateStep,
  STATUS,
  isQuickMode,
  getMissingPrereqs,
} from '../lib/workflow.mjs';
import { listSpecs, getNextVersion } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
} from '../lib/terminal.mjs';

const STEP_NUMBER = 6;

function resolveIncrementPath(projectRoot, candidate) {
  if (!candidate || typeof candidate !== 'string') {
    return null;
  }

  const possiblePaths = [
    candidate,
    path.join(projectRoot, candidate),
    path.join(projectRoot, INCSPEC_DIR, DIRS.increments, candidate),
  ];

  return possiblePaths.find(p => fs.existsSync(p)) || null;
}

/**
 * Execute merge command
 * @param {Object} ctx - Command context
 */
export async function mergeCommand(ctx) {
  const { cwd, args, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Get workflow state
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    printWarning('没有活跃的工作流。请先运行 incspec analyze 开始新工作流。');
    return;
  }

  const quickMode = isQuickMode(workflow);
  const missingSteps = getMissingPrereqs(workflow, STEP_NUMBER);
  if (missingSteps && missingSteps.length > 0 && !options.force) {
    printWarning(`请先完成步骤 ${missingSteps.join(', ')} 后再继续。`);
    printInfo('如需强制执行，请添加 --force。');
    return;
  }

  // Calculate output file
  const moduleName = workflow.currentWorkflow.replace(/^analyze-/, '');
  const version = getNextVersion(projectRoot, 'baselines', moduleName);
  const defaultOutputFile = `${moduleName}-baseline-v${version}.md`;
  const outputOverride = typeof options.output === 'string' ? options.output : '';
  const outputFile = outputOverride || defaultOutputFile;
  const outputPath = path.join(INCSPEC_DIR, DIRS.baselines, outputFile);

  // Get increment file (only needed for full mode)
  let incrementPath = null;
  if (!quickMode) {
    incrementPath = args[0];
    if (!incrementPath) {
      const increments = listSpecs(projectRoot, 'increments');
      if (increments.length > 0) {
        const featureName = workflow.currentWorkflow.replace(/^analyze-/, '');
        const matched = increments.find(spec => spec.name.startsWith(`${featureName}-increment-`));
        if (matched) {
          incrementPath = matched.path;
        } else {
          incrementPath = increments[0].path;
          printWarning(`未找到与当前工作流匹配的增量文件，已使用最近文件: ${increments[0].name}`);
        }
      } else {
        printWarning('未找到增量设计文件。请先运行步骤 4 (design)。');
        return;
      }
    } else {
      const resolved = resolveIncrementPath(projectRoot, incrementPath);
      if (!resolved) {
        printWarning(`增量设计文件不存在: ${incrementPath}`);
        return;
      }
      incrementPath = resolved;
    }
  }

  print('');
  print(colorize('步骤 6: 合并到基线', colors.bold, colors.cyan));
  if (quickMode) {
    print(colorize('(快速模式 - 重新分析生成新基线)', colors.yellow));
  }
  print(colorize('─────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  if (!quickMode) {
    print(colorize(`增量设计文件: ${incrementPath}`, colors.dim));
  }
  print(colorize(`输出基线文件: ${outputPath}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');

  if (quickMode) {
    // Quick mode instructions
    print(colorize('快速模式下，将重新分析当前代码生成新基线:', colors.cyan));
    print('');
    print(colorize('在 Cursor 中:', colors.dim));
    print(colorize(`  /incspec/inc-merge --output=${outputFile}`, colors.bold, colors.white));
    print('');
    print(colorize('在 Claude Code 中:', colors.dim));
    print(colorize(`  请分析当前代码状态，生成新的基线报告到 ${outputPath}`, colors.dim));
    print('');
    print(colorize('该命令将:', colors.dim));
    print(colorize('  1. 分析当前代码的完整流程', colors.dim));
    print(colorize('  2. 生成 API 调用时序图', colors.dim));
    print(colorize('  3. 生成依赖关系图', colors.dim));
    print(colorize('  4. 保存为新版本基线快照', colors.dim));
  } else {
    // Full mode instructions
    print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
    print('');
    print(colorize(`  /incspec/inc-merge ${incrementPath}`, colors.bold, colors.white));
    print('');
    print(colorize('或在 Claude Code 中使用斜杠命令:', colors.cyan));
    print('');
    print(colorize(`  /incspec/inc-merge ${incrementPath}`, colors.bold, colors.white));
    print('');
    print(colorize('该命令将:', colors.dim));
    print(colorize('  1. 解析增量设计文件中的时序图和依赖图', colors.dim));
    print(colorize('  2. 清理增量标记', colors.dim));
    print(colorize('  3. 重新编号为 S1-Sxx, D1-Dxx', colors.dim));
    print(colorize('  4. 生成新的基线快照', colors.dim));
  }

  print('');
  print(colorize('新基线将作为下一轮增量开发的起点。', colors.dim));
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Handle --complete flag
  if (options.complete) {
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, outputFile);
    printSuccess(`步骤 6 已标记为完成: ${outputFile}`);
  }
}
