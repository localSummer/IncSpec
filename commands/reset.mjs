/**
 * reset command - Reset current workflow
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
  STATUS,
} from '../lib/workflow.mjs';
import { archiveSpec } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printInfo,
  printWarning,
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
 * @returns {Array<{path: string, name: string}>}
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
      });
    }
  });

  return outputs;
}

/**
 * Execute reset command
 * @param {Object} ctx - Command context
 */
export async function resetCommand(ctx) {
  const { cwd } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Read current workflow
  const workflow = readWorkflow(projectRoot);

  if (!workflow?.currentWorkflow) {
    print('');
    printInfo('当前无活跃工作流，无需重置');
    return;
  }

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

    for (const output of outputs) {
      try {
        const archivePath = archiveSpec(projectRoot, output.path, true, moduleName);
        print(colorize(`  - ${output.name}`, colors.dim));
      } catch (e) {
        printWarning(`归档失败: ${output.name} - ${e.message}`);
      }
    }

    print('');
    printSuccess(`已归档 ${outputs.length} 个产出文件到 archives/${new Date().toISOString().slice(0, 7)}/${moduleName}/`);
  } else {
    printInfo('无产出文件需要归档');
  }

  // Reset workflow state
  archiveWorkflow(projectRoot);
  printSuccess('工作流已重置');
}
