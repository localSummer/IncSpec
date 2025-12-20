# IncSpec CLI 代码流程基线报告

> 生成时间: 2025-12-20
> 分析范围: 完整项目 (index.mjs, commands/, lib/)
> 版本: v1

## 1. 一句话摘要

IncSpec 是一个纯 ES Modules 的 CLI 工具，通过 `index.mjs` 入口解析命令行参数并路由到 14 个命令模块，命令模块依赖 7 个核心库实现配置管理、工作流状态、规范文件操作和终端交互。

---

## 2. 模块调用时序图

### 2.1 CLI 启动与命令路由时序

```mermaid
sequenceDiagram
    participant User as 用户
    participant CLI as index.mjs
    participant Parse as parseArgs()
    participant Cmd as commands/*.mjs
    participant Lib as lib/*.mjs
    participant FS as 文件系统

    User->>CLI: [S1] incspec <command> [options]
    CLI->>Parse: [S2] parseArgs(process.argv.slice(2))
    Parse-->>CLI: [S3] { command, args, options }
    
    alt --help 或 --version
        CLI->>User: [S4a] 显示帮助/版本
    else 有效命令
        CLI->>Cmd: [S4b] xxxCommand(ctx)
        Cmd->>Lib: [S5] 调用核心库函数
        Lib->>FS: [S6] 读写文件
        FS-->>Lib: [S7] 文件内容/操作结果
        Lib-->>Cmd: [S8] 处理结果
        Cmd->>User: [S9] 输出结果
    else 未知命令
        CLI->>User: [S4c] 错误: 未知命令
    end
```

### 2.2 init 命令时序

```mermaid
sequenceDiagram
    participant User as 用户
    participant Init as init.mjs
    participant Config as config.mjs
    participant Workflow as workflow.mjs
    participant Agents as agents.mjs
    participant Terminal as terminal.mjs
    participant FS as 文件系统

    User->>Init: [S1] incspec init
    Init->>Config: [S2] isInitialized(cwd)
    Config->>FS: [S3] 检查 incspec/project.md
    FS-->>Config: [S4] 存在/不存在
    Config-->>Init: [S5] boolean
    
    alt 已初始化且无 --force
        Init->>User: [S6a] 警告: 已初始化
    else 未初始化或 --force
        Init->>Terminal: [S6b] prompt() 收集配置
        Terminal-->>Init: [S7] 用户输入
        Init->>Config: [S8] createIncspecStructure(cwd, config)
        Config->>FS: [S9] 创建目录和文件
        Init->>Workflow: [S10] initWorkflow(cwd)
        Workflow->>FS: [S11] 写入 WORKFLOW.md
        Init->>Agents: [S12] updateProjectAgentsFile(cwd)
        Agents->>FS: [S13] 更新 AGENTS.md
        Init->>User: [S14] 初始化完成
    end
```

### 2.3 工作流命令时序 (以 analyze 为例)

```mermaid
sequenceDiagram
    participant User as 用户
    participant Analyze as analyze.mjs
    participant Config as config.mjs
    participant Workflow as workflow.mjs
    participant Spec as spec.mjs
    participant Terminal as terminal.mjs
    participant FS as 文件系统

    User->>Analyze: [S1] incspec analyze <path>
    Analyze->>Config: [S2] ensureInitialized(cwd)
    Config->>FS: [S3] findProjectRoot()
    FS-->>Config: [S4] projectRoot
    Config-->>Analyze: [S5] projectRoot 或抛错
    
    alt --baseline 选项
        Analyze->>FS: [S6a] 查找基线文件
        Analyze->>Workflow: [S7a] updateStep(1, COMPLETED)
    else 新分析
        Analyze->>Workflow: [S6b] readWorkflow()
        Workflow->>FS: [S7b] 读取 WORKFLOW.md
        FS-->>Workflow: [S8] 工作流状态
        
        alt 无活跃工作流
            Analyze->>Workflow: [S9a] startWorkflow(name)
            Workflow->>FS: [S10a] 写入 WORKFLOW.md
        else 有未完成工作流
            Analyze->>Terminal: [S9b] confirm() 询问归档
            Terminal-->>Analyze: [S10b] 用户选择
        end
        
        Analyze->>Spec: [S11] getNextVersion('baselines', module)
        Spec->>FS: [S12] 扫描版本号
        Spec-->>Analyze: [S13] 下一版本号
        Analyze->>Workflow: [S14] updateStep(1, IN_PROGRESS)
        Analyze->>User: [S15] 显示使用说明
    end
```

### 2.4 sync 命令时序

```mermaid
sequenceDiagram
    participant User as 用户
    participant Sync as sync.mjs
    participant Cursor as cursor.mjs
    participant Claude as claude.mjs
    participant Terminal as terminal.mjs
    participant FS as 文件系统

    User->>Sync: [S1] incspec sync
    Sync->>Terminal: [S2] checkbox() 选择目标
    Terminal-->>Sync: [S3] ['cursor', 'claude']
    
    loop 每个选中目标
        alt cursor
            Sync->>Terminal: [S4a] select() 选择范围
            Terminal-->>Sync: [S5a] 'project' | 'global'
            Sync->>Cursor: [S6a] syncToProject() | syncToGlobal()
            Cursor->>FS: [S7a] 写入命令文件
        else claude
            Sync->>Terminal: [S4b] select() 选择范围
            Terminal-->>Sync: [S5b] 'project' | 'global'
            Sync->>Claude: [S6b] syncToProjectClaude() | syncToGlobalClaude()
            Claude->>FS: [S7b] 复制 skill 目录
        end
    end
    
    Sync->>User: [S8] 同步完成
```

### 2.5 archive 命令时序

```mermaid
sequenceDiagram
    participant User as 用户
    participant Archive as archive.mjs
    participant Config as config.mjs
    participant Workflow as workflow.mjs
    participant Spec as spec.mjs
    participant Terminal as terminal.mjs
    participant FS as 文件系统

    User->>Archive: [S1] incspec archive [--workflow]
    Archive->>Config: [S2] ensureInitialized(cwd)
    Archive->>Workflow: [S3] readWorkflow()
    Workflow->>FS: [S4] 读取 WORKFLOW.md
    FS-->>Workflow: [S5] 工作流状态
    
    alt 归档工作流产出
        Archive->>Archive: [S6a] getArchivableOutputs()
        Archive->>Archive: [S7a] collectArchivedFiles()
        Archive->>Terminal: [S8a] confirm()
        Terminal-->>Archive: [S9a] 确认
        loop 每个产出文件
            Archive->>Spec: [S10a] archiveSpec(path, move, module)
            Spec->>FS: [S11a] 移动到 archives/YYYY-MM/{module}/
        end
        Archive->>Workflow: [S12a] archiveWorkflow()
    else 归档单文件
        Archive->>Spec: [S6b] archiveSpec(filePath)
        Spec->>FS: [S7b] 移动文件
    end
    
    Archive->>User: [S13] 归档完成
```

---

## 3. 依赖关系图

### 3.1 模块层级依赖

```mermaid
graph TB
    subgraph "入口层"
        INDEX[index.mjs]
    end
    
    subgraph "命令层 commands/"
        INIT[init.mjs]
        UPDATE[update.mjs]
        STATUS[status.mjs]
        ANALYZE[analyze.mjs]
        COLLECT_REQ[collect-req.mjs]
        COLLECT_DEP[collect-dep.mjs]
        DESIGN[design.mjs]
        APPLY[apply.mjs]
        MERGE[merge.mjs]
        LIST[list.mjs]
        VALIDATE[validate.mjs]
        ARCHIVE[archive.mjs]
        SYNC[sync.mjs]
        HELP[help.mjs]
    end
    
    subgraph "核心库层 lib/"
        CONFIG[config.mjs]
        WORKFLOW[workflow.mjs]
        SPEC[spec.mjs]
        TERMINAL[terminal.mjs]
        AGENTS[agents.mjs]
        CURSOR[cursor.mjs]
        CLAUDE[claude.mjs]
    end
    
    subgraph "外部"
        FS[Node.js fs]
        PATH[Node.js path]
        READLINE[Node.js readline]
        OS[Node.js os]
    end
    
    INDEX --> INIT & UPDATE & STATUS & ANALYZE
    INDEX --> COLLECT_REQ & COLLECT_DEP & DESIGN
    INDEX --> APPLY & MERGE & LIST & VALIDATE
    INDEX --> ARCHIVE & SYNC & HELP
    
    INIT --> CONFIG & WORKFLOW & AGENTS & TERMINAL
    UPDATE --> CONFIG & AGENTS & TERMINAL
    STATUS --> CONFIG & WORKFLOW & TERMINAL
    ANALYZE --> CONFIG & WORKFLOW & SPEC & TERMINAL
    COLLECT_REQ --> CONFIG & WORKFLOW & TERMINAL
    COLLECT_DEP --> CONFIG & WORKFLOW & TERMINAL
    DESIGN --> CONFIG & WORKFLOW & SPEC & TERMINAL
    APPLY --> CONFIG & WORKFLOW & SPEC & TERMINAL
    MERGE --> CONFIG & WORKFLOW & SPEC & TERMINAL
    LIST --> CONFIG & SPEC & TERMINAL
    VALIDATE --> CONFIG & WORKFLOW & SPEC & TERMINAL
    ARCHIVE --> CONFIG & WORKFLOW & SPEC & TERMINAL
    SYNC --> CURSOR & CLAUDE & TERMINAL
    HELP --> WORKFLOW & TERMINAL
    
    CONFIG --> FS & PATH
    WORKFLOW --> CONFIG & FS & PATH
    SPEC --> CONFIG & FS & PATH
    TERMINAL --> READLINE
    AGENTS --> CONFIG & FS & PATH
    CURSOR --> CONFIG & FS & PATH & OS
    CLAUDE --> FS & PATH & OS
```

### 3.2 核心库内部依赖

```mermaid
graph LR
    subgraph "核心库 lib/"
        TERMINAL[terminal.mjs<br/>终端 I/O]
        CONFIG[config.mjs<br/>配置管理]
        WORKFLOW[workflow.mjs<br/>工作流状态]
        SPEC[spec.mjs<br/>规范文件]
        AGENTS[agents.mjs<br/>AGENTS.md]
        CURSOR[cursor.mjs<br/>Cursor 同步]
        CLAUDE[claude.mjs<br/>Claude 同步]
    end
    
    WORKFLOW -->|getTemplatesDir| CONFIG
    SPEC -->|parseFrontmatter, DIRS| CONFIG
    AGENTS -->|getTemplatesDir| CONFIG
    CURSOR -->|INCSPEC_DIR, DIRS| CONFIG
```

### 3.3 命令-库依赖矩阵

| 命令 | config | workflow | spec | terminal | agents | cursor | claude |
|------|:------:|:--------:|:----:|:--------:|:------:|:------:|:------:|
| init | * | * | - | * | * | - | - |
| update | * | - | - | * | * | - | - |
| status | * | * | - | * | - | - | - |
| analyze | * | * | * | * | - | - | - |
| collect-req | * | * | - | * | - | - | - |
| collect-dep | * | * | - | * | - | - | - |
| design | * | * | * | * | - | - | - |
| apply | * | * | * | * | - | - | - |
| merge | * | * | * | * | - | - | - |
| list | * | - | * | * | - | - | - |
| validate | * | * | * | * | - | - | - |
| archive | * | * | * | * | - | - | - |
| sync | - | - | - | * | - | * | * |
| help | - | * | - | * | - | - | - |

---

## 4. 数据流摘要

### 4.1 工作流状态流转

```
┌─────────────────────────────────────────────────────────────────┐
│                        工作流生命周期                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [无工作流] ──startWorkflow()──► [活跃工作流]                    │
│       ▲                              │                          │
│       │                              │                          │
│       │                              ▼                          │
│       │                    ┌─────────────────┐                  │
│       │                    │ Step 1: analyze │                  │
│       │                    │   PENDING       │                  │
│       │                    │   IN_PROGRESS   │                  │
│       │                    │   COMPLETED ────┼──► 输出: baseline│
│       │                    └────────┬────────┘                  │
│       │                             │ updateStep()              │
│       │                             ▼                           │
│       │                    ┌─────────────────┐                  │
│       │                    │ Step 2-6: ...   │                  │
│       │                    │   (同上)        │                  │
│       │                    └────────┬────────┘                  │
│       │                             │                           │
│       │                             ▼                           │
│       └──archiveWorkflow()── [归档到历史]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 文件产出路径

| 步骤 | 命令 | 输出文件 | 存储路径 |
|------|------|----------|----------|
| 1 | analyze | `{module}-baseline-v{n}.md` | `incspec/baselines/` |
| 2 | collect-req | `structured-requirements.md` | `incspec/requirements/` |
| 3 | collect-dep | `ui-dependencies.md` | `incspec/requirements/` |
| 4 | design | `{feature}-increment-v{n}.md` | `incspec/increments/` |
| 5 | apply | (代码变更) | (源代码目录) |
| 6 | merge | `{module}-baseline-v{n+1}.md` | `incspec/baselines/` |
| - | archive | 移动文件 | `incspec/archives/YYYY-MM/{module}/` |

### 4.3 配置数据流

```
project.md (YAML frontmatter)
    │
    ├── name: 项目名称
    ├── version: 版本号
    ├── tech_stack: 技术栈数组
    ├── source_dir: 源代码目录
    └── created_at: 创建日期
         │
         ▼
    readProjectConfig() ──► { name, version, tech_stack, source_dir, ... }
         │
         ├──► statusCommand() 显示项目信息
         ├──► applyCommand() 获取 source_dir
         └──► validate() 检查配置完整性
```

---

## 5. 关键函数索引

### 5.1 config.mjs

| 函数 | 行号 | 用途 |
|------|------|------|
| `findProjectRoot(startDir)` | 38-52 | 向上查找 incspec/ 目录 |
| `isInitialized(cwd)` | 64-68 | 检查是否已初始化 |
| `ensureInitialized(cwd)` | 192-200 | 确保已初始化，否则抛错 |
| `parseFrontmatter(content)` | 73-109 | 解析 YAML frontmatter |
| `readProjectConfig(projectRoot)` | 126-139 | 读取项目配置 |
| `createIncspecStructure(projectRoot, config)` | 173-190 | 创建目录结构 |
| `getTemplatesDir()` | 28-34 | 获取模板目录路径 |

### 5.2 workflow.mjs

| 函数 | 行号 | 用途 |
|------|------|------|
| `readWorkflow(projectRoot)` | 118-128 | 读取工作流状态 |
| `writeWorkflow(projectRoot, workflow)` | 169-173 | 写入工作流状态 |
| `startWorkflow(projectRoot, name)` | 195-223 | 创建新工作流 |
| `updateStep(projectRoot, stepNumber, status, output)` | 229-254 | 更新步骤状态 |
| `archiveWorkflow(projectRoot)` | 274-294 | 归档当前工作流 |
| `getWorkflowProgress(workflow)` | 315-332 | 计算完成进度 |
| `parseWorkflow(content)` | 71-116 | 解析 WORKFLOW.md |

### 5.3 spec.mjs

| 函数 | 行号 | 用途 |
|------|------|------|
| `listSpecs(projectRoot, type)` | 29-48 | 列出规范文件 |
| `getNextVersion(projectRoot, type, prefix)` | 54-68 | 计算下一版本号 |
| `getLatestSpec(projectRoot, type, prefix)` | 74-90 | 获取最新版本文件 |
| `archiveSpec(projectRoot, filePath, deleteOriginal, module)` | 140-167 | 归档规范文件 |
| `readSpec(filePath)` | 125-135 | 读取规范文件内容 |
| `getSpecInfo(filePath)` | 172-206 | 解析文件信息 |

### 5.4 terminal.mjs

| 函数 | 行号 | 用途 |
|------|------|------|
| `colorize(text, ...colors)` | 32-34 | 应用 ANSI 颜色 |
| `print(text, ...colors)` | 40-46 | 打印彩色文本 |
| `prompt(message, defaultValue)` | 90-102 | 文本输入提示 |
| `confirm(message)` | 76-86 | 确认提示 (y/N) |
| `select({ message, choices })` | 108-156 | 单选交互 |
| `checkbox({ message, choices })` | 162-218 | 多选交互 |
| `printStep(step, name, status)` | 69-79 | 打印步骤状态 |

---

## 6. 技术约束

1. **纯 ES Modules**: 所有文件使用 `.mjs` 扩展名，import/export 语法
2. **零第三方依赖**: 仅使用 Node.js 内置模块 (fs, path, readline, os)
3. **无构建步骤**: 直接运行，无需编译或打包
4. **同步文件操作**: 所有文件 I/O 使用同步 API (`fs.*Sync`)
5. **终端交互**: 使用 `readline` 实现交互式提示，支持 ANSI 颜色和光标控制

---

## 7. 备注

- 工作流步骤 2-6 的实际代码生成/修改工作由外部 AI 编码助手完成
- CLI 工具主要负责状态管理、文件组织和用户交互
- `sync` 命令将模板同步到 Cursor/Claude，使 AI 助手能识别 incspec 工作流
