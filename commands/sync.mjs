/**
 * sync command - Sync incspec integrations to IDEs/AI tools
 */

import {
  syncToProject as syncCursorToProject,
  syncToGlobal as syncCursorToGlobal,
} from '../lib/cursor.mjs';
import {
  syncToProjectClaude,
  syncToGlobalClaude,
} from '../lib/claude.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  select,
  checkbox,
} from '../lib/terminal.mjs';

/** Sync target definitions */
const SYNC_TARGETS = {
  cursor: {
    name: 'Cursor',
    value: 'cursor',
  },
  claude: {
    name: 'Claude Code',
    value: 'claude',
  },
};

/**
 * Execute sync command
 * @param {Object} ctx - Command context
 */
export async function syncCommand(ctx) {
  const { cwd, options } = ctx;

  print('');
  print(colorize('  IncSpec 集成同步', colors.bold, colors.cyan));
  print(colorize('  ────────────────', colors.dim));
  print('');

  // Determine sync targets
  let targets = [];

  // Command line args take priority
  if (options.cursor) {
    targets.push('cursor');
  }
  if (options.claude) {
    targets.push('claude');
  }
  if (options.all) {
    targets = ['cursor', 'claude'];
  }

  // If no args specified, use interactive checkbox
  if (targets.length === 0) {
    targets = await checkbox({
      message: '选择要同步的目标:',
      choices: [
        { ...SYNC_TARGETS.cursor, checked: true },
        { ...SYNC_TARGETS.claude, checked: false },
      ],
    });

    if (targets.length === 0) {
      printWarning('未选择任何同步目标。');
      return;
    }
  }

  print(colorize(`已选择: ${targets.map(t => SYNC_TARGETS[t].name).join(', ')}`, colors.dim));
  print('');

  // Execute sync for each target
  for (const target of targets) {
    if (target === 'cursor') {
      await syncCursor(ctx);
    } else if (target === 'claude') {
      await syncClaude(ctx);
    }
    print('');
  }

  printInfo('同步完成。');
  print('');
}

/**
 * Sync Cursor commands
 * @param {Object} ctx
 */
async function syncCursor(ctx) {
  const { cwd, options } = ctx;

  print(colorize('=== Cursor 命令同步 ===', colors.bold));
  print('');

  // Determine sync target
  let syncTarget = null;

  if (options.project) {
    syncTarget = 'project';
  } else if (options.global) {
    syncTarget = 'global';
  } else {
    const choices = [
      {
        name: `当前目录 (${cwd}/.cursor/commands/incspec/)`,
        value: 'project',
        description: '仅对当前目录生效',
      },
      {
        name: '全局目录 (~/.cursor/commands/incspec/)',
        value: 'global',
        description: '对所有项目生效',
      },
    ];

    syncTarget = await select({
      message: 'Cursor - 选择同步目标:',
      choices,
    });
  }

  // Execute sync
  if (syncTarget === 'project') {
    const count = syncCursorToProject(cwd);
    printSuccess(`Cursor: 已同步 ${count} 个命令到 .cursor/commands/incspec/`);
    printCursorCommands();
  } else if (syncTarget === 'global') {
    const count = syncCursorToGlobal();
    printSuccess(`Cursor: 已同步 ${count} 个命令到 ~/.cursor/commands/incspec/`);
    printCursorCommands();
  }
}

/**
 * Print Cursor commands list
 */
function printCursorCommands() {
  print('');
  print(colorize('已创建的命令:', colors.bold));
  print(colorize('  /incspec/inc-analyze      步骤1: 分析代码流程', colors.dim));
  print(colorize('  /incspec/inc-collect-req  步骤2: 收集结构化需求', colors.dim));
  print(colorize('  /incspec/inc-collect-dep  步骤3: UI依赖采集', colors.dim));
  print(colorize('  /incspec/inc-design       步骤4: 增量设计', colors.dim));
  print(colorize('  /incspec/inc-apply        步骤5: 应用代码变更', colors.dim));
  print(colorize('  /incspec/inc-merge        步骤6: 合并到基线', colors.dim));
  print(colorize('  /incspec/inc-archive      归档规范文件', colors.dim));
  print(colorize('  /incspec/inc-status       查看工作流状态', colors.dim));
  print(colorize('  /incspec/inc-help         显示帮助', colors.dim));
  print('');
  printInfo('请重启 Cursor 以加载新命令。');
}

/**
 * Sync Claude Code skill
 * @param {Object} ctx
 */
async function syncClaude(ctx) {
  const { cwd, options } = ctx;

  print(colorize('=== Claude Code Skill 同步 ===', colors.bold));
  print('');

  // Determine sync target
  let syncTarget = null;

  if (options.project) {
    syncTarget = 'project';
  } else if (options.global) {
    syncTarget = 'global';
  } else {
    const choices = [
      {
        name: `当前目录 (${cwd}/.claude/skills/inc-spec-skill/)`,
        value: 'project',
        description: '仅对当前目录生效',
      },
      {
        name: '全局目录 (~/.claude/skills/inc-spec-skill/)',
        value: 'global',
        description: '对所有项目生效（推荐）',
      },
    ];

    syncTarget = await select({
      message: 'Claude Code - 选择同步目标:',
      choices,
    });
  }

  // Execute sync
  if (syncTarget === 'project') {
    const { count } = syncToProjectClaude(cwd);
    printSuccess(`Claude Code: 已同步 ${count} 个文件到 .claude/skills/inc-spec-skill/`);
    print(colorize('  包含: SKILL.md + references/', colors.dim));
  } else if (syncTarget === 'global') {
    const { count } = syncToGlobalClaude();
    printSuccess(`Claude Code: 已同步 ${count} 个文件到 ~/.claude/skills/inc-spec-skill/`);
    print(colorize('  包含: SKILL.md + references/', colors.dim));
  }
}
