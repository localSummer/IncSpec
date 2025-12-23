# 阶段 5: 生态系统建设

> v0.9.x - v1.0.x | 预计 3-4 个月

## 阶段背景

在阶段 1B 中，AI 适配层的基础架构已经建立，支持了 5+ AI 工具。本阶段将在此基础上构建完整的插件系统和社区生态，并完成 v1.0 正式版的发布准备工作。

## 与前置阶段的关系

**阶段 1B 已完成的能力**（本阶段复用和增强）：
- 统一 AI 适配层接口（AIAdapter 接口）
- 适配器管理器（AIAdapterManager）
- 5+ AI 工具支持

**本阶段新增能力**：
- 插件系统和 Registry
- 上下文优化和压缩
- 多模型支持策略
- 可观测性平台

## 阶段目标

构建可扩展的插件系统和社区生态，让 IncSpec 成为一个开放的平台，吸引社区贡献，支持更多 AI 工具和使用场景。

## 核心问题

当前版本的局限性：
- 功能扩展依赖核心代码修改
- 缺乏可观测性和诊断工具
- 社区贡献门槛高
- 插件生态尚未建立

## 关键成果

### 1. 插件系统（v1.0 前以 registry 形态落地）
- 标准化插件 API
- 插件发现（registry，静态清单优先）
- 插件开发工具

### 2. AI 适配层增强（基于阶段 1B 基础）
- 上下文优化和压缩
- 多模型支持策略
- 10+ AI 工具支持（扩展目标）

### 3. 可观测性平台
- 详细的日志和追踪
- 性能监控和告警
- 问题诊断工具

### 4. v1.0 正式版发布
- 功能完善和稳定性
- 文档齐全
- 社区运营

## 重要补充：安全、兼容与可协调要求（P0）

阶段 5 将引入可扩展能力（插件等），为确保在 v1.0.0 前保持向后兼容并可验证/可监控/可协调，本阶段新增以下硬性要求：
+
+### 1) 插件分发形态降级：Marketplace → Registry
+- v0.9.x：只承诺 **插件系统 + registry（静态清单）**，不承诺上线完整“市场”（评分/下载量/在线搜索服务等）
+- registry 建议以仓库内 `registry.json`（或同等结构）形式存在，便于审查、版本控制与回滚
+- 插件安装优先支持“本地路径/已下载包/明确来源”，降低供应链风险
+
+### 2) 安全要求（必须）
+- 插件包必须具备完整性校验（至少 checksum；如后续支持签名则增加 signature）
+- 必须提供安全边界说明：插件具备的能力范围、可能的风险、用户如何禁用/卸载
+- 默认不开启任何远程上报；若未来引入远程能力必须明确用户授权与隐私策略
+
+### 3) 兼容要求（必须）
+- 插件 API 需要版本化：明确定义支持的 `incspec` 引擎版本范围（例如 `engines.incspec`）
+- 插件加载失败必须可降级：不应阻断核心工作流（除非用户显式配置为 blocking）
+- CLI/模板变更涉及插件扩展点时，必须同步更新文档与模板，并通过模板一致性校验
+
+---
+
+## 详细任务

### 里程碑 1: 插件系统 (v0.9.0)

**优先级**: P0 (必须完成)

#### 任务 1.1: 插件架构设计

**目标**: 设计灵活、安全的插件系统

**重要：插件能力边界**

插件系统必须遵循 IncSpec 的核心定位——**规范生成而非执行**：

| 允许的能力 | 禁止的能力 |
|-----------|-----------|
| 扩展规范文档解析能力（如 Vue/React 组件分析） | 直接执行用户代码（测试、编译、运行） |
| 生成规范/模板/配置文件 | 修改用户项目文件（除 `incspec/` 目录外） |
| 扩展不同语言/框架的规范模板 | 调用外部工具并执行（如运行 jest/eslint） |
| 增强 IncSpec 自身命令的交互体验 | 读取敏感信息（环境变量、密钥）除非明确授权 |
| 格式化和美化规范文档输出 | 进行网络请求（除非用户明确同意且有安全策略） |

**安全要求**:
- 插件包必须具备完整性校验（checksum 或 signature）
- 插件能力必须在文档中明确声明
- 提供用户可控的禁用/卸载机制
- 默认不开启任何远程能力

**插件类型**:
1. **命令插件**: 扩展新命令（限于 IncSpec 自身功能增强）
2. **分析插件**: 增强规范文档分析能力（解析不同语言/框架的代码结构）
3. **生成器插件**: 自定义规范模板生成（不执行生成的代码）
4. **模板插件**: 扩展不同生态的规范模板库
5. **主题插件**: 自定义输出样式和格式

**插件 API**:
```typescript
// types/plugin.d.ts
export interface IncSpecPlugin {
  name: string;
  version: string;
  description: string;
  
  // 插件生命周期
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
  
  // 可选的钩子
  hooks?: {
    beforeAnalyze?: (context: AnalyzeContext) => Promise<void>;
    afterAnalyze?: (result: AnalyzeResult) => Promise<void>;
    beforeApply?: (context: ApplyContext) => Promise<void>;
    afterApply?: (result: ApplyResult) => Promise<void>;
    // ... 更多钩子
  };
  
  // 可选的命令
  commands?: {
    [name: string]: CommandHandler;
  };
  
  // 可选的配置
  config?: PluginConfig;
}

export interface PluginContext {
  projectRoot: string;
  workflowState: WorkflowState;
  config: ProjectConfig;
  
  // 工具函数
  logger: Logger;
  terminal: Terminal;
  fileSystem: FileSystemAPI; // 仅限访问 incspec/ 目录
  
  // 注册功能
  registerCommand(name: string, handler: CommandHandler): void;
  registerAnalyzer(name: string, analyzer: Analyzer): void; // 分析规范文档，非执行代码
  registerGenerator(name: string, generator: Generator): void; // 生成规范模板，非执行代码
}

/**
 * 文件系统 API 限制说明
 * - 插件只能读写 incspec/ 目录内的文件
 * - 不能修改用户项目源码（src/、app/ 等）
 * - 不能执行 shell 命令或调用外部程序
 */
export interface FileSystemAPI {
  readSpecFile(path: string): Promise<string>;
  writeSpecFile(path: string, content: string): Promise<void>;
  listSpecFiles(pattern: string): Promise<string[]>;
  // 不提供通用的 exec()、spawn() 等方法
}
```

**插件示例**:
```javascript
// plugins/incspec-plugin-vue/index.mjs
export default {
  name: 'incspec-plugin-vue',
  version: '1.0.0',
  description: 'Vue.js 项目支持 - 生成 Vue 组件规范模板',
  
  async activate(context) {
    // 注册 Vue 组件分析器（分析代码结构，生成规范文档）
    context.registerAnalyzer('vue-component', {
      pattern: '**/*.vue',
      analyze: async (filePath) => {
        // 读取并解析 Vue 单文件组件结构
        const content = await context.fileSystem.readFile(filePath);
        const { template, script, style } = parseVueStructure(content);
        
        // 返回结构化规范，不执行代码
        return {
          componentName: extractComponentName(script),
          props: extractProps(script),
          emits: extractEmits(script),
          templateStructure: analyzeTemplate(template),
          styleScoped: style.scoped
        };
      }
    });
    
    // 注册 Vue 测试规范生成器（生成测试模板文档）
    context.registerGenerator('vue-test-spec', {
      generate: async (componentSpec) => {
        // 生成测试规范模板文档（供 AI 参考）
        return generateVueTestTemplate(componentSpec);
        // 注意：不执行测试，不调用 vitest/jest
      }
    });
    
    context.logger.info('Vue 插件已激活 - 仅生成规范，不执行代码');
  },
  
  async deactivate() {
    // 清理资源
  }
};
```

**反例（禁止的插件行为）**:
```javascript
// ❌ 错误示例 - 不要这样做
async activate(context) {
  // ❌ 禁止：执行测试
  context.registerCommand('run-tests', async () => {
    await exec('npm test'); // 违反边界
  });
  
  // ❌ 禁止：修改用户源码
  context.registerCommand('fix-code', async () => {
    await context.fileSystem.writeFile('src/App.vue', fixedCode); // 违反边界
  });
  
  // ❌ 禁止：调用外部工具
  context.registerAnalyzer('eslint-check', {
    analyze: async (file) => {
      const result = await exec('eslint ' + file); // 违反边界
      return result;
    }
  });
}
```

**技术实现**:
```javascript
// lib/plugin-manager.mjs
export class PluginManager {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.plugins = new Map();
    this.hooks = new HookRegistry();
    this.options = {
      failOnPluginError: false, // 插件加载失败不阻断核心功能
      enableSandbox: true,      // 启用沙箱限制
      ...options
    };
  }

  async loadPlugin(pluginPath) {
    try {
      // 1. 安全检查：验证插件包完整性
      await this.verifyPluginIntegrity(pluginPath);
      
      // 2. 加载插件模块
      const plugin = await import(pluginPath);
      
      // 3. 验证插件接口和能力边界
      this.validatePlugin(plugin);
      
      // 4. 检查 IncSpec 引擎版本兼容性
      this.checkEngineCompatibility(plugin);
      
      // 5. 创建受限的插件上下文（沙箱）
      const context = this.createSandboxedContext(plugin);
      
      // 6. 激活插件
      await plugin.activate(context);
      
      // 7. 注册插件
      this.plugins.set(plugin.name, plugin);
      
      console.log(`✓ 插件 ${plugin.name} 加载成功`);
    } catch (error) {
      console.warn(`⚠ 插件加载失败: ${pluginPath}`);
      console.warn(`  原因: ${error.message}`);
      
      // 降级策略：不阻断核心工作流
      if (this.options.failOnPluginError) {
        throw error;
      } else {
        console.warn(`  继续运行（插件已禁用）`);
      }
    }
  }
  
  verifyPluginIntegrity(pluginPath) {
    // 验证 checksum 或 signature
    // 详细实现见安全模块
  }
  
  validatePlugin(plugin) {
    // 验证必需字段
    if (!plugin.name || !plugin.version || !plugin.activate) {
      throw new Error('插件缺少必需字段: name, version, activate');
    }
    
    // 验证能力声明（禁止的能力）
    if (plugin.capabilities?.includes('execute_code')) {
      throw new Error('插件声明了被禁止的能力: execute_code');
    }
  }
  
  checkEngineCompatibility(plugin) {
    const engineVersion = require('../package.json').version;
    const requiredVersion = plugin.engines?.incspec;
    
    if (requiredVersion && !semver.satisfies(engineVersion, requiredVersion)) {
      throw new Error(`插件需要 IncSpec ${requiredVersion}，当前版本 ${engineVersion}`);
    }
  }
  
  createSandboxedContext(plugin) {
    return {
      projectRoot: this.projectRoot,
      workflowState: this.getWorkflowState(),
      config: this.getConfig(),
      
      logger: this.createLogger(plugin.name),
      terminal: this.createTerminal(),
      fileSystem: this.createRestrictedFS(), // 仅限 incspec/ 目录
      
      registerCommand: this.registerCommand.bind(this),
      registerAnalyzer: this.registerAnalyzer.bind(this),
      registerGenerator: this.registerGenerator.bind(this),
    };
  }
  
  createRestrictedFS() {
    const incspecDir = path.join(this.projectRoot, 'incspec');
    
    return {
      async readSpecFile(relativePath) {
        const fullPath = path.join(incspecDir, relativePath);
        // 检查路径是否在 incspec/ 目录内
        if (!fullPath.startsWith(incspecDir)) {
          throw new Error('插件只能访问 incspec/ 目录');
        }
        return fs.readFile(fullPath, 'utf8');
      },
      
      async writeSpecFile(relativePath, content) {
        const fullPath = path.join(incspecDir, relativePath);
        if (!fullPath.startsWith(incspecDir)) {
          throw new Error('插件只能访问 incspec/ 目录');
        }
        return fs.writeFile(fullPath, content, 'utf8');
      },
      
      // 不提供 exec()、spawn() 等方法
    };
  }

  async executeHook(hookName, ...args) {
    // 按顺序执行所有插件的钩子，单个失败不影响其他
    for (const plugin of this.plugins.values()) {
      try {
        const hook = plugin.hooks?.[hookName];
        if (hook) {
          await hook(...args);
        }
      } catch (error) {
        console.warn(`⚠ 插件 ${plugin.name} 的钩子 ${hookName} 执行失败:`, error.message);
        // 继续执行其他插件
      }
    }
  }
}
```

**安全边界验证**:
```javascript
// lib/plugin-sandbox.mjs
export class PluginSandbox {
  static FORBIDDEN_MODULES = [
    'child_process', // 禁止执行外部命令
    'vm',           // 禁止动态代码执行
    'cluster',      // 禁止多进程
  ];
  
  static ALLOWED_FS_DIRS = [
    'incspec/',     // 仅允许访问规范目录
  ];
  
  static validateImport(modulePath) {
    if (this.FORBIDDEN_MODULES.includes(modulePath)) {
      throw new Error(`插件不允许导入模块: ${modulePath}`);
    }
  }
}
```

**验收标准**:
- [ ] 定义完整的插件 API
- [ ] 实现插件能力边界验证（禁止执行代码、修改用户文件等）
- [ ] 支持插件生命周期管理
- [ ] 实现钩子系统
- [ ] 插件加载失败不阻断核心工作流（降级策略）
- [ ] 提供文件系统沙箱（仅限访问 incspec/ 目录）
- [ ] 验证插件包完整性（checksum）
- [ ] 检查 IncSpec 引擎版本兼容性
- [ ] 提供插件开发者文档和安全规范

---

#### 任务 1.2: 插件 Registry（v1.0 前的“市场”替代方案）

**目标**: 提供插件发现和安装平台

**实现内容**:
```bash
# 搜索插件
$ incspec plugin search vue

搜索结果: 3 个插件

1. incspec-plugin-vue
   描述: Vue.js 项目支持
   版本: 1.2.0
   下载: 1.2k
   评分: ★★★★☆ (4.5/5)
   
2. incspec-plugin-vue-composition
   描述: Vue Composition API 增强
   版本: 0.5.0
   下载: 345
   评分: ★★★★☆ (4.2/5)
   
3. incspec-plugin-vuepress
   描述: VuePress 文档站点支持
   版本: 1.0.0
   下载: 180
   评分: ★★★☆☆ (3.8/5)

# 安装插件
$ incspec plugin install incspec-plugin-vue

正在安装 incspec-plugin-vue@1.2.0...
✓ 下载完成
✓ 验证签名
✓ 安装依赖
✓ 激活插件

插件已成功安装！

使用方式:
  - Vue 组件将被自动识别和分析
  - 运行 'incspec help vue' 查看新增命令

# 列出已安装插件
$ incspec plugin list

已安装插件: 5 个

  incspec-plugin-vue         1.2.0  启用
  incspec-plugin-react       2.0.1  启用
  incspec-plugin-tailwind    1.1.0  启用
  incspec-plugin-graphql     0.8.0  禁用
  incspec-plugin-docker      1.0.0  启用

# 更新插件
$ incspec plugin update

检查插件更新...
发现 2 个可更新插件:
  - incspec-plugin-vue: 1.2.0 → 1.3.0
  - incspec-plugin-react: 2.0.1 → 2.1.0

是否立即更新? [Y/n]
```

**插件注册表**:
```json
// https://registry.incspec.dev/plugins.json
{
  "plugins": [
    {
      "name": "incspec-plugin-vue",
      "description": "Vue.js 项目支持",
      "version": "1.2.0",
      "author": "IncSpec Team",
      "repository": "https://github.com/incspec/plugin-vue",
      "downloads": 1200,
      "rating": 4.5,
      "tags": ["vue", "framework", "frontend"],
      "keywords": ["vue", "vue3", "composition-api"],
      "engines": {
        "incspec": ">=0.9.0"
      },
      "tarball": "https://registry.incspec.dev/tarballs/incspec-plugin-vue-1.2.0.tgz",
      "checksum": "sha256:abc123..."
    }
  ]
}
```

**技术实现**:
```javascript
// lib/plugin-registry.mjs
export class PluginRegistry {
  constructor() {
    this.registryUrl = 'https://registry.incspec.dev';
  }

  async search(query) {
    // 搜索插件
    const response = await fetch(`${this.registryUrl}/search?q=${query}`);
    return response.json();
  }

  async install(name, version = 'latest') {
    // 1. 下载插件
    const tarball = await this.download(name, version);
    
    // 2. 验证签名
    await this.verify(tarball);
    
    // 3. 解压到插件目录
    const pluginDir = await this.extract(tarball);
    
    // 4. 安装依赖
    await this.installDeps(pluginDir);
    
    // 5. 激活插件
    await this.activate(name);
  }
}
```

**验收标准**:
- [ ] 实现插件注册表
- [ ] 支持插件搜索、安装、更新
- [ ] 验证插件签名
- [ ] 提供 Web 界面

---

#### 任务 1.3: 插件开发工具

**目标**: 简化插件开发流程

**实现内容**:
```bash
# 创建插件脚手架
$ incspec plugin create my-plugin

创建插件脚手架...

插件类型:
  1. 命令插件
  2. 分析插件
  3. 生成器插件
  4. 集成插件
  5. 主题插件

选择类型: 2

✓ 创建目录结构
✓ 生成配置文件
✓ 安装开发依赖
✓ 创建示例代码

插件已创建: ./my-plugin

下一步:
  cd my-plugin
  npm install
  npm run dev

# 调试插件
$ incspec plugin dev ./my-plugin

正在加载插件 (开发模式)...
✓ 插件已加载
✓ 监听文件变化

使用 'incspec <command>' 测试插件功能
按 Ctrl+C 停止

# 发布插件
$ incspec plugin publish

发布插件到 IncSpec 插件市场

验证插件配置...
✓ package.json 有效
✓ README.md 存在
✓ LICENSE 存在
✓ 测试通过

构建插件...
✓ 代码检查通过
✓ 文档生成完成
✓ 打包完成

发布到 registry.incspec.dev...
✓ 上传成功
✓ 发布完成

插件已发布: incspec-plugin-my-plugin@1.0.0
查看: https://incspec.dev/plugins/incspec-plugin-my-plugin
```

**插件脚手架结构**:
```
my-plugin/
├── package.json
├── README.md
├── LICENSE
├── src/
│   ├── index.mjs         # 插件入口
│   ├── analyzer.mjs      # 分析器实现
│   └── generator.mjs     # 生成器实现
├── tests/
│   └── index.test.mjs
├── docs/
│   └── usage.md
└── .incspec/
    └── plugin.config.json
```

**开发者文档**:
- 插件开发指南
- API 参考文档
- 最佳实践
- 示例代码

**验收标准**:
- [ ] 提供插件脚手架
- [ ] 支持插件调试
- [ ] 简化插件发布流程
- [ ] 完善开发者文档

---

### 里程碑 2: AI 适配层增强 (v0.9.5)

**优先级**: P0 (必须完成)

#### 任务 2.1: 统一 AI 工具接口

**目标**: 提供统一的接口适配不同 AI 工具

**支持的 AI 工具**:
- Claude Code
- Cursor
- GitHub Copilot
- Codeium
- Tabnine
- 通用 AGENTS.md

**统一接口设计**:
```typescript
// lib/ai-adapter.d.ts
export interface AIAdapter {
  name: string;
  version: string;
  
  // 检测是否支持
  isSupported(): boolean;
  
  // 同步命令/配置
  sync(commands: Command[]): Promise<void>;
  
  // 生成提示词
  generatePrompt(context: PromptContext): string;
  
  // 解析响应
  parseResponse(response: string): ParsedResponse;
}

export interface PromptContext {
  workflowStep: number;
  baseline?: string;
  requirements?: string;
  dependencies?: string;
  increment?: string;
}
```

**适配器实现**:
```javascript
// lib/adapters/claude-adapter.mjs
export class ClaudeAdapter {
  name = 'Claude Code';
  version = '1.0.0';
  
  isSupported() {
    return fs.existsSync('.claude/skills');
  }
  
  async sync(commands) {
    // 将命令转换为 Claude Skill
    for (const cmd of commands) {
      const skill = this.convertToSkill(cmd);
      await this.writeSkill(skill);
    }
  }
  
  generatePrompt(context) {
    // 根据上下文生成优化的提示词
    return `
      # 步骤 ${context.workflowStep}: ${STEPS[context.workflowStep].label}
      
      ## 基线信息
      ${context.baseline}
      
      ## 需求文档
      ${context.requirements}
      
      ## 任务
      ${this.getTaskDescription(context.workflowStep)}
    `;
  }
}

// lib/adapters/cursor-adapter.mjs
export class CursorAdapter {
  // 类似实现...
}

// lib/ai-adapter-manager.mjs
export class AIAdapterManager {
  constructor() {
    this.adapters = [
      new ClaudeAdapter(),
      new CursorAdapter(),
      new CopilotAdapter(),
      // ...
    ];
  }
  
  detectAdapters() {
    return this.adapters.filter(a => a.isSupported());
  }
  
  async syncAll(commands) {
    const supported = this.detectAdapters();
    await Promise.all(
      supported.map(adapter => adapter.sync(commands))
    );
  }
}
```

**验收标准**:
- [ ] 实现至少 5 个 AI 工具适配器
- [ ] 自动检测可用的 AI 工具
- [ ] 统一的同步接口
- [ ] 适配器可插拔

---

#### 任务 2.2: 上下文优化和压缩

**目标**: 优化提供给 AI 的上下文，减少 token 消耗

**优化策略**:
1. **智能摘要**: 提取关键信息
2. **分层上下文**: 根据任务提供不同级别的详细度
3. **引用压缩**: 使用引用代替重复内容
4. **增量上下文**: 仅提供变更部分

**实现内容**:
```javascript
// lib/context-optimizer.mjs
export class ContextOptimizer {
  optimize(context, options = {}) {
    const { maxTokens = 4000, compressionLevel = 'medium' } = options;
    
    // 1. 估算 token 数量
    let tokens = this.estimateTokens(context);
    
    if (tokens <= maxTokens) {
      return context; // 无需压缩
    }
    
    // 2. 应用压缩策略
    let compressed = context;
    
    // 移除注释和空白
    if (compressionLevel >= 'low') {
      compressed = this.removeComments(compressed);
      compressed = this.normalizeWhitespace(compressed);
      tokens = this.estimateTokens(compressed);
    }
    
    // 摘要化长文本
    if (compressionLevel >= 'medium' && tokens > maxTokens) {
      compressed = this.summarize(compressed);
      tokens = this.estimateTokens(compressed);
    }
    
    // 使用引用
    if (compressionLevel >= 'high' && tokens > maxTokens) {
      compressed = this.useReferences(compressed);
      tokens = this.estimateTokens(compressed);
    }
    
    return compressed;
  }
  
  summarize(text) {
    // 使用摘要算法提取关键信息
    // - 提取函数签名
    // - 提取类型定义
    // - 保留关键逻辑
    // - 移除实现细节
  }
  
  useReferences(context) {
    // 将重复内容替换为引用
    // 例如: "详见 baselines/home-baseline-v1.md:45-60"
  }
}
```

**上下文分层**:
```javascript
export const CONTEXT_LEVELS = {
  minimal: {
    maxTokens: 2000,
    includes: ['summary', 'types', 'interfaces']
  },
  standard: {
    maxTokens: 4000,
    includes: ['summary', 'types', 'interfaces', 'key-logic']
  },
  detailed: {
    maxTokens: 8000,
    includes: ['full-content']
  }
};
```

**验收标准**:
- [ ] 将上下文大小减少 40%+
- [ ] 保留关键信息完整性
- [ ] 支持多级压缩
- [ ] 提供压缩报告

---

#### 任务 2.3: 多模型支持

**目标**: 支持不同 AI 模型的特性

**模型配置**:
```yaml
# incspec/ai-config.yml
models:
  claude-3-opus:
    provider: anthropic
    contextWindow: 200000
    capabilities:
      - code-generation
      - code-analysis
      - test-generation
    costPerToken: 0.000015
    
  claude-3-sonnet:
    provider: anthropic
    contextWindow: 200000
    capabilities:
      - code-generation
      - code-analysis
    costPerToken: 0.000003
    
  gpt-4:
    provider: openai
    contextWindow: 128000
    capabilities:
      - code-generation
      - code-analysis
    costPerToken: 0.00003

strategies:
  analyze:
    preferredModel: claude-3-opus
    fallbackModel: claude-3-sonnet
    
  collect-req:
    preferredModel: claude-3-sonnet
    
  design:
    preferredModel: claude-3-opus
    
  apply:
    preferredModel: gpt-4
```

**模型选择器**:
```javascript
// lib/model-selector.mjs
export class ModelSelector {
  selectModel(task, context) {
    const config = this.loadConfig();
    const strategy = config.strategies[task];
    
    // 考虑因素:
    // 1. 任务类型
    // 2. 上下文大小
    // 3. 成本预算
    // 4. 可用性
    
    const contextSize = this.estimateContextSize(context);
    const model = this.findBestModel({
      task,
      contextSize,
      budget: config.budget,
      preferred: strategy.preferredModel
    });
    
    return model;
  }
}
```

**验收标准**:
- [ ] 支持至少 5 个主流模型
- [ ] 根据任务自动选择模型
- [ ] 支持成本优化
- [ ] 提供模型切换选项

---

### 里程碑 3: 可观测性平台 (v0.9.5)

**优先级**: P1 (重要)

#### 任务 3.1: 日志和追踪系统

**目标**: 提供详细的日志和操作追踪

**日志级别**:
- **DEBUG**: 详细调试信息
- **INFO**: 一般信息
- **WARN**: 警告信息
- **ERROR**: 错误信息
- **FATAL**: 致命错误

**实现内容**:
```javascript
// lib/logger.mjs
export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.outputs = options.outputs || [new ConsoleOutput()];
  }
  
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
  
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }
  
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }
  
  error(message, error, meta = {}) {
    this.log('ERROR', message, { ...meta, error });
  }
  
  log(level, message, meta) {
    if (this.shouldLog(level)) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
        trace: this.captureTrace()
      };
      
      for (const output of this.outputs) {
        output.write(entry);
      }
    }
  }
  
  captureTrace() {
    // 捕获调用栈
    const err = new Error();
    return err.stack;
  }
}

// 日志输出
export class FileOutput {
  constructor(logFile) {
    this.logFile = logFile;
  }
  
  write(entry) {
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }
}
```

**日志查看**:
```bash
$ incspec logs

最近的日志 (最后 50 条):

[2024-12-23 10:30:15] INFO  开始工作流: analyze-home-page
[2024-12-23 10:30:16] DEBUG 读取配置文件: incspec/project.md
[2024-12-23 10:30:18] INFO  分析文件: src/views/Home/index.tsx
[2024-12-23 10:30:20] WARN  未找到类型定义: ProductType
[2024-12-23 10:30:25] ERROR 解析失败: src/store/homeStore.ts
  Error: Unexpected token
  at parse (lib/parser.mjs:45)
[2024-12-23 10:30:30] INFO  生成基线报告: baselines/home-baseline-v1.md

# 查看特定级别日志
$ incspec logs --level=error

# 查看特定时间范围
$ incspec logs --since="2024-12-23 10:00" --until="2024-12-23 11:00"

# 导出日志
$ incspec logs --export=json > logs.json
```

**验收标准**:
- [ ] 完整的日志记录
- [ ] 支持多种输出方式
- [ ] 提供日志查询功能
- [ ] 日志文件自动轮转

---

#### 任务 3.2: 性能监控和告警

**目标**: 实时监控性能并提供告警

**监控指标**:
- 命令执行时间
- 内存使用
- 文件 I/O
- 网络请求
- 缓存命中率

**实现内容**:
```bash
$ incspec monitor

IncSpec 实时监控面板
====================

系统状态: 正常 ✓

当前活动:
  命令: analyze
  进度: 45%
  耗时: 2m 15s
  预计剩余: 3m 00s

性能指标:
  CPU: ████████░░ 78%
  内存: ███░░░░░░░ 342 MB / 512 MB
  磁盘: ██░░░░░░░░ 125 MB/s 读取
  网络: ░░░░░░░░░░ 0 KB/s

缓存统计:
  命中率: 82.5%
  大小: 156 MB
  条目: 1,245

告警: 0 个
最近更新: 2 秒前

按 'r' 刷新 | 按 'q' 退出
```

**告警配置**:
```yaml
# incspec/monitor.yml
alerts:
  - name: 高内存使用
    condition: memory > 400MB
    severity: warning
    action:
      - log
      - notify
      
  - name: 命令超时
    condition: duration > 10m
    severity: error
    action:
      - log
      - notify
      - abort
      
  - name: 低缓存命中率
    condition: cacheHitRate < 50%
    severity: warning
    action:
      - log
```

**验收标准**:
- [ ] 实时监控关键指标
- [ ] 可配置的告警规则
- [ ] 多种通知方式
- [ ] 性能数据可导出

---

#### 任务 3.3: 问题诊断工具

**目标**: 帮助用户快速诊断和解决问题

**实现内容**:
```bash
$ incspec doctor

IncSpec 环境诊断
================

检查项目配置...
  ✓ incspec/ 目录存在
  ✓ project.md 配置有效
  ✓ WORKFLOW.md 状态正常
  ✗ baselines/ 目录为空 (警告)

检查系统环境...
  ✓ Node.js 版本: v18.16.0 (满足要求)
  ✓ 磁盘空间: 45 GB 可用
  ✓ Git 已安装: v2.39.0
  ✗ 网络连接: 无法访问 registry.incspec.dev (错误)

检查依赖...
  ✓ 所有核心依赖已安装
  ⚠ 插件 incspec-plugin-vue 版本过旧 (1.0.0 → 1.3.0)

检查性能...
  ✓ 缓存正常工作
  ✓ 文件系统性能良好
  ⚠ 内存使用较高 (85%)

发现问题: 2 个错误, 2 个警告

建议修复:
  1. 网络连接问题
     原因: 无法访问插件注册表
     解决: 检查网络设置或使用代理
     
  2. 更新过期插件
     命令: incspec plugin update incspec-plugin-vue

运行 'incspec doctor --fix' 自动修复部分问题
```

**自动修复**:
```bash
$ incspec doctor --fix

自动修复问题...
  ✓ 更新插件 incspec-plugin-vue
  ✓ 清理缓存释放内存
  ✗ 网络连接问题需要手动解决

已修复 2/3 问题
```

**验收标准**:
- [ ] 检测常见问题
- [ ] 提供详细的诊断信息
- [ ] 支持自动修复
- [ ] 生成诊断报告

---

### 里程碑 4: v1.0 正式版发布 (v1.0.0)

**优先级**: P0 (必须完成)

#### 任务 4.1: 功能完善和稳定性

**目标**: 确保核心功能稳定可靠

**完善清单**:
- [ ] 所有核心命令功能完整
- [ ] 错误处理完善
- [ ] 性能达到目标
- [ ] 兼容性测试通过
- [ ] 安全审计通过
- [ ] 无已知严重 Bug

**稳定性测试**:
- 长时间运行测试
- 大型项目测试
- 极端场景测试
- 并发操作测试
- 性能回归测试

**验收标准**:
- [ ] 核心功能稳定性 > 99.9%
- [ ] 已知 Bug 数量 < 10
- [ ] 性能指标达标
- [ ] 通过安全审计

---

#### 任务 4.2: 文档齐全

**目标**: 提供完整、清晰的文档

**文档内容**:
1. **用户文档**
   - 快速开始
   - 命令参考
   - 工作流指南
   - 常见问题
   - 故障排除

2. **开发者文档**
   - 架构设计
   - API 参考
   - 插件开发
   - 贡献指南

3. **教程和示例**
   - 入门教程
   - 进阶教程
   - 实战案例
   - 视频教程

4. **变更日志**
   - 版本历史
   - 迁移指南
   - 破坏性变更

**文档站点**:
- 使用 VitePress 或 Docusaurus
- 支持搜索
- 支持多语言
- 响应式设计

**验收标准**:
- [ ] 文档覆盖率 100%
- [ ] 所有命令有示例
- [ ] 教程完整可用
- [ ] 文档站点上线

---

#### 任务 4.3: 社区运营

**目标**: 建立活跃的社区

**运营计划**:
1. **社区平台**
   - GitHub Discussions
   - Discord 服务器
   - Twitter/X 账号
   - 公众号/技术博客

2. **内容输出**
   - 发布博客文章
   - 录制视频教程
   - 举办线上分享
   - 参加技术大会

3. **用户支持**
   - Issue 响应 < 24h
   - 定期发布 FAQ
   - 举办答疑活动
   - 建立用户群

4. **社区激励**
   - 贡献者榜单
   - 优秀插件推荐
   - Bug 赏金计划
   - 社区徽章

**验收标准**:
- [ ] GitHub Stars > 1000
- [ ] 月活跃用户 > 500
- [ ] 社区插件 > 20
- [ ] Issue 响应率 > 90%

---

## v1.0 发布计划

### 发布准备

**发布前 2 周**:
- 代码冻结
- 最后一轮测试
- 文档审查
- 准备发布说明

**发布前 1 周**:
- Beta 版本测试
- 收集用户反馈
- 修复严重问题
- 最终审查

**发布日**:
- 发布 npm 包
- 更新官网
- 发布公告
- 社区宣传

### 发布后

**发布后 1 周**:
- 监控 Bug 报告
- 快速响应问题
- 发布 Hotfix 版本

**发布后 1 月**:
- 收集用户反馈
- 规划下一版本
- 持续改进

## 成功指标

### 生态指标
- 社区插件数量: > 20
- 活跃开发者: > 50
- GitHub Stars: > 1000
- 月活跃用户: > 500

### 质量指标
- 核心功能稳定性: > 99.9%
- 文档覆盖率: 100%
- 用户满意度: NPS > 70
- Issue 解决率: > 90%

### 影响力指标
- 被采用的项目: > 100
- 技术文章: > 20
- 会议分享: > 3
- 行业认可度: 前 10 开发工具

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 插件质量参差不齐 | 中 | 高 | 建立审核机制 |
| 社区活跃度不足 | 高 | 中 | 加强运营投入 |
| 竞品压力 | 中 | 中 | 突出差异化优势 |
| 维护成本高 | 高 | 中 | 构建可持续模型 |

---

**版本**: 1.0
**最后更新**: 2024-12-23
