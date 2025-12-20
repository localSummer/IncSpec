/**
 * apply command - Step 5: Apply increment code
 */

import * as path from 'path';
import * as fs from 'fs';
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
  isQuickMode,
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

  const quickMode = isQuickMode(workflow);

  // Get source directory
  const config = readProjectConfig(projectRoot);
  const sourceDir = typeof options['source-dir'] === 'string'
    ? options['source-dir']
    : (config?.source_dir || 'src');

  // Determine input based on mode
  let inputPath;
  let inputType;

  if (quickMode) {
    // Quick mode: use requirements document
    const reqFile = path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, 'structured-requirements.md');
    if (!fs.existsSync(reqFile)) {
      printWarning('未找到需求文件。请先运行步骤 2 (collect-req)。');
      return;
    }
    inputPath = path.join(INCSPEC_DIR, DIRS.requirements, 'structured-requirements.md');
    inputType = 'requirements';
  } else {
    // Full mode: use increment design file
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
    inputPath = incrementPath;
    inputType = 'increment';
  }

  print('');
  print(colorize('步骤 5: 应用代码变更', colors.bold, colors.cyan));
  if (quickMode) {
    print(colorize('(快速模式 - 基于需求文档)', colors.yellow));
  }
  print(colorize('────────────────────', colors.dim));
  print('');
  print(colorize(`当前工作流: ${workflow.currentWorkflow}`, colors.dim));
  print(colorize(`输入文件: ${inputPath}`, colors.dim));
  print(colorize(`输入类型: ${inputType === 'requirements' ? '结构化需求' : '增量设计'}`, colors.dim));
  print(colorize(`源代码目录: ${sourceDir}`, colors.dim));
  print('');

  // Update workflow status
  updateStep(projectRoot, STEP_NUMBER, STATUS.IN_PROGRESS);

  print(colorize('使用说明:', colors.bold));
  print('');

  if (quickMode) {
    // Quick mode instructions
    print(colorize('快速模式下，请直接根据需求文档实现代码变更:', colors.cyan));
    print('');
    print(colorize('在 Cursor 中:', colors.dim));
    print(colorize(`  /incspec/inc-apply ${inputPath}`, colors.bold, colors.white));
    print('');
    print(colorize('在 Claude Code 中:', colors.dim));
    print(colorize(`  请根据 ${inputPath} 中的需求描述，直接实现代码变更`, colors.dim));
    print('');
    print(colorize('该命令将:', colors.dim));
    print(colorize('  1. 解析需求文档中的功能描述', colors.dim));
    print(colorize('  2. 基于现有基线分析影响范围', colors.dim));
    print(colorize('  3. 直接执行代码新建/修改/删除', colors.dim));
    print(colorize('  4. 输出变更摘要', colors.dim));
  } else {
    // Full mode instructions
    print(colorize('请在 Cursor 中运行以下命令:', colors.cyan));
    print('');
    print(colorize(`  /incspec/inc-apply ${inputPath}`, colors.bold, colors.white));
    print('');
    print(colorize('或在 Claude Code 中使用 inc-spec-skill 技能:', colors.cyan));
    print('');
    print(colorize(`  请按照 ${inputPath} 的增量设计，应用代码变更到 ${path.join(projectRoot, sourceDir)}`, colors.dim));
    print('');
    print(colorize('该命令将:', colors.dim));
    print(colorize('  1. 解析增量设计文件中的变更计划', colors.dim));
    print(colorize('  2. 按依赖顺序排序变更', colors.dim));
    print(colorize('  3. 执行代码新建/修改/删除', colors.dim));
    print(colorize('  4. 输出变更摘要', colors.dim));
  }

  print('');
  printWarning('请在执行前仔细审查输入文件!');
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Handle --complete flag
  if (options.complete) {
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, '代码已应用');
    printSuccess(`步骤 5 已标记为完成`);
  }
}
