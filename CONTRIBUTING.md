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

## 问题反馈

如有任何问题，欢迎通过以下方式联系：

- [GitHub Issues](https://github.com/localSummer/IncSpec/issues)
- [GitHub Discussions](https://github.com/localSummer/IncSpec/discussions)（如已开启）

再次感谢你的贡献！
