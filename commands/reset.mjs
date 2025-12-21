/**
 * reset command - Reset current workflow (full or partial)
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
  archiveWorkflow,
  resetToStep,
  STATUS,
  STEPS,
} from '../lib/workflow.mjs';
import { archiveSpec } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printInfo,
  printWarning,
  printError,
} from '../lib/terminal.mjs';

/**
 * Extract module name from workflow name
 * e.g., "analyze-incspec-cli" -> "incspec-cli"
 * @param {string} workflowName
 * @returns {string}
 */
function extractModuleName(workflowName) {
  if (!workflowName) {
    return 'unknown';
  }

  // Remove common prefixes like "analyze-"
  const prefixes = ['analyze-', 'feature-', 'fix-', 'refactor-'];
  let moduleName = workflowName;

  for (const prefix of prefixes) {
    if (moduleName.startsWith(prefix)) {
      moduleName = moduleName.slice(prefix.length);
      break;
    }
  }

  return moduleName || workflowName;
}

/**
 * Get output directory for a step index
 * @param {number} stepIndex - 0-based step index
 * @returns {string|null}
 */
function getOutputDirForStepIndex(stepIndex) {
  // Step 1 (index 0) and Step 6 (index 5) -> baselines
  if (stepIndex === 0 || stepIndex === 5) {
    return DIRS.baselines;
  }

  // Step 2-3 (index 1-2) -> requirements
  if (stepIndex === 1 || stepIndex === 2) {
    return DIRS.requirements;
  }

  // Step 4 (index 3) -> increments
  if (stepIndex === 3) {
    return DIRS.increments;
  }

  return null;
}

/**
 * Collect output files from workflow steps
 * @param {string} projectRoot
 * @param {Object} workflow
 * @returns {Array<{path: string, name: string, stepIndex: number}>}
 */
function collectWorkflowOutputs(projectRoot, workflow) {
  const outputs = [];

  if (!workflow?.steps) {
    return outputs;
  }

  workflow.steps.forEach((step, index) => {
    // Only collect completed steps with output
    if (step.status !== STATUS.COMPLETED || !step.output || step.output === '-') {
      return;
    }

    const dir = getOutputDirForStepIndex(index);
    if (!dir) {
      return;
    }

    const outputPath = path.join(projectRoot, INCSPEC_DIR, dir, step.output);
    if (fs.existsSync(outputPath)) {
      outputs.push({
        path: outputPath,
        name: step.output,
        stepIndex: index,
      });
    }
  });

  return outputs;
}

/**
 * Collect output files for specific step indices
 * @param {string} projectRoot
 * @param {Array<{index: number, output: string}>} resetOutputs
 * @returns {Array<{path: string, name: string, stepIndex: number}>}
 */
function collectResetOutputs(projectRoot, resetOutputs) {
  const outputs = [];

  for (const item of resetOutputs) {
    const dir = getOutputDirForStepIndex(item.index);
    if (!dir) {
      continue;
    }

    const outputPath = path.join(projectRoot, INCSPEC_DIR, dir, item.output);
    if (fs.existsSync(outputPath)) {
      outputs.push({
        path: outputPath,
        name: item.output,
        stepIndex: item.index,
      });
    }
  }

  return outputs;
}

/**
 * Archive output files
 * @param {string} projectRoot
 * @param {Array<{path: string, name: string}>} outputs
 * @param {string} moduleName
 * @returns {number} Number of archived files
 */
function archiveOutputFiles(projectRoot, outputs, moduleName) {
  let archivedCount = 0;

  for (const output of outputs) {
    try {
      archiveSpec(projectRoot, output.path, true, moduleName);
      print(colorize(`  - ${output.name}`, colors.dim));
      archivedCount++;
    } catch (e) {
      printWarning(`归档失败: ${output.name} - ${e.message}`);
    }
  }

  return archivedCount;
}

/**
 * Execute partial reset (reset to specific step)
 * @param {string} projectRoot
 * @param {number} targetStep
 */
function executePartialReset(projectRoot, targetStep) {
  const workflow = readWorkflow(projectRoot);
  const workflowName = workflow.currentWorkflow;
  const moduleName = extractModuleName(workflowName);

  print('');
  print(colorize('  incspec 工作流部分回退', colors.bold, colors.cyan));
  print(colorize('  ───────────────────────', colors.dim));
  print('');
  print(colorize(`工作流: ${workflowName}`, colors.dim));
  print(colorize(`回退目标: 步骤 ${targetStep}`, colors.dim));
  print('');

  // Perform partial reset
  const { workflow: updatedWorkflow, resetOutputs } = resetToStep(projectRoot, targetStep);

  // Collect and archive output files from reset steps
  const outputs = collectResetOutputs(projectRoot, resetOutputs);

  if (outputs.length > 0) {
    print(colorize('归档被重置步骤的产出文件:', colors.dim));

    const archivedCount = archiveOutputFiles(projectRoot, outputs, moduleName);

    print('');
    printSuccess(`已归档 ${archivedCount} 个产出文件到 archives/${new Date().toISOString().slice(0, 7)}/${moduleName}/`);
  } else {
    printInfo('被重置步骤无产出文件需要归档');
  }

  // Show reset result
  print('');
  const targetStepInfo = STEPS[targetStep - 1];
  printSuccess(`已回退到步骤 ${targetStep} (${targetStepInfo.name})`);
  print(colorize(`当前步骤已设为: ${updatedWorkflow.currentStep}`, colors.dim));
}

/**
 * Execute full reset
 * @param {string} projectRoot
 */
function executeFullReset(projectRoot) {
  const workflow = readWorkflow(projectRoot);
  const workflowName = workflow.currentWorkflow;
  const moduleName = extractModuleName(workflowName);

  print('');
  print(colorize('  incspec 工作流重置', colors.bold, colors.cyan));
  print(colorize('  ─────────────────', colors.dim));
  print('');
  print(colorize(`工作流: ${workflowName}`, colors.dim));
  print('');

  // Collect output files
  const outputs = collectWorkflowOutputs(projectRoot, workflow);

  // Archive output files
  if (outputs.length > 0) {
    print(colorize('归档产出文件:', colors.dim));

    const archivedCount = archiveOutputFiles(projectRoot, outputs, moduleName);

    print('');
    printSuccess(`已归档 ${archivedCount} 个产出文件到 archives/${new Date().toISOString().slice(0, 7)}/${moduleName}/`);
  } else {
    printInfo('无产出文件需要归档');
  }

  // Reset workflow state
  archiveWorkflow(projectRoot);
  printSuccess('工作流已重置');
}

/**
 * Execute reset command
 * @param {Object} ctx - Command context
 */
export async function resetCommand(ctx) {
  const { cwd, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Read current workflow
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    print('');
    printInfo('当前无活跃工作流，无需重置');
    return;
  }

  // Check for --to option
  const targetStepStr = options.to || options.t;

  if (targetStepStr) {
    // Partial reset mode
    const targetStep = parseInt(targetStepStr, 10);

    if (isNaN(targetStep)) {
      print('');
      printError(`无效的步骤编号: ${targetStepStr}`);
      print(colorize('用法: incspec reset --to=<步骤编号>', colors.dim));
      print(colorize('示例: incspec reset --to=3', colors.dim));
      return;
    }

    try {
      executePartialReset(projectRoot, targetStep);
    } catch (error) {
      print('');
      printError(error.message);
    }
  } else {
    // Full reset mode (original behavior)
    executeFullReset(projectRoot);
  }
}
