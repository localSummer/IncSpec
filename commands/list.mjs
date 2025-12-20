/**
 * list command - List spec files
 */

import * as path from 'path';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
} from '../lib/config.mjs';
import { listSpecs, getSpecInfo } from '../lib/spec.mjs';
import {
  colors,
  colorize,
  print,
  printTable,
  printWarning,
  formatLocalDateTime,
} from '../lib/terminal.mjs';

/**
 * Execute list command
 * @param {Object} ctx - Command context
 */
export async function listCommand(ctx) {
  const { cwd, args, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  // Get type filter
  const type = args[0]; // baselines | requirements | increments | archives

  print('');
  print(colorize('  incspec 规范文件列表', colors.bold, colors.cyan));
  print(colorize('  ───────────────────', colors.dim));
  print('');

  const types = type ? [type] : ['baselines', 'requirements', 'increments'];

  for (const t of types) {
    const specs = listSpecs(projectRoot, t);

    print(colorize(`${DIRS[t] || t}/`, colors.bold, colors.yellow));

    if (specs.length === 0) {
      print(colorize('  (空)', colors.dim));
    } else {
      specs.forEach(spec => {
        const info = getSpecInfo(spec.path);
        const mtime = formatLocalDateTime(spec.mtime);
        const versionStr = info.version ? colorize(`v${info.version}`, colors.cyan) : '';
        
        print(`  ${colorize(spec.name, colors.white)} ${versionStr}`);
        if (options.long || options.l) {
          print(colorize(`    修改时间: ${mtime}`, colors.dim));
          print(colorize(`    路径: ${spec.path}`, colors.dim));
        }
      });
    }
    print('');
  }

  // Show archives if requested
  if (type === 'archives' || options.all || options.a) {
    const archivePath = path.join(projectRoot, INCSPEC_DIR, DIRS.archives);
    print(colorize(`${DIRS.archives}/`, colors.bold, colors.yellow));
    
    try {
      const fs = await import('fs');
      if (fs.existsSync(archivePath)) {
        const months = fs.readdirSync(archivePath).filter(f => 
          fs.statSync(path.join(archivePath, f)).isDirectory()
        );
        
        if (months.length === 0) {
          print(colorize('  (空)', colors.dim));
        } else {
          months.sort().reverse().forEach(month => {
            print(colorize(`  ${month}/`, colors.cyan));
            const monthPath = path.join(archivePath, month);
            const entries = fs.readdirSync(monthPath, { withFileTypes: true });
            
            // Collect direct .md files (legacy) and module subdirectories
            const directFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md'));
            const moduleDirs = entries.filter(e => e.isDirectory());
            
            // Show direct files (legacy structure)
            directFiles.forEach(f => {
              print(colorize(`    ${f.name}`, colors.dim));
            });
            
            // Show module subdirectories and their files
            moduleDirs.forEach(moduleDir => {
              print(colorize(`    ${moduleDir.name}/`, colors.white));
              const modulePath = path.join(monthPath, moduleDir.name);
              const moduleFiles = fs.readdirSync(modulePath).filter(f => f.endsWith('.md'));
              moduleFiles.forEach(f => {
                print(colorize(`      ${f}`, colors.dim));
              });
            });
          });
        }
      } else {
        print(colorize('  (空)', colors.dim));
      }
    } catch (e) {
      print(colorize('  (空)', colors.dim));
    }
    print('');
  }
}
