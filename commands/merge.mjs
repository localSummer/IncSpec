/**
 * merge command - Step 6: Merge to baseline
 */

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

  // Get increment file
  let incrementPath = args[0];
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
  }

  // Calculate output file
  const moduleName = workflow.currentWorkflow.replace(/^analyze-/, '');
  const version = getNextVersion(projectRoot, 'baselines', moduleName);
  const defaultOutputFile = `${moduleName}-baseline-v${version}.md`;
  const outputOverride = typeof options.output === 'string' ? options.output : '';
  const outputFile = outputOverride || defaultOutputFile;
  const outputPath = path.join(INCSPEC_DIR, DIRS.baselines, outputFile);

  print('');
  print(colorize('步骤 6: 合并到基线', colors.bold, colors.cyan));
  print(colorize('─────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  print(colorize(`增量设计文件: ${incrementPath}`, colors.dim));
  print(colorize(`输出基线文件: ${outputPath}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');
  print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-merge ${incrementPath}`, colors.bold, colors.white));
  print('');
  print(colorize('或使用 Claude Code 命令:', colors.cyan));
  print('');
  const outDir = path.join(projectRoot, INCSPEC_DIR, DIRS.baselines);
  print(colorize(`  /ai-increment:merge-to-baseline ${incrementPath} ${outDir}`, colors.bold, colors.white));
  print('');
  print(colorize('该命令将:', colors.dim));
  print(colorize('  1. 解析增量设计文件中的时序图和依赖图', colors.dim));
  print(colorize('  2. 清理增量标记 (🆕/✏️/❌)', colors.dim));
  print(colorize('  3. 重新编号为 S1-Sxx, D1-Dxx', colors.dim));
  print(colorize('  4. 生成新的基线快照', colors.dim));
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
