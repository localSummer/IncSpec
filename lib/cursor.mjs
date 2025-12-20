/**
 * Cursor integration utilities
 * - Generate Cursor slash commands
 * - Sync to project or global
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { INCSPEC_DIR, DIRS } from './config.mjs';

/** Cursor commands directory */
const CURSOR_COMMANDS_DIR = '.cursor/commands/incspec';

/** Global Cursor commands directory */
const GLOBAL_CURSOR_DIR = path.join(os.homedir(), '.cursor', 'commands', 'incspec');

/** Claude commands source directory (user local) */
const CLAUDE_COMMANDS_DIR = path.join(os.homedir(), '.claude', 'commands', 'ai-increment');

/** Built-in templates directory (fallback when Claude commands not installed) */
const TEMPLATES_DIR = fileURLToPath(new URL('../templates/cursor-commands', import.meta.url));

/**
 * Command mapping from Claude to Cursor
 */
const COMMAND_MAP = [
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
];

/**
 * Generate Cursor command content
 * Templates already contain complete Cursor command format with CLI sync instructions,
 * so we just pass through the source content directly.
 * @param {Object} cmd - Command definition
 * @param {string} sourceContent - Original template content (already complete)
 * @param {string} projectRoot - Project root path (optional, unused)
 * @returns {string}
 */
function generateCursorCommand(cmd, sourceContent, projectRoot = null) {
  // Templates are already complete Cursor commands, pass through directly
  return sourceContent;
}

/**
 * Get source file path with fallback to user local commands
 * @param {string} fileName - Source file name
 * @returns {string|null} Path to source file or null if not found
 */
function getSourcePath(fileName) {
  // Try built-in templates first (preferred)
  const templatePath = path.join(TEMPLATES_DIR, fileName);
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }

  // Fallback to user local Claude commands
  const claudePath = path.join(CLAUDE_COMMANDS_DIR, fileName);
  if (fs.existsSync(claudePath)) {
    return claudePath;
  }

  return null;
}

/**
 * Generate all Cursor commands
 * @param {string} projectRoot - Optional project root for customization
 * @returns {Array<{name: string, content: string}>}
 */
export function generateCursorCommands(projectRoot = null) {
  const commands = [];

  for (const cmd of COMMAND_MAP) {
    const sourcePath = getSourcePath(cmd.source);

    let content;
    if (sourcePath) {
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
      content = generateCursorCommand(cmd, sourceContent, projectRoot);
    } else {
      // Generate placeholder if source doesn't exist
      content = `---
description: ${cmd.description}
---

# ${cmd.label}

> 源命令文件不存在: ${cmd.source}
> 请确保已正确安装 incspec-cli 或 ai-incremental-coding 技能。

请参考 incspec 文档手动执行此步骤。
`;
    }

    commands.push({
      name: cmd.target,
      content,
    });
  }

  // Add utility commands
  commands.push({
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
cat ${INCSPEC_DIR}/WORKFLOW.md
\`\`\`
`,
  });

  commands.push({
    name: 'inc-help.md',
    content: `---
description: [incspec] 显示帮助信息
---

# incspec 帮助

## 工作流步骤

1. \`/incspec/inc-analyze\` - 分析代码流程,生成基线快照
2. \`/incspec/inc-collect-req\` - 收集结构化需求
3. \`/incspec/inc-collect-dep\` - 采集UI依赖
4. \`/incspec/inc-design\` - 生成增量设计蓝图
5. \`/incspec/inc-apply\` - 应用代码变更
6. \`/incspec/inc-merge\` - 合并到新基线

## 辅助命令

- \`/incspec/inc-archive\` - 归档规范文件到 archives 目录
- \`/incspec/inc-status\` - 查看当前工作流状态
- \`/incspec/inc-help\` - 显示帮助信息

## CLI 命令

\`\`\`bash
incspec init          # 初始化项目
incspec status        # 查看工作流状态
incspec list          # 列出规范文件
incspec validate      # 验证规范完整性
incspec cursor-sync   # 同步 Cursor 命令
incspec help          # 显示帮助
\`\`\`

## 目录结构

\`\`\`
${INCSPEC_DIR}/
├── project.md        # 项目配置
├── WORKFLOW.md       # 工作流状态
├── baselines/        # 基线快照
├── requirements/     # 需求文档
├── increments/       # 增量设计
└── archives/         # 历史归档 (YYYY-MM/{module}/)
\`\`\`
`,
  });

  // Add archive command from template
  const archiveSourcePath = getSourcePath('inc-archive.md');
  if (archiveSourcePath) {
    const archiveContent = fs.readFileSync(archiveSourcePath, 'utf-8');
    commands.push({
      name: 'inc-archive.md',
      content: archiveContent,
    });
  } else {
    commands.push({
      name: 'inc-archive.md',
      content: `---
description: [incspec] 归档规范文件到 archives 目录
---

# 归档规范文件

请运行以下命令归档规范文件:

\`\`\`bash
# 归档当前工作流全部产出文件（默认模式）
incspec archive --yes

# 归档指定文件（默认移动模式，删除原文件）
incspec archive <file-path> --yes

# 归档并保留原文件（复制模式）
incspec archive <file-path> --keep --yes
\`\`\`
`,
    });
  }

  return commands;
}

/**
 * Sync commands to project directory
 * @param {string} projectRoot
 * @returns {number} Number of files written
 */
export function syncToProject(projectRoot) {
  const targetDir = path.join(projectRoot, CURSOR_COMMANDS_DIR);
  
  // Create directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const commands = generateCursorCommands(projectRoot);
  
  for (const cmd of commands) {
    const filePath = path.join(targetDir, cmd.name);
    fs.writeFileSync(filePath, cmd.content, 'utf-8');
  }

  return commands.length;
}

/**
 * Sync commands to global Cursor directory
 * @returns {number} Number of files written
 */
export function syncToGlobal() {
  // Create directory
  if (!fs.existsSync(GLOBAL_CURSOR_DIR)) {
    fs.mkdirSync(GLOBAL_CURSOR_DIR, { recursive: true });
  }

  const commands = generateCursorCommands();
  
  for (const cmd of commands) {
    const filePath = path.join(GLOBAL_CURSOR_DIR, cmd.name);
    fs.writeFileSync(filePath, cmd.content, 'utf-8');
  }

  return commands.length;
}

/**
 * Check if Cursor commands exist
 * @param {string} projectRoot
 * @returns {{project: boolean, global: boolean}}
 */
export function checkCursorCommands(projectRoot) {
  const projectDir = path.join(projectRoot, CURSOR_COMMANDS_DIR);
  const globalDir = GLOBAL_CURSOR_DIR;

  return {
    project: fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0,
    global: fs.existsSync(globalDir) && fs.readdirSync(globalDir).length > 0,
  };
}
