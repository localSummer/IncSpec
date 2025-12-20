# 结构化需求文档

> 工作流: analyze-incspec-cli
> 创建时间: 2025-12-20
> 需求类型: Bug 修复

## 需求背景

当前项目中所有时间生成和展示使用 `new Date().toISOString()` 方法，该方法返回的是 **UTC 时间**而非**本地时间**，导致显示的时间与用户预期不符。

**问题现象:**
- 显示时间: `2025-12-20 11:32`
- 实际本地时间: `2025-12-20 19:32` (假设 UTC+8 时区)
- 差异: 8 小时

**根本原因:**
```javascript
// 当前实现 (返回 UTC 时间)
const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
```

---

## 结构化需求表格

| 需求ID | 详细描述 | 验收标准 | 依赖项 | 实现备注 |
|--------|----------|----------|--------|----------|
| REQ-001 | 创建统一的本地时间格式化工具函数，替代分散的 `toISOString()` 调用 | 1. 函数返回本地时间<br>2. 格式保持 `YYYY-MM-DD HH:mm`<br>3. 支持日期格式 `YYYY-MM-DD` | 无外部依赖 | 在 `lib/` 下创建或复用现有模块 |
| REQ-002 | 修复 `lib/workflow.mjs` 中 7 处时间生成代码 | 所有工作流时间戳使用本地时间 | REQ-001 | 行号: 214, 295, 327, 384, 414, 443, 552 |
| REQ-003 | 修复 `commands/update.mjs` 中 1 处时间生成代码 | update 命令显示本地时间 | REQ-001 | 行号: 74 |
| REQ-004 | 修复 `commands/list.mjs` 中文件修改时间展示 | list 命令显示本地时间 | REQ-001 | 行号: 50，使用 `spec.mtime` |
| REQ-005 | 确保日期格式 (`YYYY-MM-DD`) 生成逻辑正确 | `lib/config.mjs` 中日期生成使用本地日期 | REQ-001 | 行号: 210, 239 |

---

## 影响范围

### 需修改文件清单

| 文件路径 | 修改点数量 | 当前实现 | 修复后实现 |
|----------|------------|----------|------------|
| `lib/workflow.mjs` | 7 | `new Date().toISOString().replace('T', ' ').slice(0, 16)` | `formatLocalDateTime(new Date())` |
| `commands/update.mjs` | 1 | `new Date().toISOString().replace('T', ' ').slice(0, 16)` | `formatLocalDateTime(new Date())` |
| `commands/list.mjs` | 1 | `spec.mtime.toISOString().replace('T', ' ').slice(0, 16)` | `formatLocalDateTime(spec.mtime)` |
| `lib/config.mjs` | 2 | `new Date().toISOString().split('T')[0]` | `formatLocalDate(new Date())` |

**总计: 4 个文件，11 处修改点**

---

## 技术方案

### 方案: 创建本地时间格式化函数

在 `lib/terminal.mjs` 或新建 `lib/utils.mjs` 中添加:

```javascript
/**
 * 格式化为本地日期时间字符串
 * @param {Date} date
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
 * @param {Date} date
 * @returns {string} 格式: YYYY-MM-DD
 */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

**优点:**
1. 使用 `getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()` 获取本地时间
2. 集中管理，避免重复代码
3. 保持现有输出格式不变

---

## 验收检查清单

- [ ] 运行 `incspec status`，确认时间显示为本地时间
- [ ] 运行 `incspec list -l`，确认文件修改时间为本地时间
- [ ] 执行完整工作流，确认 `WORKFLOW.md` 中记录的时间正确
- [ ] 不同时区环境测试（可选）
