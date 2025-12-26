/**
 * Workflow state management for incspec
 * - Read/write workflow.json
 * - Track current step
 * - Manage workflow history
 */

import * as fs from 'fs';
import * as path from 'path';
import { INCSPEC_DIR, FILES, getTemplatesDir } from './config.mjs';
import { formatLocalDateTime } from './terminal.mjs';
import {
  getStepsForMode,
  getSkippedStepsForMode,
  isStepActiveInMode
} from './mode-utils.mjs';

/** Workflow steps definition */
export const STEPS = [
  { id: 1, name: 'analyze-codeflow', label: '代码流程分析', command: 'analyze' },
  { id: 2, name: 'collect-requirements', label: '结构化需求收集', command: 'collect-req' },
  { id: 3, name: 'collect-dependencies', label: 'UI依赖采集', command: 'collect-dep' },
  { id: 4, name: 'design-increment', label: '增量设计', command: 'design' },
  { id: 5, name: 'apply-code', label: '应用代码变更', command: 'apply' },
  { id: 6, name: 'merge-baseline', label: '合并到基线', command: 'merge' },
  { id: 7, name: 'archive-workflow', label: '归档工作流产出', command: 'archive' },
];

/** Step status */
export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

/** Workflow mode */
export const MODE = {
  FULL: 'full',
  QUICK: 'quick',
  MINIMAL: 'minimal',
};

function normalizeOutputName(outputFile) {
  if (!outputFile || typeof outputFile !== 'string') {
    return outputFile;
  }

  if (!/[\\/]/.test(outputFile)) {
    return outputFile;
  }

  const parts = outputFile.split(/[/\\]+/);
  return parts[parts.length - 1] || outputFile;
}

/**
 * Get workflow file path (JSON format)
 * @param {string} projectRoot
 * @returns {string}
 */
export function getWorkflowPath(projectRoot) {
  return path.join(projectRoot, INCSPEC_DIR, FILES.workflow);
}

/**
 * Get legacy workflow file path (Markdown format)
 * @param {string} projectRoot
 * @returns {string}
 */
function getLegacyWorkflowPath(projectRoot) {
  return path.join(projectRoot, INCSPEC_DIR, FILES.workflowLegacy);
}

/**
 * Parse legacy WORKFLOW.md content (for migration)
 * @param {string} content
 * @returns {Object}
 */
function parseMarkdownWorkflow(content) {
  const workflow = {
    currentWorkflow: null,
    currentStep: null,
    mode: MODE.FULL,
    startTime: null,
    lastUpdate: null,
    steps: [],
    history: [],
  };

  // Parse current workflow info
  const workflowMatch = content.match(/\*\*当前工作流\*\*:\s*(.+)/);
  if (workflowMatch) {
    workflow.currentWorkflow = workflowMatch[1].trim();
    if (workflow.currentWorkflow === '-' || workflow.currentWorkflow === 'none') {
      workflow.currentWorkflow = null;
    }
  }

  const stepMatch = content.match(/\*\*当前步骤\*\*:\s*(\d+)/);
  if (stepMatch) {
    workflow.currentStep = parseInt(stepMatch[1], 10);
  }

  // Parse mode field
  const modeMatch = content.match(/\*\*工作流模式\*\*:\s*(.+)/);
  if (modeMatch) {
    const modeValue = modeMatch[1].trim().toLowerCase();
    if (modeValue === 'quick') {
      workflow.mode = MODE.QUICK;
    } else if (modeValue === 'minimal') {
      workflow.mode = MODE.MINIMAL;
    } else {
      workflow.mode = MODE.FULL;
    }
  }

  const startMatch = content.match(/\*\*开始时间\*\*:\s*(.+)/);
  if (startMatch) {
    const value = startMatch[1].trim();
    workflow.startTime = value === '-' ? null : value;
  }

  const updateMatch = content.match(/\*\*最后更新\*\*:\s*(.+)/);
  if (updateMatch) {
    workflow.lastUpdate = updateMatch[1].trim();
  }

  // Parse steps table
  const stepsTableMatch = content.match(/## 步骤进度\n\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|\n*$)/);
  if (stepsTableMatch) {
    const rows = stepsTableMatch[1].trim().split('\n').filter(r => r.trim());
    workflow.steps = rows.map((row, index) => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 4) {
        return {
          id: index + 1,
          name: STEPS[index]?.name || `step-${index + 1}`,
          status: cells[1],
          output: cells[2] === '-' ? null : cells[2],
          completedAt: cells[3] === '-' ? null : cells[3],
        };
      }
      return null;
    }).filter(Boolean);
  }

  // Ensure we have all 7 steps
  while (workflow.steps.length < STEPS.length) {
    const index = workflow.steps.length;
    workflow.steps.push({
      id: index + 1,
      name: STEPS[index].name,
      status: STATUS.PENDING,
      output: null,
      completedAt: null,
    });
  }

  // Parse history table
  const historyMatch = content.match(/## 工作流历史\n\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|\n*$)/);
  if (historyMatch) {
    const rows = historyMatch[1].trim().split('\n').filter(r => r.trim());
    workflow.history = rows.map(row => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 4) {
        return {
          name: cells[0],
          status: cells[1],
          startTime: cells[2] === '-' ? null : cells[2],
          endTime: cells[3] === '-' ? null : cells[3],
        };
      }
      return null;
    }).filter(Boolean);
  }

  return workflow;
}

/**
 * Migrate from WORKFLOW.md to workflow.json
 * @param {string} projectRoot
 * @returns {Object|null} Migrated workflow or null if no migration needed
 */
function migrateFromMarkdown(projectRoot) {
  const legacyPath = getLegacyWorkflowPath(projectRoot);
  const jsonPath = getWorkflowPath(projectRoot);

  // Check if legacy file exists and JSON doesn't
  if (!fs.existsSync(legacyPath)) {
    return null;
  }

  if (fs.existsSync(jsonPath)) {
    // JSON already exists, no migration needed
    return null;
  }

  // Read and parse legacy file
  const content = fs.readFileSync(legacyPath, 'utf-8');
  const workflow = parseMarkdownWorkflow(content);

  // Update lastUpdate
  workflow.lastUpdate = formatLocalDateTime(new Date());

  // Write new JSON file
  const jsonContent = JSON.stringify(workflow, null, 2);
  fs.writeFileSync(jsonPath, jsonContent, 'utf-8');

  // Delete legacy file
  fs.unlinkSync(legacyPath);

  console.log(`已将 WORKFLOW.md 迁移到 workflow.json`);

  return workflow;
}

/**
 * Parse workflow.json content
 * @param {string} content - JSON string
 * @returns {Object}
 */
export function parseWorkflow(content) {
  try {
    const workflow = JSON.parse(content);

    // Ensure all required fields exist with defaults
    return {
      currentWorkflow: workflow.currentWorkflow ?? null,
      currentStep: workflow.currentStep ?? null,
      mode: workflow.mode ?? MODE.FULL,
      startTime: workflow.startTime ?? null,
      lastUpdate: workflow.lastUpdate ?? null,
      steps: workflow.steps ?? [],
      history: workflow.history ?? [],
    };
  } catch (e) {
    throw new Error(`解析 workflow.json 失败: ${e.message}`);
  }
}

/**
 * Read workflow state
 * @param {string} projectRoot
 * @returns {Object|null}
 */
export function readWorkflow(projectRoot) {
  // Try migration first
  const migrated = migrateFromMarkdown(projectRoot);
  if (migrated) {
    return migrated;
  }

  const workflowPath = getWorkflowPath(projectRoot);

  if (!fs.existsSync(workflowPath)) {
    return null;
  }

  const content = fs.readFileSync(workflowPath, 'utf-8');
  return parseWorkflow(content);
}

/**
 * Generate workflow.json content
 * @param {Object} workflow
 * @returns {string}
 */
export function generateWorkflowContent(workflow) {
  const now = formatLocalDateTime(new Date());
  const mode = workflow.mode || MODE.FULL;

  // Ensure steps have proper structure
  const steps = STEPS.map((step, index) => {
    const stepData = workflow.steps[index] || {};
    return {
      id: step.id,
      name: step.name,
      status: stepData.status || STATUS.PENDING,
      output: stepData.output || null,
      completedAt: stepData.completedAt || null,
    };
  });

  const data = {
    currentWorkflow: workflow.currentWorkflow || null,
    currentStep: workflow.currentStep || null,
    mode: mode,
    startTime: workflow.startTime || null,
    lastUpdate: now,
    steps: steps,
    history: workflow.history || [],
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Write workflow state
 * @param {string} projectRoot
 * @param {Object} workflow
 */
export function writeWorkflow(projectRoot, workflow) {
  const workflowPath = getWorkflowPath(projectRoot);
  const content = generateWorkflowContent(workflow);
  fs.writeFileSync(workflowPath, content, 'utf-8');
}

/**
 * Initialize empty workflow
 * @param {string} projectRoot
 */
export function initWorkflow(projectRoot) {
  const workflowPath = getWorkflowPath(projectRoot);
  const now = formatLocalDateTime(new Date());

  const workflow = {
    currentWorkflow: null,
    currentStep: null,
    mode: MODE.FULL,
    startTime: null,
    lastUpdate: now,
    steps: STEPS.map((step) => ({
      id: step.id,
      name: step.name,
      status: STATUS.PENDING,
      output: null,
      completedAt: null,
    })),
    history: [],
  };

  const content = JSON.stringify(workflow, null, 2);
  fs.writeFileSync(workflowPath, content, 'utf-8');

  return workflow;
}

/**
 * Start a new workflow
 * @param {string} projectRoot
 * @param {string} workflowName
 * @param {Object} options - { mode: 'full' | 'quick' }
 * @returns {Object}
 */
export function startWorkflow(projectRoot, workflowName, options = {}) {
  const now = formatLocalDateTime(new Date());
  const mode = options.mode || MODE.FULL;
  let workflow = readWorkflow(projectRoot);

  if (!workflow) {
    workflow = initWorkflow(projectRoot);
  }

  // Archive current workflow if exists
  if (workflow.currentWorkflow) {
    const progress = getWorkflowProgress(workflow);
    const isComplete = progress.completed === progress.total;

    // Format: "workflowName (completed/total)" for incomplete, just name for complete
    const historyName = isComplete
      ? workflow.currentWorkflow
      : `${workflow.currentWorkflow} (${progress.completed}/${progress.total})`;

    workflow.history.unshift({
      name: historyName,
      status: isComplete ? 'completed' : 'incomplete',
      startTime: workflow.startTime,
      endTime: now,
    });
  }

  // Start new workflow
  workflow.currentWorkflow = workflowName;
  workflow.currentStep = 1;
  workflow.mode = mode;
  workflow.startTime = now;

  // Initialize steps - mark skipped steps based on mode
  const skippedSteps = getSkippedStepsForMode(mode);
  workflow.steps = STEPS.map((step) => {
    if (skippedSteps.includes(step.id)) {
      return {
        id: step.id,
        name: step.name,
        status: STATUS.SKIPPED,
        output: null,
        completedAt: now,
      };
    }
    return {
      id: step.id,
      name: step.name,
      status: STATUS.PENDING,
      output: null,
      completedAt: null,
    };
  });

  writeWorkflow(projectRoot, workflow);
  return workflow;
}

/**
 * Update step status
 * @param {string} projectRoot
 * @param {number} stepNumber - 1-based step number
 * @param {string} status
 * @param {string} outputFile
 */
export function updateStep(projectRoot, stepNumber, status, outputFile = null) {
  const workflow = readWorkflow(projectRoot);
  if (!workflow) {
    throw new Error('工作流未初始化');
  }

  const index = stepNumber - 1;
  if (index < 0 || index >= STEPS.length) {
    throw new Error(`无效的步骤编号: ${stepNumber}`);
  }

  const now = formatLocalDateTime(new Date());
  const normalizedOutput = normalizeOutputName(outputFile);
  const mode = workflow.mode || MODE.FULL;

  workflow.steps[index] = {
    id: stepNumber,
    name: STEPS[index].name,
    status,
    output: normalizedOutput,
    completedAt: status === STATUS.COMPLETED ? now : null,
  };

  // Update current step based on mode
  if (status === STATUS.IN_PROGRESS) {
    workflow.currentStep = stepNumber;
  } else if (status === STATUS.COMPLETED) {
    const nextStep = getNextStep(stepNumber, mode);
    if (nextStep) {
      workflow.currentStep = nextStep;
    }
    // nextStep is null means workflow is complete
  }

  writeWorkflow(projectRoot, workflow);
  return workflow;
}

/**
 * Complete current workflow
 * @param {string} projectRoot
 */
export function completeWorkflow(projectRoot) {
  const workflow = readWorkflow(projectRoot);
  if (!workflow) {
    throw new Error('工作流未初始化');
  }

  const now = formatLocalDateTime(new Date());

  // Add to history
  workflow.history.unshift({
    name: workflow.currentWorkflow,
    status: 'completed',
    startTime: workflow.startTime,
    endTime: now,
  });

  // Reset current workflow
  workflow.currentWorkflow = null;
  workflow.currentStep = null;
  workflow.startTime = null;

  writeWorkflow(projectRoot, workflow);
  return workflow;
}

/**
 * Archive current workflow
 * @param {string} projectRoot
 */
export function archiveWorkflow(projectRoot) {
  const workflow = readWorkflow(projectRoot);
  if (!workflow || !workflow.currentWorkflow) {
    throw new Error('工作流未初始化');
  }

  const now = formatLocalDateTime(new Date());

  workflow.history.unshift({
    name: workflow.currentWorkflow,
    status: 'archived',
    startTime: workflow.startTime || null,
    endTime: now,
  });

  workflow.currentWorkflow = null;
  workflow.currentStep = null;
  workflow.startTime = null;
  workflow.steps = STEPS.map((step) => ({
    id: step.id,
    name: step.name,
    status: STATUS.PENDING,
    output: null,
    completedAt: null,
  }));

  writeWorkflow(projectRoot, workflow);
  return workflow;
}

/**
 * Reset workflow to a specific step (partial reset)
 * Keeps steps 1 to targetStep, resets steps after targetStep to pending
 * @param {string} projectRoot
 * @param {number} targetStep - 1-based step number to reset to (1-6)
 * @returns {{workflow: Object, resetOutputs: Array<{index: number, stepNumber: number, output: string}>}}
 */
export function resetToStep(projectRoot, targetStep) {
  const workflow = readWorkflow(projectRoot);
  if (!workflow || !workflow.currentWorkflow) {
    throw new Error('工作流未初始化或无活跃工作流');
  }

  // Validate targetStep: must be 1-6 (step 7 is archive, cannot be a reset target)
  if (targetStep < 1 || targetStep > 6) {
    throw new Error(`无效的目标步骤: ${targetStep}，有效范围为 1-6`);
  }

  // Check if target step is completed
  const targetIndex = targetStep - 1;
  const targetStepData = workflow.steps[targetIndex];
  if (!targetStepData || targetStepData.status !== STATUS.COMPLETED) {
    throw new Error(`目标步骤 ${targetStep} 尚未完成，无法回退到此步骤`);
  }

  // Handle mode: cannot reset to skipped steps
  const mode = workflow.mode || MODE.FULL;
  const skippedSteps = getSkippedStepsForMode(mode);
  if (skippedSteps.includes(targetStep)) {
    throw new Error(`当前模式下步骤 ${targetStep} 被跳过，无法回退到此步骤`);
  }

  // Collect outputs from steps that will be reset (targetStep+1 to 7)
  const resetOutputs = [];
  for (let i = targetStep; i < STEPS.length; i++) {
    const stepData = workflow.steps[i];
    if (stepData && stepData.output && stepData.output !== '-') {
      resetOutputs.push({
        index: i,
        stepNumber: i + 1,
        output: stepData.output,
      });
    }
  }

  // Reset steps after targetStep
  const now = formatLocalDateTime(new Date());
  for (let i = targetStep; i < STEPS.length; i++) {
    const stepNumber = i + 1;
    // Keep skipped steps as skipped based on mode
    if (skippedSteps.includes(stepNumber)) {
      workflow.steps[i] = {
        id: stepNumber,
        name: STEPS[i].name,
        status: STATUS.SKIPPED,
        output: null,
        completedAt: workflow.steps[i]?.completedAt || now,
      };
    } else {
      workflow.steps[i] = {
        id: stepNumber,
        name: STEPS[i].name,
        status: STATUS.PENDING,
        output: null,
        completedAt: null,
      };
    }
  }

  // Set currentStep to next step after targetStep
  workflow.currentStep = getNextStep(targetStep, mode) || targetStep + 1;

  writeWorkflow(projectRoot, workflow);

  return {
    workflow,
    resetOutputs,
  };
}

/**
 * Get step info by number
 * @param {number} stepNumber
 * @returns {Object|null}
 */
export function getStepInfo(stepNumber) {
  return STEPS.find(s => s.id === stepNumber) || null;
}

/**
 * Get step info by command name
 * @param {string} command
 * @returns {Object|null}
 */
export function getStepByCommand(command) {
  return STEPS.find(s => s.command === command) || null;
}

/**
 * Calculate workflow completion progress
 * @param {Object} workflow
 * @returns {{completed: number, total: number, lastCompletedStep: number|null, mode: string}}
 */
export function getWorkflowProgress(workflow) {
  if (!workflow || !workflow.steps) {
    return { completed: 0, total: STEPS.length, lastCompletedStep: null, mode: MODE.FULL };
  }

  const mode = workflow.mode || MODE.FULL;
  const skippedSteps = getSkippedStepsForMode(mode);
  const activeSteps = getStepsForMode(mode);
  let completed = 0;
  let lastCompletedStep = null;

  workflow.steps.forEach((step, index) => {
    const stepNumber = index + 1;

    // Skip counting skipped steps
    if (skippedSteps.includes(stepNumber)) {
      return;
    }

    if (step && step.status === STATUS.COMPLETED) {
      completed++;
      lastCompletedStep = stepNumber;
    }
  });

  const total = activeSteps.length;

  return {
    completed,
    total,
    lastCompletedStep,
    mode,
  };
}

/**
 * Check if workflow is incomplete (has uncompleted steps)
 * @param {Object} workflow
 * @returns {boolean}
 */
export function isWorkflowIncomplete(workflow) {
  if (!workflow || !workflow.currentWorkflow) {
    return false;
  }

  const progress = getWorkflowProgress(workflow);
  return progress.completed < progress.total;
}

/**
 * Add entry to workflow history
 * @param {string} projectRoot
 * @param {Object} entry - History entry
 * @param {string} entry.name - Workflow/file name
 * @param {string} entry.status - Status (e.g., 'archived', 'completed')
 * @param {string} [entry.startTime] - Start time (optional)
 * @param {string} [entry.endTime] - End time (optional, defaults to now)
 * @returns {Object} Updated workflow
 */
export function addToHistory(projectRoot, entry) {
  let workflow = readWorkflow(projectRoot);

  if (!workflow) {
    workflow = {
      currentWorkflow: null,
      currentStep: null,
      mode: MODE.FULL,
      startTime: null,
      lastUpdate: null,
      steps: STEPS.map((step) => ({
        id: step.id,
        name: step.name,
        status: STATUS.PENDING,
        output: null,
        completedAt: null,
      })),
      history: [],
    };
  }

  const now = formatLocalDateTime(new Date());

  workflow.history.unshift({
    name: entry.name,
    status: entry.status,
    startTime: entry.startTime || null,
    endTime: entry.endTime || now,
  });

  writeWorkflow(projectRoot, workflow);
  return workflow;
}

/**
 * Check if workflow is in quick mode
 * @param {Object} workflow
 * @returns {boolean}
 */
export function isQuickMode(workflow) {
  return workflow?.mode === MODE.QUICK;
}

/**
 * Get next valid step based on mode
 * @param {number} currentStep - Current step number (1-based)
 * @param {string} mode - Workflow mode
 * @returns {number|null} - Next step number or null if complete
 */
export function getNextStep(currentStep, mode) {
  const activeSteps = getStepsForMode(mode);
  const currentIndex = activeSteps.indexOf(currentStep);
  if (currentIndex >= 0 && currentIndex < activeSteps.length - 1) {
    return activeSteps[currentIndex + 1];
  }
  return null; // Workflow complete
}

/**
 * Check if a step should be skipped based on mode
 * @param {number} stepNumber - Step number (1-based)
 * @param {string} mode - Workflow mode
 * @returns {boolean}
 */
export function shouldSkipStep(stepNumber, mode) {
  const skippedSteps = getSkippedStepsForMode(mode);
  return skippedSteps.includes(stepNumber);
}

/**
 * Check if a step is allowed in the current mode
 * @param {number} stepNumber - Step number (1-based)
 * @param {string} mode - Workflow mode
 * @returns {boolean}
 */
export function isStepAllowed(stepNumber, mode = MODE.FULL) {
  return !shouldSkipStep(stepNumber, mode);
}

/**
 * Get prerequisite steps for a given step
 * @param {number} stepNumber - Step number (1-based)
 * @param {string} mode - Workflow mode
 * @returns {number[]|null} Null if step is not allowed in the mode
 */
export function getPrerequisiteSteps(stepNumber, mode = MODE.FULL) {
  if (stepNumber <= 1) {
    return [];
  }

  const activeSteps = getStepsForMode(mode);
  if (!activeSteps.includes(stepNumber)) {
    return null;
  }
  return activeSteps.filter(step => step < stepNumber);
}

/**
 * Get missing prerequisite steps for a given step
 * @param {Object} workflow
 * @param {number} stepNumber - Step number (1-based)
 * @returns {number[]|null} Null if step is not allowed in the mode
 */
export function getMissingPrereqs(workflow, stepNumber) {
  const mode = workflow?.mode || MODE.FULL;
  const requiredSteps = getPrerequisiteSteps(stepNumber, mode);
  if (requiredSteps === null) {
    return null;
  }

  const steps = workflow?.steps || [];
  return requiredSteps.filter(step => steps[step - 1]?.status !== STATUS.COMPLETED);
}
