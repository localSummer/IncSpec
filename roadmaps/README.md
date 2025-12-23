# IncSpec Roadmap

本目录包含 IncSpec 的演进路线图，详细规划了从当前版本到 v1.0 正式版的发展路径，并补充了"向后兼容 + 发版门禁（Release Gate）"的跨阶段约束，确保整体可执行、可验证、可监控、可协调。

## 核心定位

IncSpec 是一个**基线优先的增量规范驱动开发工具**，专为复杂 brownfield 项目设计。与"规范驱动"（Spec-Driven）工具不同，IncSpec 首先帮助 AI 编程助手**理解现有代码**，再定义增量变更。

## 文档结构

### 核心文档

- **[ROADMAP.md](./ROADMAP.md)** - 总览文档，包含整体愿景、阶段划分、版本规划、竞争策略
- **[compatibility-policy.md](./compatibility-policy.md)** - 兼容性策略：兼容契约、破坏性变更判定、弃用与迁移流程
- **[release-gate.md](./release-gate.md)** - 发版门禁：Execution / Verification / Observability / Coordination 四维检查清单
- **[template-sync-strategy.md](./template-sync-strategy.md)** - 模板同步策略

### 阶段文档

| 阶段 | 版本 | 文档 | 说明 |
|------|------|------|------|
| 1A | v0.3.x | [phase1a-core-differentiation.md](./phase1a-core-differentiation.md) | 核心差异化与极简模式 |
| 1B | v0.3.x - v0.4.x | [phase1b-ai-ecosystem.md](./phase1b-ai-ecosystem.md) | AI 工具生态扩展 |
| 2 | v0.4.x - v0.5.x | [phase2-interaction.md](./phase2-interaction.md) | 交互体验增强 |
| 3 | v0.5.x - v0.6.x | [phase3-codegen.md](./phase3-codegen.md) | 代码生成增强 |
| 4 | v0.7.x - v0.8.x | [phase4-workflow.md](./phase4-workflow.md) | 工作流协调优化 |
| 5 | v0.9.x - v1.0.x | [phase5-ecosystem.md](./phase5-ecosystem.md) | 生态系统建设 |

## 重要提醒：CLI 与 AI 工具协同

IncSpec CLI 与 AI 编程助手（Cursor、Claude Code、GitHub Copilot 等）紧密协同工作。**开发任何新功能时，必须同步更新 `templates/` 目录下的 AI 工具指令模板**。

**为什么重要？**
- IncSpec 的核心价值在于 AI 工具能够理解和执行工作流
- 用户通过 AI 工具（如 Cursor 斜杠命令、Claude 斜杠命令）触发 CLI 功能
- 如果模板不同步，AI 工具将无法使用新功能

**详细指南**：请务必阅读 [模板同步策略文档](./template-sync-strategy.md)

## 工作流模式

IncSpec 提供三种工作流模式，适应不同复杂度的开发场景：

| 模式 | 步骤数 | 适用场景 |
|------|--------|----------|
| 极简 (minimal) | 3 | Bug 修复、小型调整 |
| 快速 (quick) | 5 | 中型功能开发 |
| 完整 (full) | 7 | 大型功能、复杂重构 |

## 快速导航

### 按关注点查找

#### 核心差异化能力（阶段 1A）
- [极简模式实现](./phase1a-core-differentiation.md#里程碑-1-极简模式实现-v030)
- [基线差异分析](./phase1a-core-differentiation.md#里程碑-2-基线差异分析-v030)
- [破坏性变更检测](./phase1a-core-differentiation.md#里程碑-3-破坏性变更检测-v030)

#### AI 工具生态（阶段 1B）
- [AI 适配层架构](./phase1b-ai-ecosystem.md#里程碑-1-ai-适配层架构-v035)
- [扩展 AI 工具支持](./phase1b-ai-ecosystem.md#里程碑-2-扩展-ai-工具支持-v035)
- [AGENTS.md 标准兼容](./phase1b-ai-ecosystem.md#里程碑-3-agentsmd-标准兼容-v040)

#### 用户体验改进（阶段 2）
- [交互式工作流向导](./phase2-interaction.md#任务-11-新用户引导流程)
- [智能命令建议](./phase2-interaction.md#任务-21-命令拼写纠错)
- [可视化进度面板](./phase2-interaction.md#任务-31-进度仪表盘)
- [多语言支持](./phase2-interaction.md#里程碑-4-国际化支持-v050)

#### 代码质量提升（阶段 3）
- [测试规范生成](./phase3-codegen.md#里程碑-1-测试规范生成-v050)
- [代码质量规范](./phase3-codegen.md#里程碑-3-代码质量规范定义-v060)
- [智能冲突解决](./phase3-codegen.md#里程碑-4-智能冲突分析-v060)

#### 团队协作（阶段 4）
- [工作流智能推荐](./phase4-workflow.md#里程碑-1-智能推荐引擎-v070)
- [团队协作模式](./phase4-workflow.md#里程碑-2-团队协作模式-v075)
- [CI/CD 集成](./phase4-workflow.md#里程碑-3-cicd-集成-v080)

#### 扩展性（阶段 5）
- [插件系统](./phase5-ecosystem.md#任务-11-插件架构设计)
- [可观测性平台](./phase5-ecosystem.md#里程碑-3-可观测性平台-v095)
- [v1.0 正式版发布](./phase5-ecosystem.md#里程碑-4-v10-正式版发布-v100)

### 按时间线查找

| 版本 | 时间 | 关键特性 | 阶段 |
|------|------|----------|------|
| v0.3.0 | Q1 2025 | 极简模式、基线差异分析 | 1A |
| v0.3.5 | Q1 2025 | 5+ AI 工具支持、统一适配层 | 1B |
| v0.4.0 | Q2 2025 | 交互式向导、智能建议 | 2 |
| v0.5.0 | Q2 2025 | 可视化面板、国际化 | 2 |
| v0.6.0 | Q3 2025 | 测试规范、质量规范、冲突解决 | 3 |
| v0.7.0 | Q3 2025 | 智能推荐、团队协作 | 4 |
| v0.8.0 | Q4 2025 | CI/CD 集成、性能优化 | 4 |
| v0.9.0 | Q4 2025 | 插件系统 | 5 |
| v1.0.0 | Q1 2026 | 正式版发布 | 5 |

## 阶段概览

### 阶段 1A: 核心差异化与极简模式 (1.5-2 个月)
**核心目标**: 强化核心差异化能力，降低入门门槛

**关键成果**:
- 极简模式（3 步工作流）
- 基线差异分析基础能力
- 破坏性变更检测

[查看详情 →](./phase1a-core-differentiation.md)

---

### 阶段 1B: AI 工具生态扩展 (1.5-2 个月，与 1A 并行)
**核心目标**: 快速扩展 AI 工具支持，建立生态基础

**关键成果**:
- 支持 5+ 主流 AI 工具
- 统一 AI 适配层接口
- AGENTS.md 标准兼容

[查看详情 →](./phase1b-ai-ecosystem.md)

---

### 阶段 2: 交互体验增强 (2-3 个月)
**核心目标**: 降低学习成本，提升易用性

**关键成果**:
- 交互式工作流向导
- 智能命令建议和错误恢复
- 可视化工作流进度
- 多语言国际化支持

[查看详情 →](./phase2-interaction.md)

---

### 阶段 3: 代码生成增强 (2-3 个月)
**核心目标**: 深化代码生成精准度和质量保障能力

**关键成果**:
- 自动化测试规范生成
- 代码质量规范定义
- 智能冲突分析与解决建议
- 增量基线版本管理增强

[查看详情 →](./phase3-codegen.md)

---

### 阶段 4: 工作流协调优化 (3-4 个月)
**核心目标**: 优化团队协作和工作流智能化

**关键成果**:
- 工作流智能推荐引擎
- 团队协作模式
- CI/CD 集成
- 性能优化

[查看详情 →](./phase4-workflow.md)

---

### 阶段 5: 生态系统建设 (3-4 个月)
**核心目标**: 构建可扩展的插件系统和社区生态

**关键成果**:
- 插件系统和 Registry
- 可观测性平台
- v1.0 正式版发布

[查看详情 →](./phase5-ecosystem.md)

---

## 竞争策略

IncSpec 与 OpenSpec 是**互补而非竞争**关系：

| 场景 | 推荐工具 |
|------|----------|
| Greenfield（从零开始） | OpenSpec |
| 简单 Brownfield 变更 | OpenSpec 或 IncSpec 极简模式 |
| 复杂 Brownfield 项目 | **IncSpec**（核心优势） |
| 需要深度代码理解 | **IncSpec**（基线分析） |
| 需要变更风险评估 | **IncSpec**（破坏性变更检测） |

## 关键指标

### 核心差异化指标
- 基线分析准确率: 90%+
- 破坏性变更检测率: 85%+
- AI 工具覆盖: v0.4.0 前达到 5+

### 用户体验指标
- 极简模式上手时间: 5 分钟内
- 完整模式上手时间: 从 30 分钟降至 15 分钟
- 工作流完成率: 提升至 85%+

### 生态指标
- 社区插件数量: 20+
- AI 工具适配: 10+
- GitHub Stars: 1000+

## 参与方式

我们欢迎社区参与 roadmap 的讨论和实现！

### 反馈 Roadmap

1. 在 [GitHub Issues](https://github.com/localSummer/IncSpec/issues) 中创建标签为 `roadmap` 的 Issue
2. 参与 [GitHub Discussions](https://github.com/localSummer/IncSpec/discussions) 讨论
3. 提交 Pull Request 修改 roadmap 文档

### 认领任务

1. 查看各阶段文档中的任务列表
2. 在对应的 Issue 中评论表示认领
3. Fork 仓库开始开发
4. 提交 Pull Request

## 更新日志

- **2024-12-24**: v2.0 - 重构路线图，新增阶段 1A/1B，调整优先级
- **2024-12-23**: v1.0 - 初始版本，定义 4 个阶段和 v1.0 目标

## 许可证

本 roadmap 文档采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可证。

---

**问题反馈**: [GitHub Issues](https://github.com/localSummer/IncSpec/issues)  
**讨论交流**: [GitHub Discussions](https://github.com/localSummer/IncSpec/discussions)
