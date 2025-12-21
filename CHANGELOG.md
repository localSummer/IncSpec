# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.2] - 2025-12-21

### Changed

- 优化 validate 命令执行时机，参考 OpenSpec 最佳实践
  - 明确验证时机：步骤 1/4/6 完成后、归档前执行
  - 新增 `--strict` 选项说明，用于 CI 集成（有错误时退出码为1）
  - 更新 `templates/AGENTS.md` 和 `templates/inc-spec-skill/SKILL.md`
  - 各步骤新增验证节点说明：
    - 步骤1 (analyze): 检查基线格式（必含时序图和依赖图）
    - 步骤4 (design): 检查增量格式（必含5个模块章节）
    - 步骤6 (merge): 检查新基线完整性
    - 步骤7 (archive): 归档前后各验证一次

## [0.1.1] - 2025-12-21

### Changed

- 重命名 `templates/cursor-commands/` 为 `templates/commands/`
  - 更准确反映目录用途（IDE 命令模板，Cursor/Claude 通用）
  - 更新 CLAUDE.md 文档中的路径引用
- `sync` 命令描述文案使用灰色显示（`colors.gray`）
  - 提升 UI 层次感，更易区分主要选项和辅助说明

### Removed

- 移除 `lib/cursor.mjs` 中的向后兼容逻辑
  - 移除 `LEGACY_TEMPLATES_DIR` 常量定义
  - 简化 `getSourcePath()` 函数，统一使用 `templates/commands/` 目录

## [0.1.0] - 2025-12-21

### Added

- `reset` 命令新增 `--to` 选项，支持回退到指定步骤
  - `incspec reset --to=3` 或 `incspec reset -t 3`
  - 保留目标步骤及之前的状态，重置后续步骤为 pending
  - 被重置步骤的产出文件自动归档到 `archives/`
  - 回退后 currentStep 自动设为目标步骤的下一步
- `lib/workflow.mjs` 新增 `resetToStep()` 函数
- 文档更新：README.md 新增"回退与重置"章节
- 文档更新：AGENTS.md 新增回退使用场景说明

## [0.0.10] - 2025-12-21

### Fixed

- 修复归档同名文件命名格式，`-copy1` 改为 `-2` 序号递增格式
  - 原命名: `structured-requirements-copy1.md`
  - 新命名: `structured-requirements-2.md`

## [0.0.9] - 2025-12-21

### Changed

- 精简 AGENTS.md 工作流指南，减少约 900 行冗余内容
- 优化快速模式下需求收集完成后的提示信息，明确需要人工确认后再执行 apply
- 增量工作流文档新增人工审查步骤说明，强调审批门禁的重要性

## [0.0.8] - 2025-12-21

### Added

- 新增 `reset` 命令，重置工作流状态并可选归档当前产出
  - 支持 `--force` 跳过确认提示
  - 支持 `--archive` 在重置前自动归档
- 新增快速模式 (5步流程) 支持
  - `incspec analyze <path> --quick` 启动快速模式
  - 跳过步骤 3 (UI依赖采集) 和步骤 4 (增量设计)
  - 适用于 Bug 修复、简单功能、不涉及复杂 UI 依赖的变更
- 工作流状态新增 `skipped` 状态和 `mode` 字段
- 更新所有模板文件支持快速模式判断
- 新增 `docs/skill-best-practices.md` 技能编写最佳实践文档

### Changed

- `apply` 命令新增预执行确认步骤，执行前需确认变更范围
- `merge` 命令新增预执行确认步骤，执行前需确认合并内容
- `status` 命令显示工作流模式标签，跳过的步骤显示 `[-]` 标记
- `apply` 命令快速模式下使用需求文档 (`structured-requirements.md`) 作为输入
- `merge` 命令快速模式下重新分析当前代码生成新基线
- `archive` 命令根据模式返回不同的可归档步骤列表
- `collect-req` 命令完成后快速模式提示直接进入步骤 5
- 更新 AGENTS.md 模板，增强 AI 助手工作流指导

## [0.0.7] - 2025-12-20

### Added

- 新增 `sync` 命令，统一同步 IDE/AI 工具集成
  - 支持交互式多选 (Cursor, Claude Code)
  - 支持命令行参数 `--cursor`、`--claude`、`--all`
  - 支持 `--project` 和 `--global` 指定目标目录
- 新增 `lib/claude.mjs` 模块，实现 Claude Code Skill 同步
- 新增 `checkbox()` 多选交互组件

### Changed

- `sync --project` 现在使用当前工作目录而非查找 incspec 项目根目录
- 交互式选择目录时，当前目录选项显示在全局目录之前
- 修正 CLI 命令输出中的 Claude Code 使用提示
  - 移除不存在的 `/ai-increment:xxx` 命令格式
  - 改为引导用户使用 inc-spec-skill 技能并提供自然语言参考格式
  - 影响文件：`analyze.mjs`、`collect-req.mjs`、`collect-dep.mjs`、`design.mjs`、`apply.mjs`、`merge.mjs`

### Removed

- 移除 `cursor-sync` 命令，功能已整合到 `sync` 命令

## [0.0.6] - 2025-12-20

### Changed

- 统一 Cursor 斜杠命令的 argument-hint 命名风格
  - 采用 kebab-case 命名格式（如 `source-path`）
  - 统一使用英文参数名
  - 文件类参数使用 `-path` 后缀，目录类参数使用 `-dir` 后缀
  - 影响文件：`analyze-codeflow.md`、`analyze-increment-codeflow.md`、`merge-to-baseline.md`

## [0.0.5] - 2024-12-20

### Added

- `analyze` 命令新增 `--baseline` 选项，支持使用现有基准报告跳过分析步骤
- 自动从归档目录恢复基准报告：搜索 `baselines/` 和 `archives/` 目录，找到后自动移动到工作区

### Changed

- 更新帮助文档和模板，说明 `--baseline` 选项的使用方式

## [0.0.4] - 2024-12-20

### Added

- 发布时同时推送到 GitHub Packages
- 自动创建 GitHub Release，包含从 CHANGELOG 提取的更新说明
- Release 页面展示安装命令和相关链接

## [0.0.3] - 2024-12-20

### Fixed

- 修复 GitHub Actions 中 GITHUB_STEP_SUMMARY 环境变量问题，添加条件检查和回退输出

## [0.0.2] - 2024-12-20

### Added

- 添加 GitHub Actions 自动发布工作流
- 支持 npm provenance 签名，增强供应链安全

### Fixed

- 修复 GitHub Actions 中 GITHUB_SUMMARY 变量引用问题

## [0.0.1] - 2024-12-20

### Added

- 初始版本发布
- 7 步增量开发工作流
  - `analyze` - 代码流程分析，生成基线快照
  - `collect-req` - 结构化需求收集（5 列表格）
  - `collect-dep` - UI 依赖采集（API、Store、Types、Utils、Components、Hooks）
  - `design` - 增量设计（7 模块蓝图）
  - `apply` - 应用代码变更
  - `merge` - 合并到新基线
  - `archive` - 归档工作流产出
- 项目管理命令
  - `init` - 初始化 incspec 目录结构
  - `status` - 查看工作流状态
  - `list` - 列出规范文件
  - `validate` - 验证规范完整性
  - `update` - 更新模板到最新版本
- Cursor IDE 集成
  - `cursor-sync` - 同步斜杠命令到 `.cursor/commands/`
- AGENTS.md 支持，兼容 Claude Code 和其他 AI 助手
- 命令别名支持（如 `a` 代替 `analyze`）
- 归档按年月和模块自动组织

[0.1.2]: https://github.com/localSummer/IncSpec/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/localSummer/IncSpec/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/localSummer/IncSpec/compare/v0.0.10...v0.1.0
[0.0.10]: https://github.com/localSummer/IncSpec/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/localSummer/IncSpec/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/localSummer/IncSpec/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/localSummer/IncSpec/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/localSummer/IncSpec/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/localSummer/IncSpec/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/localSummer/IncSpec/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/localSummer/IncSpec/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/localSummer/IncSpec/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/localSummer/IncSpec/releases/tag/v0.0.1
