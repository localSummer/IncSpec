# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IncSpec 是一个面向 AI 编程助手的增量规范驱动开发 CLI 工具。通过 7 步工作流（分析 → 收集需求 → 收集依赖 → 设计 → 应用 → 合并 → 归档），在修改代码前先捕获代码流程基线。

## Requirements

- Node.js >= 18.0.0
- 允许少量引入外部依赖（如 UI 交互库），但核心逻辑仍应保持轻量
- 纯 ES Modules

## Development Commands

```bash
# 从 GitHub 克隆并安装
git clone https://github.com/localSummer/IncSpec.git
cd IncSpec
npm link

# 运行 CLI
node index.mjs [command]
incspec [command]        # npm link 后可用

# 验证安装
incspec --version

# 更新项目模板到最新版本
incspec update
incspec update -y        # 跳过确认
```

无需构建步骤，直接运行 .mjs 文件。

## Architecture

```
index.mjs                 # CLI 入口，参数解析和命令路由
├── commands/             # 命令实现（每个命令一个文件）
│   ├── init.mjs          # 初始化项目
│   ├── analyze.mjs       # 步骤1: 代码流程分析
│   ├── collect-req.mjs   # 步骤2: 结构化需求收集
│   ├── collect-dep.mjs   # 步骤3: UI依赖采集
│   ├── design.mjs        # 步骤4: 增量设计
│   ├── apply.mjs         # 步骤5: 应用代码变更
│   ├── merge.mjs         # 步骤6: 合并到基线
│   ├── archive.mjs       # 步骤7: 归档产出
│   ├── reset.mjs         # 重置/回退工作流
│   ├── sync.mjs          # 同步 IDE 集成
│   ├── update.mjs        # 更新模板
│   └── ...
├── lib/                  # 核心库
│   ├── config.mjs        # 配置管理，项目根查找，project.md 读写
│   ├── workflow.mjs      # 工作流状态管理，WORKFLOW.md 读写
│   ├── spec.mjs          # 规范文件 CRUD，版本管理，归档
│   ├── terminal.mjs      # 终端输出，颜色，交互式提示
│   ├── agents.mjs        # AGENTS.md 文件管理
│   ├── cursor.mjs        # Cursor IDE 命令同步
│   └── claude.mjs        # Claude Code Skill 同步
└── templates/            # Markdown 模板文件
    ├── AGENTS.md
    ├── WORKFLOW.md
    ├── project.md
    ├── commands/         # IDE 命令模板（Cursor/Claude 通用）
    └── inc-spec-skill/   # Claude Code Skill 模板
```

## Key Patterns

### 命令结构

每个命令导出 `async function xxxCommand(ctx)`:
- `ctx.cwd` - 当前工作目录
- `ctx.args` - 位置参数数组
- `ctx.options` - 选项对象（如 `--force`, `--output`）

### 工作流状态

`lib/workflow.mjs` 管理工作流状态:
- `STEPS` 数组定义步骤 1-7 (id, name, label, command)
- `STATUS` 枚举: PENDING / IN_PROGRESS / COMPLETED / SKIPPED
- `MODE` 枚举: FULL / QUICK
- `updateStep()` 更新步骤状态并自动推进 currentStep
- `resetToStep()` 回退到指定步骤，重置后续步骤

### 工作流模式

两种模式：
- **完整模式 (FULL)**: 执行全部 7 步，适合复杂功能开发
- **快速模式 (QUICK)**: 跳过步骤 3（UI依赖采集）和步骤 4（增量设计），适合 Bug 修复和简单功能

快速模式步骤序列: 1 → 2 → 5 → 6 → 7

启动快速模式:
```bash
incspec analyze <source> --quick
```

### 前置条件检查

命令执行前会检查前置步骤是否完成（定义在各命令文件的 `PREREQUISITES` 数组）。使用 `--force` 跳过检查:
```bash
incspec <command> --force
```

### 规范文件版本

`lib/spec.mjs` 处理文件版本:
- 文件命名: `{name}-{type}-v{version}.md`
- `getNextVersion()` 自动递增版本号
- `getLatestSpec()` 获取最新版本
- `archiveSpec()` 按年月和模块组织归档

归档目录结构:
```
incspec/archives/
└── YYYY-MM/              # 按年月组织
    └── {module-name}/    # 按工作流模块分组
        ├── baselines/
        ├── requirements/
        └── increments/
```

### 配置查找

`lib/config.mjs`:
- `findProjectRoot()` 向上查找 `incspec/` 目录
- `ensureInitialized()` 确保项目已初始化，否则抛错
- `DIRS` 定义目录结构: baselines, requirements, increments, archives

### 基线文件恢复

使用现有基线跳过分析步骤:
```bash
incspec analyze --baseline=home-baseline-v1.md
```
- 自动搜索 `baselines/` 和 `archives/` 目录
- 若文件在归档目录，自动移动到 `baselines/`
- 模块名自动从文件名推断，可通过 `--module` 覆盖

### 工作流重置与回退

完全重置:
```bash
incspec reset              # 归档所有产出，重置为初始状态
```

部分回退:
```bash
incspec reset --to=3       # 回退到步骤 3
incspec reset -t 3         # 短选项形式
```
- 保留目标步骤及之前的状态
- 重置后续步骤为 pending
- 被重置步骤的产出自动归档
- 限制: 目标步骤必须已完成，快速模式下不能回退到被跳过的步骤（3、4）

## Command Aliases

| 命令 | 别名 |
|------|------|
| analyze | a |
| collect-req | cr |
| collect-dep | cd |
| design | d |
| apply | ap |
| merge | m |
| archive | ar |
| status | st |
| list | ls |
| validate | v |
| sync | s |
| update | up |
| reset | rs |
| help | h |

## IDE Integration

### Cursor
运行 `incspec sync --cursor` 后，在 `.cursor/commands/incspec/` 生成斜杠命令:
- `/incspec/inc-analyze`
- `/incspec/inc-collect-req`
- `/incspec/inc-collect-dep`
- `/incspec/inc-design`
- `/incspec/inc-apply`
- `/incspec/inc-merge`
- `/incspec/inc-archive`

### Claude Code
运行 `incspec sync --claude` 后，在 `.claude/skills/inc-spec-skill/` 生成 Skill:
- 使用 `inc-spec-skill` Skill 触发工作流

### AGENTS.md
项目根目录的 `AGENTS.md` 包含 incspec 工作流指令块，所有 AGENTS.md 兼容工具自动识别。

## Workflow Philosophy

1. **基线优先** - 在修改代码前先理解现有代码流程
2. **结构化需求** - 5 列表格精确捕获需求（ID | 类型 | 描述 | 验收标准 | 优先级）
3. **依赖追踪** - 6 维度分析 UI 依赖（API、Store、Types、Utils、Components、Hooks）
4. **增量设计** - 7 模块蓝图指导实现（概述、API、Store、Types、Components、新文件、迁移）
5. **无缝迭代** - 每轮产出新基线，作为下一轮起点
6. **历史可追溯** - 归档按年月和模块组织
7. **规范生成而非执行** - 专注于生成测试/Lint规范供 AI 参考，而非直接运行测试或代码检查

## Common Workflows

### 完整功能开发
```bash
incspec analyze src/views/Home --module=home
incspec collect-req
incspec collect-dep
incspec design --feature=search-filter
incspec apply
incspec merge
incspec archive -y
```

### 快速 Bug 修复
```bash
incspec analyze src/views/Home --quick
incspec collect-req
incspec apply
incspec merge
incspec archive -y
```

### 使用现有基线
```bash
incspec analyze --baseline=home-baseline-v1.md
incspec collect-req
# ... 继续后续步骤
```

### 工作流回退
```bash
incspec reset --to=3       # 回退到步骤 3，重新执行后续步骤
```
