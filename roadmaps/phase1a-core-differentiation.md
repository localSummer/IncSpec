# 阶段 1A: 核心差异化与极简模式

> v0.3.x | 预计 1.5-2 个月

## 阶段背景

基于与 OpenSpec 的竞争分析，IncSpec 需要在早期阶段就建立核心差异化能力。本阶段聚焦两个关键目标：

1. **引入极简模式**：降低入门门槛，对标 OpenSpec 的 3 步工作流
2. **前移核心能力**：将基线差异分析和破坏性变更检测从原阶段 2 前移

## 阶段目标

强化 IncSpec 的核心差异化能力，让用户在第一次使用时就能感受到"基线优先"的独特价值。

## 核心问题

当前版本的差异化不足：

- 7 步工作流学习成本高于 OpenSpec 的 3 步
- 核心差异化能力（基线分析）没有可视化展示
- 用户难以感知"基线优先"带来的实际价值
- 缺乏与简单场景竞争的轻量级选项

## 关键成果

### 1. 极简模式（Minimal Mode）
- 3 步工作流：analyze → apply → archive
- 与 OpenSpec 对标的轻量级体验
- 无缝升级到快速模式或完整模式

### 2. 基线差异分析（从阶段 2 前移）
- 代码变更影响分析
- 差异报告生成
- 变更统计可视化

### 3. 破坏性变更检测（从阶段 2 前移）
- API 签名变更检测
- Store 状态结构变更检测
- 组件 Props 类型变更检测
- 风险等级评估

---

## 详细任务

### 里程碑 1: 极简模式实现 (v0.3.0)

**优先级**: P0 (必须完成)

#### 任务 1.1: 极简模式工作流定义

**目标**: 定义并实现 3 步极简工作流

**工作流定义**:

```javascript
// lib/workflow.mjs 新增

export const MODE = {
  MINIMAL: 'minimal',  // 新增：3 步极简模式
  QUICK: 'quick',      // 现有：5 步快速模式
  FULL: 'full',        // 现有：7 步完整模式
};

export const MINIMAL_STEPS = [
  { id: 1, name: 'analyze', label: '代码分析', command: 'analyze' },
  { id: 5, name: 'apply', label: '应用变更', command: 'apply' },
  { id: 7, name: 'archive', label: '归档', command: 'archive' },
];

// 极简模式跳过的步骤
export const MINIMAL_SKIPPED_STEPS = [2, 3, 4, 6]; // collect-req, collect-dep, design, merge
```

**CLI 接口**:

```bash
# 启动极简模式
incspec analyze <source> --minimal
incspec analyze <source> -m

# 极简模式下的工作流
incspec apply                    # 直接应用变更（跳过需求收集和设计）
incspec archive -y               # 归档（跳过合并步骤）

# 从极简模式升级到快速模式
incspec upgrade --to=quick       # 补充执行需求收集步骤

# 从极简模式升级到完整模式
incspec upgrade --to=full        # 补充执行所有跳过的步骤
```

**实现内容**:

```javascript
// commands/analyze.mjs 修改

export async function analyzeCommand(ctx) {
  const { options } = ctx;
  
  // 确定工作流模式
  let mode = MODE.FULL;
  if (options.minimal || options.m) {
    mode = MODE.MINIMAL;
  } else if (options.quick || options.q) {
    mode = MODE.QUICK;
  }
  
  // 初始化工作流状态
  await initWorkflow({
    mode,
    module: options.module || inferModuleName(ctx.args[0]),
    source: ctx.args[0],
  });
  
  // 执行分析
  await executeAnalysis(ctx);
  
  // 极简模式提示
  if (mode === MODE.MINIMAL) {
    terminal.info('极简模式已启用 (3 步工作流)');
    terminal.hint('下一步: incspec apply');
    terminal.hint('升级到完整模式: incspec upgrade --to=full');
  }
}
```

**验收标准**:
- [ ] `--minimal` 参数正确启动极简模式
- [ ] 极简模式只包含 3 个步骤
- [ ] 步骤跳过逻辑正确
- [ ] 工作流状态记录模式信息
- [ ] 模板同步更新（AGENTS.md, SKILL.md）

---

#### 任务 1.2: 极简模式下的 apply 命令增强

**目标**: 在极简模式下，apply 命令能够直接接受简单的变更描述

**实现内容**:

```bash
# 极简模式下的 apply 用法
incspec apply                           # 交互式输入变更描述
incspec apply --desc="修复登录按钮样式" # 直接指定变更描述
incspec apply --from=changes.md         # 从文件读取变更描述
```

**变更描述格式（极简模式专用）**:

```markdown
# 变更描述

## 变更类型
- [x] Bug 修复
- [ ] 功能新增
- [ ] 功能修改
- [ ] 重构

## 简要描述
修复登录页面按钮在移动端的样式问题

## 影响文件（可选）
- src/views/Login/index.tsx
- src/views/Login/styles.css
```

**技术实现**:

```javascript
// commands/apply.mjs 修改

export async function applyCommand(ctx) {
  const workflow = await getWorkflowState();
  
  if (workflow.mode === MODE.MINIMAL) {
    // 极简模式：直接收集变更描述
    let changeDesc;
    
    if (ctx.options.desc) {
      changeDesc = ctx.options.desc;
    } else if (ctx.options.from) {
      changeDesc = await readFile(ctx.options.from);
    } else {
      changeDesc = await collectMinimalChangeDescription();
    }
    
    // 生成简化的增量规范
    const incrementSpec = generateMinimalIncrement(workflow.baseline, changeDesc);
    
    // 保存增量规范
    await saveIncrement(incrementSpec);
    
    terminal.success('变更规范已生成');
    terminal.hint('下一步: incspec archive -y');
  } else {
    // 快速/完整模式：使用原有逻辑
    await executeApply(ctx);
  }
}

async function collectMinimalChangeDescription() {
  const answers = await terminal.prompt([
    {
      type: 'list',
      name: 'type',
      message: '变更类型:',
      choices: ['Bug 修复', '功能新增', '功能修改', '重构'],
    },
    {
      type: 'input',
      name: 'description',
      message: '简要描述:',
      validate: (v) => v.length > 0 || '请输入变更描述',
    },
    {
      type: 'input',
      name: 'files',
      message: '影响文件 (可选，逗号分隔):',
    },
  ]);
  
  return formatChangeDescription(answers);
}
```

**验收标准**:
- [ ] 极简模式下 apply 支持交互式输入
- [ ] 支持 `--desc` 直接指定描述
- [ ] 支持 `--from` 从文件读取
- [ ] 生成简化的增量规范文件

---

#### 任务 1.3: 极简模式下的 archive 命令简化

**目标**: 极简模式下跳过合并步骤，直接归档

**实现内容**:

```javascript
// commands/archive.mjs 修改

export async function archiveCommand(ctx) {
  const workflow = await getWorkflowState();
  
  if (workflow.mode === MODE.MINIMAL) {
    // 极简模式：跳过合并确认，直接归档
    const skipConfirm = ctx.options.yes || ctx.options.y;
    
    if (!skipConfirm) {
      const confirm = await terminal.confirm(
        '极简模式将跳过合并步骤，直接归档。是否继续？'
      );
      if (!confirm) {
        terminal.info('已取消');
        return;
      }
    }
    
    // 将增量规范归档（不更新基线）
    await archiveIncrement(workflow, { updateBaseline: false });
    
    terminal.success('归档完成');
    terminal.hint('提示: 使用完整模式可自动更新基线');
  } else {
    // 快速/完整模式：使用原有逻辑（先合并再归档）
    await executeArchive(ctx);
  }
}
```

**验收标准**:
- [ ] 极简模式跳过合并步骤
- [ ] `-y` 参数跳过确认
- [ ] 归档不更新基线（可选行为）
- [ ] 提示用户完整模式的优势

---

#### 任务 1.4: 模式升级命令

**目标**: 允许用户从极简模式无缝升级到快速或完整模式

**实现内容**:

```bash
# 新增命令: incspec upgrade
incspec upgrade --to=quick    # 升级到快速模式
incspec upgrade --to=full     # 升级到完整模式
incspec upgrade --list        # 查看需要补充的步骤
```

**技术实现**:

```javascript
// commands/upgrade.mjs (新增)

export async function upgradeCommand(ctx) {
  const workflow = await getWorkflowState();
  const targetMode = ctx.options.to;
  
  if (ctx.options.list) {
    // 显示需要补充的步骤
    const missingSteps = getMissingSteps(workflow.mode, targetMode);
    terminal.info('需要补充执行的步骤:');
    missingSteps.forEach((step) => {
      terminal.log(`  ${step.id}. ${step.label} (incspec ${step.command})`);
    });
    return;
  }
  
  if (!targetMode) {
    terminal.error('请指定目标模式: --to=quick 或 --to=full');
    return;
  }
  
  // 验证升级路径
  if (!isValidUpgrade(workflow.mode, targetMode)) {
    terminal.error(`无法从 ${workflow.mode} 模式升级到 ${targetMode} 模式`);
    return;
  }
  
  // 更新工作流模式
  await updateWorkflowMode(targetMode);
  
  // 提示下一步
  const nextStep = getNextPendingStep();
  terminal.success(`已升级到 ${targetMode} 模式`);
  terminal.hint(`下一步: incspec ${nextStep.command}`);
}

function getMissingSteps(currentMode, targetMode) {
  const currentSteps = getStepsForMode(currentMode);
  const targetSteps = getStepsForMode(targetMode);
  
  return targetSteps.filter(
    (step) => !currentSteps.find((s) => s.id === step.id)
  );
}

function isValidUpgrade(from, to) {
  const order = { minimal: 0, quick: 1, full: 2 };
  return order[to] > order[from];
}
```

**验收标准**:
- [ ] 支持从 minimal 升级到 quick 或 full
- [ ] 支持从 quick 升级到 full
- [ ] `--list` 显示需要补充的步骤
- [ ] 升级后工作流状态正确更新
- [ ] 升级后对 WORKFLOW.md 中状态正确反映

---

### 里程碑 2: 基线差异分析 (v0.3.0)

**优先级**: P0 (必须完成)

> 注：此任务从原阶段 2 (phase2-codegen.md) 前移，以尽早展示核心差异化价值。

#### 任务 2.1: 差异分析命令

**目标**: 提供可视化的基线与变更差异分析

**实现内容**:

```bash
# 新增命令: incspec diff
incspec diff                           # 对比当前增量与基线
incspec diff --baseline=v1.md          # 指定基线版本
incspec diff --format=json             # JSON 格式输出
incspec diff --format=markdown         # Markdown 报告
incspec diff --output=report.md        # 输出到文件
```

**差异报告结构**:

```markdown
# 基线差异分析报告

## 概览

| 项目 | 值 |
|------|-----|
| 基线版本 | home-baseline-v1.md |
| 增量版本 | search-filter-increment-v1.md |
| 分析时间 | 2024-12-24 10:30:00 |
| 总体风险等级 | 中 |

## 变更统计

| 类型 | 新增 | 修改 | 删除 | 风险 |
|------|------|------|------|------|
| API | 2 | 1 | 0 | 中 |
| 组件 | 3 | 2 | 0 | 低 |
| Store | 0 | 2 | 0 | 高 |
| 类型 | 4 | 0 | 0 | 低 |
| 工具函数 | 1 | 0 | 0 | 低 |

## 变更详情

### API 变更

#### 新增
- `GET /api/products/search` - 产品搜索接口
- `GET /api/filters/options` - 筛选选项接口

#### 修改
- `GET /api/products` - 新增 `filter` 查询参数

### 组件变更

#### 新增
- `SearchFilter.tsx` - 搜索筛选组件
- `FilterPanel.tsx` - 筛选面板组件
- `FilterTag.tsx` - 筛选标签组件

#### 修改
- `ProductList.tsx` - 集成搜索筛选功能
- `Header.tsx` - 添加搜索入口

### Store 变更

#### 修改
- `homeStore.ts`
  - 新增 `searchKeyword` 状态
  - 新增 `activeFilters` 状态
  - 修改 `products` 字段结构 (见破坏性变更)

## 影响范围

### 直接影响 (5 个文件)
- src/views/Home/index.tsx
- src/components/SearchFilter.tsx
- src/components/ProductList.tsx
- src/store/homeStore.ts
- src/api/products.ts

### 间接影响 (3 个文件)
- src/views/Dashboard/index.tsx (使用相同 Store)
- src/components/ProductCard.tsx (ProductList 子组件)
- src/hooks/useProducts.ts (依赖 products API)
```

**技术实现**:

```javascript
// lib/diff-analyzer.mjs (新增)

export class DiffAnalyzer {
  constructor(baselineDoc, incrementDoc) {
    this.baseline = this.parseSpec(baselineDoc);
    this.increment = this.parseSpec(incrementDoc);
  }

  analyze() {
    return {
      overview: this.generateOverview(),
      statistics: this.calculateStatistics(),
      changes: this.detectChanges(),
      impact: this.analyzeImpact(),
      breakingChanges: this.detectBreakingChanges(),
      riskLevel: this.assessOverallRisk(),
    };
  }

  parseSpec(doc) {
    // 解析规范文档结构
    return {
      apis: this.extractApis(doc),
      components: this.extractComponents(doc),
      stores: this.extractStores(doc),
      types: this.extractTypes(doc),
      utils: this.extractUtils(doc),
    };
  }

  calculateStatistics() {
    const stats = {};
    const categories = ['apis', 'components', 'stores', 'types', 'utils'];
    
    for (const category of categories) {
      stats[category] = {
        added: this.findAdditions(category),
        modified: this.findModifications(category),
        removed: this.findRemovals(category),
        risk: this.assessCategoryRisk(category),
      };
    }
    
    return stats;
  }

  detectChanges() {
    return {
      apis: {
        added: this.findAdditions('apis'),
        modified: this.findModifications('apis'),
        removed: this.findRemovals('apis'),
      },
      components: {
        added: this.findAdditions('components'),
        modified: this.findModifications('components'),
        removed: this.findRemovals('components'),
      },
      stores: {
        added: this.findAdditions('stores'),
        modified: this.findModifications('stores'),
        removed: this.findRemovals('stores'),
      },
      types: {
        added: this.findAdditions('types'),
        modified: this.findModifications('types'),
        removed: this.findRemovals('types'),
      },
    };
  }

  analyzeImpact() {
    return {
      direct: this.findDirectImpact(),
      indirect: this.findIndirectImpact(),
    };
  }

  findDirectImpact() {
    // 直接变更的文件列表
    const files = new Set();
    
    for (const change of this.increment.changes || []) {
      if (change.file) {
        files.add(change.file);
      }
    }
    
    return Array.from(files);
  }

  findIndirectImpact() {
    // 分析依赖关系，找出间接影响的文件
    const directFiles = this.findDirectImpact();
    const indirectFiles = new Set();
    
    for (const file of directFiles) {
      const dependents = this.findDependents(file);
      dependents.forEach((f) => {
        if (!directFiles.includes(f)) {
          indirectFiles.add(f);
        }
      });
    }
    
    return Array.from(indirectFiles);
  }

  assessOverallRisk() {
    const stats = this.calculateStatistics();
    let maxRisk = 'low';
    
    for (const category of Object.values(stats)) {
      if (category.risk === 'high') {
        return 'high';
      }
      if (category.risk === 'medium') {
        maxRisk = 'medium';
      }
    }
    
    // 考虑破坏性变更
    const breakingChanges = this.detectBreakingChanges();
    if (breakingChanges.length > 0) {
      return 'high';
    }
    
    return maxRisk;
  }
}
```

**验收标准**:
- [ ] `incspec diff` 命令正常工作
- [ ] 差异报告包含所有必要信息
- [ ] 支持 JSON 和 Markdown 格式输出
- [ ] 风险等级评估准确

---

#### 任务 2.2: 差异可视化（终端输出）

**目标**: 在终端中提供直观的差异展示

**实现内容**:

```bash
$ incspec diff

┌─────────────────────────────────────────────────────────────┐
│                    基线差异分析                              │
├─────────────────────────────────────────────────────────────┤
│ 基线: home-baseline-v1.md                                   │
│ 增量: search-filter-increment-v1.md                         │
│ 风险等级: ████░░░░░░ 中                                      │
└─────────────────────────────────────────────────────────────┘

变更统计:
  ┌──────────┬──────┬──────┬──────┬──────┐
  │ 类型     │ 新增 │ 修改 │ 删除 │ 风险 │
  ├──────────┼──────┼──────┼──────┼──────┤
  │ API      │  2   │  1   │  0   │  中  │
  │ 组件     │  3   │  2   │  0   │  低  │
  │ Store    │  0   │  2   │  0   │  高  │
  │ 类型     │  4   │  0   │  0   │  低  │
  └──────────┴──────┴──────┴──────┴──────┘

破坏性变更:
  ⚠ Store 状态结构修改 (homeStore.ts)
    products 字段类型从 Product[] 改为 { list: Product[], total: number }

影响范围:
  直接: 5 个文件
  间接: 3 个文件

使用 --output=report.md 生成详细报告
```

**验收标准**:
- [ ] 终端输出美观易读
- [ ] 风险等级有颜色标识
- [ ] 破坏性变更突出显示

---

### 里程碑 3: 破坏性变更检测 (v0.3.0)

**优先级**: P0 (必须完成)

> 注：此任务从原阶段 2 前移。

#### 任务 3.1: 破坏性变更规则引擎

**目标**: 定义并检测常见的破坏性变更模式

**破坏性变更规则**:

```javascript
// lib/breaking-change-rules.mjs

export const BREAKING_RULES = [
  {
    id: 'api-signature-change',
    name: 'API 签名变更',
    severity: 'high',
    detect: (baseline, increment) => {
      // 检测 API 参数删除或类型变更
      const changes = [];
      for (const api of increment.apis) {
        const baselineApi = baseline.apis.find((a) => a.name === api.name);
        if (baselineApi) {
          // 检查必填参数是否变化
          const removedParams = baselineApi.params.filter(
            (p) => p.required && !api.params.find((ap) => ap.name === p.name)
          );
          if (removedParams.length > 0) {
            changes.push({
              type: 'api-param-removed',
              api: api.name,
              params: removedParams.map((p) => p.name),
              message: `API ${api.name} 移除了必填参数: ${removedParams.map((p) => p.name).join(', ')}`,
            });
          }
          
          // 检查返回类型是否变化
          if (api.returnType !== baselineApi.returnType) {
            changes.push({
              type: 'api-return-type-change',
              api: api.name,
              from: baselineApi.returnType,
              to: api.returnType,
              message: `API ${api.name} 返回类型从 ${baselineApi.returnType} 改为 ${api.returnType}`,
            });
          }
        }
      }
      return changes;
    },
  },
  {
    id: 'store-state-structure-change',
    name: 'Store 状态结构变更',
    severity: 'high',
    detect: (baseline, increment) => {
      // 检测 Store 状态字段类型变化
      const changes = [];
      for (const store of increment.stores) {
        const baselineStore = baseline.stores.find((s) => s.name === store.name);
        if (baselineStore) {
          for (const field of store.state) {
            const baselineField = baselineStore.state.find((f) => f.name === field.name);
            if (baselineField && field.type !== baselineField.type) {
              changes.push({
                type: 'store-field-type-change',
                store: store.name,
                field: field.name,
                from: baselineField.type,
                to: field.type,
                message: `Store ${store.name} 的 ${field.name} 字段类型从 ${baselineField.type} 改为 ${field.type}`,
              });
            }
          }
        }
      }
      return changes;
    },
  },
  {
    id: 'component-props-required-change',
    name: '组件必填 Props 变更',
    severity: 'medium',
    detect: (baseline, increment) => {
      // 检测组件必填 props 的新增
      const changes = [];
      for (const component of increment.components) {
        const baselineComponent = baseline.components.find((c) => c.name === component.name);
        if (baselineComponent) {
          const newRequiredProps = component.props.filter(
            (p) => p.required && !baselineComponent.props.find((bp) => bp.name === p.name)
          );
          if (newRequiredProps.length > 0) {
            changes.push({
              type: 'component-new-required-props',
              component: component.name,
              props: newRequiredProps.map((p) => p.name),
              message: `组件 ${component.name} 新增了必填 props: ${newRequiredProps.map((p) => p.name).join(', ')}`,
            });
          }
        }
      }
      return changes;
    },
  },
  {
    id: 'type-definition-change',
    name: '类型定义变更',
    severity: 'medium',
    detect: (baseline, increment) => {
      // 检测导出类型的结构变化
      const changes = [];
      for (const type of increment.types) {
        const baselineType = baseline.types.find((t) => t.name === type.name);
        if (baselineType && type.exported && baselineType.exported) {
          // 检测移除的必填字段
          const removedFields = baselineType.fields.filter(
            (f) => !f.optional && !type.fields.find((tf) => tf.name === f.name)
          );
          if (removedFields.length > 0) {
            changes.push({
              type: 'type-field-removed',
              typeName: type.name,
              fields: removedFields.map((f) => f.name),
              message: `类型 ${type.name} 移除了字段: ${removedFields.map((f) => f.name).join(', ')}`,
            });
          }
        }
      }
      return changes;
    },
  },
];
```

**检测命令**:

```bash
# 破坏性变更检测集成到 diff 命令
incspec diff --check-breaking        # 只显示破坏性变更
incspec diff --fail-on-breaking      # 有破坏性变更时返回非零退出码
```

**验收标准**:
- [ ] 检测 API 签名变更
- [ ] 检测 Store 状态结构变更
- [ ] 检测组件必填 Props 变更
- [ ] 检测类型定义变更
- [ ] 生成修复建议

---

#### 任务 3.2: 风险评估报告

**目标**: 综合评估变更风险并提供建议

**实现内容**:

```markdown
## 风险评估报告

### 总体风险: 高

### 风险因素

| 因素 | 等级 | 说明 |
|------|------|------|
| 破坏性变更 | 高 | 发现 1 个 Store 结构变更 |
| 影响范围 | 中 | 间接影响 3 个文件 |
| 测试覆盖 | 中 | 受影响区域测试覆盖率 45% |
| 回滚难度 | 低 | 变更可安全回滚 |

### 建议

1. **高优先级**: 处理破坏性变更
   - 为 `homeStore.ts` 的 `products` 字段添加兼容层
   - 或批量更新所有使用 `products` 的组件

2. **中优先级**: 增加测试覆盖
   - 为 `ProductList.tsx` 添加单元测试
   - 添加搜索功能的 E2E 测试

3. **低优先级**: 代码审查
   - 确认间接影响的文件不需要修改
```

**技术实现**:

```javascript
// lib/risk-assessor.mjs

export class RiskAssessor {
  constructor(diffResult, projectContext) {
    this.diff = diffResult;
    this.context = projectContext;
  }

  assess() {
    const factors = {
      breakingChanges: this.assessBreakingChanges(),
      impactScope: this.assessImpactScope(),
      testCoverage: this.assessTestCoverage(),
      rollbackDifficulty: this.assessRollbackDifficulty(),
    };

    return {
      overall: this.calculateOverallRisk(factors),
      factors,
      recommendations: this.generateRecommendations(factors),
    };
  }

  assessBreakingChanges() {
    const count = this.diff.breakingChanges.length;
    if (count === 0) return { level: 'low', description: '无破坏性变更' };
    if (count <= 2) return { level: 'medium', description: `发现 ${count} 个破坏性变更` };
    return { level: 'high', description: `发现 ${count} 个破坏性变更` };
  }

  assessImpactScope() {
    const indirect = this.diff.impact.indirect.length;
    if (indirect === 0) return { level: 'low', description: '无间接影响' };
    if (indirect <= 5) return { level: 'medium', description: `间接影响 ${indirect} 个文件` };
    return { level: 'high', description: `间接影响 ${indirect} 个文件` };
  }

  assessTestCoverage() {
    // 基于项目上下文评估测试覆盖
    const coverage = this.context.testCoverage || 0;
    if (coverage >= 70) return { level: 'low', description: `测试覆盖率 ${coverage}%` };
    if (coverage >= 40) return { level: 'medium', description: `测试覆盖率 ${coverage}%` };
    return { level: 'high', description: `测试覆盖率 ${coverage}%` };
  }

  assessRollbackDifficulty() {
    // 评估回滚难度
    const hasDbChanges = this.diff.changes.some((c) => c.type === 'database');
    const hasApiBreaking = this.diff.breakingChanges.some((c) => c.type.startsWith('api-'));
    
    if (hasDbChanges) return { level: 'high', description: '包含数据库变更，回滚复杂' };
    if (hasApiBreaking) return { level: 'medium', description: 'API 变更可能影响客户端' };
    return { level: 'low', description: '变更可安全回滚' };
  }

  calculateOverallRisk(factors) {
    const levels = Object.values(factors).map((f) => f.level);
    if (levels.includes('high')) return 'high';
    if (levels.filter((l) => l === 'medium').length >= 2) return 'high';
    if (levels.includes('medium')) return 'medium';
    return 'low';
  }

  generateRecommendations(factors) {
    const recommendations = [];
    
    if (factors.breakingChanges.level !== 'low') {
      recommendations.push({
        priority: 'high',
        category: '处理破坏性变更',
        actions: this.generateBreakingChangeActions(),
      });
    }
    
    if (factors.testCoverage.level !== 'low') {
      recommendations.push({
        priority: 'medium',
        category: '增加测试覆盖',
        actions: this.generateTestActions(),
      });
    }
    
    if (factors.impactScope.level !== 'low') {
      recommendations.push({
        priority: 'low',
        category: '代码审查',
        actions: ['确认间接影响的文件不需要修改'],
      });
    }
    
    return recommendations;
  }
}
```

**验收标准**:
- [ ] 综合评估多个风险因素
- [ ] 生成可操作的建议
- [ ] 按优先级排序建议

---

## 技术债务

本阶段需要关注的技术债务：

1. **规范解析器增强**
   - 当前解析器可能需要增强以支持差异分析
   - 需要标准化规范文档的结构定义

2. **测试覆盖**
   - 差异分析器需要全面的单元测试
   - 破坏性变更检测规则需要测试覆盖

3. **性能优化**
   - 大型规范文档的解析性能
   - 差异计算算法优化

---

## 模板同步任务

### 必须更新的模板

1. **AGENTS.md**
   - 新增极简模式说明
   - 新增 `incspec diff` 命令文档
   - 新增 `incspec upgrade` 命令文档

2. **SKILL.md**
   - 更新工作流模式说明（MINIMAL/QUICK/FULL）
   - 新增差异分析使用指南
   - 新增破坏性变更处理最佳实践

3. **commands/ 模板**
   - 新增 `inc-diff.md` 命令模板
   - 新增 `inc-upgrade.md` 命令模板
   - 更新 `inc-analyze.md` 增加 `--minimal` 参数

---

## 成功指标

### 量化指标

- 极简模式完成时间: < 5 分钟
- 差异分析准确率: > 85%
- 破坏性变更检测率: > 80%
- 模式升级成功率: > 95%

### 定性指标

- 用户能清晰理解三种模式的区别
- 差异报告对决策有实际帮助
- 破坏性变更建议可直接操作

---

## 风险和缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 极简模式过于简化，无法满足需求 | 中 | 中 | 提供清晰的模式升级路径 |
| 差异分析不够准确 | 中 | 高 | 先支持核心场景，逐步扩展 |
| 破坏性变更误报 | 低 | 中 | 提供 `--ignore` 选项 |
| 规范解析复杂度 | 中 | 中 | 定义标准化的规范格式 |

---

## 下一步

完成阶段 1A 后，进入：

1. **阶段 1B: AI 工具生态扩展** - 并行推进，扩展 AI 工具支持
2. **阶段 2: 交互体验增强** - 在核心能力基础上提升交互体验

---

**关联文档**:
- [ROADMAP.md](./ROADMAP.md) - 路线图总览
- [phase1b-ai-ecosystem.md](./phase1b-ai-ecosystem.md) - AI 工具生态扩展
- [phase2-interaction.md](./phase2-interaction.md) - 交互体验增强
