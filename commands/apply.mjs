/**
 * apply command - Step 5: Apply increment code
 */

import * as path from 'path';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
  readProjectConfig,
} from '../lib/config.mjs';
import {
  readWorkflow,
  updateStep,
  STATUS,
} from '../lib/workflow.mjs';
import { listSpecs } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  prompt,
} from '../lib/terminal.mjs';

const STEP_NUMBER = 5;

/**
 * Execute apply command
 * @param {Object} ctx - Command context
 */
export async function applyCommand(ctx) {
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

  // Get source directory
  const config = readProjectConfig(projectRoot);
  const sourceDir = typeof options['source-dir'] === 'string'
    ? options['source-dir']
    : (config?.source_dir || 'src');

  print('');
  print(colorize('步骤 5: 应用代码变更', colors.bold, colors.cyan));
  print(colorize('────────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  print(colorize(`增量设计文件: ${incrementPath}`, colors.dim));
  print(colorize(`源代码目录: ${sourceDir}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');
  print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
  print('');
  print(colorize(`  /incspec/inc-apply ${incrementPath}`, colors.bold, colors.white));
  print('');
  print(colorize('或使用 Claude Code 命令:', colors.cyan));
  print('');
  print(colorize(`  /ai-increment:apply-increment-code ${incrementPath} ${path.join(projectRoot, sourceDir)}`, colors.bold, colors.white));
  print('');
  print(colorize('该命令将:', colors.dim));
  print(colorize('  1. 解析增量设计文件中的变更计划', colors.dim));
  print(colorize('  2. 按依赖顺序排序变更', colors.dim));
  print(colorize('  3. 执行代码新建/修改/删除', colors.dim));
  print(colorize('  4. 输出变更摘要', colors.dim));
  print('');
  printWarning('请在执行前仔细审查增量设计文件!');
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Handle --complete flag
  if (options.complete) {
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, '代码已应用');
    printSuccess(`步骤 5 已标记为完成`);
  }
}
