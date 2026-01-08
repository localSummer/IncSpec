/**
 * init command - Initialize incspec in a project
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  isInitialized,
  createIncspecStructure,
  getDefaultConfig,
  INCSPEC_DIR,
  findProjectRoot,
} from '../lib/config.mjs';
import { initWorkflow } from '../lib/workflow.mjs';
import { updateProjectAgentsFile } from '../lib/agents.mjs';
import {
  syncToProject,
  syncToGlobal,
  getSupportedIDEs,
  getIDEConfig,
} from '../lib/ide-sync.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  prompt,
  confirm,
  select,
} from '../lib/terminal.mjs';

/**
 * Sync IDE commands helper
 * @param {string} cwd - Current working directory
 */
async function syncIDECommands(cwd) {
  print('');
  print(colorize('IDE 命令同步', colors.bold, colors.cyan));
  print(colorize('─────────────', colors.dim));
  print('');

  // Ask which IDE to sync
  const ideChoice = await select({
    message: '选择要同步的 IDE',
    choices: [
      { name: 'Cursor', value: 'cursor' },
      { name: 'Claude Code', value: 'claude' },
      { name: '全部 (Cursor + Claude Code)', value: 'all' },
    ]
  });

  // Ask for sync scope
  const scopeChoice = await select({
    message: '选择同步范围',
    choices: [
      { name: '项目级 (仅当前项目)', value: 'project' },
      { name: '全局级 (所有项目)', value: 'global' },
    ]
  });

  const isGlobal = scopeChoice === 'global';

  // Determine which IDEs to sync
  const idesToSync = ideChoice === 'all' ? getSupportedIDEs() : [ideChoice];
  let syncCount = 0;

  for (const ide of idesToSync) {
    const config = getIDEConfig(ide);
    try {
      let count;
      if (isGlobal) {
        count = syncToGlobal(ide);
      } else {
        count = syncToProject(ide, cwd);
      }
      
      syncCount += count;
      const targetDir = isGlobal ? config.globalDir : path.join(cwd, config.projectDir);
      printInfo(`已同步 ${count} 个命令到 ${config.name}: ${targetDir}`);
    } catch (error) {
      printWarning(`同步 ${config.name} 命令失败: ${error.message}`);
    }
  }

  print('');
  printSuccess(`IDE 命令同步完成! 共同步 ${syncCount} 个命令文件`);
  print('');
  print(colorize('可用的 IDE 命令:', colors.bold));
  print(colorize(`  /incspec/inc-analyze    - 步骤1: 分析代码流程`, colors.dim));
  print(colorize(`  /incspec/inc-collect-req - 步骤2: 收集结构化需求`, colors.dim));
  print(colorize(`  /incspec/inc-collect-dep - 步骤3: 采集UI依赖`, colors.dim));
  print(colorize(`  /incspec/inc-design      - 步骤4: 增量设计`, colors.dim));
  print(colorize(`  /incspec/inc-apply       - 步骤5: 应用代码变更`, colors.dim));
  print(colorize(`  /incspec/inc-merge       - 步骤6: 合并到基线`, colors.dim));
  print(colorize(`  /incspec/inc-archive     - 步骤7: 归档产出`, colors.dim));
  print(colorize(`  /incspec/inc-status      - 查看工作流状态`, colors.dim));
  print(colorize(`  /incspec/inc-help        - 显示帮助信息`, colors.dim));
  print('');
  print(colorize('下一步:', colors.bold));
  print(colorize(`  1. 运行 'incspec status' 查看工作流状态`, colors.dim));
  print(colorize(`  2. 使用 /incspec/inc-analyze 开始第一个工作流`, colors.dim));
  print('');
}

/**
 * Execute init command
 * @param {Object} ctx - Command context
 */
export async function initCommand(ctx) {
  const { cwd, options } = ctx;

  // Check if already initialized
  if (isInitialized(cwd) && !options.force) {
    printWarning(`incspec 已在此目录初始化。`);
    printInfo(`如需重新初始化，请使用 --force 选项。`);
    return;
  }

  const existingRoot = findProjectRoot(cwd);
  if (existingRoot && existingRoot !== cwd && !options.force) {
    printWarning(`检测到上级目录已初始化 incspec: ${existingRoot}`);
    printInfo('请在项目根目录执行，或使用 --force 在当前目录初始化。');
    return;
  }

  print('');
  print(colorize('  incspec 初始化向导', colors.bold, colors.cyan));
  print(colorize('  ─────────────────', colors.dim));
  print('');

  // Collect project info
  const projectName = await prompt('项目名称', path.basename(cwd));

  // Select tech stack
  const techStackStr = await prompt('技术栈 (逗号分隔)', 'React, TypeScript');
  const techStack = techStackStr.split(',').map(s => s.trim()).filter(Boolean);

  const sourceDir = await prompt('源代码目录', 'src');

  // Create config
  const config = getDefaultConfig({
    name: projectName,
    tech_stack: techStack,
    source_dir: sourceDir,
  });

  print('');
  print(colorize('配置预览:', colors.bold));
  print(colorize(`  项目名称: ${config.name}`, colors.dim));
  print(colorize(`  技术栈: ${config.tech_stack.join(', ')}`, colors.dim));
  print(colorize(`  源代码目录: ${config.source_dir}`, colors.dim));
  print('');

  const shouldProceed = await confirm('确认创建 incspec 目录结构?');

  if (!shouldProceed) {
    print(colorize('已取消初始化。', colors.dim));
    return;
  }

  // If force mode and directory exists, remove it first
  const incspecPath = path.join(cwd, INCSPEC_DIR);
  if (options.force && fs.existsSync(incspecPath)) {
    fs.rmSync(incspecPath, { recursive: true, force: true });
    printInfo('已删除旧的 incspec 目录。');
  }

  // Create structure
  createIncspecStructure(cwd, config);

  // Initialize workflow
  initWorkflow(cwd);

  // Update project AGENTS.md with incspec block
  const agentsResult = updateProjectAgentsFile(cwd);
  if (agentsResult.created) {
    printInfo('已创建项目 AGENTS.md 文件。');
  } else if (agentsResult.updated) {
    printInfo('已更新项目 AGENTS.md 中的 incspec 指令块。');
  } else {
    printInfo('已添加 incspec 指令块到项目 AGENTS.md。');
  }

  print('');
  printSuccess('incspec 初始化完成!');
  print('');
  print(colorize('创建的目录结构:', colors.bold));
  print(colorize(`  ${INCSPEC_DIR}/`, colors.cyan));
  print(colorize(`  ├── project.md`, colors.dim));
  print(colorize(`  ├── workflow.json`, colors.dim));
  print(colorize(`  ├── AGENTS.md`, colors.dim));
  print(colorize(`  ├── baselines/`, colors.dim));
  print(colorize(`  ├── requirements/`, colors.dim));
  print(colorize(`  ├── increments/`, colors.dim));
  print(colorize(`  └── archives/`, colors.dim));
  print('');
  print(colorize(`  AGENTS.md (项目根目录)`, colors.cyan));
  print(colorize(`  └── incspec 指令块已添加`, colors.dim));
  print('');

  // Ask user if they want to sync IDE commands
  const shouldSync = await confirm('是否立即同步 IDE 命令?');

  if (shouldSync) {
    await syncIDECommands(cwd);
  } else {
    print('');
    print(colorize('下一步:', colors.bold));
    print(colorize(`  1. 运行 'incspec status' 查看工作流状态`, colors.dim));
    print(colorize(`  2. 运行 'incspec sync' 同步 IDE 命令`, colors.dim));
    print(colorize(`  3. 使用 /incspec/inc-analyze 开始第一个工作流`, colors.dim));
    print('');
  }
}
