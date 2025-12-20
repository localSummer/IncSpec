---
name: inc-spec-skill
description: 设计优先的前端功能增量编码工作流。适用于实现新UI组件、修改现有功能，或当用户提及"增量编码"、"代码流程分析"、"需求收集"，以及需要带有API/Store依赖追踪的结构化功能开发时使用。
---

# AI增量编码

## 目录

- [快速开始](#快速开始)
- [工作流概览](#工作流概览)
- [CLI集成](#cli集成)
- [步骤详情](#步骤详情)
- [最佳实践](#最佳实践)
- [参考资源](#参考资源)

## 快速开始

**完整模式 (6步):**
```
1. 分析现有代码    → incspec analyze <path>
2. 收集需求        → incspec collect-req
3. 收集依赖        → incspec collect-dep
4. 设计增量        → incspec design
5. 应用代码变更    → incspec apply <report>
6. 合并到基线      → incspec merge <report>
7. 归档工作流      → incspec archive --yes
```

**快速模式 (3步):**
```
1. 分析现有代码    → incspec analyze <path> --quick
2. 收集需求        → incspec collect-req
3. 应用代码变更    → incspec apply (基于需求文档)
4. 合并到基线      → incspec merge (重新分析生成)
5. 归档工作流      → incspec archive --yes
```

首次使用前初始化: `incspec init`

## 工作流概览

### 完整模式 (6步)

适用于复杂功能开发，需要完整的 UI 依赖分析和增量设计。

| 步骤 | 目的 | 产出 |
|------|------|------|
| 1. 代码流程分析 | 记录当前API/Store/组件交互 | 基线快照 |
| 2. 需求收集 | 将模糊需求转换为结构化5列表格 | 需求报告 |
| 3. 依赖收集 | 识别所有API/Store/类型依赖 | 依赖报告 |
| 4. 增量设计 | 生成实现蓝图 | 增量快照 |
| 5. 代码应用 | 按蓝图创建/修改文件 | 更新后的代码库 |
| 6. 基线合并 | 将增量转换为干净基线 | 新基线 |
| 7. 归档 | 归档工作流产出到 `archives/YYYY-MM/` | 干净的工作区 |

### 快速模式 (3步)

适用于简单功能或不涉及复杂 UI 依赖的变更。

| 步骤 | 目的 | 产出 |
|------|------|------|
| 1. 代码流程分析 | 记录当前API/Store/组件交互 | 基线快照 |
| 2. 需求收集 | 将模糊需求转换为结构化5列表格 | 需求报告 |
| 5. 代码应用 | 基于需求直接创建/修改文件 | 更新后的代码库 |
| 6. 基线合并 | 重新分析生成新基线 | 新基线 |
| 7. 归档 | 归档工作流产出 | 干净的工作区 |

**模式选择建议:**
- **完整模式**: 复杂 UI 功能、多组件交互、需要详细设计审查
- **快速模式**: Bug 修复、简单功能、不涉及 UI 依赖变更

## CLI集成

每个步骤与 `incspec` CLI同步以跟踪工作流状态:

| 步骤 | 开始 | 完成 |
|------|------|------|
| 分析 | `incspec analyze <path> --module=<m>` 或 `--baseline=<file>` 或 `--quick` | `--complete --output=<file>` |
| 需求 | `incspec collect-req` | `--complete` |
| 依赖 | `incspec collect-dep` | `--complete` |
| 设计 | `incspec design --feature=<f>` | `--complete --output=<file>` |
| 应用 | `incspec apply <report>` | `--complete` |
| 合并 | `incspec merge <report>` | `--complete --output=<file>` |
| 归档 | `incspec archive --yes` | - |

管理命令:
- `incspec status` - 查看工作流状态
- `incspec list` - 列出规范文件
- `incspec validate` - 验证项目健康状态

## 步骤详情

### 步骤1: 代码流程分析

分析现有代码，创建API调用、依赖关系和组件交互的文档化基线。

**命令:** `incspec analyze <path> [--module=<m>] [--quick] [--baseline=<file>]`

**选项:**
- `--quick`: 启动快速模式 (3步流程)
- `--baseline=<file>`: 使用现有基准报告

**输入:** 源代码目录路径 (如 `src/pages/dashboard`) 或现有基线文件 (`--baseline=<file>`)

**输出:** 基线报告，包含:
- 编号的API调用序列图 (如 `[1]`、`[2]`)
- 组件/Store依赖关系图
- 数据流摘要

详见 [references/analyze-codeflow.md](references/analyze-codeflow.md)。

### 步骤2: 需求收集

将模糊的用户需求转换为严格的5列结构化表格，消除所有歧义术语。

**输入:** 用户的非正式需求描述

**输出:** 结构化表格，包含以下列:
1. 需求ID
2. 详细描述 (不含"某些"、"相关"等模糊术语)
3. 验收标准
4. 依赖项
5. 实现备注

详见 [references/structured-requirements-collection.md](references/structured-requirements-collection.md)。

### 步骤3: 依赖收集

在代码生成前识别所有上下文依赖。

**输入:** 步骤2的结构化需求

**输出:** 完整的依赖清单:
- **API:** 端点、方法、请求/响应类型
- **Store:** 模块、状态属性、actions
- **类型:** 现有和新增的TypeScript接口
- **组件:** 共享组件、工具函数

详见 [references/ui-dependency-collection.md](references/ui-dependency-collection.md)。

### 步骤4: 增量设计

基于当前状态、需求和依赖生成实现蓝图。**设计获批前不编写任何代码。**

**输入:** 基线(步骤1) + 需求(步骤2) + 依赖(步骤3)

**输出:** 增量快照，包含:
- 集成新调用的API序列图
- 文件修改计划 (新增/修改/删除)
- 分步实现指导

详见 [references/analyze-increment-codeflow.md](references/analyze-increment-codeflow.md)。

### 步骤5: 代码应用

通过创建新文件和修改现有文件执行增量蓝图。

**输入:** 步骤4的增量快照 + 源代码目录

**输出:** 修改后的代码库:
- 按蓝图创建的新文件
- 更新的现有文件
- 正确的导入和类型定义

详见 [references/apply-increment-code.md](references/apply-increment-code.md)。

### 步骤6: 基线合并

将增量快照(带有新增/修改/删除标记)转换为干净基线，为下次迭代做准备。

**输入:** 步骤4的增量快照

**输出:** 代表当前系统状态的干净基线(无增量标记)

详见 [references/merge-to-baseline.md](references/merge-to-baseline.md)。

### 步骤7: 归档

将已完成的工作流产出归档到 `archives/YYYY-MM/{module}/` 目录。

**输入:** 要归档的文件(可选，默认为当前工作流)

**操作:**
```bash
incspec archive --yes              # 归档所有工作流产出
incspec archive <file> --yes       # 归档指定文件
incspec archive <file> --keep      # 复制而非移动
```

详见 [references/inc-archive.md](references/inc-archive.md)。

## 最佳实践

**顺序执行:** 按步骤顺序执行。完整模式按 1-7 执行，快速模式按 1-2-5-6-7 执行。跳过步骤会导致集成问题。

**设计先于编码:** 完整模式下，步骤4设计获批前不编写任何代码。快速模式跳过设计步骤，适用于简单变更。

**不可跳过依赖:** 完整模式下，遗漏依赖(步骤3)是集成失败的首要原因。

**CLI同步:** 始终与 `incspec` CLI同步以保证工作流可追溯。

**模式选择:**
- 不确定时优先选择完整模式
- 仅在变更范围明确、不涉及复杂依赖时使用快速模式

**验证节点:**
- 步骤2后: 需求中无模糊术语
- 步骤4后 (完整模式): 编码前审查蓝图
- 步骤5后: 验证所有文件已正确创建/修改
- 步骤7后: 确认工作区已清理

## 常见陷阱

| 陷阱 | 后果 |
|------|------|
| 跳过代码流程分析 | 集成问题，返工 |
| 接受模糊需求 | 编码时发现歧义 |
| 遗漏依赖 | 导入错误，运行时失败 |
| 编码先于设计 | 在不符合架构的实现上浪费精力 |
| 跳过基线合并 | 对当前系统状态产生混淆 |
| 忽略归档 | 工作区杂乱，历史丢失 |

## 参考资源

| 文件 | 用途 |
|------|------|
| [analyze-codeflow.md](references/analyze-codeflow.md) | 代码流程分析和API序列图 |
| [structured-requirements-collection.md](references/structured-requirements-collection.md) | 5列需求结构化 |
| [ui-dependency-collection.md](references/ui-dependency-collection.md) | API/Store/类型依赖收集 |
| [analyze-increment-codeflow.md](references/analyze-increment-codeflow.md) | 设计优先的增量蓝图 |
| [apply-increment-code.md](references/apply-increment-code.md) | 基于蓝图的代码应用 |
| [merge-to-baseline.md](references/merge-to-baseline.md) | 增量到基线转换 |
| [inc-archive.md](references/inc-archive.md) | 工作流产出归档 |

## 使用示例

**任务:** 为产品仪表板添加筛选功能

```
步骤1: 分析产品仪表板代码流程
       → 记录当前数据获取、store结构、API端点

步骤2: 结构化筛选需求
       → 将"添加一些筛选器"转换为具体筛选类型(类别、价格、评分)
       → 定义确切行为和组合逻辑(AND/OR)

步骤3: 收集依赖
       → 识别筛选API端点、store扩展、共享筛选组件

步骤4: 生成增量蓝图
       → 规划FilterPanel集成、状态管理变更、文件修改

步骤5: 应用增量
       → 创建FilterPanel组件，修改ProductDashboard，更新store

步骤6: 合并到基线
       → 生成新仪表板状态的干净快照

步骤7: 归档
       → 归档工作流产出，为下次增量做准备(如添加排序功能)
```

## 开发工作流集成

- **版本控制:** 步骤7(完整周期)后提交
- **代码审查:** 在步骤4审查增量蓝图
- **测试:** 在步骤5添加测试
- **文档:** 在步骤6更新文档
