# 结构化需求分析报告

## 1. 需求摘要

新增 `incspec reset` 命令 (别名 `rs`)，用于完全重置当前工作流状态，自动归档已有产出文件到 archives 目录，使用户能够快速从头开始新的工作流。

## 2. 结构化表格

| 新增/修改功能 | 涉及的文件/模块 | 触发条件 | 影响的核心状态 | 预期数据流向 |
| :--- | :--- | :--- | :--- | :--- |
| 新增 reset 命令完全重置工作流 | `commands/reset.mjs` (新增)<br>`index.mjs` (注册命令+别名 rs)<br>`commands/help.mjs` (更新帮助信息) | 用户执行 `incspec reset` 或 `incspec rs` | `WORKFLOW.md`: currentWorkflow → null, steps 状态清空 | CLI 解析 → readWorkflow() 获取产出列表 → archiveSpec() 归档到 archives/YYYY-MM/{module}/ → archiveWorkflow() 清空状态 |

## 3. 详细需求描述

### 3.1 功能定义

- **命令名称**: `reset`
- **命令别名**: `rs`
- **功能**: 完全重置当前工作流，回到无工作流状态

### 3.2 行为规范

1. **重置范围**: 完全重置，清空整个工作流状态
2. **产出处理**: 自动归档当前工作流产出文件到 `archives/YYYY-MM/{module}/`
3. **模块名提取**: 从工作流名称提取 (如 `analyze-incspec-cli` → `incspec-cli`)
4. **确认机制**: 直接执行，不需要用户确认
5. **归档范围**: 仅归档当前工作流产出的文件 (从 WORKFLOW.md 的 outputs 字段读取)

### 3.3 文件修改清单

| 文件 | 操作 | 说明 |
| :--- | :--- | :--- |
| `commands/reset.mjs` | 新增 | reset 命令实现 |
| `index.mjs` | 修改 | 注册 reset 命令和别名 rs |
| `commands/help.mjs` | 修改 | 添加 reset 命令帮助信息 |

### 3.4 依赖的核心库函数

| 函数 | 来源 | 用途 |
| :--- | :--- | :--- |
| `ensureInitialized()` | `lib/config.mjs` | 确保项目已初始化 |
| `readWorkflow()` | `lib/workflow.mjs` | 读取当前工作流状态 |
| `archiveWorkflow()` | `lib/workflow.mjs` | 归档并清空工作流 |
| `archiveSpec()` | `lib/spec.mjs` | 归档单个规范文件 |
| `print()`, `printSuccess()`, `printInfo()`, `printWarning()` | `lib/terminal.mjs` | 终端输出 |

### 3.5 预期输出示例

```
$ incspec reset

已归档 2 个产出文件到 archives/2025-12/incspec-cli/
  - incspec-cli-baseline-v1.md
  - structured-requirements.md
✓ 工作流已重置
```

若无活跃工作流:

```
$ incspec reset

ℹ 当前无活跃工作流，无需重置
```
