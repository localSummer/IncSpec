/**
 * upgrade command - Upgrade workflow mode
 */

import {
  ensureInitialized,
} from '../lib/config.mjs';
import {
  readWorkflow,
  writeWorkflow,
  STATUS,
  MODE,
} from '../lib/workflow.mjs';
import {
  validateModeUpgrade,
  getMissingStepsAfterUpgrade,
  getModeLabel,
  MODE_UPGRADE_ORDER,
} from '../lib/mode-utils.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printError,
  printInfo,
  confirm,
} from '../lib/terminal.mjs';

/**
 * Execute upgrade command
 * @param {Object} ctx - Command context
 */
export async function upgradeCommand(ctx) {
  const { cwd, args, options } = ctx;

  const targetMode = args[0]; // 目标模式：quick 或 full

  // Validate target mode
  if (!targetMode) {
    printError('请指定目标模式');
    print('');
    print(colorize('用法:', colors.bold));
    print(colorize('  incspec upgrade <mode>', colors.dim));
    print('');
    print(colorize('可用模式:', colors.bold));
    print(colorize(`  ${MODE_UPGRADE_ORDER.join(' → ')}`, colors.cyan));
    return;
  }

  if (!Object.values(MODE).includes(targetMode)) {
    printError(`未知的目标模式: ${targetMode}`);
    print('');
    print(colorize('可用模式:', colors.bold));
    print(colorize(`  ${MODE_UPGRADE_ORDER.join(', ')}`, colors.dim));
    return;
  }

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Get workflow state
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    printError('当前没有活跃的工作流');
    printInfo('请先运行 incspec analyze 开始新工作流');
    return;
  }

  const currentMode = workflow.mode || MODE.FULL;

  // Validate upgrade
  const validation = validateModeUpgrade(currentMode, targetMode);
  if (!validation.valid) {
    printError(`无法升级: ${validation.reason}`);
    print('');
    print(colorize('提示:', colors.bold));
    print(colorize('  只能从宽松模式升级到严格模式', colors.dim));
    print(colorize(`  升级路径: ${MODE_UPGRADE_ORDER.join(' → ')}`, colors.cyan));
    return;
  }

  // Get missing steps
  const missingSteps = getMissingStepsAfterUpgrade(currentMode, targetMode);

  print('');
  print(colorize('工作流模式升级', colors.bold, colors.cyan));
  print(colorize('──────────────', colors.dim));
  print('');
  print(colorize(`当前模式: ${getModeLabel(currentMode)}`, colors.dim));
  print(colorize(`目标模式: ${getModeLabel(targetMode)}`, colors.cyan));
  print('');

  if (missingSteps.length > 0) {
    print(colorize('需要补充的步骤:', colors.bold));
    missingSteps.forEach(stepId => {
      print(colorize(`  - 步骤 ${stepId}`, colors.yellow));
    });
    print('');
  } else {
    print(colorize('无需补充额外步骤', colors.dim));
    print('');
  }

  const confirmed = await confirm('确认升级工作流模式？');
  if (!confirmed) {
    print('');
    printInfo('已取消升级');
    return;
  }

  // Update workflow mode
  workflow.mode = targetMode;

  // Update skipped steps to pending (the steps that were skipped but now are needed)
  missingSteps.forEach(stepId => {
    const index = stepId - 1;
    if (workflow.steps[index]) {
      workflow.steps[index].status = STATUS.PENDING;
      workflow.steps[index].output = null;
      workflow.steps[index].completedAt = null;
    }
  });

  // Write updated workflow
  writeWorkflow(projectRoot, workflow);

  print('');
  printSuccess(`已升级到 ${getModeLabel(targetMode)}`);
  
  if (missingSteps.length > 0) {
    print('');
    printInfo(`请依次执行步骤: ${missingSteps.join(', ')}`);
    print('');
    print(colorize('提示: 运行 incspec status 查看详细进度', colors.dim));
  }
}
