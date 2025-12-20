/**
 * help command - Display help information
 */

import {
  colors,
  colorize,
  print,
} from '../lib/terminal.mjs';
import { STEPS } from '../lib/workflow.mjs';

/**
 * Command definitions for help
 */
const COMMANDS = {
  init: {
    usage: 'incspec init [--force]',
    description: '初始化 incspec 项目结构',
    options: [
      ['--force', '强制重新初始化'],
    ],
  },
  update: {
    usage: 'incspec update [-y|--yes]',
    aliases: ['up'],
    description: '更新模板文件到最新版本',
    options: [
      ['-y, --yes', '跳过确认提示'],
    ],
  },
  status: {
    usage: 'incspec status',
    aliases: ['st'],
    description: '显示当前工作流状态',
  },
  analyze: {
    usage: 'incspec analyze <source-path> [--module=name] [--baseline=file]',
    aliases: ['a'],
    description: '步骤1: 分析代码流程，生成基线快照',
    options: [
      ['-m, --module=<name>', '指定模块名称'],
      ['-w, --workflow=<name>', '指定工作流名称(避免交互提示)'],
      ['-b, --baseline=<file>', '使用现有基准报告(自动从归档恢复)'],
      ['--complete', '标记步骤完成'],
      ['-o, --output=<file>', '完成时指定输出文件'],
    ],
  },
  'collect-req': {
    usage: 'incspec collect-req',
    aliases: ['cr'],
    description: '步骤2: 收集结构化需求',
    options: [
      ['--complete', '标记步骤完成'],
    ],
  },
  'collect-dep': {
    usage: 'incspec collect-dep',
    aliases: ['cd'],
    description: '步骤3: 采集 UI 依赖',
    options: [
      ['--complete', '标记步骤完成'],
    ],
  },
  design: {
    usage: 'incspec design [--feature=name]',
    aliases: ['d'],
    description: '步骤4: 生成增量设计蓝图',
    options: [
      ['-f, --feature=<name>', '指定功能名称'],
      ['--complete', '标记步骤完成'],
      ['-o, --output=<file>', '完成时指定输出文件'],
    ],
  },
  apply: {
    usage: 'incspec apply [increment-path]',
    aliases: ['ap'],
    description: '步骤5: 应用代码变更',
    options: [
      ['-s, --source-dir=<path>', '指定源代码目录'],
      ['--complete', '标记步骤完成'],
    ],
  },
  merge: {
    usage: 'incspec merge [increment-path]',
    aliases: ['m'],
    description: '步骤6: 合并到新基线',
    options: [
      ['--complete', '标记步骤完成'],
      ['-o, --output=<file>', '完成时指定输出文件'],
    ],
  },
  list: {
    usage: 'incspec list [type] [-l|--long] [-a|--all]',
    aliases: ['ls'],
    description: '列出规范文件',
    options: [
      ['type', 'baselines | requirements | increments | archives'],
      ['-l, --long', '显示详细信息'],
      ['-a, --all', '包含归档文件'],
    ],
  },
  validate: {
    usage: 'incspec validate [--strict]',
    aliases: ['v'],
    description: '验证规范完整性',
    options: [
      ['--strict', '严格模式，有错误时返回非零退出码'],
    ],
  },
  archive: {
    usage: 'incspec archive [file-path] [--workflow] [-k|--keep] [-y|--yes]',
    aliases: ['ar'],
    description: '归档规范文件 (默认归档当前工作流产出)',
    options: [
      ['--workflow', '归档当前工作流全部产出文件'],
      ['-k, --keep', '复制而非移动'],
      ['-y, --yes', '跳过确认提示'],
    ],
  },
  sync: {
    usage: 'incspec sync [--cursor] [--claude] [--all] [--project|--global]',
    aliases: ['s'],
    description: '同步集成到 IDE/AI 工具 (Cursor, Claude Code)',
    options: [
      ['--cursor', '仅同步 Cursor 命令'],
      ['--claude', '仅同步 Claude Code Skill'],
      ['--all', '同步所有目标'],
      ['--project', '同步到项目目录'],
      ['--global', '同步到全局目录'],
    ],
  },
  help: {
    usage: 'incspec help [command]',
    aliases: ['h'],
    description: '显示帮助信息',
  },
};

/**
 * Execute help command
 * @param {Object} ctx - Command context
 */
export async function helpCommand(ctx = {}) {
  const { command } = ctx;

  print('');

  if (command && COMMANDS[command]) {
    // Show specific command help
    showCommandHelp(command);
  } else if (command) {
    print(colorize(`未知命令: ${command}`, colors.red));
    print('');
    showGeneralHelp();
  } else {
    showGeneralHelp();
  }
}

/**
 * Show general help
 */
function showGeneralHelp() {
  print(colorize('  IncSpec - 增量规范驱动开发工具', colors.bold, colors.cyan));
  print(colorize('  ────────────────────────────', colors.dim));
  print('');
  print(colorize('用法:', colors.bold));
  print(colorize('  incspec <command> [options]', colors.white));
  print('');

  print(colorize('工作流命令:', colors.bold));
  print('');

  const workflowCommands = ['analyze', 'collect-req', 'collect-dep', 'design', 'apply', 'merge'];
  workflowCommands.forEach((cmd, index) => {
    const def = COMMANDS[cmd];
    const aliases = def.aliases ? colorize(` (${def.aliases.join(', ')})`, colors.dim) : '';
    print(`  ${colorize(`${index + 1}.`, colors.cyan)} ${colorize(cmd, colors.white)}${aliases}`);
    print(colorize(`     ${def.description}`, colors.dim));
  });

  print('');
  print(colorize('管理命令:', colors.bold));
  print('');

  const mgmtCommands = ['init', 'update', 'status', 'list', 'validate', 'archive', 'sync', 'help'];
  mgmtCommands.forEach(cmd => {
    const def = COMMANDS[cmd];
    const aliases = def.aliases ? colorize(` (${def.aliases.join(', ')})`, colors.dim) : '';
    print(`  ${colorize(cmd, colors.white)}${aliases}`);
    print(colorize(`     ${def.description}`, colors.dim));
  });

  print('');
  print(colorize('选项:', colors.bold));
  print(colorize('  -h, --help     显示帮助', colors.dim));
  print(colorize('  -v, --version  显示版本', colors.dim));
  print('');
  print(colorize('示例:', colors.bold));
  print(colorize('  incspec init                    # 初始化项目', colors.dim));
  print(colorize('  incspec update                  # 更新模板文件', colors.dim));
  print(colorize('  incspec analyze src/views/Home  # 分析代码流程', colors.dim));
  print(colorize('  incspec status                  # 查看工作流状态', colors.dim));
  print(colorize('  incspec sync                    # 同步 IDE 集成', colors.dim));
  print('');
  print(colorize(`运行 'incspec help <command>' 查看命令详情。`, colors.dim));
  print('');
}

/**
 * Show specific command help
 * @param {string} command
 */
function showCommandHelp(command) {
  const def = COMMANDS[command];

  print(colorize(`incspec ${command}`, colors.bold, colors.cyan));
  print('');
  print(colorize(def.description, colors.white));
  print('');
  print(colorize('用法:', colors.bold));
  print(colorize(`  ${def.usage}`, colors.white));

  if (def.aliases && def.aliases.length > 0) {
    print('');
    print(colorize('别名:', colors.bold));
    print(colorize(`  ${def.aliases.join(', ')}`, colors.dim));
  }

  if (def.options && def.options.length > 0) {
    print('');
    print(colorize('选项:', colors.bold));
    def.options.forEach(([opt, desc]) => {
      print(`  ${colorize(opt.padEnd(20), colors.cyan)} ${colorize(desc, colors.dim)}`);
    });
  }

  print('');
}
