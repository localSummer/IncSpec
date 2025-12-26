# 贡献指南

感谢你对 IncSpec 的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/localSummer/IncSpec/issues) 提交，并包含以下信息：

- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息（Node.js 版本、操作系统等）

### 功能建议

欢迎通过 [GitHub Issues](https://github.com/localSummer/IncSpec/issues) 提交功能建议。请描述：

- 功能的使用场景
- 期望的行为
- 可能的实现方案（可选）

### 提交代码

1. **Fork 仓库**
   ```bash
   git clone https://github.com/localSummer/IncSpec.git
   cd IncSpec
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发与测试**
   ```bash
   npm link
   incspec --version  # 验证安装
   ```

4. **提交变更**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request。

## 开发规范

### 代码风格

- 使用 ES Modules（`.mjs` 扩展名）
- 遵循项目现有的代码风格
- 保持函数简洁，单一职责

### 模板文件更新规范

当更新 `templates/` 目录下的模板文件时，请注意：

- **AGENTS.md**: AI 助手操作手册，会在 `incspec init` 时复制到项目的 `incspec/AGENTS.md`
- **commands/*.md**: IDE 命令模板（Cursor/Claude 通用），通过 `incspec sync` 同步到各 IDE 配置目录
  - Cursor: 同步到 `.cursor/commands/incspec/`
  - Claude Code: 同步到 `.claude/commands/incspec/`
  - 两个 IDE 生成完全相同的命令文件

**关键原则**:
- 参考业界最佳实践（如 OpenSpec）保持模板质量
- validate 命令的执行时机：步骤 1/4/6 完成后、归档前执行
- 模板更新后需同步测试 `incspec sync` 命令
- **保持模板与代码一致**: `templates/workflow.json` 中的步骤必须与 `lib/workflow.mjs` 中的 `STEPS` 数组保持一致（包含完整的 7 个步骤）

### 提交信息规范

使用语义化提交信息：

```
<type>: <description>

[optional body]
```

**类型（type）：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 代码重构（不影响功能） |
| `chore` | 构建/工具变更 |

**示例：**
```
feat: add archive command for workflow outputs
fix: resolve path issue on windows
docs: update installation instructions
```

### 目录结构

```
index.mjs           # CLI 入口
├── commands/       # 命令实现（每个命令一个文件）
├── lib/            # 核心库
└── templates/      # Markdown 模板
```

新增命令时：
1. 在 `commands/` 目录创建命令文件
2. 在 `index.mjs` 中注册命令
3. 更新 README.md 命令文档

## 版本发布记录

### v0.2.6 (2025-12-23)
- **feat**: 重构 --complete 标志处理逻辑，作为独立模式运行
  - 新增：--complete 标志跳过所有前置条件检查和交互式确认流程
  - 改进：所有命令提供清晰的步骤完成标记指引
  - 影响：优化 AI 助手与工作流的集成体验，支持非交互式批量操作
- **feat**: 完善项目配置和工作流元数据
  - 新增：.gitignore 忽略 incspec 目录
  - 更新：工作流和项目元数据描述

### v0.2.1 (2025-12-22)
- **fix**: 修复 `templates/WORKFLOW.md` 模板缺少第 7 步"归档"的问题
  - 问题：init 初始化时生成的 WORKFLOW.md 只包含 6 个步骤
  - 根因：模板文件硬编码了 6 个步骤，与 `lib/workflow.mjs` 中 STEPS 数组（7个步骤）不一致
  - 影响：初始化后的步骤进度表格缺少 "7. archive-workflow" 行
  - 修复：在模板文件中补充第 7 步归档的表格行

### v0.2.0
- 添加快速模式支持
- 优化工作流状态管理
- 完善 validate 命令

## 问题反馈

如有任何问题，欢迎通过以下方式联系：

- [GitHub Issues](https://github.com/localSummer/IncSpec/issues)
- [GitHub Discussions](https://github.com/localSummer/IncSpec/discussions)（如已开启）

再次感谢你的贡献！
