/**
 * Unified IDE integration utilities
 * - Generate IDE slash commands from templates
 * - Support multiple IDEs through configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { INCSPEC_DIR } from './config.mjs';
import { MODE_CONFIG, MODE_UPGRADE_ORDER } from './mode-utils.mjs';

/** Built-in templates directory */
const TEMPLATES_DIR = fileURLToPath(new URL('../templates/commands', import.meta.url));

/**
 * IDE-specific configurations
 */
const IDE_CONFIGS = {
  cursor: {
    name: 'Cursor',
    projectDir: '.cursor/commands/incspec',
    globalDir: path.join(os.homedir(), '.cursor', 'commands', 'incspec'),
    fallbackDirs: [
      // Support old ai-incremental-coding commands for backward compatibility
      path.join(os.homedir(), '.claude', 'commands', 'ai-increment'),
    ],
  },
  claude: {
    name: 'Claude Code',
    projectDir: '.claude/commands/incspec',
    globalDir: path.join(os.homedir(), '.claude', 'commands', 'incspec'),
    fallbackDirs: [],
  },
};

/**
 * Command mapping (shared across all IDEs)
 */
export const COMMAND_MAP = [
  {
    source: 'analyze-codeflow.md',
    target: 'inc-analyze.md',
    step: 1,
    label: '步骤1: 分析代码流程',
    description: '[incspec] 分析代码工作流,生成API时序图和依赖关系基线快照',
  },
  {
    source: 'structured-requirements-collection.md',
    target: 'inc-collect-req.md',
    step: 2,
    label: '步骤2: 结构化需求收集',
    description: '[incspec] 交互式收集需求,生成5列结构化表格',
  },
  {
    source: 'ui-dependency-collection.md',
    target: 'inc-collect-dep.md',
    step: 3,
    label: '步骤3: UI依赖采集',
    description: '[incspec] 交互式采集6维度UI依赖信息',
  },
  {
    source: 'analyze-increment-codeflow.md',
    target: 'inc-design.md',
    step: 4,
    label: '步骤4: 增量设计',
    description: '[incspec] 基于需求和依赖生成增量设计蓝图(7大模块)',
  },
  {
    source: 'apply-increment-code.md',
    target: 'inc-apply.md',
    step: 5,
    label: '步骤5: 应用代码变更',
    description: '[incspec] 根据增量设计执行代码变更',
  },
  {
    source: 'merge-to-baseline.md',
    target: 'inc-merge.md',
    step: 6,
    label: '步骤6: 合并到基线',
    description: '[incspec] 将增量融合为新的代码流基线快照',
  },
  {
    source: 'inc-archive.md',
    target: 'inc-archive.md',
    step: 7,
    label: '步骤7: 归档工作流产出',
    description: '[incspec] 归档工作流产出文件到历史记录目录',
  },
];

/**
 * Get source file path with optional fallback directories
 * @param {string} fileName - Source file name
 * @param {Array<string>} fallbackDirs - Optional fallback directories to search
 * @returns {string|null} Path to source file or null if not found
 */
function getSourcePath(fileName, fallbackDirs = []) {
  // Try built-in templates first (preferred)
  const templatePath = path.join(TEMPLATES_DIR, fileName);
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }

  // Try fallback directories
  for (const dir of fallbackDirs) {
    const fallbackPath = path.join(dir, fileName);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
  }

  return null;
}

/**
 * Generate mode sections for help content
 * Shows all 7 workflow steps with their mode indicators
 * @returns {string}
 */
function generateModeSections() {
  const lines = [];

  // Step info: command, description, and which modes support it
  const steps = [
    { cmd: 'inc-analyze', desc: '分析代码流程,生成基线快照', modes: ['full', 'quick', 'minimal'] },
    { cmd: 'inc-collect-req', desc: '收集结构化需求', modes: ['full', 'quick'] },
    { cmd: 'inc-collect-dep', desc: '采集UI依赖', modes: ['full'] },
    { cmd: 'inc-design', desc: '生成增量设计蓝图', modes: ['full'] },
    { cmd: 'inc-apply', desc: '应用代码变更', modes: ['full', 'quick', 'minimal'] },
    { cmd: 'inc-merge', desc: '合并到新基线', modes: ['full', 'quick'] },
    { cmd: 'inc-archive', desc: '归档工作流产出', modes: ['full', 'quick', 'minimal'] }
  ];

  // Generate all 7 steps with mode indicators
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;

    let cmdLine;
    if (step.modes.length === 3) {
      cmdLine = `\`/incspec/${step.cmd}\``;
    } else if (step.modes.includes('full') && step.modes.includes('quick')) {
      cmdLine = `\`/incspec/${step.cmd}\` (完整/快速)`;
    } else {
      cmdLine = `\`/incspec/${step.cmd}\` (完整)`;
    }

    lines.push(`${stepNum}. ${cmdLine} - ${step.desc}`);
  }

  return lines.join('\n');
}

/**
 * Generate utility commands content
 * @returns {Array<{name: string, content: string}>}
 */
function generateUtilityCommands() {
  // Generate help content from template
  const helpTemplatePath = path.join(TEMPLATES_DIR, 'inc-help.md');
  let helpContent;

  if (fs.existsSync(helpTemplatePath)) {
    const template = fs.readFileSync(helpTemplatePath, 'utf-8');
    helpContent = template.replace('<!-- MODE_SECTIONS -->', generateModeSections());
  } else {
    // Fallback: generate complete content inline
    helpContent = `---
description: [incspec] 显示帮助信息
---

# incspec 帮助

## 工作流步骤

${generateModeSections()}
## 辅助命令

- \`/incspec/inc-status\` - 查看当前工作流状态
- \`/incspec/inc-help\` - 显示帮助信息

## CLI 命令

\`\`\`bash
incspec init          # 初始化项目
incspec status        # 查看工作流状态
incspec list          # 列出规范文件
incspec validate      # 验证规范完整性
incspec sync          # 同步 IDE 命令
incspec help          # 显示帮助
\`\`\`

## 目录结构

\`\`\`
${INCSPEC_DIR}/
├── project.md        # 项目配置
├── workflow.json     # 工作流状态
├── baselines/        # 基线快照
├── requirements/     # 需求文档
├── increments/       # 增量设计
└── archives/         # 历史归档 (YYYY-MM/{module}/)
\`\`\`
`;
  }

  return [
    {
      name: 'inc-status.md',
      content: `---
description: [incspec] 查看当前工作流状态
---

# 查看工作流状态

请运行以下命令查看当前工作流状态:

\`\`\`bash
incspec status
\`\`\`

或直接读取状态文件:

\`\`\`bash
cat ${INCSPEC_DIR}/workflow.json
\`\`\`
`,
    },
    {
      name: 'inc-help.md',
      content: helpContent,
    },
  ];
}

/**
 * Generate all IDE commands
 * @param {string} ide - IDE type ('cursor' or 'claude')
 * @param {Object} options - Additional options
 * @param {string} options.projectRoot - Optional project root for customization
 * @returns {Array<{name: string, content: string}>}
 */
export function generateCommands(ide, { projectRoot = null } = {}) {
  const config = IDE_CONFIGS[ide];
  if (!config) {
    throw new Error(`Unknown IDE: ${ide}`);
  }

  const commands = [];

  // Generate workflow commands
  for (const cmd of COMMAND_MAP) {
    const sourcePath = getSourcePath(cmd.source, config.fallbackDirs);

    let content;
    if (sourcePath) {
      content = fs.readFileSync(sourcePath, 'utf-8');
    } else {
      // Generate placeholder if source doesn't exist
      content = `---
description: ${cmd.description}
---

# ${cmd.label}

> 源命令文件不存在: ${cmd.source}
> 请确保已正确安装 incspec-cli。

请参考 incspec 文档手动执行此步骤。
`;
    }

    commands.push({
      name: cmd.target,
      content,
    });
  }

  // Add utility commands
  commands.push(...generateUtilityCommands());

  return commands;
}

/**
 * Sync commands to project directory
 * @param {string} ide - IDE type ('cursor' or 'claude')
 * @param {string} projectRoot - Project root path
 * @returns {number} Number of files written
 */
export function syncToProject(ide, projectRoot) {
  const config = IDE_CONFIGS[ide];
  if (!config) {
    throw new Error(`Unknown IDE: ${ide}`);
  }

  const targetDir = path.join(projectRoot, config.projectDir);

  // Create directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const commands = generateCommands(ide, { projectRoot });

  for (const cmd of commands) {
    const filePath = path.join(targetDir, cmd.name);
    fs.writeFileSync(filePath, cmd.content, 'utf-8');
  }

  return commands.length;
}

/**
 * Sync commands to global directory
 * @param {string} ide - IDE type ('cursor' or 'claude')
 * @returns {number} Number of files written
 */
export function syncToGlobal(ide) {
  const config = IDE_CONFIGS[ide];
  if (!config) {
    throw new Error(`Unknown IDE: ${ide}`);
  }

  const targetDir = config.globalDir;

  // Create directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const commands = generateCommands(ide);

  for (const cmd of commands) {
    const filePath = path.join(targetDir, cmd.name);
    fs.writeFileSync(filePath, cmd.content, 'utf-8');
  }

  return commands.length;
}

/**
 * Check if IDE commands exist
 * @param {string} ide - IDE type ('cursor' or 'claude')
 * @param {string} projectRoot - Project root path
 * @returns {{project: boolean, global: boolean}}
 */
export function checkCommands(ide, projectRoot) {
  const config = IDE_CONFIGS[ide];
  if (!config) {
    throw new Error(`Unknown IDE: ${ide}`);
  }

  const projectDir = path.join(projectRoot, config.projectDir);
  const globalDir = config.globalDir;

  return {
    project: fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0,
    global: fs.existsSync(globalDir) && fs.readdirSync(globalDir).length > 0,
  };
}

/**
 * Get IDE configuration
 * @param {string} ide - IDE type ('cursor' or 'claude')
 * @returns {Object} IDE configuration
 */
export function getIDEConfig(ide) {
  const config = IDE_CONFIGS[ide];
  if (!config) {
    throw new Error(`Unknown IDE: ${ide}`);
  }
  return config;
}

/**
 * Get list of supported IDEs
 * @returns {Array<string>}
 */
export function getSupportedIDEs() {
  return Object.keys(IDE_CONFIGS);
}
