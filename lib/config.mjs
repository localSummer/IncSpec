/**
 * Configuration management for incspec
 * - Find project root
 * - Read/write project.md
 * - Default configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { formatLocalDate } from './terminal.mjs';

/** incspec directory name */
export const INCSPEC_DIR = 'incspec';

/** Default subdirectories */
export const DIRS = {
  baselines: 'baselines',
  requirements: 'requirements',
  increments: 'increments',
  archives: 'archives',
};

/** Core files */
export const FILES = {
  project: 'project.md',
  workflow: 'WORKFLOW.md',
  agents: 'AGENTS.md',
};

/**
 * Get the templates directory path
 * @returns {string}
 */
export function getTemplatesDir() {
  // Get the directory of this module file
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const libDir = path.dirname(currentFilePath);
  const cliRoot = path.dirname(libDir);
  return path.join(cliRoot, 'templates');
}

/**
 * Find project root by looking for incspec/ directory
 * @param {string} startDir - Starting directory
 * @returns {string|null} Project root path or null if not found
 */
export function findProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const incspecPath = path.join(currentDir, INCSPEC_DIR);
    const projectFile = path.join(incspecPath, FILES.project);
    // 检查 project.md 是否存在，避免 macOS 大小写不敏感导致的误判
    if (fs.existsSync(projectFile)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Get incspec directory path
 * @param {string} projectRoot
 * @returns {string}
 */
export function getIncspecDir(projectRoot) {
  return path.join(projectRoot, INCSPEC_DIR);
}

/**
 * Check if incspec is initialized in directory
 * @param {string} cwd
 * @returns {boolean}
 */
export function isInitialized(cwd) {
  const incspecDir = path.join(cwd, INCSPEC_DIR);
  const projectFile = path.join(incspecDir, FILES.project);
  return fs.existsSync(incspecDir) && fs.existsSync(projectFile);
}

/**
 * Parse frontmatter from markdown content
 * @param {string} content
 * @returns {{frontmatter: Object, body: string}}
 */
export function parseFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];

  // Simple YAML-like parsing
  const frontmatter = {};
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith('- ')) {
      if (currentArray !== null) {
        currentArray.push(trimmed.slice(2).trim());
      }
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (value === '') {
        // Start of array or nested object
        frontmatter[key] = [];
        currentKey = key;
        currentArray = frontmatter[key];
      } else {
        frontmatter[key] = value;
        currentKey = key;
        currentArray = null;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Serialize frontmatter to YAML-like string
 * @param {Object} frontmatter
 * @returns {string}
 */
export function serializeFrontmatter(frontmatter) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach(item => lines.push(`  - ${item}`));
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Read project configuration
 * @param {string} projectRoot
 * @returns {Object|null}
 */
export function readProjectConfig(projectRoot) {
  const projectPath = path.join(projectRoot, INCSPEC_DIR, FILES.project);

  if (!fs.existsSync(projectPath)) {
    return null;
  }

  const content = fs.readFileSync(projectPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  return {
    ...frontmatter,
    _body: body,
    _path: projectPath,
  };
}

/**
 * Write project configuration
 * @param {string} projectRoot
 * @param {Object} config
 */
export function writeProjectConfig(projectRoot, config) {
  const projectPath = path.join(projectRoot, INCSPEC_DIR, FILES.project);
  const content = generateProjectContent(config);
  fs.writeFileSync(projectPath, content, 'utf-8');
}

/**
 * Generate project.md content from template
 * @param {Object} config
 * @returns {string}
 */
function generateProjectContent(config) {
  const templatePath = path.join(getTemplatesDir(), 'project.md');

  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, 'utf-8');

    // Replace variables
    content = content.replace(/\{\{name\}\}/g, config.name || '');
    content = content.replace(/\{\{version\}\}/g, config.version || '1.0.0');
    content = content.replace(/\{\{source_dir\}\}/g, config.source_dir || 'src');
    content = content.replace(/\{\{created_at\}\}/g, config.created_at || formatLocalDate(new Date()));

    // Handle tech_stack array
    const techStackLines = (config.tech_stack || []).map(item => `  - ${item}`).join('\n');
    content = content.replace(/\{\{tech_stack\}\}/g, techStackLines);

    return content;
  }

  // Fallback to hardcoded content if template not found
  return generateFallbackProjectContent(config);
}

/**
 * Fallback project content generator
 * @param {Object} config
 * @returns {string}
 */
function generateFallbackProjectContent(config) {
  const { _body, _path, ...frontmatter } = config;
  return serializeFrontmatter(frontmatter) + '\n' + getDefaultProjectBody();
}

/**
 * Get default project configuration
 * @param {Object} options
 * @returns {Object}
 */
export function getDefaultConfig(options = {}) {
  const now = formatLocalDate(new Date());

  return {
    name: options.name || path.basename(process.cwd()),
    version: '1.0.0',
    tech_stack: options.tech_stack || [],
    source_dir: options.source_dir || 'src',
    created_at: now,
  };
}

/**
 * Get default project.md body content
 * @returns {string}
 */
function getDefaultProjectBody() {
  return `
# Project Overview

## 模块列表

| 模块名 | 路径 | 描述 | 当前基线版本 |
|--------|------|------|-------------|
| - | - | - | - |

## 技术约束

- [添加项目特定的技术约束]

## 备注

[项目特定的说明和注意事项]
`;
}

/**
 * Create incspec directory structure
 * @param {string} projectRoot
 * @param {Object} config
 */
export function createIncspecStructure(projectRoot, config) {
  const incspecDir = path.join(projectRoot, INCSPEC_DIR);

  // Create main directory
  if (!fs.existsSync(incspecDir)) {
    fs.mkdirSync(incspecDir, { recursive: true });
  }

  // Create subdirectories
  for (const dir of Object.values(DIRS)) {
    const dirPath = path.join(incspecDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Write project.md
  writeProjectConfig(projectRoot, config);

  // Write AGENTS.md from template
  writeAgentsFile(projectRoot);
}

/**
 * Write AGENTS.md file from template
 * @param {string} projectRoot
 */
function writeAgentsFile(projectRoot) {
  const agentsPath = path.join(projectRoot, INCSPEC_DIR, FILES.agents);
  const templatePath = path.join(getTemplatesDir(), 'AGENTS.md');

  // Read template content
  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(agentsPath, content, 'utf-8');
  } else {
    // Fallback: write a minimal AGENTS.md if template not found
    const fallbackContent = `# IncSpec 使用指南

请参阅 incspec-cli 文档获取完整的 AI 编码助手使用指南。

## 快速开始

1. 运行 \`incspec status\` 查看当前工作流状态
2. 按顺序执行7步工作流: analyze → collect-req → collect-dep → design → apply → merge → archive
3. 使用 \`incspec help\` 获取更多帮助
`;
    fs.writeFileSync(agentsPath, fallbackContent, 'utf-8');
  }
}

/**
 * Ensure incspec is initialized, throw error if not
 * @param {string} cwd
 * @returns {string} Project root path
 */
export function ensureInitialized(cwd) {
  const projectRoot = findProjectRoot(cwd);

  if (!projectRoot || !isInitialized(projectRoot)) {
    throw new Error(
      `incspec 未初始化。请先运行 'incspec init' 初始化项目。`
    );
  }

  return projectRoot;
}
