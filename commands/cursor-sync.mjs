/**
 * cursor-sync command - Sync Cursor slash commands
 */

import * as path from 'path';
import {
  findProjectRoot,
  INCSPEC_DIR,
} from '../lib/config.mjs';
import {
  syncToProject,
  syncToGlobal,
  checkCursorCommands,
} from '../lib/cursor.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  confirm,
  select,
} from '../lib/terminal.mjs';

/**
 * Execute cursor-sync command
 * @param {Object} ctx - Command context
 */
export async function cursorSyncCommand(ctx) {
  const { cwd, options } = ctx;

  print('');
  print(colorize('  incspec Cursor 命令同步', colors.bold, colors.cyan));
  print(colorize('  ──────────────────────', colors.dim));
  print('');

  // Determine sync target
  let syncTarget = null;

  if (options.project) {
    syncTarget = 'project';
  } else if (options.global) {
    syncTarget = 'global';
  } else {
    // Interactive selection
    const projectRoot = findProjectRoot(cwd);
    
    const choices = [
      {
        name: '项目目录 (.cursor/commands/incspec/)',
        value: 'project',
        description: '仅对当前项目生效',
      },
      {
        name: '全局目录 (~/.cursor/commands/incspec/)',
        value: 'global',
        description: '对所有项目生效',
      },
    ];

    if (!projectRoot) {
      // No project found, only allow global
      printWarning('未检测到 incspec 项目，将同步到全局目录。');
      syncTarget = 'global';
    } else {
      syncTarget = await select({
        message: '选择同步目标:',
        choices,
      });
    }
  }

  // Execute sync
  if (syncTarget === 'project') {
    const projectRoot = findProjectRoot(cwd);
    
    if (!projectRoot) {
      printWarning('未检测到 incspec 项目。请先运行 incspec init 或使用 --global 选项。');
      return;
    }

    print(colorize(`同步到项目: ${projectRoot}`, colors.dim));
    print('');

    const count = syncToProject(projectRoot);
    
    printSuccess(`已同步 ${count} 个 Cursor 命令到 .cursor/commands/incspec/`);
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

  } else if (syncTarget === 'global') {
    print(colorize('同步到全局目录...', colors.dim));
    print('');

    const count = syncToGlobal();
    
    printSuccess(`已同步 ${count} 个 Cursor 命令到 ~/.cursor/commands/incspec/`);
    print('');
    print(colorize('全局命令将对所有项目生效。', colors.dim));
    print(colorize('在项目中运行 incspec cursor-sync --project 可覆盖全局命令。', colors.dim));
  }

  print('');
  printInfo('请重启 Cursor 以加载新命令。');
  print('');
}
