/**
 * Terminal utilities for CLI
 * - ANSI color codes
 * - Interactive prompts
 * - Table formatting
 */

import * as readline from 'readline';

// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

/**
 * Apply color to text
 * @param {string} text
 * @param {...string} colorCodes
 * @returns {string}
 */
export function colorize(text, ...colorCodes) {
  return `${colorCodes.join('')}${text}${colors.reset}`;
}

/**
 * Print colored text
 * @param {string} text
 * @param {...string} colorCodes
 */
export function print(text, ...colorCodes) {
  if (colorCodes.length > 0) {
    console.log(colorize(text, ...colorCodes));
  } else {
    console.log(text);
  }
}

/**
 * Print error message
 * @param {string} message
 */
export function printError(message) {
  console.error(colorize(`Error: ${message}`, colors.red));
}

/**
 * Print success message
 * @param {string} message
 */
export function printSuccess(message) {
  console.log(colorize(`✓ ${message}`, colors.green));
}

/**
 * Print warning message
 * @param {string} message
 */
export function printWarning(message) {
  console.log(colorize(`⚠ ${message}`, colors.yellow));
}

/**
 * Print info message
 * @param {string} message
 */
export function printInfo(message) {
  console.log(colorize(`ℹ ${message}`, colors.cyan));
}

/**
 * Print a section header
 * @param {string} title
 */
export function printHeader(title) {
  console.log();
  console.log(colorize(title, colors.bold, colors.cyan));
  console.log(colorize('─'.repeat(title.length + 4), colors.dim));
}

/**
 * Print a step status
 * @param {number} step
 * @param {string} name
 * @param {string} status - 'completed' | 'in_progress' | 'pending'
 */
export function printStep(step, name, status) {
  const statusIcons = {
    completed: colorize('✓', colors.green),
    in_progress: colorize('●', colors.yellow),
    pending: colorize('○', colors.dim),
  };
  const statusColors = {
    completed: colors.green,
    in_progress: colors.yellow,
    pending: colors.dim,
  };
  
  const icon = statusIcons[status] || statusIcons.pending;
  const color = statusColors[status] || colors.dim;
  
  console.log(`  ${icon} ${colorize(`步骤 ${step}:`, colors.bold)} ${colorize(name, color)}`);
}

/**
 * Simple confirm prompt
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(colorize(`${message} (y/N): `, colors.cyan), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Prompt for text input
 * @param {string} message
 * @param {string} defaultValue
 * @returns {Promise<string>}
 */
export async function prompt(message, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const defaultHint = defaultValue ? colorize(` [${defaultValue}]`, colors.dim) : '';

  return new Promise((resolve) => {
    rl.question(colorize(`${message}${defaultHint}: `, colors.cyan), (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Interactive single select prompt
 * @param {Object} options
 * @param {string} options.message
 * @param {Array<{name: string, value: any, description?: string}>} options.choices
 * @returns {Promise<any>}
 */
export async function select({ message, choices }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const fallback = choices[0]?.value ?? null;
    printWarning('当前环境不支持交互选择，已使用默认选项。');
    return fallback;
  }

  return new Promise((resolve) => {
    let cursor = 0;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    readline.emitKeypressEvents(process.stdin, rl);

    const render = () => {
      process.stdout.write('\x1b[2J\x1b[H');

      console.log(colorize(message, colors.bold, colors.cyan));
      console.log(colorize('(Use arrow keys to navigate, enter to select)', colors.dim));
      console.log();

      choices.forEach((choice, index) => {
        const isCursor = cursor === index;
        const pointer = isCursor ? colorize('❯', colors.cyan) : ' ';
        const name = isCursor ? colorize(choice.name, colors.bold) : choice.name;

        console.log(`${pointer} ${name}`);

        if (choice.description && isCursor) {
          console.log(colorize(`  ${choice.description}`, colors.gray));
        }
      });
    };

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
    };

    const handleKeypress = (str, key) => {
      if (!key) return;

      if (key.name === 'up' || key.name === 'k') {
        cursor = cursor > 0 ? cursor - 1 : choices.length - 1;
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = cursor < choices.length - 1 ? cursor + 1 : 0;
        render();
      } else if (key.name === 'return') {
        cleanup();
        process.stdin.removeListener('keypress', handleKeypress);
        process.stdout.write('\x1b[2J\x1b[H');
        resolve(choices[cursor].value);
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup();
        process.stdin.removeListener('keypress', handleKeypress);
        process.stdout.write('\x1b[2J\x1b[H');
        process.exit(0);
      }
    };

    process.stdin.on('keypress', handleKeypress);
    render();
  });
}

/**
 * Interactive checkbox (multi-select) prompt
 * @param {Object} options
 * @param {string} options.message
 * @param {Array<{name: string, value: any, checked?: boolean}>} options.choices
 * @returns {Promise<any[]>}
 */
export async function checkbox({ message, choices }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const selected = choices.filter(c => c.checked).map(c => c.value);
    printWarning('当前环境不支持交互多选，已使用默认选项。');
    return selected;
  }

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = choices.map(c => c.checked || false);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    readline.emitKeypressEvents(process.stdin, rl);

    const render = () => {
      process.stdout.write('\x1b[2J\x1b[H');

      console.log(colorize(message, colors.bold, colors.cyan));
      console.log(colorize('(space: toggle, a: toggle all, enter: confirm)', colors.dim));
      console.log();

      choices.forEach((choice, index) => {
        const isCursor = cursor === index;
        const isSelected = selected[index];
        const pointer = isCursor ? colorize('>', colors.cyan) : ' ';
        const check = isSelected ? colorize('[x]', colors.green) : '[ ]';
        const name = isCursor ? colorize(choice.name, colors.bold) : choice.name;

        console.log(`${pointer} ${check} ${name}`);
      });
    };

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
    };

    const handleKeypress = (str, key) => {
      if (!key) return;

      if (key.name === 'up' || key.name === 'k') {
        cursor = cursor > 0 ? cursor - 1 : choices.length - 1;
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = cursor < choices.length - 1 ? cursor + 1 : 0;
        render();
      } else if (key.name === 'space') {
        selected[cursor] = !selected[cursor];
        render();
      } else if (str === 'a') {
        const allSelected = selected.every(s => s);
        selected.fill(!allSelected);
        render();
      } else if (key.name === 'return') {
        cleanup();
        process.stdin.removeListener('keypress', handleKeypress);
        process.stdout.write('\x1b[2J\x1b[H');
        const result = choices.filter((_, i) => selected[i]).map(c => c.value);
        resolve(result);
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup();
        process.stdin.removeListener('keypress', handleKeypress);
        process.stdout.write('\x1b[2J\x1b[H');
        process.exit(0);
      }
    };

    process.stdin.on('keypress', handleKeypress);
    render();
  });
}

/**
 * Format a table for terminal output
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {Object} options
 */
export function printTable(headers, rows, options = {}) {
  const { padding = 2 } = options;
  
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(r => (r[i] || '').length));
    return Math.max(h.length, maxRowWidth);
  });

  // Print header
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' '.repeat(padding));
  console.log(colorize(headerRow, colors.bold));
  console.log(colorize('─'.repeat(headerRow.length), colors.dim));

  // Print rows
  rows.forEach(row => {
    const rowStr = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' '.repeat(padding));
    console.log(rowStr);
  });
}

/**
 * Create a simple spinner
 * @param {string} message
 * @returns {{stop: (success?: boolean, finalMessage?: string) => void}}
 */
export function spinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${colorize(frames[i], colors.cyan)} ${message}`);
    i = (i + 1) % frames.length;
  }, 80);

  return {
    stop: (success = true, finalMessage = message) => {
      clearInterval(interval);
      const icon = success ? colorize('✓', colors.green) : colorize('✗', colors.red);
      process.stdout.write(`\r${icon} ${finalMessage}\n`);
    }
  };
}

/**
 * Format date to local datetime string
 * @param {Date} date - Date object
 * @returns {string} Format: YYYY-MM-DD HH:mm
 */
export function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format date to local date string
 * @param {Date} date - Date object
 * @returns {string} Format: YYYY-MM-DD
 */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
