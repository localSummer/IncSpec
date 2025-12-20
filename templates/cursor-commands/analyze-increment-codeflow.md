---
description: 基于现状、需求和依赖,生成增量需求的设计蓝图(时序、依赖、文件变更),指导代码生成
argument-hint: [旧需求快照] [结构化需求] [UI依赖报告] [report-output-dir]
allowed-tools: Glob, Grep, Read, Write, Bash
---

## CLI 同步 (自动)

开始执行前，先用 Bash 执行:

```bash
incspec design --feature=<feature>
```

完成报告写入后，再用 Bash 执行:

```bash
incspec design --feature=<feature> --complete --output=<output-file>
```

说明:
- `<feature>` 可从基线文件名 `<feature>-baseline-vN.md` 推断，或使用当前工作流名称去掉 `analyze-` 前缀
- `<output-file>` 必须与最终写入的文件名一致
- 若 incspec 提示缺少输入文件，请先完成步骤 1-3

# 角色定位

你是前端增量架构师。执行 Design-First 策略,基于系统现状快照、结构化需求和依赖分析,规划并输出《增量需求融合快照》作为代码生成的精确蓝图。

# 输入材料

接收以下三份材料(由用户提供或从指定文件读取):

1. **旧需求快照**(来自 `analyze-codeflow`): 包含 S1~Sxx 时序编号、Dxx 依赖节点、Rxx 关系总结
2. **结构化需求描述**(来自 `structured-requirements-collection`): 包含新增/修改功能、触发条件、核心状态、数据流向的 5 列表格
3. **UI依赖采集报告**(来自 `ui-dependency-collection`): 包含依赖类型、来源路径、变更类型的依赖详情表

# 执行流程

## 步骤 1: 解析输入材料

读取并理解三份输入材料的完整内容,提取关键信息。

## 步骤 2: 推导变更逻辑

基于输入材料,分析增量变更的影响范围和实现路径。

## 步骤 3: 生成设计报告

按照下述 7 大模块结构生成完整的 Markdown 报告。

## 步骤 4: 写入文件

将报告写入 `<report-output-dir>/increment-codeflow-v2.md`(默认目录 `v6/docs/increment`)。

# 报告结构规范

生成的报告必须包含以下 7 大模块:

## 模块 1: 本次需求一句话摘要

用一句话概括本次增量需求的核心目标。

## 模块 2: 完整的变更链条设计表

这是代码生成的顶层指令表,将需求拆解为具体的原子变更点。

| 变更编号 | 类型 | 关联旧节点 | 新/修改后节点 | 变更逻辑说明 (Instruction) | 目标文件 (精确路径) | 风险 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C1 | 新增 | - | N1 | 基于 Table 组件新建 BatchActions 组件,实现批量操作 UI | src/components/BatchActions.tsx | 低 |
| C2 | 修改 | S12 | S12 → N2 | 在 API 响应处理逻辑中,解析并追加 `is_batchable` 字段 | src/store/listStore.ts | 高 |

**列说明**:
- **变更编号**: C1, C2...
- **类型**: 新增/修改/删除
- **关联旧节点**: 引用旧快照中的 Sxx (时序) 或 Dxx (依赖)
- **新/修改后节点**: 定义新的编号 Nx
- **变更逻辑说明**: 用技术语言描述具体操作(如"追加字段"、"新增 Effect"),足以指导 AI 生成代码
- **目标文件**: 精确的文件路径
- **风险**: 低/中/高

## 模块 3: 规划后的 API 调用时序图 (Mermaid sequenceDiagram)

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Store
    participant API

    Note over Component: [S1] 组件挂载
    Component->>Store: [S2] 初始化 state
    Store->>API: [S3] 请求列表数据
    API-->>Store: [S4] 返回数据
    
    rect rgba(144, 238, 144, 0.2)
        Note over User,Component: 🆕 [N1] 新增批量操作逻辑
        User->>Component: [N2] 勾选多项并点击批量操作
        Component->>Store: [N3] 触发批量操作 action
    end
    
    rect rgba(255, 200, 100, 0.2)
        Note over Store,API: ✏️ [S3-Modified] 批量接口调用(修改原有逻辑)
        Store->>API: [N4] 调用批量接口
        API-->>Store: [N5] 返回操作结果
    end
    
    rect rgba(144, 238, 144, 0.2)
        Note over Store,Component: 🆕 [N6] 新增UI状态更新
        Store->>Component: [N7] 更新批量操作结果
    end
```

**要求**:
- **保留原有流程**: 100% 保留原有 S1~Sxx 所有编号和完整流程
- **新增标识**: 使用绿色背景块 `rect rgba(144, 238, 144, 0.2)` + 🆕 标记新增步骤 `[N1]`, `[N2]`...
- **修改标识**: 使用橙色背景块 `rect rgba(255, 200, 100, 0.2)` + ✏️ 标记修改步骤,原编号后加 `-Modified` 如 `[S3-Modified]`
- **删除标识**: 使用红色背景块 `rect rgba(255, 100, 100, 0.2)` + ❌ 标记删除步骤 `[S5-Deleted]`,并用删除线标注
- **链路完整性**: 确保变更链路从触发点到最终响应的所有步骤都被高亮覆盖
- **目的**: 明确新代码在运行时序中的精确插入点和修改范围,便于 AI 准确定位变更位置

## 模块 4: 规划后的依赖关系图 (Mermaid graph TD)

```mermaid
graph TD
    %% 原有依赖节点
    D1[API Layer]
    D2[Store Layer]
    D3[Component Layer]
    D4[Utils Layer]
    
    %% 新增依赖节点
    N1["🆕 BatchActions 组件<br/>(新增)"]
    N2["🆕 BatchAPI 模块<br/>(新增)"]
    
    %% 修改的依赖节点
    D2_MOD["✏️ Store Layer<br/>(已修改)"]
    
    %% 删除的依赖节点(用于标注)
    D5_DEL["❌ OldHelper<br/>(已删除)"]
    
    %% 原有依赖关系(保持不变) - 索引 0,1,2
    D1 --> D2
    D2 --> D3
    D4 --> D2
    
    %% 新增依赖关系 - 索引 3,4,5
    N1 -.->|新增依赖| D2_MOD
    N2 -.->|新增依赖| D1
    D2_MOD -.->|新增依赖| N2
    
    %% 修改后的依赖关系 - 索引 6
    D2_MOD ==>|修改后| D3
    
    %% 删除的依赖关系 - 索引 7
    D5_DEL -.->|已移除| D2
    
    %% 样式定义
    classDef newNode fill:#90EE90,stroke:#2E7D32,stroke-width:3px,color:#000
    classDef modifiedNode fill:#FFE082,stroke:#F57C00,stroke-width:3px,color:#000
    classDef deletedNode fill:#FFCDD2,stroke:#C62828,stroke-width:2px,stroke-dasharray:5 5,color:#666
    classDef originalNode fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000
    
    %% 应用样式
    class N1,N2 newNode
    class D2_MOD modifiedNode
    class D5_DEL deletedNode
    class D1,D2,D3,D4 originalNode
    
    %% 链接样式(索引从0开始)
    linkStyle 3,4,5 stroke:#4CAF50,stroke-width:2px,stroke-dasharray:5 5
    linkStyle 6 stroke:#FF9800,stroke-width:3px
    linkStyle 7 stroke:#F44336,stroke-width:2px,stroke-dasharray:5 5
```

**要求**:
- **保留原有节点**: 所有 D1~Dxx 节点必须保留,使用 `originalNode` 样式(浅蓝填充+蓝色边框)
- **新增节点标识**: 新节点标记为 `N1`, `N2`...,加 🆕 前缀,使用 `newNode` 样式(绿色填充+深绿边框)
- **修改节点标识**: 修改的节点在原编号后加 `_MOD`,加 ✏️ 前缀和 `(已修改)` 文案,使用 `modifiedNode` 样式(黄色填充+橙色边框)
- **删除节点标识**: 删除的节点在原编号后加 `_DEL`,加 ❌ 前缀和 `(已删除)` 文案,使用 `deletedNode` 样式(红色填充+红色虚线边框)
- **依赖关系箭头语法**:
  - 新增依赖: `-.->|新增依赖|` (虚线箭头+文字标签)
  - 修改依赖: `==>|修改后|` (粗实线箭头+文字标签)
  - 删除依赖: `-.->|已移除|` (虚线箭头+文字标签)
  - 原有依赖: `-->` (普通实线箭头)
- **链接样式配置**: 使用 `linkStyle` 按索引设置箭头颜色和样式
  - 新增依赖链接: 绿色虚线 `stroke:#4CAF50,stroke-width:2px,stroke-dasharray:5 5`
  - 修改依赖链接: 橙色粗线 `stroke:#FF9800,stroke-width:3px`
  - 删除依赖链接: 红色虚线 `stroke:#F44336,stroke-width:2px,stroke-dasharray:5 5`
- **索引计数规则**: linkStyle 索引从 0 开始,按箭头声明顺序计数,必须在注释中标注索引范围避免错误
- **样式优先级**: 使用 `classDef` 定义样式类,用 `class` 应用,避免 `style` 单独定义造成的覆盖问题
- **链路完整性**: 确保所有变更节点及其上下游依赖关系都被标识出来,形成完整的变更链路
- **目的**: 确保新代码引入的依赖关系符合架构规范,无循环依赖,AI 能清晰识别需要修改的依赖链路

## 模块 5: 完整的新增/修改文件清单

| 操作 | 文件路径 | 详细修改内容 (Code Spec) |
| :--- | :--- | :--- |
| 新建 | src/components/BatchActions.tsx | 1. 引入 Button; 2. 接收 `selectedIds` prop; 3. 点击触发 `onBatchDelete` |
| 修改 | src/store/listStore.ts | 1. State 新增 `batchStatus`; 2. Action 新增 `executeBatchDelete` 调用 API |

**要求**: 精确到文件路径,并说明具体的修改内容。

## 模块 6: 潜在副作用与风险预警

逐条列出,带 `[ ]` 复选框:

- [ ] 是否会影响其他页面/组件复用同一接口或 Store?
- [ ] 新增字段在旧数据缓存中是否会导致 undefined / 类型错误?
- [ ] 错误处理链路是否覆盖新逻辑?
- [ ] 权限控制是否需要补充?

## 模块 7: 建议的测试用例

至少 6 条,覆盖主路径 + 异常 + 边界:

1. 正常批量操作流程
2. 部分操作失败场景
3. 网络异常处理
4. 权限不足提示
5. 空选择状态
6. 最大批量数限制

# 输出配置

- **report-output-dir**: 报告输出目录,默认 `incspec/increments`
- **文件命名**: `{feature}-increment-v{n}.md`
  - `{feature}`: 功能名称,从旧需求快照文件名推断或由用户指定
  - `{n}`: 版本号,扫描目标目录中同名前缀的文件,取最大版本号+1,若无则为 1
- **示例**: 功能名称为 `batch-operation`,输出 `incspec/increments/batch-operation-increment-v1.md`
- **目录创建**: 如目录不存在,需主动创建

# 输出要求

1. **静默输出**: 禁止在对话中输出完整的 Markdown 报告内容
2. **文件写入**: 必须将完整报告(包含所有 7 大模块)直接写入文件
3. **内容格式**: 写入文件的内容必须包含标题 `# 增量需求融合快照`
4. **完成提示**: 文件写入完成后,仅在对话中回复:
   > "✅ 增量需求融合快照 已生成并写入文件。请审核报告,确认无误后,请指示开始代码生成。"

# 执行约束

- **禁止修改业务代码**: 本次会话中,绝对禁止直接修改、创建或删除任何业务代码文件(如 `src/` 下的文件)
- **设计而非实施**: 你是在设计代码,而不是编写代码。确保设计方案在逻辑上是通的(例如: 先有 Store 定义,再有组件调用)
- **引用一致性**: 所有的 Nxx 编号在表格、时序图、依赖图中必须含义一致
- **输出纯粹**: 不添加任何多余的解释或开场白,直接输出结果
