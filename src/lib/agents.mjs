/**
 * AGENTS.md file read/write utilities for incspec
 * Handles managed block insertion/update in project AGENTS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { getTemplatesDir } from './config.mjs';

const INCSPEC_BLOCK_START = '<!-- INCSPEC:START -->';
const INCSPEC_BLOCK_END = '<!-- INCSPEC:END -->';

/**
 * Get the project AGENTS.md file path
 * @param {string} projectRoot - Project root directory
 * @returns {string}
 */
export function getProjectAgentsFilePath(projectRoot) {
  return path.join(projectRoot, 'AGENTS.md');
}

/**
 * Read the incspec block template content
 * @returns {string}
 */
export function getIncspecBlockTemplate() {
  const templatePath = path.join(getTemplatesDir(), 'INCSPEC_BLOCK.md');
  
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  
  // Fallback content if template not found
  return `<!-- INCSPEC:START -->
# IncSpec 指令

本指令适用于在此项目中工作的 AI 助手。

当请求符合以下情况时，请始终打开 \`@/incspec/AGENTS.md\`：
- 涉及增量开发或编码工作流
- 引入需要分步实现的新功能
- 需要基线分析、需求收集或代码生成
- 请求含义模糊，需要先了解规范工作流再编码

通过 \`@/incspec/AGENTS.md\` 可以了解：
- 如何使用 7 步增量编码工作流
- 规范格式与约定
- 项目结构与指南

请保留此托管块，以便 'incspec init' 可以刷新指令内容。

<!-- INCSPEC:END -->
`;
}

/**
 * Update or create AGENTS.md with incspec managed block
 * - If file doesn't exist, create it with the block
 * - If file exists but no markers, append the block
 * - If file exists with markers, replace content between markers
 * @param {string} projectRoot - Project root directory
 * @returns {{created: boolean, updated: boolean}}
 */
export function updateProjectAgentsFile(projectRoot) {
  const filePath = getProjectAgentsFilePath(projectRoot);
  const blockContent = getIncspecBlockTemplate();
  
  let existingContent = '';
  let fileExists = false;
  
  if (fs.existsSync(filePath)) {
    existingContent = fs.readFileSync(filePath, 'utf-8');
    fileExists = true;
  }
  
  let newContent;
  let updated = false;
  
  if (!fileExists) {
    // File doesn't exist, create new with block content
    newContent = blockContent;
  } else {
    // File exists, check for markers
    const startIndex = existingContent.indexOf(INCSPEC_BLOCK_START);
    const endIndex = existingContent.indexOf(INCSPEC_BLOCK_END);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      // Markers found, replace content between markers (inclusive)
      const endMarkerLength = INCSPEC_BLOCK_END.length;
      newContent =
        existingContent.substring(0, startIndex) +
        blockContent.trim() +
        existingContent.substring(endIndex + endMarkerLength);
      updated = true;
    } else {
      // Markers not found, append block to end of file
      const separator = existingContent.endsWith('\n') ? '\n' : '\n\n';
      newContent = existingContent + separator + blockContent;
      updated = true;
    }
  }
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  
  return {
    created: !fileExists,
    updated: updated,
  };
}

/**
 * Check if AGENTS.md has incspec block
 * @param {string} projectRoot - Project root directory
 * @returns {boolean}
 */
export function hasIncspecBlock(projectRoot) {
  const filePath = getProjectAgentsFilePath(projectRoot);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(INCSPEC_BLOCK_START) && content.includes(INCSPEC_BLOCK_END);
}

/**
 * Remove incspec block from AGENTS.md
 * @param {string} projectRoot - Project root directory
 * @returns {boolean} True if block was removed
 */
export function removeIncspecBlock(projectRoot) {
  const filePath = getProjectAgentsFilePath(projectRoot);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const startIndex = content.indexOf(INCSPEC_BLOCK_START);
  const endIndex = content.indexOf(INCSPEC_BLOCK_END);
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return false;
  }
  
  const endMarkerLength = INCSPEC_BLOCK_END.length;
  let newContent =
    content.substring(0, startIndex) +
    content.substring(endIndex + endMarkerLength);
  
  // Clean up extra newlines
  newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();
  
  if (newContent) {
    fs.writeFileSync(filePath, newContent + '\n', 'utf-8');
  } else {
    // If file is empty after removal, delete it
    fs.unlinkSync(filePath);
  }
  
  return true;
}
