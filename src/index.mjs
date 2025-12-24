#!/usr/bin/env node

/**
 * incspec CLI
 * Incremental spec-driven development workflow tool
 */

import { initCommand } from './commands/init.mjs';
import { updateCommand } from './commands/update.mjs';
import { statusCommand } from './commands/status.mjs';
import { analyzeCommand } from './commands/analyze.mjs';
import { collectReqCommand } from './commands/collect-req.mjs';
import { collectDepCommand } from './commands/collect-dep.mjs';
import { designCommand } from './commands/design.mjs';
import { applyCommand } from './commands/apply.mjs';
import { mergeCommand } from './commands/merge.mjs';
import { listCommand } from './commands/list.mjs';
import { validateCommand } from './commands/validate.mjs';
import { archiveCommand } from './commands/archive.mjs';
import { resetCommand } from './commands/reset.mjs';
import { upgradeCommand } from './commands/upgrade.mjs';
import { syncCommand } from './commands/sync.mjs';
import { helpCommand } from './commands/help.mjs';
import { colors, colorize } from './lib/terminal.mjs';

/**
 * Parse command line arguments
 * @param {string[]} args
 * @returns {{command: string, args: string[], options: Object}}
 */
function parseArgs(args) {
  const result = {
    command: '',
    args: [],
    options: {},
  };

  const valueOptions = new Set(['module', 'feature', 'source-dir', 'output', 'workflow', 'to']);
  const shortValueMap = new Map([
    ['m', 'module'],
    ['f', 'feature'],
    ['s', 'source-dir'],
    ['o', 'output'],
    ['w', 'workflow'],
    ['t', 'to'],
  ]);
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === '--') {
      result.args.push(...args.slice(i + 1));
      break;
    }

    const shortValueMatch = arg.match(/^-([a-zA-Z0-9])=(.+)$/);
    if (shortValueMatch) {
      const key = shortValueMatch[1];
      const value = shortValueMatch[2];
      const longKey = shortValueMap.get(key);
      if (longKey) {
        result.options[longKey] = value;
      } else {
        result.options[key] = value;
      }
    } else if (arg.startsWith('--')) {
      // Long option: --key=value or --key
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        result.options[key] = value;
      } else {
        const key = arg.slice(2);
        const nextArg = args[i + 1];
        if (valueOptions.has(key) && nextArg && !nextArg.startsWith('-')) {
          result.options[key] = nextArg;
          i += 2;
          continue;
        }
        result.options[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short option: -k
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      const longKey = shortValueMap.get(key);
      if (longKey && nextArg && !nextArg.startsWith('-')) {
        result.options[longKey] = nextArg;
        i += 2;
        continue;
      }
      result.options[key] = true;
    } else if (!result.command) {
      result.command = arg;
    } else {
      result.args.push(arg);
    }

    i++;
  }

  return result;
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Handle --help or -h flag
  if (parsed.options.help || parsed.options.h) {
    await helpCommand({ command: parsed.command || undefined });
    return;
  }

  // Handle --version or -v flag
  if (parsed.options.version || parsed.options.v) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    try {
      const pkg = require('../package.json');
      console.log(pkg.version);
    } catch {
      console.log('unknown');
    }
    return;
  }

  // Default to help if no command
  if (!parsed.command) {
    await helpCommand();
    return;
  }

  // Route to appropriate command
  const cwd = process.cwd();
  const commandContext = { cwd, args: parsed.args, options: parsed.options };

  try {
    switch (parsed.command) {
      // Initialize
      case 'init':
        await initCommand(commandContext);
        break;

      // Update templates
      case 'update':
      case 'up':
        await updateCommand(commandContext);
        break;

      // Status
      case 'status':
      case 'st':
        await statusCommand(commandContext);
        break;

      // Workflow commands (Step 1-6, Step 7 archive is separate)
      case 'analyze':
      case 'a':
        await analyzeCommand(commandContext);
        break;

      case 'collect-req':
      case 'cr':
        await collectReqCommand(commandContext);
        break;

      case 'collect-dep':
      case 'cd':
        await collectDepCommand(commandContext);
        break;

      case 'design':
      case 'd':
        await designCommand(commandContext);
        break;

      case 'apply':
      case 'ap':
        await applyCommand(commandContext);
        break;

      case 'merge':
      case 'm':
        await mergeCommand(commandContext);
        break;

      // Management commands
      case 'list':
      case 'ls':
        await listCommand(commandContext);
        break;

      case 'validate':
      case 'v':
        await validateCommand(commandContext);
        break;

      case 'archive':
      case 'ar':
        await archiveCommand(commandContext);
        break;

      // Reset workflow
      case 'reset':
      case 'rs':
        await resetCommand(commandContext);
        break;

      // Upgrade workflow mode
      case 'upgrade':
      case 'ug':
        await upgradeCommand(commandContext);
        break;

      // Sync integrations
      case 'sync':
      case 's':
        await syncCommand(commandContext);
        break;

      // Help
      case 'help':
      case 'h':
        await helpCommand({ command: parsed.args[0] });
        break;

      default:
        console.error(colorize(`Unknown command: ${parsed.command}`, colors.red));
        console.error(colorize("Run 'incspec help' for usage information.", colors.dim));
        process.exit(1);
    }
  } catch (error) {
    console.error(colorize(`Error: ${error.message}`, colors.red));
    if (parsed.options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error(colorize(`Fatal error: ${error.message}`, colors.red));
  process.exit(1);
});
