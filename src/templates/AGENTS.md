# IncSpec 使用指南

> **核心定位**: CLI 工具仅用于工作流状态的跟踪记录和流程串联。**每个步骤的具体执行内容**（如代码分析、需求收集、UI依赖收集、增量设计、应用代码等）**应由用户指定的 Agent（Cursor、Claude Code） 根据对应指令完成**。

AI 编码助手使用 IncSpec 进行增量规格驱动开发的操作指南。

## 快速检查清单

**完整模式 (FULL, 7步)**:
- 按顺序执行: analyze → collect-req → collect-dep → design → apply → merge → archive
- 适用于: 复杂 UI 功能、多组件交互、需要详细设计审查

**快速模式 (QUICK, 5步)**:
- 启动: `incspec analyze <path> --quick`
- 按顺序执行: 
  - 步骤1: analyze (代码分析)
  - 步骤2: collect-req (需求收集)
  - [跳过步骤3: UI依赖采集]
  - [跳过步骤4: 增量设计]
  - 步骤5: apply (应用代码)
  - 步骤6: merge (合并基线)
  - 步骤7: archive (归档)
- 适用于: Bug 修复、简单功能、不涉及复杂 UI 依赖的变更

**极简模式 (MINIMAL, 3步)**:
- 启动: `incspec analyze <path> --minimal`
- 按顺序执行:
  - 步骤1: analyze (代码分析)
  - [跳过步骤2: 需求收集]
  - [跳过步骤3: UI依赖采集]
  - [跳过步骤4: 增量设计]
  - 步骤5: apply (直接应用代码变更)
  - [跳过步骤6: 合并基线]
  - 步骤7: archive (归档，用户自行决定是否先合并基线)
- 适用于: 紧急 Bug 修复、单文件小改动、快速实验
- 注意: 归档时会提醒用户是否需要先生成新基线快照（可选运行 `incspec merge`）

**核心约定**:
- 初始化: `incspec init`
- 检查状态: `incspec status`
- 编号引用: `[S1]` 时序步骤, `[D1]` 依赖, `[C1]` 变更
- 增量标记: `[N1]` 新增, `[S1-Modified]` 修改, `[S1-Deleted]` 删除
- 验证时机: 完整/快速模式在步骤 1/4/6 后、归档前执行 `incspec validate`；极简模式在步骤 1 和归档前执行，若先执行 merge 则在合并后验证

## 七步工作流

```
完整模式:  [1分析] → [2需求] → [3UI依赖] → [4设计] → [5应用] → [6合并] → [7归档] → 循环
快速模式:  [1分析] → [2需求] ─(跳过3,4)─→ [5应用] → [6合并] → [7归档] → 循环
极简模式:  [1分析] ─(跳过2,3,4,6)─→ [5应用] → [7归档] → 循环
```

### 模式对比表

| 维度 | 完整模式 (FULL) | 快速模式 (QUICK) | 极简模式 (MINIMAL) |
|------|----------------|-----------------|-------------------|
| 步骤数 | 7 步 | 5 步 | 3 步 |
| 跳过步骤 | 无 | 步骤 3, 4 | 步骤 2, 3, 4, 6 |
| 需求收集 | ✓ 5 列结构化需求 | ✓ 5 列结构化需求 | ✗ 直接应用 |
| 增量设计 | ✓ 完整设计蓝图 | ✗ 直接应用 | ✗ 直接应用 |
| UI 依赖采集 | ✓ 6 维度分析 | ✗ 跳过 | ✗ 跳过 |
| 合并基线 | ✓ merge 命令 | ✓ merge 命令 | ✗ 可选（归档时提醒） |
| 适用场景 | 复杂功能、架构变更 | Bug 修复、简单功能 | 紧急修复、单文件改动 |
| 审批门禁 | 设计阶段 + 应用前 | 应用前 | 应用前 |

### 步骤 1: 分析代码工作流

**命令**: `incspec analyze <source-path> [--module=name] [--quick|--minimal] [--baseline=file]`

**选项**:
- `--quick`: 启动快速模式（跳过步骤 3, 4）
- `--minimal`: 启动极简模式（跳过步骤 2/3/4，步骤 6 可选）
- `--baseline=file`: 使用现有基线（跳过分析，直接进入步骤 2；极简模式直接进入 apply）

**目的**: 生成包含 API 调用时序图和依赖关系图的基线快照。

**输出**: `incspec/baselines/{module}-baseline-v{n}.md`

**交付物**: Mermaid 时序图 (`[S1]`-`[Sn]`)、依赖图 (`[D1]`-`[Dn]`)、依赖摘要 (`[R1.x]`-`[R3.x]`)

**验证**: 完成后执行 `incspec validate` 检查基线格式（必含时序图和依赖图）

### 步骤 2: 收集结构化需求

**命令**: `incspec collect-req [--force]` (别名: `cr`)

**目的**: 交互式需求收集,转换为 5 列格式。
**极简模式**: 跳过此步骤。

**输出**: `incspec/requirements/structured-requirements.md`

**5列格式**: 新增/修改功能 | 涉及的UI组件 | 触发条件 | 核心状态变更 | 预期数据流

### 步骤 3: 收集 UI 依赖

**命令**: `incspec collect-dep [--force]` (别名: `cd`)

**目的**: 映射新增/修改 UI 组件的所有上下文依赖。
**极简模式**: 跳过此步骤。

**输出**: `incspec/requirements/ui-dependencies.md`

**6个维度**: UI组件库 | 状态管理 | API集成 | 类型定义 | 工具函数 | 上下文/位置

### 步骤 4: 设计增量

**命令**: `incspec design [--feature=name] [--force]` (别名: `d`)

**目的**: 创建全面的增量设计蓝图。
**极简模式**: 跳过此步骤。

**输出**: `incspec/increments/{feature}-increment-v{n}.md`

**7个模块**:
1. 一句话摘要
2. 变更链设计表 (`[C1]`-`[Cn]`)
3. 规划的API调用时序图 (原始 `[S]` + 新增 `[N]` + 修改 `[S-Modified]` + 删除 `[S-Deleted]`)
4. 规划的依赖关系图 (原始 `[D]` + 新增 `[N]` + 修改 `[D_MOD]` + 删除 `[D_DEL]`)
5. 完整文件变更清单
6. 潜在风险与副作用
7. 建议的测试用例 (至少6个)

**验证**: 完成后执行 `incspec validate` 检查增量格式（必含5个模块章节）

### 步骤 5: 应用代码变更

**命令**: `incspec apply [increment-path] [--force]` (别名: `ap`)

**目的**: 根据增量蓝图执行代码生成和修改。

**执行顺序**: Types → Utils → APIs → Store → Components

**审批门禁**: 完整/快速模式需审批增量设计；极简模式在 apply 前确认改动范围。

### 步骤 6: 合并到基线

**命令**: `incspec merge [increment-path] [--force]` (别名: `m`)

**目的**: 将增量整合到新的基线快照中。
**极简模式**: 可选执行（通常在归档前按需生成新基线）。

**处理**: 移除增量标记 → 合并新节点 → 重新编号为干净序列 → 输出新基线 v{n+1}

**验证**: 完成后执行 `incspec validate` 检查新基线完整性

### 步骤 7: 归档工作流产出

**命令**: `incspec archive [--yes] [<file>] [--keep]`

**目的**: 将已完成的工作流产出归档到 `incspec/archives/YYYY-MM/{workflow}/`

**验证**: 归档前执行 `incspec validate` 确保项目健康。归档操作本身会验证文件移动正确性。

## 目录结构

```
incspec/
├── project.md              # 项目配置
├── WORKFLOW.md             # 工作流状态
├── AGENTS.md               # 本指南
├── baselines/              # 基线快照 (版本控制)
├── requirements/           # 需求与依赖
├── increments/             # 增量设计 (版本控制)
└── archives/               # 历史归档 (按月/工作流)
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

# 7步工作流 (支持三种模式)
incspec analyze <path> [--quick|--minimal] [--module=name] [--baseline=file]  # 步骤1
incspec collect-req / cr [--force]  # 步骤2 (--force 跳过前置检查，极简模式跳过)
incspec collect-dep / cd [--force]  # 步骤3 (快速/极简模式跳过)
incspec design / d [--feature=name] [--force]  # 步骤4 (快速/极简模式跳过)
incspec apply / ap [path] [--force] # 步骤5
incspec merge / m [path] [--force]  # 步骤6 (极简模式可选)
incspec archive [--yes] [--keep]    # 步骤7

# 模式管理
incspec upgrade <mode> / ug         # 升级工作流模式 (minimal → quick → full)

# 验证与同步
incspec validate / v [--strict]     # 验证完整性
incspec sync [--cursor|--claude|--all] [--global|--project]  # IDE集成
incspec reset                       # 完全重置工作流（归档所有产出）
incspec reset --to=<step>           # 部分回退到指定步骤（保留1-N，重置N+1至7）
```

### 模式升级

**命令**: `incspec upgrade <mode>`

**升级路径**: minimal → quick → full (只能从宽松到严格)

**用法示例**:
```bash
# 从极简模式升级到快速模式
incspec upgrade quick

# 从快速模式升级到完整模式
incspec upgrade full
```

**升级效果**:
- 极简 → 快速: 需补充步骤 2 (需求收集) 和步骤 6 (合并基线)
- 快速 → 完整: 需补充步骤 3 (UI依赖) 和步骤 4 (增量设计)
- 极简 → 完整: 需补充步骤 2 (需求收集)、步骤 3 (UI依赖)、步骤 4 (增量设计) 和步骤 6 (合并基线)

**注意事项**:
- 只有在活跃工作流中才能升级
- 升级后需按提示补充缺失的步骤
- 不支持降级（full → quick 或 quick → minimal）

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

**极简模式流程**:
1. 人类提供紧急修复需求 → AI 执行步骤 1 (分析) → AI 执行步骤 5 (直接应用) → AI 执行步骤 7 (归档，提醒是否合并基线) → 循环

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
| Previous step not completed | 运行 `incspec status` 检查进度，或添加 `--force` 跳过前置检查 |
| Validation failed | 检查文件格式和编号序列 |
| 工作流卡住或状态异常 | `incspec reset` 完全重置，或 `incspec reset --to=N` 回退到步骤N |

**前置步骤检查**:
- 步骤 2-6 执行前会自动检查前置步骤是否完成
- 若前置步骤未完成，命令会提示并阻止执行
- 添加 `--force` 可跳过此检查，强制执行当前步骤
**极简模式**:
- 默认仅要求步骤 1 完成后才允许执行 apply
- 若选择执行 merge，将在归档前补齐合并与验证

**工作流重置**:
- 完全重置: `incspec reset` - 归档所有产出，回到初始状态
- 部分回退: `incspec reset --to=N` - 保留步骤1-N，重置N+1至7（示例：`--to=3` 保留1-3，重置4-7）

记住: **基线是真相，增量是提案**。通过工作流周期保持它们同步。
