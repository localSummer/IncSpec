<p align="center">
  <strong>IncSpec</strong>
</p>
<p align="center">面向 AI 编程助手的增量规范驱动开发工具</p>
<p align="center">
  <a href="https://github.com/localSummer/IncSpec"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-localSummer%2FIncSpec-blue?style=flat-square&logo=github" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/node/v/@localsummer/incspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square" /></a>
</p>

# IncSpec

IncSpec 通过**增量规范驱动开发**让人类与 AI 编程助手保持一致 - 这是一个 6+1 步工作流（6 步开发 + 归档），在修改代码前先捕获代码流程基线。**无需 API 密钥。**

## 为什么选择 IncSpec?

AI 编程助手在处理复杂前端代码库时常常力不从心，因为 API 调用、状态管理和组件依赖深度交织。incspec 添加了一个结构化分析工作流，在提出变更前先捕获当前状态，让你获得可预测、可审查的输出。

核心价值：
- **基线优先**：在修改代码前先理解现有代码流程。
- **结构化需求**：5 列表格精确捕获需求。
- **依赖追踪**：6 维度分析 UI 依赖（API、Store、Types 等）。
- **增量设计**：7 模块蓝图指导实现。
- **无缝迭代**：将完成的工作合并为新基线，开启下一轮循环。
- **历史可追溯**：归档按年月和模块组织，便于回顾历史决策。
- 兼容你已有的 AI 工具：Cursor、Claude Code 及任何 AGENTS.md 兼容助手。

## IncSpec 对比一览

- **前端专注**：专为 API 数据流程分析和组件依赖设计。
- **6+1 步循环**：分析 → 收集需求 → 收集依赖 → 设计 → 应用 → 合并 → 归档。
- **基线管理**：每个循环产出新基线，作为下一轮迭代的起点。
- **与 OpenSpec 对比**：OpenSpec 擅长 0→1 功能规范。incspec 擅长理解和修改现有前端代码库（1→n），特别是 API 流程和状态管理复杂的场景。

完整对比见 [incspec 对比](#incspec-对比)。

## 工作原理

```
┌────────────────────┐
│ 1. 分析            │  分析现有代码流程
│    代码流程        │  生成基线快照
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 2. 收集            │  捕获结构化需求
│    需求            │  5 列表格格式
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 3. 收集            │  分析 UI 依赖
│    依赖            │  API、Store、Types、Utils、Components、Hooks
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 4. 设计            │  生成增量蓝图
│    增量            │  7 模块设计文档
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 5. 应用            │  实现代码变更
│    变更            │  按照蓝图执行
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 6. 合并            │  合并为新基线
│    到基线          │  验证功能正常
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 7. 归档            │  归档本轮产出
│    产出            │  清空工作区
└────────┬───────────┘
         │
         └──────────────────────────────────────┐
                                                │
                    ┌───────────────────────────┘
                    │ 新基线成为
                    │ 下一轮增量循环的
                    ▼ 起点
              ┌───────────┐
              │   迭代    │
              └───────────┘
```

## 快速开始

### 支持的 AI 工具

<details>
<summary><strong>原生斜杠命令</strong>（点击展开）</summary>

运行 `incspec cursor-sync` 后，这些工具可使用内置的 incspec 命令。

| 工具 | 命令 |
|------|------|
| **Cursor** | `/incspec/inc-analyze`、`/incspec/inc-collect-req`、`/incspec/inc-collect-dep`、`/incspec/inc-design`、`/incspec/inc-apply`、`/incspec/inc-merge`、`/incspec/inc-archive` |
| **Claude Code** | 使用 AGENTS.md 工作流指令 |

</details>

<details>
<summary><strong>AGENTS.md 兼容</strong>（点击展开）</summary>

这些工具会自动读取 `incspec/AGENTS.md` 中的工作流指令。如需提醒，可让它们遵循 incspec 工作流。

| 工具 |
|------|
| Claude Code、Cursor（Agent 模式）及其他 AGENTS.md 兼容助手 |

</details>

### 安装与初始化

#### 前置条件
- **Node.js >= 18.0.0** - 使用 `node --version` 检查版本

#### 步骤 1：安装 CLI

```bash
# 从源码安装（开发模式）
cd ~/.claude/clis/incspec-cli # 这是我当前的路径，请根据实际路径调整
npm link
```

验证安装：
```bash
incspec --version
```

#### 步骤 2：在项目中初始化 IncSpec

进入项目目录：
```bash
cd my-project
```

运行初始化：
```bash
incspec init
```

**初始化过程中会：**
- 创建 `incspec/` 目录结构
- 生成包含工作流指令的 `AGENTS.md`
- 在 `incspec/project.md` 中设置项目配置

#### 步骤 3：同步 Cursor 命令（可选）

如果使用 Cursor IDE：
```bash
incspec cursor-sync
```

**设置完成后：**
- 运行 `incspec status` 验证设置
- Cursor 用户可直接触发 `/incspec/inc-*` 命令

### 创建你的第一个增量

以下是展示完整 incspec 工作流的真实示例。

#### 1. 分析现有代码

首先分析你要修改的代码：

```text
你：分析 Home 页面组件及其 API 流程
    （Cursor 快捷命令：/incspec/inc-analyze）

AI：我来分析 Home 组件的代码流程。
    *生成 incspec/baselines/home-baseline-v1.md，包含 API 调用序列、
    依赖关系和组件结构。*
```

验证并标记完成：
```bash
$ incspec status                              # 检查当前工作流状态
$ incspec analyze src/views/Home --complete   # 标记步骤 1 完成
```

#### 2. 收集结构化需求

定义你想要的变更：

```text
你：我需要在 Home 页面添加搜索过滤功能
    （Cursor 快捷命令：/incspec/inc-collect-req）

AI：我来为搜索过滤创建结构化需求。
    *生成 incspec/requirements/structured-requirements.md，
    包含 5 列表格：ID | 类型 | 描述 | 验收标准 | 优先级*
```

#### 3. 收集 UI 依赖

分析新功能所需的依赖：

```text
你：搜索过滤功能需要哪些依赖？
    （Cursor 快捷命令：/incspec/inc-collect-dep）

AI：我来分析所需的依赖。
    *生成 incspec/requirements/ui-dependencies.md，
    涵盖 API、Store、Types、Utils、Components 和 Hooks*
```

#### 4. 设计增量

生成实现蓝图：

```text
你：为搜索过滤功能设计增量
    （Cursor 快捷命令：/incspec/inc-design）

AI：我来创建增量设计文档。
    *生成 incspec/increments/search-filter-increment-v1.md，
    包含 7 个模块：概述、API 变更、Store 变更、类型定义、
    组件变更、新文件和迁移说明*
```

#### 5. 应用变更

按照蓝图实现：

```text
你：应用搜索过滤增量
    （Cursor 快捷命令：/incspec/inc-apply）

AI：我将按照增量设计实现变更。
    *根据蓝图修改源文件*
```

#### 6. 合并到新基线

完成循环：

```text
你：合并创建新基线
    （Cursor 快捷命令：/incspec/inc-merge）

AI：我将增量合并到新基线。
    *创建 incspec/baselines/home-baseline-v2.md，
    准备进入下一轮迭代循环*
```

### 7. 归档已完成的工作

完成 6 步工作流后，使用归档命令保存本轮产出：

```text
你：归档本轮工作流产出
    （Cursor 快捷命令：/incspec/inc-archive）

AI：我来归档本轮工作流的所有产出文件。
    *运行 incspec archive --workflow*
```

或直接在终端执行：
```bash
$ incspec archive -y    # 归档所有工作流产出，跳过确认
```

## 归档流程

归档是 incspec 工作流的收尾步骤，将本轮迭代的产出文件移入历史存档，为下一轮迭代腾出空间。

### 为什么需要归档?

- **保持工作区整洁**：避免多轮迭代的文件混杂在一起。
- **历史可追溯**：按年月和模块组织，便于回顾历史决策。
- **迭代边界清晰**：每轮归档后，`baselines/`、`requirements/`、`increments/` 目录重新开始。

### 归档时机

在以下情况下执行归档：

1. **6 步工作流全部完成** - 代码已应用，新基线已生成
2. **功能已验证通过** - 确认变更符合预期
3. **准备开始下一轮迭代** - 需要清空当前工作区

### 归档命令详解

```bash
# 归档整个工作流（推荐）
incspec archive --workflow      # 交互式确认
incspec archive -y              # 跳过确认，直接归档

# 归档指定文件
incspec archive baselines/home-baseline-v1.md

# 归档但保留原文件（复制而非移动）
incspec archive baselines/home-baseline-v1.md --keep

# 查看归档内容
incspec list -a                 # 列出所有文件，包含归档
incspec list archives           # 仅列出归档文件
```

### 归档后的目录结构

归档命令按年月和模块自动组织文件：

```
incspec/
├── archives/
│   └── 2024-12/                      # 按年月组织
│       └── home-search-filter/       # 按工作流模块分组
│           ├── baselines/
│           │   ├── home-baseline-v1.md   # 初始基线
│           │   └── home-baseline-v2.md   # 合并后的新基线
│           ├── requirements/
│           │   ├── structured-requirements.md
│           │   └── ui-dependencies.md
│           └── increments/
│               └── search-filter-increment-v1.md
├── baselines/                        # 归档后已清空，准备下一轮
├── requirements/                     # 归档后已清空
└── increments/                       # 归档后已清空
```

### 归档工作流示意

```
┌────────────────────┐
│ 6 步工作流完成     │
│ 新基线已生成       │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 验证功能           │  确认代码变更符合预期
│ 测试通过           │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 执行归档           │  incspec archive -y
│                    │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ 归档完成                                   │
│                                            │
│  ┌─────────────┐      ┌─────────────┐      │
│  │ archives/   │      │ baselines/  │      │
│  │ 2024-12/    │      │ (已清空)    │      │
│  │ module/     │      │             │      │
│  │  ├─baselines│      │ 准备下一轮  │      │
│  │  ├─requirements    │ 迭代        │      │
│  │  └─increments      └─────────────┘      │
│  └─────────────┘                           │
└────────────────────────────────────────────┘
```

### 归档最佳实践

1. **及时归档** - 完成一轮迭代后立即归档，避免文件堆积。
2. **使用 --workflow** - 优先归档整个工作流，确保完整性。
3. **保留新基线** - 归档时新基线会被复制（而非移动）到归档目录，同时保留在 `baselines/` 作为下一轮起点。
4. **定期清理** - 对于过期的归档，可手动删除或移至外部存储。

## 目录结构

```
your-project/
├── AGENTS.md                    # AI 代理指令（包含 incspec 指令块）
├── incspec/
│   ├── project.md               # 项目配置
│   ├── WORKFLOW.md              # 当前工作流状态
│   ├── AGENTS.md                # incspec 使用指南
│   ├── baselines/               # 基线快照
│   │   └── home-baseline-v1.md
│   ├── requirements/            # 需求文档
│   │   ├── structured-requirements.md
│   │   └── ui-dependencies.md
│   ├── increments/              # 增量设计
│   │   └── feature-increment-v1.md
│   └── archives/                # 历史归档
│       └── 2024-12/             # 按年月组织
│           └── {module}/        # 按工作流模块分组
└── .cursor/
    └── commands/
        └── incspec/             # Cursor 命令
```

## 命令参考

<details>
<summary><strong>初始化与状态</strong>（点击展开）</summary>

```bash
incspec init              # 初始化项目
incspec init --force      # 强制重新初始化

incspec update            # 更新模板到最新版本（别名：up）
incspec update -y         # 跳过确认提示

incspec status            # 查看工作流状态（别名：st）

incspec help              # 显示帮助（别名：h）
incspec help <command>    # 显示特定命令帮助
```

</details>

<details>
<summary><strong>工作流命令</strong>（点击展开）</summary>

所有工作流命令支持 `--complete` 标记步骤完成。

```bash
# 步骤 1：分析代码流程
incspec analyze <source-path> [--module=name]   # 别名：a
incspec a src/views/Home --module=home
incspec analyze src/views/Home --complete -o baselines/home-baseline-v1.md

# 步骤 2：收集结构化需求
incspec collect-req                             # 别名：cr
incspec cr --complete

# 步骤 3：收集 UI 依赖
incspec collect-dep                             # 别名：cd
incspec cd --complete

# 步骤 4：生成增量设计
incspec design [--feature=name]                 # 别名：d
incspec d --feature=user-auth --complete -o increments/auth-increment-v1.md

# 步骤 5：应用代码变更
incspec apply [increment-path]                  # 别名：ap
incspec ap --source-dir=src/ --complete

# 步骤 6：合并到基线
incspec merge [increment-path]                  # 别名：m
incspec m --complete -o baselines/home-baseline-v2.md
```

</details>

<details>
<summary><strong>管理命令</strong>（点击展开）</summary>

```bash
incspec list [type]       # 列出规范文件（别名：ls）
incspec list baselines    # 列出基线文件
incspec list -l           # 详细模式
incspec list -a           # 包含归档

incspec validate          # 验证规范完整性（别名：v）
incspec validate --strict # 严格模式，有错误时返回非零退出码

incspec archive                # 归档所有工作流产出（别名：ar）
incspec archive --workflow     # 同上，显式指定
incspec archive <file>         # 归档指定文件
incspec archive <file> --keep  # 复制而非移动
incspec archive -y             # 跳过确认提示
```

</details>

<details>
<summary><strong>命令别名</strong>（点击展开）</summary>

| 命令 | 别名 | 说明 |
|------|------|------|
| `analyze` | `a` | 步骤 1 |
| `collect-req` | `cr` | 步骤 2 |
| `collect-dep` | `cd` | 步骤 3 |
| `design` | `d` | 步骤 4 |
| `apply` | `ap` | 步骤 5 |
| `merge` | `m` | 步骤 6 |
| `archive` | `ar` | 步骤 7 |
| `status` | `st` | 状态 |
| `list` | `ls` | 列表 |
| `validate` | `v` | 验证 |
| `cursor-sync` | `cs` | 同步 |
| `update` | `up` | 更新 |
| `help` | `h` | 帮助 |

</details>

## IncSpec 对比

### vs. OpenSpec

| 特性 | incspec | OpenSpec |
|------|---------|----------|
| 工作流 | 6+1 步增量循环（含归档） | 3 阶段（proposal → apply → archive） |
| 侧重点 | 前端 API 流程分析 | 通用功能规范 |
| 编号系统 | S/D/N/C/R 多层编号 | 单一编号 |
| 代码生成 | 集成应用步骤 | 需手动编码 |
| 迭代管理 | 基线合并 + 归档，无缝循环 | 无明确迭代管理 |

**何时使用 incspec：** 修改具有复杂 API 流程、状态管理和组件依赖的现有前端代码库。

**何时使用 OpenSpec：** 从零开始定义新功能，特别是后端或全栈工作。

### vs. 无规范

没有规范时，AI 编程助手根据模糊提示生成代码，常常破坏现有功能或遗漏依赖。incspec 先捕获当前状态，确保变更基于对代码库的准确理解。

## 团队采用

1. **初始化 incspec** - 在仓库中运行 `incspec init`。
2. **从复杂变更开始** - 在修改包含大量 API 调用或依赖的代码时使用 incspec。
3. **增量构建基线** - 每个循环产出下一轮的基线。
4. **跨工具共享** - 团队成员可使用 Cursor、Claude Code 或任何 AGENTS.md 兼容工具。

运行 `incspec update` 将模板和代理指令刷新到最新版本。

## 更新 IncSpec

1. **拉取最新变更**
   ```bash
   cd ~/.claude/clis/incspec-cli
   git pull
   npm link
   ```
2. **刷新项目模板**
   ```bash
   incspec update
   ```

## 技术要求

- Node.js >= 18.0.0
- 无第三方依赖

## License

ISC
