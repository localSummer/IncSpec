/**
 * 工作流模式工具函数
 * 提供纯函数接口，无副作用
 */

import { MODE, STEPS } from './workflow.mjs';

// ============ 类型定义 ============

/**
 * @typedef {'full' | 'quick' | 'minimal'} WorkflowMode
 * 工作流模式枚举
 */

/**
 * @typedef {Object} ModeConfig
 * @property {number[]} steps - 模式包含的步骤ID列表
 * @property {number[]} skippedSteps - 模式跳过的步骤ID列表
 * @property {string} label - 模式的显示标签
 * @property {string} description - 模式的描述
 * @property {number[]} archivableSteps - 可归档的步骤ID列表
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {string} [reason] - 无效原因
 */

// ============ 常量定义 ============

/**
 * 模式配置映射表
 * @type {Object.<string, ModeConfig>}
 */
export const MODE_CONFIG = {
  full: {
    steps: [1, 2, 3, 4, 5, 6, 7],
    skippedSteps: [],
    label: '完整模式',
    description: '7步完整工作流，适合复杂功能开发和架构变更',
    archivableSteps: [1, 2, 3, 4, 5, 6]  // 步骤7是归档本身，不可归档
  },
  quick: {
    steps: [1, 2, 5, 6, 7],
    skippedSteps: [3, 4],
    label: '快速模式',
    description: '5步简化工作流，跳过依赖采集和增量设计，适合简单功能迭代',
    archivableSteps: [1, 2, 5, 6]
  },
  minimal: {
    steps: [1, 5, 7],
    skippedSteps: [2, 3, 4, 6],
    label: '极简模式',
    description: '3步最简工作流（分析→应用→归档），适合Bug修复和简单变更',
    archivableSteps: [1, 5]  // 步骤7是归档本身，步骤6被跳过
  }
};

/**
 * 模式升级顺序（从宽松到严格）
 */
export const MODE_UPGRADE_ORDER = ['minimal', 'quick', 'full'];

// ============ 模式判断函数 ============

/**
 * 判断工作流是否为极简模式
 * @param {Object} workflow - 工作流状态对象
 * @returns {boolean}
 */
export function isMinimalMode(workflow) {
  return workflow?.mode === 'minimal';
}

/**
 * 判断工作流是否为快速模式
 * @param {Object} workflow - 工作流状态对象
 * @returns {boolean}
 */
export function isQuickMode(workflow) {
  return workflow?.mode === 'quick';
}

/**
 * 判断工作流是否为完整模式
 * @param {Object} workflow - 工作流状态对象
 * @returns {boolean}
 */
export function isFullMode(workflow) {
  return workflow?.mode === 'full';
}

// ============ 步骤管理函数 ============

/**
 * 获取指定模式包含的步骤ID列表
 * @param {string} mode - 模式名称 ('full' | 'quick' | 'minimal')
 * @returns {number[]} 步骤ID数组
 * @throws {Error} 如果模式不存在
 */
export function getStepsForMode(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    throw new Error(`Unknown mode: ${mode}`);
  }
  return [...config.steps];
}

/**
 * 获取指定模式跳过的步骤ID列表
 * @param {string} mode - 模式名称
 * @returns {number[]} 跳过的步骤ID数组
 * @throws {Error} 如果模式不存在
 */
export function getSkippedStepsForMode(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    throw new Error(`Unknown mode: ${mode}`);
  }
  return [...config.skippedSteps];
}

/**
 * 判断步骤在指定模式下是否激活（未被跳过）
 * @param {number} stepId - 步骤ID (1-7)
 * @param {string} mode - 模式名称
 * @returns {boolean}
 */
export function isStepActiveInMode(stepId, mode) {
  const steps = getStepsForMode(mode);
  return steps.includes(stepId);
}

/**
 * 获取指定模式下可归档的步骤索引（用于 archive 命令）
 * @param {string} mode - 模式名称
 * @returns {number[]} 可归档的步骤索引数组（0-based）
 */
export function getArchivableStepsForMode(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    throw new Error(`Unknown mode: ${mode}`);
  }
  // 步骤ID转索引：减1
  return config.archivableSteps.map(id => id - 1);
}

// ============ 格式化函数 ============

/**
 * 获取模式的显示标签（中文）
 * @param {string} mode - 模式名称
 * @returns {string} 格式化的标签，如 "完整模式 (7步)"
 */
export function getModeLabel(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    return '未知模式';
  }
  const stepCount = config.steps.length;
  return `${config.label} (${stepCount}步)`;
}

/**
 * 获取模式的详细描述
 * @param {string} mode - 模式名称
 * @returns {string}
 */
export function getModeDescription(mode) {
  const config = MODE_CONFIG[mode];
  return config?.description || '无描述';
}

/**
 * 格式化模式信息为多行文本（用于终端输出）
 * @param {string} mode - 模式名称
 * @returns {string}
 */
export function formatModeInfo(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    return '未知模式';
  }
  const lines = [
    `${config.label} (${config.steps.length}步)`,
    `描述: ${config.description}`,
    `步骤: ${config.steps.join(' → ')}`
  ];
  if (config.skippedSteps.length > 0) {
    lines.push(`跳过: 步骤 ${config.skippedSteps.join(', ')}`);
  }
  return lines.join('\n');
}

// ============ 模式转换函数 ============

/**
 * 验证模式升级是否合法
 * @param {string} fromMode - 当前模式
 * @param {string} toMode - 目标模式
 * @returns {ValidationResult}
 */
export function validateModeUpgrade(fromMode, toMode) {
  if (!MODE_CONFIG[fromMode]) {
    return { valid: false, reason: `未知的源模式: ${fromMode}` };
  }
  if (!MODE_CONFIG[toMode]) {
    return { valid: false, reason: `未知的目标模式: ${toMode}` };
  }
  
  const fromIndex = MODE_UPGRADE_ORDER.indexOf(fromMode);
  const toIndex = MODE_UPGRADE_ORDER.indexOf(toMode);
  
  if (fromIndex === toIndex) {
    return { valid: false, reason: '源模式和目标模式相同' };
  }
  if (fromIndex > toIndex) {
    return { valid: false, reason: '只能从宽松模式升级到严格模式（minimal → quick → full）' };
  }
  
  return { valid: true };
}

/**
 * 获取模式升级后需要补充的步骤ID
 * @param {string} fromMode - 当前模式
 * @param {string} toMode - 目标模式
 * @returns {number[]} 需要补充的步骤ID数组
 */
export function getMissingStepsAfterUpgrade(fromMode, toMode) {
  const fromSteps = new Set(getStepsForMode(fromMode));
  const toSteps = getStepsForMode(toMode);
  return toSteps.filter(step => !fromSteps.has(step));
}

// ============ 文件路径函数 ============

/**
 * 获取 apply 命令的输入文件路径（相对于 projectRoot/incspec/）
 * @param {string} mode - 模式名称
 * @param {Object} workflow - 工作流状态（用于获取版本号）
 * @returns {string} 相对路径
 */
export function getApplyInputFile(mode, workflow) {
  if (mode === 'full') {
    // 完整模式：使用增量设计文件
    const moduleName = workflow.currentWorkflow?.replace('analyze-', '') || 'default';
    const version = workflow.incrementVersion || 1;
    return `increments/${moduleName}-increment-v${version}.md`;
  } else {
    // 快速/极简模式：使用结构化需求文件
    return 'requirements/structured-requirements.md';
  }
}

/**
 * 获取 merge 命令的输出基线文件名（不含路径）
 * @param {string} moduleName - 模块名称
 * @param {number} version - 版本号
 * @returns {string} 文件名
 */
export function getMergeOutputFilename(moduleName, version) {
  return `${moduleName}-baseline-v${version}.md`;
}
