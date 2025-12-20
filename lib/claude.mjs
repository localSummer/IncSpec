/**
 * Claude Code integration utilities
 * - Sync inc-spec-skill to global or project
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

/** Claude skills directory name */
const CLAUDE_SKILLS_DIR_NAME = 'skills';

/** Skill name */
const SKILL_NAME = 'inc-spec-skill';

/** Global Claude skills directory */
const GLOBAL_CLAUDE_SKILLS_DIR = path.join(os.homedir(), '.claude', CLAUDE_SKILLS_DIR_NAME);

/** Project Claude skills directory (relative to project root) */
const PROJECT_CLAUDE_SKILLS_DIR = path.join('.claude', CLAUDE_SKILLS_DIR_NAME);

/** Skill template source directory */
const SKILL_TEMPLATE_DIR = fileURLToPath(new URL('../templates/inc-spec-skill', import.meta.url));

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Count files in directory recursively
 * @param {string} dir - Directory path
 * @returns {number} File count
 */
function countFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Sync skill to global Claude skills directory
 * @returns {{count: number, targetDir: string}}
 */
export function syncToGlobalClaude() {
  const targetDir = path.join(GLOBAL_CLAUDE_SKILLS_DIR, SKILL_NAME);

  // Remove existing if present
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy skill template
  copyDirRecursive(SKILL_TEMPLATE_DIR, targetDir);

  const count = countFiles(targetDir);

  return { count, targetDir };
}

/**
 * Sync skill to project Claude skills directory
 * @param {string} projectRoot - Project root path
 * @returns {{count: number, targetDir: string}}
 */
export function syncToProjectClaude(projectRoot) {
  const targetDir = path.join(projectRoot, PROJECT_CLAUDE_SKILLS_DIR, SKILL_NAME);

  // Remove existing if present
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy skill template
  copyDirRecursive(SKILL_TEMPLATE_DIR, targetDir);

  const count = countFiles(targetDir);

  return { count, targetDir };
}

/**
 * Check if Claude skill exists
 * @param {string} projectRoot - Optional project root
 * @returns {{project: boolean, global: boolean}}
 */
export function checkClaudeSkill(projectRoot = null) {
  const globalDir = path.join(GLOBAL_CLAUDE_SKILLS_DIR, SKILL_NAME);
  const result = {
    global: fs.existsSync(globalDir) && fs.readdirSync(globalDir).length > 0,
    project: false,
  };

  if (projectRoot) {
    const projectDir = path.join(projectRoot, PROJECT_CLAUDE_SKILLS_DIR, SKILL_NAME);
    result.project = fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0;
  }

  return result;
}

/**
 * Get skill template info
 * @returns {{fileCount: number, hasSkillMd: boolean, hasReferences: boolean}}
 */
export function getSkillTemplateInfo() {
  const skillMdPath = path.join(SKILL_TEMPLATE_DIR, 'SKILL.md');
  const referencesDir = path.join(SKILL_TEMPLATE_DIR, 'references');

  return {
    fileCount: countFiles(SKILL_TEMPLATE_DIR),
    hasSkillMd: fs.existsSync(skillMdPath),
    hasReferences: fs.existsSync(referencesDir) && fs.readdirSync(referencesDir).length > 0,
  };
}
