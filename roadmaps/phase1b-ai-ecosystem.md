# 阶段 1B: AI 工具生态扩展

> v0.3.x - v0.4.x | 预计 1.5-2 个月（与阶段 1A 并行）

## 阶段背景

基于竞争分析，OpenSpec 已支持 20+ AI 编程助手，而 IncSpec 目前仅支持 Cursor 和 Claude Code。作为"面向 AI 编程助手"的工具，快速扩展 AI 工具支持是建立生态基础的关键。

本阶段目标是在 v0.4.0 前支持 5+ 主流 AI 工具，并建立可扩展的 AI 适配层架构。

## 阶段目标

快速扩展 AI 工具支持范围，建立统一的 AI 适配层接口，降低新工具接入成本。

## 核心问题

当前版本的 AI 工具支持痛点：

- 仅支持 2 个 AI 工具（Cursor、Claude Code）
- 每个工具需要单独维护模板
- 缺乏统一的适配层抽象
- 新工具接入成本高

## 关键成果

### 1. 扩展 AI 工具支持
- GitHub Copilot 支持
- Windsurf 支持
- Gemini CLI 支持
- RooCode 支持
- Cline 支持

### 2. 统一 AI 适配层
- 标准化的 AI 工具接口
- 模板自动生成机制
- 工具检测和自动配置

### 3. AGENTS.md 标准兼容
- 完善 AGENTS.md 支持
- 兼容更多 AGENTS.md 工具
- 自动检测和更新

---

## 详细任务

### 里程碑 1: AI 适配层架构 (v0.3.5)

**优先级**: P0 (必须完成)

#### 任务 1.1: 统一 AI 工具接口定义

**目标**: 定义标准化的 AI 工具适配接口

**接口定义**:

```typescript
// lib/ai-adapter/types.d.ts

/**
 * AI 工具适配器接口
 */
export interface AIAdapter {
  /** 工具名称 */
  name: string;
  
  /** 工具版本（如可检测） */
  version?: string;
  
  /** 工具类型 */
  type: 'slash-command' | 'agents-md' | 'command' | 'workflow';
  
  /** 配置目录路径 */
  configDir: string;
  
  /** 检测工具是否已安装/可用 */
  isSupported(): boolean;
  
  /** 检测项目是否已配置该工具 */
  isConfigured(projectRoot: string): boolean;
  
  /** 同步模板到项目 */
  sync(projectRoot: string, options?: SyncOptions): Promise<SyncResult>;
  
  /** 生成工具特定的提示词 */
  generatePrompt(context: PromptContext): string;
  
  /** 获取命令列表 */
  getCommands(): CommandDefinition[];
}

/**
 * 同步选项
 */
export interface SyncOptions {
  /** 强制覆盖已有配置 */
  force?: boolean;
  
  /** 只检查不写入 */
  dryRun?: boolean;
  
  /** 要同步的命令（默认全部） */
  commands?: string[];
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  filesCreated: string[];
  filesUpdated: string[];
  filesSkipped: string[];
  errors: string[];
}

/**
 * 提示词上下文
 */
export interface PromptContext {
  /** 工作流模式 */
  mode: 'minimal' | 'quick' | 'full';
  
  /** 当前步骤 */
  currentStep?: string;
  
  /** 项目信息 */
  project: {
    name: string;
    root: string;
    techStack?: string[];
  };
  
  /** 基线信息（如有） */
  baseline?: {
    path: string;
    version: string;
  };
}

/**
 * 命令定义
 */
export interface CommandDefinition {
  /** 命令名称 */
  name: string;
  
  /** 命令别名 */
  aliases?: string[];
  
  /** 命令描述 */
  description: string;
  
  /** 对应的 CLI 命令 */
  cliCommand: string;
  
  /** 模板文件路径 */
  templatePath: string;
}
```

**验收标准**:
- [ ] 接口定义完整
- [ ] 所有现有适配器实现接口
- [ ] 类型定义导出可用

---

#### 任务 1.2: 适配器管理器

**目标**: 实现适配器的统一管理和调度

**实现内容**:

```javascript
// lib/ai-adapter/manager.mjs

import { CursorAdapter } from './adapters/cursor.mjs';
import { ClaudeCodeAdapter } from './adapters/claude-code.mjs';
import { GithubCopilotAdapter } from './adapters/github-copilot.mjs';
import { WindsurfAdapter } from './adapters/windsurf.mjs';
import { GeminiCliAdapter } from './adapters/gemini-cli.mjs';
import { RooCodeAdapter } from './adapters/roo-code.mjs';
import { ClineAdapter } from './adapters/cline.mjs';
import { AgentsMdAdapter } from './adapters/agents-md.mjs';

export class AIAdapterManager {
  constructor() {
    this.adapters = new Map();
    this.registerBuiltinAdapters();
  }

  registerBuiltinAdapters() {
    // 斜杠命令类工具
    this.register(new CursorAdapter());
    this.register(new ClaudeCodeAdapter());
    this.register(new GithubCopilotAdapter());
    this.register(new WindsurfAdapter());
    this.register(new GeminiCliAdapter());
    this.register(new RooCodeAdapter());
    this.register(new ClineAdapter());
    
    // AGENTS.md 兼容工具（通用）
    this.register(new AgentsMdAdapter());
  }

  register(adapter) {
    this.adapters.set(adapter.name, adapter);
  }

  get(name) {
    return this.adapters.get(name);
  }

  getAll() {
    return Array.from(this.adapters.values());
  }

  /**
   * 检测项目中可用的 AI 工具
   */
  detectAvailable(projectRoot) {
    const available = [];
    
    for (const adapter of this.adapters.values()) {
      if (adapter.isSupported()) {
        available.push({
          name: adapter.name,
          type: adapter.type,
          configured: adapter.isConfigured(projectRoot),
        });
      }
    }
    
    return available;
  }

  /**
   * 同步所有已配置的工具
   */
  async syncAll(projectRoot, options = {}) {
    const results = {};
    
    for (const adapter of this.adapters.values()) {
      if (adapter.isConfigured(projectRoot) || options.all) {
        try {
          results[adapter.name] = await adapter.sync(projectRoot, options);
        } catch (error) {
          results[adapter.name] = {
            success: false,
            errors: [error.message],
          };
        }
      }
    }
    
    return results;
  }

  /**
   * 同步指定的工具
   */
  async syncSpecific(projectRoot, adapterNames, options = {}) {
    const results = {};
    
    for (const name of adapterNames) {
      const adapter = this.adapters.get(name);
      if (adapter) {
        try {
          results[name] = await adapter.sync(projectRoot, options);
        } catch (error) {
          results[name] = {
            success: false,
            errors: [error.message],
          };
        }
      } else {
        results[name] = {
          success: false,
          errors: [`未知的 AI 工具: ${name}`],
        };
      }
    }
    
    return results;
  }
}

// 单例导出
export const adapterManager = new AIAdapterManager();
```

**CLI 集成**:

```bash
# 检测可用的 AI 工具
incspec sync --detect

# 同步所有已配置的工具
incspec sync

# 同步指定工具
incspec sync --cursor --claude --copilot

# 同步所有支持的工具
incspec sync --all

# 检查同步状态（不写入）
incspec sync --dry-run
```

**验收标准**:
- [ ] 适配器注册和管理正常
- [ ] 工具检测准确
- [ ] 同步功能正常
- [ ] 错误处理完善

---

#### 任务 1.3: 基础适配器实现

**目标**: 实现适配器基类，减少重复代码

**实现内容**:

```javascript
// lib/ai-adapter/base-adapter.mjs

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export class BaseAdapter {
  constructor(config) {
    this.name = config.name;
    this.type = config.type;
    this.configDir = config.configDir;
    this.commandPrefix = config.commandPrefix || 'incspec';
    this.fileExtension = config.fileExtension || '.md';
  }

  isSupported() {
    // 默认支持，子类可覆盖
    return true;
  }

  isConfigured(projectRoot) {
    const configPath = path.join(projectRoot, this.configDir);
    return existsSync(configPath);
  }

  async sync(projectRoot, options = {}) {
    const result = {
      success: true,
      filesCreated: [],
      filesUpdated: [],
      filesSkipped: [],
      errors: [],
    };

    try {
      const commands = this.getCommands();
      const configPath = path.join(projectRoot, this.configDir);
      
      // 确保目录存在
      await fs.mkdir(configPath, { recursive: true });

      for (const command of commands) {
        const filePath = path.join(configPath, command.name + this.fileExtension);
        const content = await this.generateCommandTemplate(command);
        
        if (existsSync(filePath) && !options.force) {
          result.filesSkipped.push(filePath);
        } else {
          if (!options.dryRun) {
            await fs.writeFile(filePath, content, 'utf-8');
          }
          if (existsSync(filePath)) {
            result.filesUpdated.push(filePath);
          } else {
            result.filesCreated.push(filePath);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  getCommands() {
    // 返回 IncSpec 标准命令列表
    return [
      {
        name: `${this.commandPrefix}-analyze`,
        description: '分析代码流程，生成基线规范',
        cliCommand: 'incspec analyze',
      },
      {
        name: `${this.commandPrefix}-collect-req`,
        description: '收集结构化需求',
        cliCommand: 'incspec collect-req',
      },
      {
        name: `${this.commandPrefix}-collect-dep`,
        description: '采集 UI 依赖',
        cliCommand: 'incspec collect-dep',
      },
      {
        name: `${this.commandPrefix}-design`,
        description: '生成增量设计规范',
        cliCommand: 'incspec design',
      },
      {
        name: `${this.commandPrefix}-apply`,
        description: '应用代码变更',
        cliCommand: 'incspec apply',
      },
      {
        name: `${this.commandPrefix}-merge`,
        description: '合并到基线',
        cliCommand: 'incspec merge',
      },
      {
        name: `${this.commandPrefix}-archive`,
        description: '归档产出',
        cliCommand: 'incspec archive',
      },
      {
        name: `${this.commandPrefix}-diff`,
        description: '分析基线差异',
        cliCommand: 'incspec diff',
      },
    ];
  }

  async generateCommandTemplate(command) {
    // 子类可覆盖以自定义模板格式
    return `# ${command.name}

## 描述
${command.description}

## CLI 命令
\`${command.cliCommand}\`

## 使用说明
请按照 IncSpec 工作流执行此步骤。

## 参考
- 运行 \`incspec status\` 查看当前工作流状态
- 运行 \`incspec help ${command.cliCommand.split(' ')[1]}\` 查看详细帮助
`;
  }

  generatePrompt(context) {
    // 子类可覆盖以自定义提示词
    return this.getDefaultPrompt(context);
  }

  getDefaultPrompt(context) {
    const modeDesc = {
      minimal: '极简模式 (3 步)',
      quick: '快速模式 (5 步)',
      full: '完整模式 (7 步)',
    };

    return `你正在使用 IncSpec 进行增量规范驱动开发。

当前模式: ${modeDesc[context.mode] || context.mode}
${context.currentStep ? `当前步骤: ${context.currentStep}` : ''}
${context.baseline ? `基线版本: ${context.baseline.version}` : ''}

请按照 IncSpec 工作流规范执行操作。使用 \`incspec status\` 查看当前状态。`;
  }
}
```

**验收标准**:
- [ ] 基类提供通用功能
- [ ] 子类可轻松扩展
- [ ] 模板生成正确

---

### 里程碑 2: 扩展 AI 工具支持 (v0.3.5)

**优先级**: P0 (必须完成)

#### 任务 2.1: GitHub Copilot 适配器

**目标**: 支持 GitHub Copilot 的 prompts 功能

**配置目录**: `.github/prompts/`

**实现内容**:

```javascript
// lib/ai-adapter/adapters/github-copilot.mjs

import { BaseAdapter } from '../base-adapter.mjs';
import path from 'path';

export class GithubCopilotAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'github-copilot',
      type: 'slash-command',
      configDir: '.github/prompts',
      commandPrefix: 'incspec',
      fileExtension: '.md',
    });
  }

  async generateCommandTemplate(command) {
    // GitHub Copilot prompts 格式
    return `---
mode: agent
description: ${command.description}
---

# ${command.name}

You are helping the user with IncSpec incremental specification-driven development.

## Task
${command.description}

## CLI Command
Run: \`${command.cliCommand}\`

## Instructions
1. Check current workflow status with \`incspec status\`
2. Execute the command: \`${command.cliCommand}\`
3. Follow the IncSpec workflow guidelines

## Context
- IncSpec uses a baseline-first approach
- Always verify changes against the baseline
- Use \`incspec diff\` to check for breaking changes

## Reference
See IncSpec documentation for detailed workflow guidance.
`;
  }
}
```

**验收标准**:
- [ ] 生成正确的 GitHub Copilot prompts 格式
- [ ] 命令可在 Copilot Chat 中使用
- [ ] 模板内容符合 IncSpec 工作流

---

#### 任务 2.2: Windsurf 适配器

**目标**: 支持 Windsurf 的 workflows 功能

**配置目录**: `.windsurf/workflows/`

**实现内容**:

```javascript
// lib/ai-adapter/adapters/windsurf.mjs

import { BaseAdapter } from '../base-adapter.mjs';

export class WindsurfAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'windsurf',
      type: 'workflow',
      configDir: '.windsurf/workflows',
      commandPrefix: 'incspec',
      fileExtension: '.md',
    });
  }

  async generateCommandTemplate(command) {
    // Windsurf workflow 格式
    return `# ${command.name}

## Description
${command.description}

## Trigger
\`/${command.name}\`

## Workflow Steps

### Step 1: Check Status
First, check the current IncSpec workflow status:
\`\`\`bash
incspec status
\`\`\`

### Step 2: Execute Command
Run the IncSpec command:
\`\`\`bash
${command.cliCommand}
\`\`\`

### Step 3: Verify
After execution, verify the changes:
- Check generated files in \`incspec/\` directory
- Review any warnings or errors
- Proceed to the next step if successful

## Notes
- IncSpec uses baseline-first incremental development
- Use \`incspec diff\` to analyze changes before applying
- Use \`incspec upgrade --to=full\` to switch to full workflow mode
`;
  }
}
```

**验收标准**:
- [ ] 生成正确的 Windsurf workflow 格式
- [ ] 工作流可在 Windsurf 中触发
- [ ] 步骤说明清晰

---

#### 任务 2.3: Gemini CLI 适配器

**目标**: 支持 Gemini CLI 的 commands 功能

**配置目录**: `.gemini/commands/incspec/`

**实现内容**:

```javascript
// lib/ai-adapter/adapters/gemini-cli.mjs

import { BaseAdapter } from '../base-adapter.mjs';

export class GeminiCliAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'gemini-cli',
      type: 'slash-command',
      configDir: '.gemini/commands/incspec',
      commandPrefix: 'incspec',
      fileExtension: '.md',
    });
  }

  getCommands() {
    // Gemini CLI 使用 : 分隔命令
    return super.getCommands().map((cmd) => ({
      ...cmd,
      name: cmd.name.replace('-', ':'),
    }));
  }

  async generateCommandTemplate(command) {
    return `# ${command.name}

${command.description}

## Usage
\`/${command.name}\`

## CLI Command
\`\`\`bash
${command.cliCommand}
\`\`\`

## IncSpec Workflow
This command is part of the IncSpec incremental specification-driven development workflow.

### Current Step Context
- Check status: \`incspec status\`
- View diff: \`incspec diff\`
- Get help: \`incspec help\`

### Workflow Modes
- **Minimal (3 steps)**: analyze → apply → archive
- **Quick (5 steps)**: analyze → collect-req → apply → merge → archive
- **Full (7 steps)**: Complete workflow with design phase

## Best Practices
1. Always start with \`incspec analyze\` to capture baseline
2. Use \`incspec diff\` before applying changes
3. Archive completed work with \`incspec archive -y\`
`;
  }
}
```

**验收标准**:
- [ ] 使用正确的命令分隔符（:）
- [ ] 生成符合 Gemini CLI 格式的模板
- [ ] 命令可在 Gemini CLI 中使用

---

#### 任务 2.4: RooCode 适配器

**目标**: 支持 RooCode 的 commands 功能

**配置目录**: `.roo/commands/`

**实现内容**:

```javascript
// lib/ai-adapter/adapters/roo-code.mjs

import { BaseAdapter } from '../base-adapter.mjs';

export class RooCodeAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'roo-code',
      type: 'slash-command',
      configDir: '.roo/commands',
      commandPrefix: 'incspec',
      fileExtension: '.md',
    });
  }

  async generateCommandTemplate(command) {
    return `# ${command.name}

## Purpose
${command.description}

## Command
\`/${command.name}\`

## Execution
\`\`\`bash
${command.cliCommand}
\`\`\`

## Workflow Context

### IncSpec Baseline-First Development
IncSpec captures code baselines before making changes, ensuring AI understands the existing codebase.

### Steps
1. Run the command above
2. Follow prompts in the terminal
3. Check \`incspec/\` for generated specifications
4. Use \`incspec status\` to see next steps

## Related Commands
- \`incspec status\` - View workflow status
- \`incspec diff\` - Analyze changes
- \`incspec upgrade\` - Switch workflow mode
`;
  }
}
```

**验收标准**:
- [ ] 生成符合 RooCode 格式的模板
- [ ] 命令可在 RooCode 中使用

---

#### 任务 2.5: Cline 适配器

**目标**: 支持 Cline 的 workflows 功能

**配置目录**: `.clinerules/workflows/`

**实现内容**:

```javascript
// lib/ai-adapter/adapters/cline.mjs

import { BaseAdapter } from '../base-adapter.mjs';

export class ClineAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'cline',
      type: 'workflow',
      configDir: '.clinerules/workflows',
      commandPrefix: 'incspec',
      fileExtension: '.md',
    });
  }

  async generateCommandTemplate(command) {
    return `# ${command.name}

## Trigger
When the user asks to "${command.description.toLowerCase()}"

## Workflow

### Pre-check
1. Verify IncSpec is initialized: \`incspec status\`
2. If not initialized, run: \`incspec init\`

### Execute
Run the IncSpec command:
\`\`\`bash
${command.cliCommand}
\`\`\`

### Post-check
1. Verify command completed successfully
2. Check generated files in \`incspec/\` directory
3. Report any errors to the user

## Context
IncSpec is a baseline-first incremental specification-driven development tool.

### Key Concepts
- **Baseline**: Captured state of existing code
- **Increment**: Proposed changes on top of baseline
- **Diff**: Comparison between baseline and increment

### Workflow Modes
- Minimal: 3 steps (quick fixes)
- Quick: 5 steps (standard development)
- Full: 7 steps (complex features)

## Error Handling
If the command fails:
1. Check if previous steps are completed: \`incspec status\`
2. Use \`--force\` to skip prerequisite checks if needed
3. Report the error message to the user
`;
  }
}
```

**验收标准**:
- [ ] 生成符合 Cline 格式的模板
- [ ] 工作流可在 Cline 中使用
- [ ] 包含错误处理指导

---

### 里程碑 3: AGENTS.md 标准兼容 (v0.4.0)

**优先级**: P0 (必须完成)

#### 任务 3.1: 增强 AGENTS.md 生成

**目标**: 生成更完善的 AGENTS.md 文件，兼容更多工具

**实现内容**:

```javascript
// lib/ai-adapter/adapters/agents-md.mjs

import { BaseAdapter } from '../base-adapter.mjs';

export class AgentsMdAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'agents-md',
      type: 'agents-md',
      configDir: '',  // 根目录
      commandPrefix: 'incspec',
    });
  }

  async sync(projectRoot, options = {}) {
    const result = {
      success: true,
      filesCreated: [],
      filesUpdated: [],
      filesSkipped: [],
      errors: [],
    };

    try {
      const agentsMdPath = path.join(projectRoot, 'AGENTS.md');
      const content = this.generateAgentsMd();
      
      if (!options.dryRun) {
        await fs.writeFile(agentsMdPath, content, 'utf-8');
      }
      
      if (existsSync(agentsMdPath)) {
        result.filesUpdated.push(agentsMdPath);
      } else {
        result.filesCreated.push(agentsMdPath);
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  generateAgentsMd() {
    return `# AGENTS.md

> 本文件供 AI 编程助手理解项目的 IncSpec 工作流配置。
> 兼容 Amp、Jules、以及其他支持 AGENTS.md 标准的工具。

## IncSpec 工作流

本项目使用 IncSpec 进行增量规范驱动开发。IncSpec 采用**基线优先**方法，在修改代码前先捕获现有代码的结构和行为。

### 工作流模式

| 模式 | 步骤数 | 适用场景 |
|------|--------|----------|
| 极简 (minimal) | 3 | Bug 修复、小型调整 |
| 快速 (quick) | 5 | 中型功能开发 |
| 完整 (full) | 7 | 大型功能、复杂重构 |

### 核心命令

\`\`\`bash
# 启动工作流
incspec analyze <source> [--minimal|--quick]

# 查看状态
incspec status

# 分析差异
incspec diff

# 应用变更
incspec apply

# 归档
incspec archive -y
\`\`\`

### 目录结构

\`\`\`
incspec/
├── baselines/      # 基线规范文件
├── requirements/   # 需求规范文件
├── increments/     # 增量设计文件
├── archives/       # 归档产出
└── WORKFLOW.md     # 工作流状态
\`\`\`

### 工作流步骤

#### 完整模式 (7 步)

1. **analyze** - 分析代码流程，生成基线
2. **collect-req** - 收集结构化需求
3. **collect-dep** - 采集 UI 依赖
4. **design** - 生成增量设计规范
5. **apply** - 应用代码变更
6. **merge** - 合并到基线
7. **archive** - 归档产出

#### 快速模式 (5 步)
跳过步骤 3 (collect-dep) 和步骤 4 (design)

#### 极简模式 (3 步)
只执行 analyze → apply → archive

### 最佳实践

1. **始终从分析开始**: 使用 \`incspec analyze\` 捕获基线
2. **变更前检查差异**: 使用 \`incspec diff\` 评估风险
3. **及时归档**: 完成后使用 \`incspec archive -y\`

### 故障排除

- 如果步骤被跳过，使用 \`--force\` 强制执行
- 如果需要切换模式，使用 \`incspec upgrade --to=full\`
- 如果需要重置，使用 \`incspec reset\`

## 更多信息

- 运行 \`incspec help\` 查看所有命令
- 运行 \`incspec status\` 查看当前状态
- 访问项目文档了解更多详情
`;
  }
}
```

**验收标准**:
- [ ] AGENTS.md 内容完整
- [ ] 兼容主流 AGENTS.md 工具
- [ ] 包含所有工作流模式说明

---

#### 任务 3.2: 自动检测和更新

**目标**: 自动检测已有 AGENTS.md 并智能更新

**实现内容**:

```javascript
// lib/ai-adapter/agents-md-updater.mjs

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class AgentsMdUpdater {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.agentsMdPath = path.join(projectRoot, 'AGENTS.md');
  }

  async detect() {
    if (!existsSync(this.agentsMdPath)) {
      return { exists: false };
    }

    const content = await fs.readFile(this.agentsMdPath, 'utf-8');
    
    return {
      exists: true,
      hasIncspecSection: this.hasIncspecSection(content),
      incspecVersion: this.detectIncspecVersion(content),
    };
  }

  hasIncspecSection(content) {
    return content.includes('IncSpec') || content.includes('incspec');
  }

  detectIncspecVersion(content) {
    const match = content.match(/IncSpec.*v(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  }

  async update(options = {}) {
    const detection = await this.detect();
    
    if (!detection.exists) {
      // 创建新文件
      return this.create();
    }

    if (!detection.hasIncspecSection) {
      // 追加 IncSpec 部分
      return this.append();
    }

    if (options.force) {
      // 替换 IncSpec 部分
      return this.replace();
    }

    return {
      action: 'skipped',
      reason: 'IncSpec section already exists. Use --force to update.',
    };
  }

  async create() {
    const adapter = new AgentsMdAdapter();
    const content = adapter.generateAgentsMd();
    await fs.writeFile(this.agentsMdPath, content, 'utf-8');
    return { action: 'created' };
  }

  async append() {
    const existingContent = await fs.readFile(this.agentsMdPath, 'utf-8');
    const adapter = new AgentsMdAdapter();
    const incspecSection = adapter.generateAgentsMd();
    
    const newContent = `${existingContent}\n\n---\n\n${incspecSection}`;
    await fs.writeFile(this.agentsMdPath, newContent, 'utf-8');
    return { action: 'appended' };
  }

  async replace() {
    const existingContent = await fs.readFile(this.agentsMdPath, 'utf-8');
    
    // 查找并替换 IncSpec 部分
    const incspecStart = existingContent.indexOf('## IncSpec');
    if (incspecStart === -1) {
      return this.append();
    }

    // 找到下一个同级标题或文件结尾
    const nextSection = existingContent.indexOf('\n## ', incspecStart + 1);
    const endPos = nextSection === -1 ? existingContent.length : nextSection;

    const adapter = new AgentsMdAdapter();
    const incspecSection = adapter.generateAgentsMd()
      .split('\n')
      .filter((line) => !line.startsWith('# AGENTS.md'))
      .join('\n');

    const newContent = 
      existingContent.slice(0, incspecStart) + 
      incspecSection + 
      existingContent.slice(endPos);

    await fs.writeFile(this.agentsMdPath, newContent, 'utf-8');
    return { action: 'replaced' };
  }
}
```

**CLI 命令**:

```bash
# 检测 AGENTS.md 状态
incspec sync --detect-agents

# 更新 AGENTS.md
incspec sync --agents

# 强制更新 AGENTS.md
incspec sync --agents --force
```

**验收标准**:
- [ ] 检测现有 AGENTS.md
- [ ] 智能追加或更新 IncSpec 部分
- [ ] 不破坏用户已有内容

---

## 技术债务

本阶段需要关注的技术债务：

1. **模板版本管理**
   - 模板需要与 CLI 版本同步
   - 需要机制检测过期模板

2. **工具检测准确性**
   - 部分工具可能难以准确检测
   - 需要提供手动配置选项

3. **测试覆盖**
   - 每个适配器需要单元测试
   - 需要集成测试验证模板生成

---

## 模板同步任务

### 必须更新的模板

1. **templates/AGENTS.md**
   - 使用新的 AgentsMdAdapter 生成
   - 包含所有工作流模式

2. **templates/commands/**
   - 更新为使用 BaseAdapter 生成
   - 确保与 CLI 参数一致

3. **templates/commands/**
   - 更新斜杠命令模板包含新功能
   - 确保 Cursor/Claude Code 通用

---

## 成功指标

### 量化指标

- AI 工具支持数量: 5+ (v0.3.5), 8+ (v0.4.0)
- 模板同步成功率: > 98%
- 新工具接入时间: < 2 小时

### 定性指标

- 用户能轻松配置多个 AI 工具
- 模板质量与 OpenSpec 相当
- AGENTS.md 兼容主流工具

---

## 风险和缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| AI 工具 API 变化 | 中 | 中 | 模块化设计，快速适配 |
| 模板格式不兼容 | 低 | 高 | 参考 OpenSpec 已验证的格式 |
| 维护成本过高 | 中 | 中 | 使用基类减少重复代码 |
| 检测准确性不足 | 低 | 低 | 提供手动配置选项 |

---

## 下一步

完成阶段 1B 后：

1. **合并阶段 1A 成果** - 确保极简模式与多工具支持协同工作
2. **进入阶段 2** - 在 AI 生态基础上提升交互体验

---

**关联文档**:
- [ROADMAP.md](./ROADMAP.md) - 路线图总览
- [phase1a-core-differentiation.md](./phase1a-core-differentiation.md) - 核心差异化与极简模式
- [phase2-interaction.md](./phase2-interaction.md) - 交互体验增强
- [template-sync-strategy.md](./template-sync-strategy.md) - 模板同步策略