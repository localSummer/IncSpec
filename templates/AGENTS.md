# IncSpec 使用指南

AI 编码助手使用 IncSpec 进行增量规格驱动开发的操作指南。

## 快速检查清单

**完整模式 (7步)**:
- 按顺序执行: analyze → collect-req → collect-dep → design → apply → merge → archive
- 适用于: 复杂 UI 功能、多组件交互、需要详细设计审查

**快速模式 (5步)**:
- 启动: `incspec analyze <path> --quick`
- 按顺序执行: analyze → collect-req → apply → merge → archive
- 跳过步骤 3 (UI依赖采集) 和步骤 4 (增量设计)
- 适用于: Bug 修复、简单功能、不涉及复杂 UI 依赖的变更

**核心约定**:
- 初始化: `incspec init`
- 检查状态: `incspec status`
- 编号引用: `[S1]` 时序步骤, `[D1]` 依赖, `[C1]` 变更
- 增量标记: `[N1]` 新增, `[S1-Modified]` 修改, `[S1-Deleted]` 删除
- 继续前验证: `incspec validate --strict`

## 七步工作流

```
完整模式:  [1分析] → [2需求] → [3UI依赖] → [4设计] → [5应用] → [6合并] → [7归档] → 循环
快速模式:  [1分析] → [2需求] ─────────────────────→ [5应用] → [6合并] → [7归档] → 循环
```

### 步骤 1: 分析代码工作流

**命令**: `incspec analyze <source-path> [--module=name] [--quick] [--baseline=file]`

**目的**: 生成包含 API 调用时序图和依赖关系图的基线快照。

**输出**: `incspec/baselines/{module}-baseline-v{n}.md`

**交付物**: Mermaid 时序图 (`[S1]`-`[Sn]`)、依赖图 (`[D1]`-`[Dn]`)、依赖摘要 (`[R1.x]`-`[R3.x]`)

### 步骤 2: 收集结构化需求

**命令**: `incspec collect-req` (别名: `cr`)

**目的**: 交互式需求收集,转换为 5 列格式。

**输出**: `incspec/requirements/structured-requirements.md`

**5列格式**: 新增/修改功能 | 涉及的UI组件 | 触发条件 | 核心状态变更 | 预期数据流

### 步骤 3: 收集 UI 依赖

**命令**: `incspec collect-dep` (别名: `cd`)

**目的**: 映射新增/修改 UI 组件的所有上下文依赖。

**输出**: `incspec/requirements/ui-dependencies.md`

**6个维度**: UI组件库 | 状态管理 | API集成 | 类型定义 | 工具函数 | 上下文/位置

### 步骤 4: 设计增量

**命令**: `incspec design [--feature=name]` (别名: `d`)

**目的**: 创建全面的增量设计蓝图。

**输出**: `incspec/increments/{feature}-increment-v{n}.md`

**7个模块**:
1. 一句话摘要
2. 变更链设计表 (`[C1]`-`[Cn]`)
3. 规划的API调用时序图 (原始 `[S]` + 新增 `[N]` + 修改 `[S-Modified]` + 删除 `[S-Deleted]`)
4. 规划的依赖关系图 (原始 `[D]` + 新增 `[N]` + 修改 `[D_MOD]` + 删除 `[D_DEL]`)
5. 完整文件变更清单
6. 潜在风险与副作用
7. 建议的测试用例 (至少6个)

### 步骤 5: 应用代码变更

**命令**: `incspec apply [increment-path]` (别名: `ap`)

**目的**: 根据增量蓝图执行代码生成和修改。

**执行顺序**: Types → Utils → APIs → Store → Components

**审批门禁**: 增量设计必须经过审查批准后才能执行。

### 步骤 6: 合并到基线

**命令**: `incspec merge [increment-path]` (别名: `m`)

**目的**: 将增量整合到新的基线快照中。

**处理**: 移除增量标记 → 合并新节点 → 重新编号为干净序列 → 输出新基线 v{n+1}

### 步骤 7: 归档工作流产出

**命令**: `incspec archive [--yes] [<file>] [--keep]`

**目的**: 将已完成的工作流产出归档到 `incspec/archives/YYYY-MM/{module}/`

## 目录结构

```
incspec/
├── project.md              # 项目配置
├── WORKFLOW.md             # 工作流状态
├── AGENTS.md               # 本指南
├── baselines/              # 基线快照 (版本控制)
├── requirements/           # 需求与依赖
├── increments/             # 增量设计 (版本控制)
└── archives/               # 历史归档 (按月/模块)
```

## 编号系统

| 类型 | 原始 | 新增 | 修改 | 删除 |
|------|------|------|------|------|
| 时序 | `[S1]` | `[N1]` | `[S1-Modified]` | `[S1-Deleted]` |
| 依赖 | `[D1]` | `[N1]` | `[D1_MOD]` | `[D1_DEL]` |
| 变更 | `[C1]` | - | - | - |
| 关系 | `[R1.x]` 串行, `[R2.x]` 并行, `[R3.x]` 条件 |

## CLI 命令

```bash
# 初始化与状态
incspec init [--force]              # 初始化项目
incspec status / st                 # 查看工作流状态
incspec list / ls [-l] [-a]         # 列出规格文件

# 7步工作流
incspec analyze <path> [--quick] [--module=name] [--baseline=file]  # 步骤1
incspec collect-req / cr            # 步骤2
incspec collect-dep / cd            # 步骤3 (快速模式跳过)
incspec design / d [--feature=name] # 步骤4 (快速模式跳过)
incspec apply / ap [path]           # 步骤5
incspec merge / m [path]            # 步骤6
incspec archive [--yes] [--keep]    # 步骤7

# 验证与同步
incspec validate / v [--strict]     # 验证完整性
incspec sync [--cursor|--claude|--all] [--global|--project]  # IDE集成
incspec reset [--to=<step>]         # 重置工作流（可选回退到指定步骤 1-6）
```

## 文件格式示例

### 基线文件

```markdown
---
module: home
version: 1
source_path: src/pages/Home
---

# Home 基线 v1

## API 调用时序图
sequenceDiagram (Mermaid): User → Component → Store → API 的 [S1]-[Sn] 编号调用

## 依赖关系图
graph TD (Mermaid): [D1]-[Dn] 编号的组件依赖关系

## 依赖摘要
| ID | 类型 | 关系 | 描述 |
| R1.1 | 串行 | S1 → S2 | 顺序调用 |
| R2.1 | 并行 | S3 ∥ S4 | 并发调用 |
```

### 增量文件

```markdown
---
feature: batch-operation
baseline: home-baseline-v1
---

# Batch-operation 增量 v1

## 1. 一句话摘要
## 2. 变更链设计表 ([C1]-[Cn])
## 3. 规划的API调用时序图 (原始[S] + [N]新增 + [S-Modified] + [S-Deleted])
## 4. 规划的依赖关系图 (原始[D] + [N]新增 + [D_MOD] + [D_DEL])
## 5. 完整文件变更清单 (create/modify/delete + 路径)
## 6. 潜在风险与副作用
## 7. 建议的测试用例 (至少6个)
```

## 与AI助手集成

**完整模式流程**:
1. 人类提供需求 → AI 执行步骤 1-4 → 人类审批设计 → AI 执行步骤 5-7 → 循环

**快速模式流程**:
1. 人类提供简单需求 → AI 执行步骤 1-2 → 人类审批 → AI 执行步骤 5-7 → 循环

**核心原则**:
- 增量优于大爆炸 - 小的、经过验证的变更
- 规格驱动 - 需求先于代码
- 可追溯 - 每个变更关联到需求
- 可逆转 - 基线提供回滚点

## 故障排除

| 错误 | 解决方案 |
|------|----------|
| Workflow not initialized | 运行 `incspec init` |
| No baseline found | 先完成步骤 1 (analyze) |
| Previous step not completed | 运行 `incspec status` 检查进度 |
| Validation failed | 检查文件格式和编号序列 |
| 工作流卡住 | 运行 `incspec reset` 重置状态 |

记住: **基线是真相，增量是提案**。通过工作流周期保持它们同步。
