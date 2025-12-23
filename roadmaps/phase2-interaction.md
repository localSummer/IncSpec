# 阶段 2: 交互体验增强

> v0.4.x - v0.5.x | 预计 2-3 个月

## 阶段背景

在完成阶段 1A（核心差异化与极简模式）和阶段 1B（AI 工具生态扩展）后，IncSpec 已具备核心竞争力和广泛的 AI 工具支持。本阶段聚焦于提升整体交互体验，让用户更高效地使用这些能力。

## 重要补充：最小可观测性与依赖策略（P0）

为确保阶段 1 的目标“可验证、可监控”，并为后续阶段（推荐引擎、CI 校验、体验指标）提供数据基础，本阶段前置以下两项跨任务能力：

### 1) 最小可观测性（默认本地，不做远程上报）
- 记录命令级事件：命令名、开始/结束时间、耗时、成功/失败、错误码（如有）
- 记录工作流关键事件：workflow 开始/结束、step 状态变更（pending/in_progress/completed/skipped）
- 提供最小统计输出入口（例如通过 `incspec history --stats` 或后续统一 `incspec report`）
- 必须提供关闭开关（例如 `--no-telemetry` 或配置项），避免隐私争议

> 注：初期只要求本地落地与可导出（例如 `--json`），不要求联网上报。

#### 统一事件 Schema（跨阶段复用）

为确保阶段 1、3、4 的可观测性数据一致性，定义统一的事件格式：

```typescript
// lib/telemetry/event-schema.d.ts

/** 命令级事件 */
interface CommandEvent {
  eventType: 'command';
  commandName: string;
  commandAlias?: string;
  args: string[];
  options: Record<string, any>;
  startTime: string; // ISO 8601
  endTime: string;
  duration: number; // 毫秒
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/** 工作流级事件 */
interface WorkflowEvent {
  eventType: 'workflow';
  workflowId: string;
  workflowName: string;
  mode: 'full' | 'quick' | 'minimal';
  action: 'start' | 'complete' | 'abort';
  timestamp: string; // ISO 8601
  // 扩展字段（阶段 3 使用）
  metrics?: {
    filesAnalyzed?: number;
    linesOfCode?: number;
    testsGenerated?: number;
    issuesFound?: number;
  };
}

/** 步骤级事件 */
interface StepEvent {
  eventType: 'step';
  workflowId: string;
  stepId: number;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  timestamp: string; // ISO 8601
  duration?: number; // 毫秒（完成时才有）
  files?: string[]; // 产出文件列表（可选）
}

/** 事件存储格式 */
interface EventLog {
  version: '1.0';
  events: (CommandEvent | WorkflowEvent | StepEvent)[];
}
```

**存储位置**: `incspec/.events.jsonl`（每行一个 JSON 事件，便于追加和解析）

**实现要求**:
- 阶段 2：实现基础的 `CommandEvent` 和 `StepEvent` 记录
- 阶段 4：扩展 `WorkflowEvent` 的 `metrics` 字段，用于历史分析和推荐
- 阶段 5：基于此格式构建可观测性平台

**导出接口**:
```bash
incspec telemetry --export=json  # 导出为结构化 JSON
incspec telemetry --stats         # 显示统计摘要
incspec telemetry --clear         # 清空事件日志
```

### 2) dashboard 依赖策略（双轨：无依赖可用 + 可选增强）
- P0：保证在不引入第三方依赖的情况下，提供纯文本 dashboard（ASCII/表格/颜色），可覆盖 80% 使用场景
- P1：若引入第三方依赖可显著提升体验（交互/TUI 渲染），允许引入 1 个成熟 TUI 库，但必须：
  - 记录引入原因、许可证、替代方案与降级路径
  - 在不支持的终端或禁用开关下回落到纯文本模式（不可用则视为不通过发版门禁）

## 与前置阶段的关系

本阶段依赖阶段 1A 和 1B 的成果：

- **阶段 1A 成果**：极简模式、基线差异分析、破坏性变更检测
- **阶段 1B 成果**：5+ AI 工具支持、统一适配层接口

本阶段将在这些基础上：
- 为极简/快速/完整模式提供交互式向导
- 增强差异分析的可视化展示
- 优化多 AI 工具的配置体验

## 阶段目标

显著提升命令行交互体验，降低学习成本，让新用户能够快速上手并高效使用 IncSpec。

## 核心问题

当前版本的交互体验痛点：
- 用户需要记忆大量命令和参数
- 错误信息不够友好，缺乏修复建议
- 工作流状态不直观，难以追踪进度
- 仅支持中文，国际化受限

## 关键成果

### 1. 交互式工作流向导
- 新用户引导模式
- 智能参数收集
- 上下文感知提示

### 2. 智能命令建议和错误恢复
- 命令拼写纠错
- 智能命令补全
- 错误分析和修复建议

### 3. 工作流可视化
- 进度仪表盘（优先纯文本，必要时可选 TUI 增强）
- 依赖关系图
- 实时状态监控（watch 模式）


### 4. 多语言国际化
- 英文支持
- 可扩展的语言包
- 自动语言检测

## 详细任务

### 里程碑 1: 交互式向导系统 (v0.3.0)

**优先级**: P0 (必须完成)

#### 任务 1.1: 新用户引导流程

**目标**: 让新用户在 5 分钟内完成首次工作流

**实现内容**:
```bash
# 新增命令: incspec wizard
incspec wizard              # 启动交互式向导
incspec wizard --quick      # 快速模式向导
incspec wizard --resume     # 恢复中断的向导
```

**向导流程**:
1. 检测项目是否已初始化
   - 未初始化 → 引导执行 `init`
   - 已初始化 → 检查工作流状态
2. 工作流状态检测
   - 无活跃工作流 → 引导启动新工作流
   - 有未完成工作流 → 询问继续或重置
3. 逐步参数收集
   - 使用智能提示和默认值
   - 实时验证输入有效性
4. 执行命令并显示结果
   - 显示执行过程
   - 提供下一步建议

**技术实现**:
- 在 `commands/` 下新增 `wizard.mjs`
- 使用 `lib/terminal.mjs` 的交互函数
- 状态持久化到 `incspec/.wizard-state.json`

**验收标准**:
- [ ] 新用户能在 5 分钟内完成首次完整工作流
- [ ] 向导可以中断和恢复
- [ ] 所有输入都有默认值和验证

---

#### 任务 1.2: 智能参数收集

**目标**: 减少手动输入，智能推断常用参数

**实现内容**:
- 模块名自动推断（基于文件路径）
- 功能名智能建议（基于需求文档）
- 源码目录自动检测（检测 `src/`, `app/`, `components/` 等）
- 输出路径智能生成（基于版本号和模块名）

**技术实现**:
```javascript
// lib/smart-params.mjs
export function inferModuleName(sourcePath) {
  // 从路径推断: src/views/Home/index.tsx -> home
  // 从路径推断: components/UserProfile.tsx -> user-profile
}

export function suggestFeatureName(requirementsPath) {
  // 解析需求文档，提取关键词
  // 生成简短、有意义的功能名
}

export function detectSourceDir(projectRoot) {
  // 检测常见源码目录
  // 优先级: src/ > app/ > components/ > lib/
}
```

**验收标准**:
- [ ] 80% 的场景下无需手动指定模块名
- [ ] 源码目录自动检测准确率 > 90%
- [ ] 参数推断错误时可手动覆盖

---

#### 任务 1.3: 上下文感知提示

**目标**: 根据工作流状态提供智能提示

**实现内容**:
```bash
# 示例输出
$ incspec

IncSpec v0.3.0 - 增量规范驱动开发工具

当前状态:
  工作流: analyze-home-page (完整模式)
  进度: 步骤 3/7 已完成
  下一步: incspec design --feature=search-filter

可用命令:
  incspec design      # 执行步骤 4: 增量设计 (推荐)
  incspec status      # 查看详细状态
  incspec reset       # 重置当前工作流

提示: 使用 'incspec wizard' 启动交互式向导
```

**技术实现**:
- 增强 `commands/help.mjs`，添加上下文感知
- 读取 `WORKFLOW.md` 状态
- 根据当前步骤提供下一步建议

**验收标准**:
- [ ] 运行 `incspec` 显示上下文信息
- [ ] 提示内容与工作流状态一致
- [ ] 包含可执行的命令示例

---

### 里程碑 2: 智能建议和错误恢复 (v0.3.5)

**优先级**: P0 (必须完成)

#### 里程碑 2 补充（P0）：最小可观测性落地
**目标**：让“错误率降低、上手时间缩短、工作流完成率提升”等指标可被量化验证，并支撑后续推荐引擎与 CI 校验。

**最小要求**：
- [ ] 记录命令执行事件（耗时/成功失败/错误码）
- [ ] 记录工作流 step 状态变更事件
- [ ] 提供最小统计汇总入口（例如 `--stats` 或导出 JSON）
- [ ] 支持关闭开关（默认本地；不做远程上报）


#### 任务 2.1: 命令拼写纠错

**目标**: 容忍拼写错误，提供智能建议

**实现内容**:
```bash
# 错误输入
$ incspec anlyze src/

未找到命令 'anlyze'。您是否想执行:
  incspec analyze src/

输入 'y' 执行建议命令，或 'n' 取消: _
```

**技术实现**:
```javascript
// lib/spell-checker.mjs
import { distance } from './levenshtein.mjs';

export function findSimilarCommand(input, commands) {
  // 计算编辑距离
  // 返回最相似的命令（距离 < 3）
}
```

**验收标准**:
- [ ] 识别常见拼写错误（如 anlyze → analyze）
- [ ] 提供最多 3 个建议命令
- [ ] 可一键执行建议命令

---

#### 任务 2.2: 智能命令补全

**目标**: 提供 Shell 自动补全脚本

**实现内容**:
```bash
# 生成补全脚本
incspec completion bash > /etc/bash_completion.d/incspec
incspec completion zsh > ~/.zsh/completion/_incspec
incspec completion fish > ~/.config/fish/completions/incspec.fish
```

**技术实现**:
- 新增 `commands/completion.mjs`
- 生成各 Shell 的补全脚本
- 支持命令、选项、文件路径补全

**验收标准**:
- [ ] 支持 bash, zsh, fish
- [ ] 补全命令和选项
- [ ] 补全文件路径（如 baseline 文件）

---

#### 任务 2.3: 错误分析和修复建议

**目标**: 将错误信息转化为可操作的修复建议

**实现内容**:
```bash
# 错误示例
$ incspec collect-dep

Error: 请先完成步骤 1 (代码流程分析) 后再继续。

修复建议:
  1. 运行 'incspec analyze src/views/Home' 分析代码流程
  2. 或使用 'incspec wizard' 启动交互式向导
  3. 如需强制执行，添加 --force 选项

相关文档:
  https://github.com/localSummer/IncSpec#workflow
```

**技术实现**:
```javascript
// lib/error-handler.mjs
export class IncSpecError extends Error {
  constructor(message, { suggestions = [], docsUrl = null } = {}) {
    super(message);
    this.suggestions = suggestions;
    this.docsUrl = docsUrl;
  }
}

export function formatError(error) {
  // 格式化错误信息
  // 显示修复建议和文档链接
}
```

**验收标准**:
- [ ] 所有错误都有至少 1 条修复建议
- [ ] 提供相关文档链接
- [ ] 建议可直接复制执行

---

### 里程碑 3: 可视化和监控 (v0.4.0)

**优先级**: P1 (重要)

#### 任务 3.1: 进度仪表盘

**目标**: 直观展示工作流进度和状态

**实现内容**:
```bash
$ incspec dashboard

┌─────────────────────────────────────────────────────────────┐
│  IncSpec Dashboard - analyze-home-page (完整模式)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  进度: ████████████░░░░░░░░  57% (4/7)                      │
│                                                             │
│  ✓ 步骤 1: 代码流程分析      已完成  2024-12-20 10:30      │
│  ✓ 步骤 2: 结构化需求收集    已完成  2024-12-20 11:15      │
│  ✓ 步骤 3: UI依赖采集        已完成  2024-12-20 14:20      │
│  ✓ 步骤 4: 增量设计          已完成  2024-12-20 16:45      │
│  ⧗ 步骤 5: 应用代码变更      进行中  开始于 17:10          │
│  ○ 步骤 6: 合并到基线        待执行                         │
│  ○ 步骤 7: 归档工作流产出    待执行                         │
│                                                             │
│  预计剩余时间: ~1.5 小时                                    │
│                                                             │
│  产出文件:                                                  │
│    baselines/home-baseline-v1.md           (12.3 KB)       │
│    requirements/structured-requirements.md  (8.5 KB)       │
│    requirements/ui-dependencies.md          (6.2 KB)       │
│    increments/search-filter-increment-v1.md (15.8 KB)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  按 'r' 刷新 | 按 'q' 退出 | 按 'h' 帮助                    │
└─────────────────────────────────────────────────────────────┘
```

**技术实现**:
- 新增 `commands/dashboard.mjs`
- **P0（默认）**：纯文本 dashboard（ASCII/表格/颜色），不依赖第三方库
- **P1（可选增强）**：如确需 TUI 可引入 1 个成熟库（例如 `ink` 或 `blessed` 二选一），但必须提供降级回落到纯文本模式的能力，并记录依赖引入原因/许可证/替代方案
- 实时读取工作流状态
- 支持键盘交互（若为纯文本模式，可先只支持刷新/退出等最小交互）


**验收标准**:
- [ ] 显示完整工作流进度
- [ ] 实时更新状态
- [ ] 显示产出文件和大小
- [ ] 支持交互式操作

---

#### 任务 3.2: 依赖关系图

**目标**: 可视化展示模块依赖关系

**实现内容**:
```bash
$ incspec graph

生成依赖关系图: incspec-dependency-graph.svg

┌─────────────────────────────────────────┐
│  Home 组件依赖关系                       │
├─────────────────────────────────────────┤
│                                         │
│         ┌──────────┐                    │
│         │   Home   │                    │
│         └────┬─────┘                    │
│              │                          │
│      ┌───────┼────────┐                 │
│      │       │        │                 │
│  ┌───▼──┐ ┌──▼──┐ ┌───▼────┐           │
│  │ API  │ │Store│ │ Search │           │
│  │      │ │     │ │ Filter │           │
│  └──────┘ └─────┘ └────────┘           │
│                                         │
│  图例:                                  │
│    ━━  直接依赖                         │
│    ┄┄  间接依赖                         │
│                                         │
└─────────────────────────────────────────┘
```

**技术实现**:
- 新增 `commands/graph.mjs`
- 解析基线和增量文档中的依赖信息
- 生成 ASCII 图或 SVG
- 使用 `graphviz` 或 `d3` 生成可视化

**验收标准**:
- [ ] 支持 ASCII 和 SVG 输出
- [ ] 显示组件、API、Store 依赖
- [ ] 高亮当前修改的模块

---

#### 任务 3.3: 实时状态监控

**目标**: 提供 watch 模式，监控工作流变化

**实现内容**:
```bash
$ incspec watch

正在监控工作流变化...

[10:35:42] 步骤 2 状态变更: pending → in_progress
[10:47:15] 步骤 2 状态变更: in_progress → completed
[10:47:16] 新文件: requirements/structured-requirements.md
[10:47:16] 当前步骤推进: 2 → 3
```

**技术实现**:
- 新增 `commands/watch.mjs`
- 使用 `fs.watch()` 监控文件变化
- 解析 WORKFLOW.md 变化
- 实时输出状态更新

**验收标准**:
- [ ] 监控 WORKFLOW.md 变化
- [ ] 监控产出文件创建/修改
- [ ] 支持过滤特定事件

---

### 里程碑 4: 国际化支持 (v0.4.0)

**优先级**: P2 (可选)

#### 任务 4.1: 多语言架构

**目标**: 构建可扩展的国际化框架

**实现内容**:
```javascript
// lib/i18n.mjs
const translations = {
  'zh-CN': {
    'workflow.step1': '代码流程分析',
    'workflow.step2': '结构化需求收集',
    // ...
  },
  'en-US': {
    'workflow.step1': 'Code Flow Analysis',
    'workflow.step2': 'Structured Requirements Collection',
    // ...
  }
};

export function t(key, params = {}) {
  // 翻译函数
}

export function setLocale(locale) {
  // 设置语言
}
```

**技术实现**:
- 新增 `lib/i18n.mjs`
- 所有用户可见文本使用 `t()` 包裹
- 支持参数插值
- 自动检测系统语言

**验收标准**:
- [ ] 支持中文和英文
- [ ] 可通过环境变量切换语言
- [ ] 翻译覆盖率 > 95%

---

#### 任务 4.2: 英文文档和模板

**目标**: 提供完整的英文支持

**实现内容**:
- 翻译所有 Markdown 模板
- 英文命令输出
- 英文错误信息和建议
- 英文文档站点

**验收标准**:
- [ ] 所有模板有英文版本
- [ ] 命令输出支持英文
- [ ] README 有英文版

---

## 技术债务

在本阶段需要解决的技术债务：

1. **终端输出重构**
   - 统一输出格式
   - 支持多级日志（debug, info, warn, error）
   - 可配置输出详细程度

2. **错误处理标准化**
   - 定义错误类型体系
   - 统一错误码
   - 错误日志和上报

3. **测试覆盖**
   - 交互式功能的自动化测试
   - E2E 测试套件
   - 性能基准测试

## 成功指标

### 量化指标
- 新用户上手时间: 从 30 分钟降至 10 分钟
- 命令错误率: 降低 60%
- 工作流完成率: 提升至 85%+
- 用户满意度: NPS > 50

### 定性指标
- 用户反馈: "非常容易使用"
- 错误信息: "清晰且有帮助"
- 文档质量: "简洁且完整"

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| TUI 库兼容性问题 | 高 | 中 | 提前做技术选型 POC |
| 国际化工作量超预期 | 中 | 高 | 分阶段发布，优先英文 |
| 用户习惯改变抵触 | 中 | 中 | 保留传统命令，向导为可选 |

## 下一步

完成阶段 1 后，进入 [阶段 2: 代码生成增强](./phase2-codegen.md)。

---

**版本**: 1.0
**最后更新**: 2024-12-23
