/**
 * collect-dep command - Step 3: Collect UI dependencies
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
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
} from '../lib/terminal.mjs';

const STEP_NUMBER = 3;
const OUTPUT_FILE = 'ui-dependencies.md';

/**
 * Execute collect-dep command
 * @param {Object} ctx - Command context
 */
export async function collectDepCommand(ctx) {
  const { cwd, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Get workflow state
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    printWarning('没有活跃的工作流。请先运行 incspec analyze 开始新工作流。');
    return;
  }

  const outputPath = path.join(INCSPEC_DIR, DIRS.requirements, OUTPUT_FILE);

  print('');
  print(colorize('步骤 3: UI 依赖采集', colors.bold, colors.cyan));
  print(colorize('───────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  print(colorize(`输出文件: ${outputPath}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');
  print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-collect-dep`, colors.bold, colors.white));
  print('');
  print(colorize('或在 Claude Code 中使用 inc-spec-skill 技能:', colors.cyan));
  print('');
  print(colorize(`  请收集 UI 依赖，生成依赖报告到 ${path.join(projectRoot, INCSPEC_DIR, DIRS.requirements)}`, colors.dim));
  print('');
  print(colorize('该命令将交互式采集 6 维度 UI 依赖:', colors.dim));
  print(colorize('  - UI组件库 (Arco/Antd)', colors.dim));
  print(colorize('  - 状态管理 (Store)', colors.dim));
  print(colorize('  - API 交互', colors.dim));
  print(colorize('  - 类型定义 (Type)', colors.dim));
  print(colorize('  - 工具函数 (Utils)', colors.dim));
  print(colorize('  - 定位上下文 (Context)', colors.dim));
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Handle --complete flag
  if (options.complete) {
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, OUTPUT_FILE);
    printSuccess(`步骤 3 已标记为完成: ${OUTPUT_FILE}`);
  }
}
