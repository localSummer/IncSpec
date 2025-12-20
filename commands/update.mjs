/**
 * update command - Update template files to latest version
 * Updates AGENTS.md, WORKFLOW.md in incspec/ and managed block in project AGENTS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ensureInitialized,
  getIncspecDir,
  getTemplatesDir,
  FILES,
} from '../lib/config.mjs';
import { updateProjectAgentsFile, getProjectAgentsFilePath } from '../lib/agents.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printInfo,
  confirm,
  formatLocalDateTime,
} from '../lib/terminal.mjs';

/**
 * Update incspec/AGENTS.md from template
 * @param {string} projectRoot
 * @returns {{updated: boolean, path: string}}
 */
function updateIncspecAgents(projectRoot) {
  const targetPath = path.join(getIncspecDir(projectRoot), FILES.agents);
  const templatePath = path.join(getTemplatesDir(), 'AGENTS.md');

  if (!fs.existsSync(templatePath)) {
    return { updated: false, path: targetPath, error: '模板文件不存在' };
  }

  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  // Check if content is different
  let currentContent = '';
  if (fs.existsSync(targetPath)) {
    currentContent = fs.readFileSync(targetPath, 'utf-8');
  }

  if (currentContent === templateContent) {
    return { updated: false, path: targetPath, reason: '内容相同' };
  }

  fs.writeFileSync(targetPath, templateContent, 'utf-8');
  return { updated: true, path: targetPath };
}

/**
 * Update incspec/WORKFLOW.md template structure while preserving user data
 * @param {string} projectRoot
 * @returns {{updated: boolean, path: string}}
 */
function updateIncspecWorkflow(projectRoot) {
  const targetPath = path.join(getIncspecDir(projectRoot), FILES.workflow);
  const templatePath = path.join(getTemplatesDir(), 'WORKFLOW.md');

  if (!fs.existsSync(templatePath)) {
    return { updated: false, path: targetPath, error: '模板文件不存在' };
  }

  // For WORKFLOW.md, we only update if file doesn't exist
  // Because it contains dynamic user data that we don't want to overwrite
  // The template is only used for initial structure
  if (fs.existsSync(targetPath)) {
    return { updated: false, path: targetPath, reason: '保留用户工作流数据' };
  }

  const now = formatLocalDateTime(new Date());
  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  templateContent = templateContent.replace(/\{\{last_update\}\}/g, now);

  fs.writeFileSync(targetPath, templateContent, 'utf-8');
  return { updated: true, path: targetPath };
}

/**
 * Execute update command
 * @param {Object} ctx - Command context
 */
export async function updateCommand(ctx) {
  const { cwd, options } = ctx;

  // Ensure project is initialized
  let projectRoot;
  try {
    projectRoot = ensureInitialized(cwd);
  } catch (error) {
    printWarning(error.message);
    return;
  }

  print('');
  print(colorize('  incspec 模板更新', colors.bold, colors.cyan));
  print(colorize('  ────────────────', colors.dim));
  print('');

  // List what will be updated
  print(colorize('将更新以下模板文件:', colors.bold));
  print(colorize('  - incspec/AGENTS.md (incspec 使用指南)', colors.dim));
  print(colorize('  - incspec/WORKFLOW.md (工作流模板，保留用户数据)', colors.dim));
  print(colorize('  - AGENTS.md (项目根目录 incspec 指令块)', colors.dim));
  print('');

  // Confirm unless --yes flag
  if (!options.yes && !options.y) {
    const shouldProceed = await confirm('确认更新模板文件?');
    if (!shouldProceed) {
      print(colorize('已取消更新。', colors.dim));
      return;
    }
  }

  print('');

  const results = [];

  // Update incspec/AGENTS.md
  const agentsResult = updateIncspecAgents(projectRoot);
  results.push({
    file: 'incspec/AGENTS.md',
    ...agentsResult,
  });

  // Update incspec/WORKFLOW.md
  const workflowResult = updateIncspecWorkflow(projectRoot);
  results.push({
    file: 'incspec/WORKFLOW.md',
    ...workflowResult,
  });

  // Update project AGENTS.md (managed block)
  const projectAgentsResult = updateProjectAgentsFile(projectRoot);
  results.push({
    file: 'AGENTS.md',
    path: getProjectAgentsFilePath(projectRoot),
    updated: projectAgentsResult.created || projectAgentsResult.updated,
    created: projectAgentsResult.created,
    blockUpdated: projectAgentsResult.updated,
  });

  // Print results
  print(colorize('更新结果:', colors.bold));
  print('');

  let updatedCount = 0;
  let skippedCount = 0;

  for (const result of results) {
    if (result.error) {
      print(`  ${colorize('x', colors.red)} ${result.file}`);
      print(colorize(`    错误: ${result.error}`, colors.red));
    } else if (result.updated) {
      updatedCount++;
      if (result.created) {
        print(`  ${colorize('+', colors.green)} ${result.file} ${colorize('(新建)', colors.green)}`);
      } else if (result.blockUpdated) {
        print(`  ${colorize('~', colors.yellow)} ${result.file} ${colorize('(更新指令块)', colors.yellow)}`);
      } else {
        print(`  ${colorize('~', colors.yellow)} ${result.file} ${colorize('(已更新)', colors.yellow)}`);
      }
    } else {
      skippedCount++;
      const reasonText = result.reason ? ` (${result.reason})` : '';
      print(`  ${colorize('-', colors.dim)} ${result.file} ${colorize(`跳过${reasonText}`, colors.dim)}`);
    }
  }

  print('');

  if (updatedCount > 0) {
    printSuccess(`已更新 ${updatedCount} 个文件。`);
  } else {
    printInfo('所有模板文件已是最新版本。');
  }

  if (skippedCount > 0) {
    printInfo(`跳过 ${skippedCount} 个文件。`);
  }

  print('');
}

export default updateCommand;
