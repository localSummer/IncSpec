/**
 * status command - Display workflow status
 */

import {
  ensureInitialized,
  readProjectConfig,
} from '../lib/config.mjs';
import {
  readWorkflow,
  STEPS,
  STATUS,
  MODE,
  isQuickMode,
} from '../lib/workflow.mjs';
import {
  getModeLabel,
  getSkippedStepsForMode,
} from '../lib/mode-utils.mjs';
import {
  colors,
  colorize,
  print,
  printHeader,
  printStep,
  printWarning,
} from '../lib/terminal.mjs';

/**
 * Execute status command
 * @param {Object} ctx - Command context
 */
export async function statusCommand(ctx) {
  const { cwd } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Read config and workflow
  const config = readProjectConfig(projectRoot);
  const workflow = readWorkflow(projectRoot);

  print('');
  print(colorize('  incspec 工作流状态', colors.bold, colors.cyan));
  print(colorize('  ─────────────────', colors.dim));
  print('');

  // Project info
  const techStack = Array.isArray(config?.tech_stack)
    ? config.tech_stack
    : (config?.tech_stack ? [config.tech_stack] : []);
  print(colorize(`项目: ${config.name}`, colors.bold));
  print(colorize(`技术栈: ${techStack.join(', ') || '-'}`, colors.dim));
  print('');

  // Current workflow
  if (workflow?.currentWorkflow) {
    const mode = workflow.mode || MODE.FULL;
    const modeLabel = getModeLabel(mode);
    const skippedSteps = getSkippedStepsForMode(mode);

    print(colorize(`当前工作流: `, colors.bold) + colorize(workflow.currentWorkflow, colors.cyan));
    print(colorize(`工作流模式: ${modeLabel}`, colors.dim));
    print(colorize(`开始时间: ${workflow.startTime || '-'}`, colors.dim));
    print(colorize(`最后更新: ${workflow.lastUpdate || '-'}`, colors.dim));
    print('');

    // Steps progress
    print(colorize('步骤进度:', colors.bold));
    print('');

    STEPS.forEach((step, index) => {
      const stepData = workflow.steps[index] || {};
      let status = stepData.status || STATUS.PENDING;
      const isCurrent = workflow.currentStep === step.id;
      const isSkipped = skippedSteps.includes(step.id);

      // Mark skipped steps
      if (isSkipped && status !== STATUS.SKIPPED) {
        status = STATUS.SKIPPED;
      }

      // Determine display status
      let displayStatus = status;
      if (isCurrent && status === STATUS.PENDING) {
        displayStatus = STATUS.IN_PROGRESS;
      }

      // Use dimmed style for skipped steps
      if (status === STATUS.SKIPPED) {
        print(colorize(`  [-] ${step.id}. ${step.label}`, colors.dim) + colorize(' (已跳过)', colors.dim));
      } else {
        printStep(step.id, step.label, displayStatus);
      }

      // Show output file if completed
      if (stepData.output && status === STATUS.COMPLETED) {
        print(colorize(`     → ${stepData.output}`, colors.dim));
      }
    });

    print('');

    // Next step hint
    const nextStepIndex = workflow.steps.findIndex((step, index) => {
      const stepNumber = index + 1;
      // Skip excluded steps based on mode
      if (skippedSteps.includes(stepNumber)) {
        return false;
      }
      return (step?.status || STATUS.PENDING) !== STATUS.COMPLETED;
    });
    if (nextStepIndex >= 0) {
      const nextStep = STEPS[nextStepIndex];
      print(colorize('下一步:', colors.bold));
      print(colorize(`  运行 'incspec ${nextStep.command}' 或使用 /incspec/inc-${nextStep.command}`, colors.cyan));
    } else {
      print(colorize('当前工作流步骤已全部完成。', colors.dim));
    }
  } else {
    printWarning('当前没有活跃的工作流');
    print('');
    print(colorize('开始新工作流:', colors.bold));
    print(colorize(`  1. 运行 'incspec analyze <source-path>' 分析代码`, colors.dim));
    print(colorize(`  2. 或使用 Cursor 命令 /incspec/inc-analyze`, colors.dim));
  }

  print('');

  // Recent history
  if (workflow?.history && workflow.history.length > 0) {
    print(colorize('最近的工作流:', colors.bold));
    print('');

    const recentHistory = workflow.history.slice(0, 5);
    recentHistory.forEach(item => {
      const statusIcon = item.status === 'completed'
        ? colorize('✓', colors.green)
        : colorize('○', colors.dim);
      print(`  ${statusIcon} ${item.name} (${item.startTime || '-'})`);
    });
    print('');
  }
}
