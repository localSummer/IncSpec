# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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
- 6+1 步增量开发工作流
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

[Unreleased]: https://github.com/localSummer/IncSpec/compare/v0.0.5...HEAD
[0.0.5]: https://github.com/localSummer/IncSpec/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/localSummer/IncSpec/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/localSummer/IncSpec/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/localSummer/IncSpec/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/localSummer/IncSpec/releases/tag/v0.0.1
