/**
 * validate command - Validate spec files
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ensureInitialized,
  INCSPEC_DIR,
  DIRS,
  FILES,
  parseFrontmatter,
} from '../lib/config.mjs';
import { listSpecs, readSpec } from '../lib/spec.mjs';
import { readWorkflow, STEPS } from '../lib/workflow.mjs';
import {
  colors,
  colorize,
  print,
  printSuccess,
  printWarning,
  printError,
} from '../lib/terminal.mjs';

/**
 * Execute validate command
 * @param {Object} ctx - Command context
 */
export async function validateCommand(ctx) {
  const { cwd, options } = ctx;

  // Ensure initialized
  const projectRoot = ensureInitialized(cwd);

  print('');
  print(colorize('  incspec 规范验证', colors.bold, colors.cyan));
  print(colorize('  ────────────────', colors.dim));
  print('');

  const errors = [];
  const warnings = [];

  // 1. Check core files
  print(colorize('检查核心文件...', colors.bold));

  const projectPath = path.join(projectRoot, INCSPEC_DIR, FILES.project);
  if (!fs.existsSync(projectPath)) {
    errors.push(`缺少 ${FILES.project} 文件`);
  } else {
    const content = fs.readFileSync(projectPath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    if (!frontmatter.name) {
      warnings.push(`${FILES.project}: 缺少 name 字段`);
    }
    if (!frontmatter.tech_stack || frontmatter.tech_stack.length === 0) {
      warnings.push(`${FILES.project}: 缺少 tech_stack 字段`);
    }
    printSuccess(`${FILES.project} 存在`);
  }

  const workflowPath = path.join(projectRoot, INCSPEC_DIR, FILES.workflow);
  if (!fs.existsSync(workflowPath)) {
    warnings.push(`缺少 ${FILES.workflow} 文件 (将在首次使用时创建)`);
  } else {
    printSuccess(`${FILES.workflow} 存在`);
  }

  // 2. Check directories
  print('');
  print(colorize('检查目录结构...', colors.bold));

  for (const [key, dir] of Object.entries(DIRS)) {
    const dirPath = path.join(projectRoot, INCSPEC_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      warnings.push(`缺少目录: ${dir}/`);
    } else {
      printSuccess(`${dir}/ 存在`);
    }
  }

  // 3. Check spec files format
  print('');
  print(colorize('检查规范文件格式...', colors.bold));

  const specTypes = ['baselines', 'increments'];
  let checkedCount = 0;

  for (const type of specTypes) {
    const specs = listSpecs(projectRoot, type);
    for (const spec of specs) {
      checkedCount++;
      try {
        const { frontmatter, body } = readSpec(spec.path);

        // Check for required sections in baselines
        if (type === 'baselines') {
          if (!body.includes('## 1.') && !body.includes('# ')) {
            warnings.push(`${spec.name}: 可能缺少标准章节结构`);
          }
          if (!body.includes('sequenceDiagram') && !body.includes('graph ')) {
            warnings.push(`${spec.name}: 未检测到 Mermaid 图表`);
          }
        }

        // Check for required sections in increments
        if (type === 'increments') {
          const requiredSections = ['模块1', '模块2', '模块3', '模块4', '模块5'];
          const missingSections = requiredSections.filter(s => !body.includes(s));
          if (missingSections.length > 0) {
            warnings.push(`${spec.name}: 可能缺少模块 ${missingSections.join(', ')}`);
          }
        }
      } catch (e) {
        errors.push(`${spec.name}: 读取失败 - ${e.message}`);
      }
    }
  }

  if (checkedCount > 0) {
    printSuccess(`已检查 ${checkedCount} 个规范文件`);
  } else {
    print(colorize('  (暂无规范文件)', colors.dim));
  }

  // 4. Check workflow consistency
  print('');
  print(colorize('检查工作流一致性...', colors.bold));

  const workflow = readWorkflow(projectRoot);
  if (workflow?.currentWorkflow) {
    printSuccess(`当前工作流: ${workflow.currentWorkflow}`);

    // Check step outputs exist
    workflow.steps.forEach((step, index) => {
      if (step.output && step.status === 'completed') {
        // Determine expected path based on step
        let expectedPath;
        if (index === 0 || index === 5) {
          expectedPath = path.join(projectRoot, INCSPEC_DIR, DIRS.baselines, step.output);
        } else if (index === 1 || index === 2) {
          expectedPath = path.join(projectRoot, INCSPEC_DIR, DIRS.requirements, step.output);
        } else if (index === 3) {
          expectedPath = path.join(projectRoot, INCSPEC_DIR, DIRS.increments, step.output);
        }

        if (expectedPath && !fs.existsSync(expectedPath)) {
          warnings.push(`步骤 ${index + 1} 输出文件不存在: ${step.output}`);
        }
      }
    });
  } else {
    print(colorize('  (无活跃工作流)', colors.dim));
  }

  // Summary
  print('');
  print(colorize('验证结果:', colors.bold));
  print('');

  if (errors.length === 0 && warnings.length === 0) {
    printSuccess('所有检查通过!');
  } else {
    if (errors.length > 0) {
      print(colorize(`错误 (${errors.length}):`, colors.red, colors.bold));
      errors.forEach(e => print(colorize(`  ✗ ${e}`, colors.red)));
      print('');
    }

    if (warnings.length > 0) {
      print(colorize(`警告 (${warnings.length}):`, colors.yellow, colors.bold));
      warnings.forEach(w => print(colorize(`  ⚠ ${w}`, colors.yellow)));
      print('');
    }
  }

  // Exit with error code if strict mode
  if (options.strict && errors.length > 0) {
    process.exit(1);
  }
}
