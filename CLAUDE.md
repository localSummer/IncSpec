# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IncSpec 是一个面向 AI 编程助手的增量规范驱动开发 CLI 工具。通过 7 步工作流（分析 → 收集需求 → 收集依赖 → 设计 → 应用 → 合并 → 归档），在修改代码前先捕获代码流程基线。

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
```

无需构建步骤，无第三方依赖，纯 ES Modules。

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

`lib/workflow.mjs` 管理工作流状态（STEPS 数组定义步骤 1-6，归档为独立的第 7 步）:
- `STEPS` 数组定义步骤 id、name、label、command
- `STATUS` 枚举: PENDING / IN_PROGRESS / COMPLETED
- `updateStep()` 更新步骤状态并自动推进 currentStep

### 规范文件版本

`lib/spec.mjs` 处理文件版本:
- 文件命名: `{name}-{type}-v{version}.md`
- `getNextVersion()` 自动递增版本号
- `getLatestSpec()` 获取最新版本

### 配置查找

`lib/config.mjs`:
- `findProjectRoot()` 向上查找 `incspec/` 目录
- `ensureInitialized()` 确保项目已初始化，否则抛错

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
| help | h |
