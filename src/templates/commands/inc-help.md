---
description: [incspec] 显示帮助信息
---

# incspec 帮助

## 工作流步骤

<!-- MODE_SECTIONS -->

## 辅助命令

- `/incspec/inc-status` - 查看当前工作流状态
- `/incspec/inc-help` - 显示帮助信息

## CLI 命令

```bash
incspec init          # 初始化项目
incspec status        # 查看工作流状态
incspec list          # 列出规范文件
incspec validate      # 验证规范完整性
incspec sync          # 同步 IDE 命令
incspec help          # 显示帮助
```

## 目录结构

```
incspec/
├── project.md        # 项目配置
├── workflow.json     # 工作流状态
├── baselines/        # 基线快照
├── requirements/     # 需求文档
├── increments/       # 增量设计
└── archives/         # 历史归档 (YYYY-MM/{module}/)
```
