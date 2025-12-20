/**
 * Workflow state management for incspec
 * - Read/write WORKFLOW.md
 * - Track current step
 * - Manage workflow history
 */

import * as fs from 'fs';
import * as path from 'path';
import { INCSPEC_DIR, FILES, getTemplatesDir } from './config.mjs';
import { formatLocalDateTime } from './terminal.mjs';

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
};

/** Quick mode valid steps (1-based) */
export const QUICK_MODE_STEPS = [1, 2, 5, 6, 7];

/** Quick mode skipped steps (1-based) */
export const QUICK_MODE_SKIPPED = [3, 4];

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

function ensureTableSeparator(content, sectionTitle, headerLine, separatorLine) {
  const sectionIndex = content.indexOf(sectionTitle);
  if (sectionIndex === -1) {
    return { content, updated: false };
  }

  const headerIndex = content.indexOf(headerLine, sectionIndex);
  if (headerIndex === -1) {
    return { content, updated: false };
  }

  const headerLineEnd = content.indexOf('\n', headerIndex);
  if (headerLineEnd === -1) {
    return { content, updated: false };
  }

  const nextLineStart = headerLineEnd + 1;
  const nextLineEnd = content.indexOf('\n', nextLineStart);
  const nextLine = content
    .slice(nextLineStart, nextLineEnd === -1 ? content.length : nextLineEnd)
    .replace(/\r$/, '');

  if (nextLine.trim() === separatorLine.trim()) {
    return { content, updated: false };
  }

  const updatedContent =
    content.slice(0, nextLineStart) +
    `${separatorLine}\n` +
    content.slice(nextLineStart);

  return { content: updatedContent, updated: true };
}

function normalizeWorkflowContent(content) {
  let updated = false;
  let normalized = content;

  const stepsResult = ensureTableSeparator(
    normalized,
    '## 步骤进度',
    '| 步骤 | 状态 | 输出文件 | 完成时间 |',
    '|------|------|---------|---------|'
  );
  normalized = stepsResult.content;
  updated = updated || stepsResult.updated;

  const historyResult = ensureTableSeparator(
    normalized,
    '## 工作流历史',
    '| 工作流 | 状态 | 开始时间 | 完成时间 |',
    '|--------|------|---------|---------|'
  );
  normalized = historyResult.content;
  updated = updated || historyResult.updated;

  return { content: normalized, updated };
}

/**
 * Get workflow file path
 * @param {string} projectRoot
 * @returns {string}
 */
export function getWorkflowPath(projectRoot) {
  return path.join(projectRoot, INCSPEC_DIR, FILES.workflow);
}

/**
 * Parse WORKFLOW.md content
 * @param {string} content
 * @returns {Object}
 */
export function parseWorkflow(content) {
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
    workflow.mode = modeValue === 'quick' ? MODE.QUICK : MODE.FULL;
  }

  const startMatch = content.match(/\*\*开始时间\*\*:\s*(.+)/);
  if (startMatch) {
    workflow.startTime = startMatch[1].trim();
  }

  const updateMatch = content.match(/\*\*最后更新\*\*:\s*(.+)/);
  if (updateMatch) {
    workflow.lastUpdate = updateMatch[1].trim();
  }

  // Parse steps table
  const stepsTableMatch = content.match(/## 步骤进度\n\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|\n*$)/);
  if (stepsTableMatch) {
    const rows = stepsTableMatch[1].trim().split('\n').filter(r => r.trim());
    workflow.steps = rows.map(row => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 4) {
        return {
          step: cells[0],
          status: cells[1],
          output: cells[2] === '-' ? null : cells[2],
          completedAt: cells[3] === '-' ? null : cells[3],
        };
      }
      return null;
    }).filter(Boolean);
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
 * Read workflow state
 * @param {string} projectRoot
 * @returns {Object|null}
 */
export function readWorkflow(projectRoot) {
  const workflowPath = getWorkflowPath(projectRoot);

  if (!fs.existsSync(workflowPath)) {
    return null;
  }

  const content = fs.readFileSync(workflowPath, 'utf-8');
  const normalized = normalizeWorkflowContent(content);
  if (normalized.updated) {
    fs.writeFileSync(workflowPath, normalized.content, 'utf-8');
  }
  return parseWorkflow(normalized.content);
}

/**
 * Generate WORKFLOW.md content
 * @param {Object} workflow
 * @returns {string}
 */
export function generateWorkflowContent(workflow) {
  const now = formatLocalDateTime(new Date());
  const mode = workflow.mode || MODE.FULL;

  const lines = [
    '# Workflow Status',
    '',
    `**当前工作流**: ${workflow.currentWorkflow || '-'}`,
    `**当前步骤**: ${workflow.currentStep || '-'}`,
    `**工作流模式**: ${mode}`,
    `**开始时间**: ${workflow.startTime || '-'}`,
    `**最后更新**: ${now}`,
    '',
    '## 步骤进度',
    '',
    '| 步骤 | 状态 | 输出文件 | 完成时间 |',
    '|------|------|---------|---------|',
  ];

  // Generate steps
  STEPS.forEach((step, index) => {
    const stepData = workflow.steps[index] || {};
    const status = stepData.status || STATUS.PENDING;
    const output = stepData.output || '-';
    const completedAt = stepData.completedAt || '-';
    lines.push(`| ${step.id}. ${step.name} | ${status} | ${output} | ${completedAt} |`);
  });

  lines.push('');
  lines.push('## 工作流历史');
  lines.push('');
  lines.push('| 工作流 | 状态 | 开始时间 | 完成时间 |');
  lines.push('|--------|------|---------|---------|');

  // Generate history
  if (workflow.history && workflow.history.length > 0) {
    workflow.history.forEach(item => {
      lines.push(`| ${item.name} | ${item.status} | ${item.startTime || '-'} | ${item.endTime || '-'} |`);
    });
  }

  return lines.join('\n');
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
  const content = generateInitialWorkflowContent();
  fs.writeFileSync(workflowPath, content, 'utf-8');

  return {
    currentWorkflow: null,
    currentStep: null,
    mode: MODE.FULL,
    startTime: null,
    lastUpdate: null,
    steps: STEPS.map(() => ({
      status: STATUS.PENDING,
      output: null,
      completedAt: null,
    })),
    history: [],
  };
}

/**
 * Generate initial WORKFLOW.md content from template
 * @returns {string}
 */
function generateInitialWorkflowContent() {
  const templatePath = path.join(getTemplatesDir(), 'WORKFLOW.md');
  const now = formatLocalDateTime(new Date());

  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, 'utf-8');
    content = content.replace(/\{\{last_update\}\}/g, now);
    return content;
  }

  // Fallback to generated content
  const workflow = {
    currentWorkflow: null,
    currentStep: null,
    startTime: null,
    lastUpdate: null,
    steps: STEPS.map(() => ({
      status: STATUS.PENDING,
      output: null,
      completedAt: null,
    })),
    history: [],
  };

  return generateWorkflowContent(workflow);
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

  // Initialize steps - mark skipped steps in quick mode
  workflow.steps = STEPS.map((step) => {
    if (mode === MODE.QUICK && QUICK_MODE_SKIPPED.includes(step.id)) {
      return {
        status: STATUS.SKIPPED,
        output: null,
        completedAt: now,
      };
    }
    return {
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
    startTime: workflow.startTime || '-',
    endTime: now,
  });

  workflow.currentWorkflow = null;
  workflow.currentStep = null;
  workflow.startTime = null;
  workflow.steps = STEPS.map(() => ({
    status: STATUS.PENDING,
    output: null,
    completedAt: null,
  }));

  writeWorkflow(projectRoot, workflow);
  return workflow;
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
  let completed = 0;
  let lastCompletedStep = null;

  workflow.steps.forEach((step, index) => {
    const stepNumber = index + 1;

    // Skip counting skipped steps in quick mode
    if (mode === MODE.QUICK && QUICK_MODE_SKIPPED.includes(stepNumber)) {
      return;
    }

    if (step && step.status === STATUS.COMPLETED) {
      completed++;
      lastCompletedStep = stepNumber;
    }
  });

  // Quick mode has 5 steps (1,2,5,6,7), full mode has 7 steps
  const total = mode === MODE.QUICK ? QUICK_MODE_STEPS.length : STEPS.length;

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
      startTime: null,
      lastUpdate: null,
      steps: STEPS.map(() => ({
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
    startTime: entry.startTime || '-',
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
  if (mode === MODE.QUICK) {
    const currentIndex = QUICK_MODE_STEPS.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < QUICK_MODE_STEPS.length - 1) {
      return QUICK_MODE_STEPS[currentIndex + 1];
    }
    return null; // Workflow complete
  }
  // Full mode
  return currentStep < STEPS.length ? currentStep + 1 : null;
}

/**
 * Check if a step should be skipped based on mode
 * @param {number} stepNumber - Step number (1-based)
 * @param {string} mode - Workflow mode
 * @returns {boolean}
 */
export function shouldSkipStep(stepNumber, mode) {
  return mode === MODE.QUICK && QUICK_MODE_SKIPPED.includes(stepNumber);
}
