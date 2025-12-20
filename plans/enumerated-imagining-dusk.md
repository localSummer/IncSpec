# IncSpec CLI 快速模式实现计划

## 概述

为 IncSpec CLI 添加"快速模式"（5步流程），允许在简单任务中跳过 UI 依赖采集和增量设计步骤。

### 流程对比

| 步骤 | 完整模式 (7步) | 快速模式 (5步) |
|------|---------------|---------------|
| 1. analyze | 执行 | 执行 |
| 2. collect-req | 执行 | 执行 |
| 3. collect-dep | 执行 | **跳过** |
| 4. design | 执行 | **跳过** |
| 5. apply | 基于增量设计文件 | **基于需求文档** |
| 6. merge | 合并增量到基线 | **重新分析生成新基线** |

---

## 实现步骤

### Phase 1: 核心数据结构 (lib/workflow.mjs)

**修改内容:**

1. 添加模式常量:
```javascript
export const MODE = {
  FULL: 'full',
  QUICK: 'quick',
};

export const QUICK_MODE_STEPS = [1, 2, 5, 6];
export const QUICK_MODE_SKIPPED = [3, 4];
```

2. 扩展 STATUS 添加 SKIPPED 状态

3. 修改 `parseWorkflow()` 解析 mode 字段

4. 修改 `generateWorkflowContent()` 输出 mode 字段

5. 修改 `startWorkflow(projectRoot, name, options)` 接收 mode 参数，初始化时标记跳过的步骤

6. 添加辅助函数:
   - `isQuickMode(workflow)` - 检查是否快速模式
   - `getNextStep(currentStep, mode)` - 获取下一个有效步骤
   - `shouldSkipStep(stepNumber, mode)` - 检查步骤是否应跳过

7. 修改 `updateStep()` 使用 `getNextStep()` 计算下一步

8. 修改 `getWorkflowProgress()` 快速模式下 total=4

### Phase 2: 命令入口 (commands/analyze.mjs)

**修改内容:**

1. 解析 `--quick` / `-q` 选项

2. 调用 `startWorkflow()` 时传入 `{ mode: isQuick ? MODE.QUICK : MODE.FULL }`

3. 显示快速模式提示:
```
快速模式流程: 分析 -> 需求收集 -> 应用代码 -> 合并基线
(跳过 UI依赖采集 和 增量设计)
```

### Phase 3: 状态显示 (commands/status.mjs)

**修改内容:**

1. 显示工作流模式标签

2. 跳过的步骤显示 `[-]` 和灰色文字

3. 计算下一步时排除跳过的步骤

### Phase 4: 核心命令适配

#### commands/collect-req.mjs
- `--complete` 后快速模式提示跳到 Step 5

#### commands/apply.mjs
- 快速模式下使用 `structured-requirements.md` 作为输入
- 调整使用说明显示

#### commands/merge.mjs
- 快速模式下不查找增量文件
- 调整使用说明为"重新分析生成新基线"

### Phase 5: 归档适配 (commands/archive.mjs)

**修改内容:**

- `getArchivableStepIndexes(workflow)` 根据模式返回不同的可归档步骤列表

### Phase 6: 辅助更新

#### commands/help.mjs
- analyze 命令添加 `-q, --quick` 选项说明

#### templates/WORKFLOW.md
- 添加 `**工作流模式**: full` 字段

---

## 关键文件

| 文件 | 修改类型 | 优先级 |
|------|---------|--------|
| `lib/workflow.mjs` | 核心逻辑 | P0 |
| `commands/analyze.mjs` | 入口适配 | P0 |
| `commands/status.mjs` | 显示适配 | P1 |
| `commands/apply.mjs` | 输入适配 | P1 |
| `commands/merge.mjs` | 逻辑适配 | P1 |
| `commands/collect-req.mjs` | 提示适配 | P2 |
| `commands/archive.mjs` | 归档适配 | P2 |
| `commands/help.mjs` | 文档更新 | P2 |
| `templates/WORKFLOW.md` | 模板更新 | P2 |

---

## WORKFLOW.md 格式变更

```markdown
# Workflow Status

**当前工作流**: analyze-xxx
**当前步骤**: 2
**工作流模式**: quick   <-- 新增
**开始时间**: 2025-12-20 10:00
**最后更新**: 2025-12-20 10:30

## 步骤进度

| 步骤 | 状态 | 输出文件 | 完成时间 |
|------|------|---------|---------|
| 1. analyze-codeflow | completed | xxx-baseline-v1.md | ... |
| 2. collect-requirements | in_progress | - | - |
| 3. collect-dependencies | skipped | - | - |
| 4. design-increment | skipped | - | - |
| 5. apply-code | pending | - | - |
| 6. merge-baseline | pending | - | - |
```

---

## 用户交互示例

```bash
# 启动快速模式
$ incspec analyze src/views/Home --quick

  已创建新工作流: analyze-Home (快速模式: 5步)
  快速模式流程: 分析 -> 需求收集 -> 应用代码 -> 合并基线

# 查看状态
$ incspec status

  当前工作流: analyze-Home
  工作流模式: 快速模式 (5步)

  步骤进度:
    [x] 1. 代码流程分析        -> Home-baseline-v1.md
    [ ] 2. 结构化需求收集
    [-] 3. UI依赖采集          (已跳过)
    [-] 4. 增量设计            (已跳过)
    [ ] 5. 应用代码变更
    [ ] 6. 合并到基线
```

---

## 向后兼容性

- 默认仍为完整 7 步流程 (full mode)
- 现有工作流无 mode 字段时默认为 full
- 不影响现有命令和文件结构
- 模板文件保持原有功能，快速模式作为额外选项

---

## Phase 7: 模板文件修改

快速模式需要同步修改 Cursor 命令和 Claude Code Skill 模板，确保 AI 编码助手能正确识别和处理快速模式流程。

### 7.1 Cursor 命令模板 (templates/cursor-commands/)

#### analyze-codeflow.md
**修改内容:**
- CLI 同步部分添加 `--quick` 选项说明
- 添加快速模式使用示例

```markdown
## CLI 同步 (自动)

**启动快速模式工作流:**
```bash
incspec analyze <source-path> --module=<module> --quick
```

快速模式跳过步骤 3 (UI依赖采集) 和步骤 4 (增量设计)，直接从需求进入代码应用。
```

#### apply-increment-code.md
**修改内容:**
- 添加快速模式分支判断
- 快速模式下使用需求文档作为输入（而非增量设计文件）

```markdown
## CLI 同步 (自动)

**检测工作流模式:**
```bash
incspec status
```

若为快速模式 (mode: quick):
- 输入文件为 `incspec/requirements/structured-requirements.md`
- 不需要增量设计文件

**快速模式执行:**
```bash
incspec apply --complete
```

## 快速模式流程

快速模式下，无需解析增量设计报告的模块3/4/5，直接基于:
1. 步骤 1 的基线报告（理解现有代码结构）
2. 步骤 2 的需求文档（明确变更目标）

执行代码变更时:
1. 读取基线报告，理解当前代码架构
2. 读取需求文档，明确变更目标
3. 直接在源代码目录执行变更
4. 输出变更摘要
```

#### merge-to-baseline.md
**修改内容:**
- 添加快速模式分支逻辑
- 快速模式下重新分析代码生成基线（复用 analyze-codeflow 逻辑）

```markdown
## CLI 同步 (自动)

**检测工作流模式:**
```bash
incspec status
```

若为快速模式 (mode: quick):
- 不依赖增量设计报告
- 直接重新分析当前代码生成新基线

**快速模式执行:**
```bash
incspec merge --complete --output=<output-file>
```

## 快速模式流程

快速模式下，合并步骤实际是"重新分析":
1. 使用 analyze-codeflow 的分析方法
2. 分析当前代码状态（已应用变更后）
3. 生成新版本基线快照
4. 输出到 `incspec/baselines/{module}-baseline-v{n+1}.md`

本质上是执行步骤 1 的分析逻辑，但版本号递增。
```

#### structured-requirements-collection.md
**修改内容:**
- 在最终完成时添加快速模式提示

```markdown
## 快速模式提示

若当前工作流为快速模式，完成需求收集后输出:
> "✅ 结构化需求已收齐。快速模式下，直接运行 `incspec apply` 进入代码应用。"
```

### 7.2 Claude Code Skill 模板 (templates/inc-spec-skill/)

#### SKILL.md
**修改内容:**
- 添加快速模式工作流说明
- 更新快速开始和 CLI 集成表格

```markdown
## 快速开始

**完整模式 (7步):**
```
1. 分析现有代码    → incspec analyze <path>
2. 收集需求        → incspec collect-req
3. 收集依赖        → incspec collect-dep
4. 设计增量        → incspec design
5. 应用代码变更    → incspec apply
6. 合并到基线      → incspec merge
7. 归档工作流      → incspec archive --yes
```

**快速模式 (5步):**
```
1. 分析现有代码    → incspec analyze <path> --quick
2. 收集需求        → incspec collect-req
3. 应用代码变更    → incspec apply (基于需求文档)
4. 合并到基线      → incspec merge (重新分析生成)
5. 归档工作流      → incspec archive --yes
```

## 工作流概览

### 完整模式 (7步)
适用于复杂功能开发，需要完整的 UI 依赖分析和增量设计。

| 步骤 | 目的 | 产出 |
|------|------|------|
| 1. 代码流程分析 | 记录当前API/Store/组件交互 | 基线快照 |
| 2. 需求收集 | 将模糊需求转换为结构化5列表格 | 需求报告 |
| 3. 依赖收集 | 识别所有API/Store/类型依赖 | 依赖报告 |
| 4. 增量设计 | 生成实现蓝图 | 增量快照 |
| 5. 代码应用 | 按蓝图创建/修改文件 | 更新后的代码库 |
| 6. 基线合并 | 将增量转换为干净基线 | 新基线 |

### 快速模式 (5步)
适用于简单功能或不涉及复杂 UI 依赖的变更。

| 步骤 | 目的 | 产出 |
|------|------|------|
| 1. 代码流程分析 | 记录当前API/Store/组件交互 | 基线快照 |
| 2. 需求收集 | 将模糊需求转换为结构化5列表格 | 需求报告 |
| 5. 代码应用 | 基于需求直接创建/修改文件 | 更新后的代码库 |
| 6. 基线合并 | 重新分析生成新基线 | 新基线 |

**模式选择建议:**
- **完整模式**: 复杂 UI 功能、多组件交互、需要详细设计审查
- **快速模式**: Bug 修复、简单功能、不涉及 UI 依赖变更
```

#### references/ 目录
以下文件需要与 cursor-commands 保持同步:
- `apply-increment-code.md` - 添加快速模式流程
- `merge-to-baseline.md` - 添加快速模式流程

### 7.3 AGENTS.md (templates/AGENTS.md)

**修改内容:**
- 添加快速模式流程说明
- 更新命令快速参考

```markdown
## 快速检查清单

**完整模式 (7步):**
- 按顺序执行: analyze → collect-req → collect-dep → design → apply → merge

**快速模式 (5步):**
- 启动: `incspec analyze <path> --quick`
- 按顺序执行: analyze → collect-req → apply → merge
- 跳过步骤 3 (UI依赖) 和步骤 4 (增量设计)

## 七步工作流

### 概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      IncSpec 工作流模式                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   完整模式 (7步):                                                       │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│   │ 步骤 1   │    │ 步骤 2   │    │ 步骤 3   │                         │
│   │ 分析     │───▶│ 收集     │───▶│ 收集     │                         │
│   │ 代码流   │    │ 需求     │    │ UI依赖   │                         │
│   └──────────┘    └──────────┘    └──────────┘                         │
│        ▲                               │                                │
│        │                               ▼                                │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│   │ 步骤 6   │    │ 步骤 5   │    │ 步骤 4   │                         │
│   │ 合并到   │◀───│ 应用     │◀───│ 设计     │                         │
│   │ 基线     │    │ 代码     │    │ 增量     │                         │
│   └──────────┘    └──────────┘    └──────────┘                         │
│                                                                         │
│   快速模式 (5步):                                                       │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │ 步骤 1   │    │ 步骤 2   │    │ 步骤 5   │    │ 步骤 6   │         │
│   │ 分析     │───▶│ 收集     │───▶│ 应用     │───▶│ 合并到   │         │
│   │ 代码流   │    │ 需求     │    │ 代码     │    │ 基线     │         │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│   (跳过步骤 3 UI依赖采集 和 步骤 4 增量设计)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 步骤 1: 分析代码工作流

**命令**: `incspec analyze <source-path> [--module=name] [--quick] [--baseline=file]`

**选项**:
- `--quick`: 启动快速模式 (5步流程)
- `--baseline=<file>`: 使用现有基准报告
```

---

## 模板文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `templates/cursor-commands/analyze-codeflow.md` | 添加选项 | 添加 `--quick` 选项说明 |
| `templates/cursor-commands/apply-increment-code.md` | 添加分支 | 快速模式使用需求文档 |
| `templates/cursor-commands/merge-to-baseline.md` | 添加分支 | 快速模式重新分析 |
| `templates/cursor-commands/structured-requirements-collection.md` | 添加提示 | 快速模式下一步提示 |
| `templates/inc-spec-skill/SKILL.md` | 添加模式 | 快速模式工作流说明 |
| `templates/inc-spec-skill/references/analyze-codeflow.md` | 添加选项 | 与 cursor 同步 `--quick` 选项 |
| `templates/inc-spec-skill/references/apply-increment-code.md` | 添加分支 | 与 cursor 同步 |
| `templates/inc-spec-skill/references/merge-to-baseline.md` | 添加分支 | 与 cursor 同步 |
| `templates/inc-spec-skill/references/structured-requirements-collection.md` | 添加提示 | 与 cursor 同步快速模式提示 |
| `templates/AGENTS.md` | 添加模式 | 快速模式流程图和命令 |

---

## 注意事项

### CLI 输出与模板命令一致性

`commands/apply.mjs` 和 `commands/merge.mjs` 中的 Cursor 命令提示必须引用已存在的模板命令：

**正确做法:**
```javascript
// apply.mjs - 快速模式下复用同一命令
print(colorize(`  /incspec/inc-apply ${inputPath}`, colors.bold, colors.white));

// merge.mjs - 快速模式下复用同一命令
print(colorize(`  /incspec/inc-merge --output=${outputFile}`, colors.bold, colors.white));
```

**错误做法 (不要使用不存在的命令):**
```javascript
// 错误: inc-apply-quick 命令模板不存在
print(colorize(`  /incspec/inc-apply-quick ${inputPath}`, ...));

// 错误: inc-merge-quick 命令模板不存在
print(colorize(`  /incspec/inc-merge-quick --output=${outputFile}`, ...));
```

**原因:** 模板文件 `apply-increment-code.md` 和 `merge-to-baseline.md` 已内置快速模式判断逻辑，AI 编码助手会通过 `incspec status` 自动检测工作流模式并执行对应流程，无需创建独立的快速模式命令。

### 同名模板文件同步

`templates/cursor-commands/` 和 `templates/inc-spec-skill/references/` 目录下的同名文件必须保持内容一致：

| cursor-commands | inc-spec-skill/references | 说明 |
|-----------------|---------------------------|------|
| analyze-codeflow.md | analyze-codeflow.md | 必须同步 |
| apply-increment-code.md | apply-increment-code.md | 必须同步 |
| merge-to-baseline.md | merge-to-baseline.md | 必须同步 |
| structured-requirements-collection.md | structured-requirements-collection.md | 必须同步 |

修改任一目录下的文件时，务必同步更新另一目录下的同名文件。
