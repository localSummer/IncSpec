# 模板同步策略

> IncSpec CLI 与 AI 工具协同工作的模板同步指南

## 问题背景

IncSpec 是一个 CLI 工具，但它与 AI 编程助手（Cursor、Claude Code 等）紧密协同工作。当 CLI 功能增强时，必须同步更新以下模板文件，确保 AI 工具能够正确使用新功能。

## 模板文件结构

```
templates/
├── AGENTS.md                      # ⭐ 完整使用指南 - 供所有 AGENTS.md 兼容工具使用
├── INCSPEC_BLOCK.md               # AGENTS.md 中的 IncSpec 指令块（可选）
├── WORKFLOW.md                    # 工作流状态模板
├── project.md                     # 项目配置模板
└── commands/                      # 斜杠命令模板（Cursor/Claude Code 通用）
    ├── analyze-codeflow.md
    ├── structured-requirements-collection.md
    └── ...（7个步骤的详细指令）
```

**核心入口文件（必须更新）**：
- `AGENTS.md`: 所有 AI 工具的统一入口（Cursor、Claude Code 等）

**补充文件（按需更新）**：
- `commands/*.md`: 斜杠命令的详细说明（Cursor/Claude Code 通用）

## 同步原则

### 1. 一致性原则
- CLI 命令和 AI 工具指令功能必须一致
- 参数选项必须对应
- 输出格式必须匹配

### 2. 及时性原则
- CLI 功能开发完成后，立即更新模板
- 作为功能开发的必要步骤，不是可选项
- 模板更新与 CLI 发布同步

### 3. 可维护性原则
- 使用变量和占位符减少重复
- 提供清晰的注释和示例
- 版本化管理模板变更

## 各阶段的模板同步任务

### 阶段 1: 交互体验增强

#### 新增功能 → 需要的模板更新

| CLI 功能 | 核心更新 | 补充更新 |
|---------|---------|---------|
| `incspec wizard` | AGENTS.md | - |
| `incspec dashboard` | AGENTS.md | commands/inc-dashboard.md |
| `incspec graph` | AGENTS.md | commands/inc-graph.md |
| `incspec watch` | AGENTS.md | commands/inc-watch.md |
| 智能参数推断 | AGENTS.md（更新所有命令说明） | - |
| 上下文感知提示 | AGENTS.md（增强状态说明） | - |

**具体任务**:
```markdown
## 任务: 阶段 1 模板同步

### ⭐ 核心任务（必须完成）

#### 1. 更新 AGENTS.md
- [ ] 添加"交互式向导"章节
  - wizard 命令的使用说明
  - 何时使用 wizard vs 手动步骤
- [ ] 更新"CLI 命令"章节
  - 添加 wizard/dashboard/graph/watch 命令
  - 更新命令参数说明，标注自动推断特性
- [ ] 增强"工作流概览"章节
  - 添加可视化工作流状态说明
  - 添加依赖关系图查看方式
- [ ] 更新"故障排除"章节
  - 添加 dashboard/graph/watch 的常见问题

#### 2. （已废弃）更新 SKILL.md
注意：Claude Code 现在使用命令方式，与 Cursor 一致。所有更新只需在 AGENTS.md 中完成。

### 可选任务（补充文档）

#### 3. 新增 Cursor 命令模板
- [ ] commands/inc-wizard.md
- [ ] commands/inc-dashboard.md
- [ ] commands/inc-graph.md
- [ ] commands/inc-watch.md

#### 4. 新增 Claude 命令参考文档
- [ ] commands/inc-wizard.md（Cursor/Claude 通用）
- [ ] references/inc-dashboard.md
- [ ] references/inc-graph.md
- [ ] references/inc-watch.md

**注意**: 补充文档是可选的。Cursor 和 Claude Code 都使用 AGENTS.md 作为核心入口，补充文档（commands/）仅在需要更详细说明时创建。
```

---

### 阶段 2: 代码生成增强

#### 新增功能 → 需要的模板更新

| CLI 功能 | 核心更新 | 影响章节 |
|---------|---------|---------|
| `incspec diff` | AGENTS.md | CLI命令、步骤5(应用) |
| `incspec test generate/run/coverage` | AGENTS.md | CLI命令、步骤5(应用)、最佳实践 |
| `incspec lint` | AGENTS.md | CLI命令、步骤5(应用) |
| `incspec complexity` | AGENTS.md | CLI命令、步骤5(应用) |
| `incspec quality-gate` | AGENTS.md | CLI命令、步骤5(应用) |
| `incspec check-conflicts` | AGENTS.md | CLI命令、步骤5(应用) |
| 步骤5集成质量检查 | AGENTS.md | 步骤5详情、工作流概览 |

**具体任务**:
```markdown
## 任务: 阶段 2 模板同步

### ⭐ 核心任务（必须完成）

#### 1. 更新 AGENTS.md

**CLI 命令章节**:
- [ ] 添加代码分析命令
  - `incspec diff` - 差异分析
  - `incspec complexity` - 复杂度分析
  - `incspec check-conflicts` - 冲突检测
- [ ] 添加测试命令
  - `incspec test generate` - 生成测试
  - `incspec test run` - 运行测试
  - `incspec test coverage` - 覆盖率报告
- [ ] 添加质量检查命令
  - `incspec lint` - 代码检查
  - `incspec quality-gate` - 质量门禁

**步骤5 (应用代码变更) 章节**:
- [ ] 更新执行顺序
  ```markdown
  执行顺序: 
  1. 运行差异分析 (incspec diff)
  2. Types → Utils → APIs → Store → Components
  3. 生成测试用例 (incspec test generate)
  4. 执行质量门禁 (incspec quality-gate)
  ```
- [ ] 添加质量检查说明
- [ ] 更新审批门禁要求

**最佳实践章节**:
- [ ] 添加"代码质量保障"小节
- [ ] 添加测试生成最佳实践

#### 2. （已废弃）更新 SKILL.md
注意：Claude Code 现在使用命令方式，与 Cursor 一致。所有更新只需在 AGENTS.md 中完成。

**快速开始章节**:
- [ ] 更新步骤5说明，包含质量检查

**步骤详情 - 步骤5**:
- [ ] 更新输入/输出说明
- [ ] 添加质量检查流程
- [ ] 更新验证步骤

**最佳实践章节**:
- [ ] 添加"质量优先"原则
- [ ] 添加测试覆盖率要求

**常见陷阱章节**:
- [ ] 添加"跳过质量检查"陷阱

### 可选任务（补充文档）

#### 3. 新增补充文档（如需要）
- [ ] commands/inc-diff.md
- [ ] commands/inc-test-*.md
- [ ] commands/inc-lint.md
- [ ] references/ 对应文件
```

---

### 阶段 3: 工作流协调优化

#### 新增功能 → 需要的模板更新

| CLI 功能 | 核心更新 | 影响章节 |
|---------|---------|---------|
| `incspec history` | AGENTS.md | CLI命令 |
| `incspec lock/unlock` | AGENTS.md | CLI命令、团队协作 |
| `incspec publish/pull` | AGENTS.md | CLI命令、团队协作 |
| `incspec team-status` | AGENTS.md | CLI命令、团队协作 |
| `incspec create-mr/review` | AGENTS.md | CLI命令、团队协作 |
| 工作流智能推荐 | AGENTS.md | 步骤1、快速检查清单 |
| 步骤跳过建议 | AGENTS.md | 所有步骤、最佳实践 |

**具体任务**:
```markdown
## 任务: 阶段 3 模板同步

### ⭐ 核心任务（必须完成）

#### 1. 更新 AGENTS.md

**新增"团队协作"章节**:
- [ ] 工作流锁定机制
  - `incspec lock/unlock` 使用说明
  - 锁定冲突处理
- [ ] 工作流共享
  - `incspec publish/pull` 使用说明
  - 团队状态查看 (`team-status`)
- [ ] 代码评审
  - `incspec create-mr/review` 使用说明
  - MR 描述自动生成

**更新"快速检查清单"**:
- [ ] 添加模式推荐说明
  - 何时使用完整模式
  - 何时使用快速模式
  - 系统自动推荐逻辑
- [ ] 添加步骤跳过建议

**更新"步骤1 (分析)"**:
- [ ] 添加模式推荐输出
- [ ] 添加步骤跳过建议输出

**CLI 命令章节**:
- [ ] 添加协作命令组
- [ ] 添加历史记录命令

#### 2. （已废弃）更新 SKILL.md
注意：Claude Code 现在使用命令方式，与 Cursor 一致。所有更新只需在 AGENTS.md 中完成。
- [ ] 代码评审集成
- [ ] 团队状态监控

**更新"执行规则"**:
- [ ] 添加智能推荐说明
- [ ] 更新默认行为（考虑推荐）

**更新"工作流概览"**:
- [ ] 添加模式选择建议表格
- [ ] 更新步骤可跳过说明

**更新"最佳实践"**:
- [ ] 添加"听从智能推荐"建议
- [ ] 添加团队协作最佳实践

### 可选任务（补充文档）

#### 3. 新增补充文档（如需要）
- [ ] commands/inc-lock.md
- [ ] commands/inc-publish.md
- [ ] commands/inc-review.md
- [ ] references/ 对应文件
```

---

### 阶段 3: 工作流协调优化

#### 新增功能 → 需要的模板更新

| CLI 功能 | 核心更新 | 影响章节 |
|---------|---------|---------|
| `incspec wizard` | AGENTS.md | 快速开始、CLI命令 |
| `incspec history` | AGENTS.md | CLI命令 |
| `incspec dashboard` | AGENTS.md | CLI命令 |
| `incspec watch` | AGENTS.md | CLI命令 |
| CI/CD 集成 | AGENTS.md | 与AI助手集成、新增 CI/CD 章节 |
| 团队协作 | AGENTS.md | 新增团队协作章节 |

**具体任务**:
```markdown
## 任务: 阶段 3 模板同步

### ⭐ 核心任务（必须完成）

#### 1. 更新 AGENTS.md

**新增章节**:
```markdown
## 交互式功能

### 工作流向导
使用向导快速启动工作流：
\`\`\`bash
incspec wizard              # 启动交互式向导
incspec wizard --quick      # 快速模式向导
incspec wizard --resume     # 恢复中断的向导
\`\`\`

### 工作流可视化
查看工作流进度和状态：
\`\`\`bash
incspec dashboard           # 显示工作流仪表盘
incspec history             # 查看历史记录
incspec history --stats     # 显示统计信息
incspec watch               # 实时监控工作流变化
\`\`\`

## 团队协作

### 工作流锁定
避免多人同时修改同一工作流：
\`\`\`bash
incspec status              # 查看锁定状态
# 工作流会自动锁定，完成后自动释放
incspec reset --force       # 强制释放锁定（谨慎使用）
\`\`\`

### CI/CD 集成
在持续集成中验证 IncSpec 规范：
\`\`\`bash
incspec init --check        # 检查项目是否已初始化
incspec validate --strict   # 严格验证规范完整性
incspec status --json       # 输出 JSON 格式状态
\`\`\`

注意：IncSpec 在 CI 中仅验证规范文件完整性，不执行用户代码的测试或 lint 检查。
\`\`\`

**更新 CLI 命令表**:
添加新命令到命令列表：
- `wizard` / `w` - 启动交互式向导
- `history` - 查看工作流历史
- `dashboard` / `dash` - 显示工作流仪表盘
- `watch` - 实时监控工作流

#### 2. （已废弃）更新 SKILL.md
注意：Claude Code 现在使用命令方式，与 Cursor 一致。所有更新只需在 AGENTS.md 中完成。

**新增章节**:
```markdown
## 交互式工作流

### 向导模式
对于新用户或不熟悉工作流的场景，使用向导模式：
\`\`\`bash
incspec wizard
\`\`\`
向导会引导你逐步完成：
1. 项目初始化检查
2. 选择工作流模式（FULL/QUICK）
3. 收集必要参数
4. 执行相应步骤

### 可视化监控
监控工作流进度：
\`\`\`bash
incspec dashboard    # 图形化仪表盘
incspec watch        # 实时监控
\`\`\`

## 团队协作最佳实践

### 避免冲突
- 使用 Git 分支隔离不同的工作流
- 检查工作流状态避免覆盖他人工作
- 在 CI 中验证规范完整性

### CI/CD 集成
在 GitHub Actions 或 GitLab CI 中添加：
\`\`\`yaml
- run: incspec validate --strict
\`\`\`
这将验证：
- 规范文件是否完整
- 工作流状态是否一致
- 文件结构是否正确

注意：不会执行实际的代码测试或 lint，这些由用户项目自行配置。
\`\`\`

### 可选任务（补充文档）

#### 3. 新增 Cursor 命令模板（如需要）

如果 wizard/dashboard 等命令需要详细说明，可在 `commands/` 添加：
- `commands/wizard.md` - 交互式向导详细指令
- `commands/dashboard.md` - 仪表盘使用说明

#### 4. 新增 Claude 命令参考文档（如需要）
- [ ] commands/inc-xxx.md（Cursor/Claude 通用）

在 `references/` 中添加对应文档：
- `references/wizard.md`
- `references/team-collaboration.md`
- `references/ci-cd-integration.md`

---

### 阶段 4: 生态系统建设

#### 新增功能 → 需要的模板更新

| CLI 功能 | 核心更新 | 影响章节 |
|---------|---------|---------|
| `incspec plugin *` | AGENTS.md | CLI命令、新增插件章节 |
| `incspec monitor` | AGENTS.md | CLI命令 |
| `incspec logs` | AGENTS.md | CLI命令、故障排除 |
| `incspec doctor` | AGENTS.md | CLI命令、故障排除 |
| 插件系统 | AGENTS.md | 新增插件章节 |
| AI 适配优化 | AGENTS.md | 全局优化提示词 |

**具体任务**:
```markdown
## 任务: 阶段 4 模板同步

### ⭐ 核心任务（必须完成）

#### 1. 更新 AGENTS.md

**新增"插件生态"章节**:
- [ ] 插件系统介绍
- [ ] 插件搜索和安装
  - `incspec plugin search`
  - `incspec plugin install`
  - `incspec plugin list`
  - `incspec plugin update`
- [ ] 常用插件推荐
- [ ] 插件开发指引

**新增"可观测性"章节**:
- [ ] 性能监控 (`incspec monitor`)
- [ ] 日志查看 (`incspec logs`)
- [ ] 问题诊断 (`incspec doctor`)

**更新"故障排除"章节**:
- [ ] 添加 `incspec doctor` 自动诊断
- [ ] 添加日志查看方式
- [ ] 完善常见问题列表

**CLI 命令章节**:
- [ ] 添加插件管理命令组
- [ ] 添加运维命令组

**全局优化**:
- [ ] 优化所有章节的提示词结构
- [ ] 增强上下文说明
- [ ] 改进错误处理指导

#### 2. （已废弃）更新 SKILL.md
注意：Claude Code 现在使用命令方式，与 Cursor 一致。所有更新只需在 AGENTS.md 中完成。

**新增"插件扩展"章节**:
- [ ] 插件系统使用
- [ ] 推荐插件列表
- [ ] 插件开发指南

**新增"性能监控"章节**:
- [ ] 实时监控使用
- [ ] 日志分析技巧
- [ ] 问题诊断流程

**更新"参考资源"章节**:
- [ ] 添加插件市场链接
- [ ] 添加可观测性文档

**全局优化**:
- [ ] 优化提示词精确度
- [ ] 压缩冗余上下文
- [ ] 改进执行规则说明

#### 3. 创建模板开发指南
- [ ] 新建 templates/CONTRIBUTING.md
- [ ] 定义 AGENTS.md 更新规范
- [ ] 定义 AGENTS.md 更新规范
- [ ] 提供模板测试方法
- [ ] 版本管理指南

### 可选任务（补充文档）

#### 4. 新增补充文档（如需要）
- [ ] commands/inc-plugin-*.md
- [ ] commands/inc-monitor.md
- [ ] commands/inc-logs.md
- [ ] commands/inc-doctor.md
- [ ] references/ 对应文件
```

---

## 模板更新工作流

### 1. 开发阶段
```bash
# 1. 开发 CLI 功能
git checkout -b feature/dashboard
# 实现 incspec dashboard 命令

# 2. 更新核心入口文件（必须）
vim templates/AGENTS.md
# - 在"CLI 命令"章节添加 dashboard 命令说明
# - 更新相关工作流步骤说明
# - 添加使用示例
# - 在"CLI集成"表格添加 dashboard 命令
# - 更新相关步骤说明
# - 同步 AGENTS.md 的更新

# 3. （可选）创建补充文档
# 仅在需要更详细说明时创建
mkdir -p templates/commands
touch templates/commands/inc-dashboard.md
# 编写详细的斜杠命令说明（Cursor/Claude Code 通用）

# 4. 测试模板
incspec sync --cursor --claude
# 验证模板同步成功
# 使用 Cursor/Claude 测试命令执行
```

### 2. 审查清单

在 PR 中必须包含：
- [ ] CLI 功能实现
- [ ] 单元测试
- [ ] ⭐ **AGENTS.md 更新**（核心，必须）
- [ ] ⭐ **AGENTS.md 更新**（核心，必须 - Cursor/Claude Code 通用）
- [ ] 命令模板（可选，如需详细说明）
- [ ] Claude 命令参考文档（可选，如需详细说明）
- [ ] 模板测试验证
- [ ] 文档更新

**审查重点**：
- AGENTS.md 的更新是否完整（包含 Cursor/Claude Code 所需的所有说明）
- 命令说明是否清晰易懂
- 是否包含必要的示例
- 是否更新了相关的工作流步骤

### 3. 发布流程
```bash
# 1. 版本发布
npm version minor
git push --tags

# 2. 通知用户更新模板
# 在 CHANGELOG.md 中说明模板变更

# 3. 用户更新
incspec update     # 自动更新本地模板
```

## 模板开发规范

### 1. 核心入口文件规范

#### AGENTS.md 结构
```markdown
# IncSpec 使用指南

## 快速检查清单
- 完整模式和快速模式说明
- 核心约定

## 七步工作流
- 工作流可视化
- 每个步骤的说明

### 步骤 N: <步骤名称>
**命令**: 命令格式
**目的**: 简要说明
**输出**: 产出说明
**交付物**: 关键交付物
**验证**: 验证方式

## 目录结构
## 编号系统
## CLI 命令
- 按类别组织的所有命令
- 包含命令、别名、参数说明

## 文件格式示例
## 与AI助手集成
## 故障排除
```

**更新原则**：
- 保持结构清晰，章节有序
- 新功能优先更新相关步骤说明
- 在"CLI 命令"章节添加新命令
- 在"故障排除"添加新的常见问题
- 使用清晰的命令示例

#### （已废弃）SKILL.md 结构
注意：Claude Code 现在使用命令方式，与 Cursor 一致，不再需要单独的 SKILL.md 文件。
AGENTS.md 作为所有 AI 工具的统一入口，所有更新只需在 AGENTS.md 中完成。

### 2. 补充文档规范（可选）

仅在核心入口文件说明不够详细时创建补充文档。

#### Cursor 命令模板 (commands/*.md)
```markdown
# <命令名称>

## 目标
简短描述此命令的目标（1-2 句话）

## 前置条件
- 列出必须满足的前置条件

## 执行步骤
1. 第一步：具体操作
2. 第二步：具体操作

## 输出要求
- 描述期望的输出格式
- 提供输出示例

## 错误处理
- 常见错误及处理方式

## 示例
提供完整的使用示例

## 参考
- 相关文档链接
```

#### Claude 命令参考 (commands/*.md)
与 Cursor 命令模板完全一致，存放在 `templates/commands/` 目录中，供 Cursor 和 Claude Code 共同使用。

### 3. 提示词优化
- 使用清晰、具体的指令
- 避免模糊的表述
- 提供充足的上下文
- 包含示例和预期输出
- 明确错误处理方式

### 4. 版本管理
- 模板文件头部包含版本号
- 记录模板变更历史
- 保持向后兼容性

## 模板一致性校验规范（Unified Template Consistency Validation）

> 目标：把“模板同步”从经验要求变成可自动验证的规则（Release Gate 的一部分）。  
> 适用范围：当 CLI 新增/变更命令、参数、输出、工作流语义时，必须满足至少以下一致性规则。

### 1) 核心入口一致性（MUST）
- `templates/AGENTS.md` 必须：
  - 包含完整的工作流概览与推荐主路径（至少覆盖新手可走通的主流程）
  - 给出"关键命令入口"与使用方式（至少包含核心工作流命令与新增命令的可发现性说明）
  - 对 CLI 的关键新行为/重要参数变更给出明确说明（含示例）
- 当 CLI 变更影响用户行为（新增/弃用/默认行为变化）时，该文件必须同步更新。

### 2) 命令覆盖一致性（MUST）
对每个 CLI 命令（含别名）：
- 必须在核心入口文件 AGENTS.md 中可被发现（出现该命令的用途或主路径引用）
- 若该命令是"面向 AI 工具的主要触发入口"（例如新增 workflow 步骤命令、强推荐命令）：
  - 必须在 `templates/commands/` 中提供详细说明
  - 若不补充，必须在 PR/Release Notes 解释原因（例如"无需补充说明/仅内部命令"）

> 说明：补充模板并非每个命令都必须创建，但"关键命令"必须具备足够说明以避免 AI 误用。

### 3) 参数一致性（MUST）
- 模板中出现的命令参数必须与 CLI 一致：
  - 参数名一致（长/短选项）
  - 参数语义一致（含默认值与互斥关系）
  - 示例命令必须可执行（至少在“格式与参数层面”可执行）
- 如 CLI 支持 `--help`，模板中的参数说明应对齐 `--help` 输出（建议以 `--help` 作为单一事实来源）。

### 4) 输出/格式一致性（SHOULD）
- 如果 CLI 提供可脚本化输出（例如 `--json` / `--format=json`），模板中应说明：
  - 何时应选择机器可读输出
  - 关键字段（至少列出 3-5 个最常用字段）与示例
- 如果输出结构发生变化：
  - 必须在模板中更新示例
  - 必须在 Release Notes 标注（如会影响解析，按兼容策略走弃用/迁移）

### 5) 失败与降级路径一致性（SHOULD）
- 对交互式能力（wizard/dashboard/TUI 等）：
  - 模板需说明如何非交互运行或如何降级（例如纯文本模式）
- 对可能失败的命令：
  - 模板需给出最少 1 条可执行的错误恢复建议（例如下一步命令、加 `--force` 的风险提示等）

## 测试策略

### 1. 自动化测试（建议作为 Release Gate 的 MUST）
```javascript
// tests/templates/template-validator.test.mjs
describe('Template Validation', () => {
  it('核心入口文件存在且可读取', () => {
    // 验证 templates/AGENTS.md 存在
  });

  it('CLI 命令在核心入口中可被发现（覆盖一致性）', () => {
    const cliCommands = getCliCommands();
    const agents = readAgents();

    for (const cmd of cliCommands) {
      expect(agents.includes(cmd)).toBe(true);
    }
  });

  it('关键命令具备补充模板（如需要）', () => {
    const criticalCommands = getCriticalCommands(); // 例如新增/推荐/工作流关键入口
    const commandTemplates = getCommandTemplates();

    for (const cmd of criticalCommands) {
      // 检查 commands/ 目录中是否存在对应模板
      const hasTemplate = commandTemplates.includes(`inc-${cmd}.md`);
      expect(hasTemplate).toBe(true);
    }
  });

  it('模板示例参数与 CLI 参数一致（参数一致性）', () => {
    // 从 CLI 的参数定义或 `--help` 输出提取参数集合
    // 从模板中提取命令示例与参数
    // 做集合对齐校验（至少校验：新增参数未遗漏、废弃参数未继续推荐）
  });

  it('如提供机器可读输出，模板需包含 JSON/格式说明（输出一致性）', () => {
    // 如果某些命令支持 --json/--format=json
    // 验证模板包含对应说明与示例
  });
});
```

### 2. 手动测试
- 使用 Cursor 测试斜杠命令
- 使用 Claude Code 测试斜杠命令
- 验证输出与 CLI 一致（尤其是示例命令与关键参数）
- 检查错误处理与降级路径（交互命令/TUI 退回纯文本）

## 维护责任

### 核心团队职责
- 审查所有模板变更
- 确保模板质量
- 维护模板规范
- 处理模板相关 Issue
- 维护“关键命令清单”（critical commands）判定标准

### 贡献者职责
- 新功能必须包含模板（至少更新核心入口：AGENTS.md）
- 遵循模板规范
- 测试模板可用性
- 更新相关文档

## 常见问题

### Q: 什么时候需要更新模板？
A: 以下情况必须更新模板：
1. 新增 CLI 命令
2. 修改命令参数
3. 更改输出格式
4. 修改默认行为/工作流语义（含 QUICK/FULL、步骤推进规则等）

### Q: 为什么强调"核心入口可发现性"？
A: 对 AI 工具来说，AGENTS.md 是主要入口。即使补充模板（commands/）缺失，只要核心入口可发现且描述准确，仍能避免大部分误用；反之会导致 AI 触发错误命令或使用错误参数。

### Q: 如何定义“关键命令”（critical commands）？
A: 满足任一条件即可视为关键命令：
- 新增命令（尤其影响主流程/强推荐路径）
- 工作流关键入口（例如步骤命令、validate/sync/upgrade 等）
- 带有复杂参数/交互行为/降级路径的命令
- 需要在 CI 或自动化场景调用的命令（例如 validate/quality-gate）
4. 增强命令功能
5. 修改工作流逻辑

### Q: 如何确保模板与 CLI 一致？
A: 
1. 自动化测试验证
2. PR 审查强制检查
3. 发布前完整测试
4. 用户反馈跟踪

### Q: 模板出现不一致怎么办？
A:
1. 立即在 GitHub 提 Issue
2. 使用 `incspec update` 更新模板
3. 如严重影响，发布 Hotfix 版本

---

**最后更新**: 2024-12-23  
**负责人**: IncSpec 核心团队
