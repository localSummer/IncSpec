/**
 * analyze command - Step 1: Analyze code workflow
 */

import * as path from 'path';
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
  getStepInfo,
  isWorkflowIncomplete,
  getWorkflowProgress,
} from '../lib/workflow.mjs';
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
 * Execute analyze command
 * @param {Object} ctx - Command context
 */
export async function analyzeCommand(ctx) {
  const { cwd, args, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

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

  // Check if starting new workflow
  if (!workflow?.currentWorkflow) {
    let workflowName = typeof options.workflow === 'string' ? options.workflow : '';
    if (!workflowName) {
      workflowName = await prompt('请输入工作流名称', `analyze-${moduleName}`);
    }
    workflow = startWorkflow(projectRoot, workflowName);
    printSuccess(`已创建新工作流: ${workflowName}`);
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
        workflowName = await prompt('请输入新工作流名称', `analyze-${moduleName}`);
      }
      workflow = startWorkflow(projectRoot, workflowName);
      printSuccess(`已归档旧工作流，创建新工作流: ${workflowName}`);
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
  print(colorize('或使用 Claude Code 命令:', colors.cyan));
  print('');
  print(colorize(`  /ai-increment:analyze-codeflow ${sourcePath} ${path.join(projectRoot, INCSPEC_DIR, DIRS.baselines)}`, colors.bold, colors.white));
  print('');
  printInfo(`完成后运行 'incspec status' 查看进度`);
  print('');

  // Provide command to mark as complete
  print(colorize('完成分析后，运行以下命令标记完成:', colors.dim));
  print(colorize(`  incspec analyze --complete --output=${outputFile}`, colors.dim));
  print('');

  // Handle --complete flag
  if (options.complete) {
    const output = typeof options.output === 'string' ? options.output : outputFile;
    updateStep(projectRoot, STEP_NUMBER, STATUS.COMPLETED, output);
    printSuccess(`步骤 1 已标记为完成: ${output}`);
  }
}
