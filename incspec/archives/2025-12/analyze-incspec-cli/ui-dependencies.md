# UI 依赖收集报告

> 工作流: analyze-incspec-cli
> 创建时间: 2025-12-20
> 需求类型: Bug 修复 (时间格式问题)

---

## 1. 依赖收集概述

由于本项目是纯 CLI 工具，不涉及前端 UI 框架，本报告聚焦于：
- **模块依赖**: 文件间的导入关系
- **工具函数**: 新增的公共函数
- **类型定义**: 无 (纯 JavaScript 项目)
- **外部依赖**: 无新增

---

## 2. 新增工具函数

### 2.1 函数定义

| 函数名 | 签名 | 返回值 | 说明 |
|--------|------|--------|------|
| `formatLocalDateTime` | `(date: Date) => string` | `YYYY-MM-DD HH:mm` | 格式化本地日期时间 |
| `formatLocalDate` | `(date: Date) => string` | `YYYY-MM-DD` | 格式化本地日期 |

### 2.2 放置位置

**文件**: `lib/terminal.mjs`

**理由**:
1. `terminal.mjs` 是项目底层模块，仅依赖 Node.js 内置模块 `readline`
2. 所有 commands 都已导入 `terminal.mjs`
3. 时间格式化属于输出格式化范畴，符合模块职责
4. 不会产生循环依赖

### 2.3 函数实现

```javascript
/**
 * 格式化为本地日期时间字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式: YYYY-MM-DD HH:mm
 */
export function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化为本地日期字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式: YYYY-MM-DD
 */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

---

## 3. 模块依赖关系

### 3.1 当前依赖图

```
                    ┌─────────────────┐
                    │  terminal.mjs   │ ◄── 仅依赖 Node.js readline
                    │  (底层模块)     │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
     ┌──────────┐     ┌───────────┐    ┌──────────┐
     │config.mjs│     │workflow.mjs│    │ 所有命令 │
     │ (无导入) │     │(导入config)│    │(已导入)  │
     └──────────┘     └───────────┘    └──────────┘
```

### 3.2 修改后依赖图

```
                    ┌─────────────────┐
                    │  terminal.mjs   │
                    │ + formatLocal*  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  ┌────────────┐     ┌─────────────┐     ┌──────────────┐
  │ config.mjs │     │workflow.mjs │     │   commands/  │
  │ +新增导入  │     │  +新增导入  │     │  list.mjs    │
  │ terminal   │     │  terminal   │     │  update.mjs  │
  └────────────┘     └─────────────┘     └──────────────┘
```

---

## 4. 文件修改清单

### 4.1 新增导入语句

| 文件 | 修改类型 | 导入内容 |
|------|----------|----------|
| `lib/workflow.mjs` | 新增 | `import { formatLocalDateTime } from './terminal.mjs';` |
| `lib/config.mjs` | 新增 | `import { formatLocalDate } from './terminal.mjs';` |
| `commands/update.mjs` | 修改 | 在现有导入中添加 `formatLocalDateTime` |
| `commands/list.mjs` | 修改 | 在现有导入中添加 `formatLocalDateTime` |

### 4.2 代码替换清单

| 文件 | 行号 | 当前代码 | 替换为 |
|------|------|----------|--------|
| **lib/terminal.mjs** | EOF | - | 新增 `formatLocalDateTime`, `formatLocalDate` |
| **lib/workflow.mjs** | 214 | `new Date().toISOString().replace('T', ' ').slice(0, 16)` | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 295 | 同上 | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 327 | 同上 | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 384 | 同上 | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 414 | 同上 | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 443 | 同上 | `formatLocalDateTime(new Date())` |
| **lib/workflow.mjs** | 552 | 同上 | `formatLocalDateTime(new Date())` |
| **commands/update.mjs** | 74 | 同上 | `formatLocalDateTime(new Date())` |
| **commands/list.mjs** | 50 | `spec.mtime.toISOString().replace('T', ' ').slice(0, 16)` | `formatLocalDateTime(spec.mtime)` |
| **lib/config.mjs** | 210 | `new Date().toISOString().split('T')[0]` | `formatLocalDate(new Date())` |
| **lib/config.mjs** | 239 | 同上 | `formatLocalDate(new Date())` |

---

## 5. 循环依赖检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| terminal.mjs → config.mjs | 无 | terminal 不导入任何项目模块 |
| terminal.mjs → workflow.mjs | 无 | 同上 |
| config.mjs → terminal.mjs | 安全 | 新增导入，无循环 |
| workflow.mjs → terminal.mjs | 安全 | 新增导入，无循环 |

**结论**: 无循环依赖风险

---

## 6. 外部依赖

| 类型 | 依赖项 | 说明 |
|------|--------|------|
| Node.js 内置 | `readline` | terminal.mjs 已有 |
| npm 包 | 无 | 保持零依赖原则 |

---

## 7. 影响评估

### 7.1 修改文件统计

| 修改类型 | 文件数 | 修改点数 |
|----------|--------|----------|
| 新增函数 | 1 | 2 函数 |
| 新增导入 | 2 | 2 行 |
| 修改导入 | 2 | 2 行 |
| 代码替换 | 4 | 11 处 |
| **总计** | **4** | **17 处** |

### 7.2 兼容性

- 输出格式保持不变: `YYYY-MM-DD HH:mm`
- 仅时间值从 UTC 改为本地时间
- 对现有工作流文件向后兼容
