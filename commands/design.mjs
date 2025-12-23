/**
 * design command - Step 4: Design increment
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
  isStepAllowed,
  getMissingPrereqs,
} from '../lib/workflow.mjs';
import { getNextVersion, listSpecs } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  prompt,
} from '../lib/terminal.mjs';

const STEP_NUMBER = 4;

/**
 * Execute design command
 * @param {Object} ctx - Command context
 */
export async function designCommand(ctx) {
  const { cwd, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Get workflow state
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    printWarning('没有活跃的工作流。请先运行 incspec analyze 开始新工作流。');
    return;
  }

  if (!isStepAllowed(STEP_NUMBER, workflow.mode)) {
    printWarning('当前工作流为快速模式，步骤 4 已跳过。');
    return;
  }

  const missingSteps = getMissingPrereqs(workflow, STEP_NUMBER);
  if (missingSteps && missingSteps.length > 0 && !options.force) {
    printWarning(`请先完成步骤 ${missingSteps.join(', ')} 后再继续。`);
    printInfo('如需强制执行，请添加 --force。');
    return;
  }

  // Get feature name
  let featureName = typeof options.feature === 'string' ? options.feature : '';
  if (!featureName) {
    featureName = workflow.currentWorkflow.replace(/^analyze-/, '');
  }

  // Calculate output file
  const version = getNextVersion(projectRoot, 'increments', featureName);
  const outputFile = `${featureName}-increment-v${version}.md`;
  const outputPath = path.join(INCSPEC_DIR, DIRS.increments, outputFile);

  // Find input files
  const baselines = listSpecs(projectRoot, 'baselines');
  const latestBaseline = baselines[0]?.name || '[无基线文件]';
  if (baselines.length === 0) {
    printWarning('未找到基线文件。请先运行步骤 1 (analyze)。');
    return;
  }

  const reqFile = path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, 'structured-requirements.md');
  const depFile = path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, 'ui-dependencies.md');
  const missingInputs = [];
  if (!fs.existsSync(reqFile)) {
    missingInputs.push('structured-requirements.md');
  }
  if (!fs.existsSync(depFile)) {
    missingInputs.push('ui-dependencies.md');
  }
  if (missingInputs.length > 0) {
    printWarning(`缺少需求输入文件: ${missingInputs.join(', ')}`);
    printWarning('请先完成步骤 2 (collect-req) 和步骤 3 (collect-dep)。');
    return;
  }

  print('');
  print(colorize('步骤 4: 增量设计', colors.bold, colors.cyan));
  print(colorize('────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  print(colorize(`功能名称: ${featureName}`, colors.dim));
  print(colorize(`输出文件: ${outputPath}`, colors.dim));
  print('');
  print(colorize('输入文件:', colors.bold));
  print(colorize(`  基线快照: ${INCSPEC_DIR}/${DIRS.baselines}/${latestBaseline}`, colors.dim));
  print(colorize(`  结构化需求: ${INCSPEC_DIR}/${DIRS.requirements}/structured-requirements.md`, colors.dim));
  print(colorize(`  UI依赖: ${INCSPEC_DIR}/${DIRS.requirements}/ui-dependencies.md`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');
  print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-design --feature=${featureName}`, colors.bold, colors.white));
  print('');
  print(colorize('或在 Claude Code 中使用斜杠命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-design --feature=${featureName}`, colors.bold, colors.white));
  print('');
  print(colorize('该命令将生成包含 7 大模块的增量设计蓝图:', colors.dim));
  print(colorize('  1. 一句话摘要', colors.dim));
  print(colorize('  2. 变更链条设计表', colors.dim));
  print(colorize('  3. 规划后的 API 调用时序图', colors.dim));
  print(colorize('  4. 规划后的依赖关系图', colors.dim));
  print(colorize('  5. 文件清单', colors.dim));
  print(colorize('  6. 风险预警', colors.dim));
  print(colorize('  7. 测试用例', colors.dim));
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Handle --complete flag
  if (options.complete) {
    const output = typeof options.output === 'string' ? options.output : outputFile;
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, output);
    printSuccess(`步骤 4 已标记为完成: ${output}`);
  }
}
