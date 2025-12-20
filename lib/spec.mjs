/**
 * Specification file operations for incspec
 * - File version management
 * - CRUD for spec files
 * - Archive management
 */

import * as fs from 'fs';
import * as path from 'path';
import { INCSPEC_DIR, DIRS, parseFrontmatter, serializeFrontmatter } from './config.mjs';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureUniqueArchivePath(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  let counter = 2;
  let candidate;

  do {
    candidate = path.join(dir, `${base}-${counter}${ext}`);
    counter += 1;
  } while (fs.existsSync(candidate));

  return candidate;
}

/**
 * List spec files in a directory
 * @param {string} projectRoot
 * @param {string} type - 'baselines' | 'requirements' | 'increments' | 'archives'
 * @returns {Array<{name: string, path: string, mtime: Date}>}
 */
export function listSpecs(projectRoot, type) {
  const dir = path.join(projectRoot, INCSPEC_DIR, DIRS[type] || type);

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = path.join(dir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        mtime: stats.mtime,
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
}

/**
 * Get next version number for a spec type
 * @param {string} projectRoot
 * @param {string} type - 'baselines' | 'increments'
 * @param {string} prefix - file name prefix (e.g., module name)
 * @returns {number}
 */
export function getNextVersion(projectRoot, type, prefix) {
  const specs = listSpecs(projectRoot, type);
  const safePrefix = escapeRegExp(prefix);
  const pattern = new RegExp(`^${safePrefix}.*-v(\\d+)\\.md$`);

  const versions = specs
    .map(s => {
      const match = s.name.match(pattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(v => v > 0);

  return versions.length > 0 ? Math.max(...versions) + 1 : 1;
}

/**
 * Get latest spec file for a given prefix
 * @param {string} projectRoot
 * @param {string} type
 * @param {string} prefix
 * @returns {Object|null}
 */
export function getLatestSpec(projectRoot, type, prefix) {
  const specs = listSpecs(projectRoot, type);
  const safePrefix = escapeRegExp(prefix);
  const pattern = new RegExp(`^${safePrefix}.*-v(\\d+)\\.md$`);

  const versioned = specs
    .map(s => {
      const match = s.name.match(pattern);
      return match ? { ...s, version: parseInt(match[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);

  return versioned.length > 0 ? versioned[0] : null;
}

/**
 * Create a baseline spec file
 * @param {string} projectRoot
 * @param {string} moduleName
 * @param {string} content
 * @returns {string} Created file path
 */
export function createBaseline(projectRoot, moduleName, content) {
  const version = getNextVersion(projectRoot, 'baselines', moduleName);
  const fileName = `${moduleName}-baseline-v${version}.md`;
  const filePath = path.join(projectRoot, INCSPEC_DIR, DIRS.baselines, fileName);

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Create an increment spec file
 * @param {string} projectRoot
 * @param {string} featureName
 * @param {string} content
 * @returns {string} Created file path
 */
export function createIncrement(projectRoot, featureName, content) {
  const version = getNextVersion(projectRoot, 'increments', featureName);
  const fileName = `${featureName}-increment-v${version}.md`;
  const filePath = path.join(projectRoot, INCSPEC_DIR, DIRS.increments, fileName);

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Create a requirements file
 * @param {string} projectRoot
 * @param {string} type - 'structured-requirements' | 'ui-dependencies'
 * @param {string} content
 * @returns {string} Created file path
 */
export function createRequirement(projectRoot, type, content) {
  const fileName = `${type}.md`;
  const filePath = path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, fileName);

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Read a spec file
 * @param {string} filePath
 * @returns {{frontmatter: Object, body: string, raw: string}}
 */
export function readSpec(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  return { frontmatter, body, raw };
}

/**
 * Archive a spec file
 * @param {string} projectRoot
 * @param {string} filePath
 * @param {boolean} deleteOriginal - Default true (move mode) to keep workflow clean
 * @param {string} [module] - Optional module name for subdirectory grouping
 * @returns {string} Archive path
 */
export function archiveSpec(projectRoot, filePath, deleteOriginal = true, module = null) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Build archive directory: archives/YYYY-MM[/module]
  let archiveDir = path.join(projectRoot, INCSPEC_DIR, DIRS.archives, yearMonth);
  if (module) {
    archiveDir = path.join(archiveDir, module);
  }

  // Create archive directory if needed
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const archivePath = path.join(archiveDir, fileName);
  const finalArchivePath = ensureUniqueArchivePath(archivePath);

  // Copy or move file
  fs.copyFileSync(filePath, finalArchivePath);
  if (deleteOriginal) {
    fs.unlinkSync(filePath);
  }

  return finalArchivePath;
}

/**
 * Get spec file info from path
 * @param {string} filePath
 * @returns {Object}
 */
export function getSpecInfo(filePath) {
  const fileName = path.basename(filePath);
  const dir = path.basename(path.dirname(filePath));

  // Parse file name pattern: {name}-{type}-v{version}.md
  const baselineMatch = fileName.match(/^(.+)-baseline-v(\d+)\.md$/);
  const incrementMatch = fileName.match(/^(.+)-increment-v(\d+)\.md$/);
  const requirementMatch = fileName.match(/^(structured-requirements|ui-dependencies)\.md$/);

  if (baselineMatch) {
    return {
      type: 'baseline',
      name: baselineMatch[1],
      version: parseInt(baselineMatch[2], 10),
      fileName,
    };
  }

  if (incrementMatch) {
    return {
      type: 'increment',
      name: incrementMatch[1],
      version: parseInt(incrementMatch[2], 10),
      fileName,
    };
  }

  if (requirementMatch) {
    return {
      type: 'requirement',
      name: requirementMatch[1],
      version: null,
      fileName,
    };
  }

  return {
    type: 'unknown',
    name: fileName.replace('.md', ''),
    version: null,
    fileName,
  };
}

/**
 * Generate spec file path
 * @param {string} projectRoot
 * @param {string} type - 'baselines' | 'requirements' | 'increments'
 * @param {string} fileName
 * @returns {string}
 */
export function getSpecPath(projectRoot, type, fileName) {
  return path.join(projectRoot, INCSPEC_DIR, DIRS[type] || type, fileName);
}

/**
 * Check if spec file exists
 * @param {string} projectRoot
 * @param {string} type
 * @param {string} fileName
 * @returns {boolean}
 */
export function specExists(projectRoot, type, fileName) {
  const filePath = getSpecPath(projectRoot, type, fileName);
  return fs.existsSync(filePath);
}

/**
 * Delete a spec file
 * @param {string} filePath
 * @param {boolean} archive - Whether to archive before deleting
 * @param {string} projectRoot - Required if archive is true
 * @param {string} [module] - Optional module name for archive subdirectory
 */
export function deleteSpec(filePath, archive = true, projectRoot = null, module = null) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  if (archive && projectRoot) {
    archiveSpec(projectRoot, filePath, true, module);
  } else {
    fs.unlinkSync(filePath);
  }
}
