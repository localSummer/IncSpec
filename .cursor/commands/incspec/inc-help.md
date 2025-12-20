---
description: [incspec] 显示帮助信息
---

# incspec 帮助

## 工作流步骤

1. `/incspec/inc-analyze` - 分析代码流程,生成基线快照
2. `/incspec/inc-collect-req` - 收集结构化需求
3. `/incspec/inc-collect-dep` - 采集UI依赖
4. `/incspec/inc-design` - 生成增量设计蓝图
5. `/incspec/inc-apply` - 应用代码变更
6. `/incspec/inc-merge` - 合并到新基线

## 辅助命令

- `/incspec/inc-archive` - 归档规范文件到 archives 目录
- `/incspec/inc-status` - 查看当前工作流状态
- `/incspec/inc-help` - 显示帮助信息

## CLI 命令

```bash
incspec init          # 初始化项目
incspec status        # 查看工作流状态
incspec list          # 列出规范文件
incspec validate      # 验证规范完整性
incspec cursor-sync   # 同步 Cursor 命令
incspec help          # 显示帮助
```

## 目录结构

```
incspec/
├── project.md        # 项目配置
├── WORKFLOW.md       # 工作流状态
├── baselines/        # 基线快照
├── requirements/     # 需求文档
├── increments/       # 增量设计
└── archives/         # 历史归档 (YYYY-MM/{module}/)
```
