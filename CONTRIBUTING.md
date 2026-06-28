# Contributing to Kafka Log Analyzer

感谢你对 Kafka Log Analyzer 项目的关注！本文档将帮助你参与项目开发。

## 📋 目录

- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [Git 规范](#git-规范)
- [提交 PR](#提交-pr)
- [测试规范](#测试规范)
- [文档规范](#文档规范)

---

## 开发环境设置

### 1. 克隆仓库

```bash
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的配置
```

### 4. 启动开发模式

```bash
npm run dev
```

### 5. 运行测试

```bash
npm test
```

---

## 代码规范

### TypeScript 规范

#### 基本原则

1. **严格类型检查**：始终启用 TypeScript strict mode
2. **明确类型定义**：避免使用 `any`，优先使用具体类型
3. **命名清晰**：变量、函数、类名应自解释

#### 命名规范

```
文件名：kebab-case.ts
类名：PascalCase
函数名：camelCase
常量：UPPER_SNAKE_CASE
接口：IPascalCase（可选前缀）
类型：PascalCase
```

#### 导入顺序

```typescript
// 1. Node.js 内置模块
import path from 'path';
import fs from 'fs';

// 2. 第三方模块
import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk';

// 3. 内部模块（相对路径）
import { analyzeLog } from './tools/analyze_log';
import { logger } from '../utils/logger';
```

#### 代码风格示例

```typescript
// ✅ Good: 明确的类型定义
interface AnalyzeLogInput {
  source: 'paste' | 'file';
  content?: string;
  path?: string;
  focus?: FocusArea[];
}

async function analyzeLog(input: AnalyzeLogInput): Promise<AnalysisResult> {
  // ...
}

// ❌ Bad: 使用 any
async function analyzeLog(input: any): Promise<any> {
  // ...
}
```

### Python 规范

#### 基本原则

1. **PEP 8**：遵循 Python 官方风格指南
2. **类型提示**：使用 Python 3.8+ 的类型提示
3. **文档字符串**：为所有公共函数添加 docstring

#### 代码风格示例

```python
# ✅ Good: 类型提示 + docstring
def parse_log_line(line: str) -> Optional[LogEvent]:
    """
    Parse a single Kafka log line into a structured event.
    
    Args:
        line: Raw log line string
        
    Returns:
        LogEvent object if parsing succeeds, None otherwise
    """
    # ...
```

---

## Git 规范

### 分支命名

```
feature/xxx    # 新功能
fix/xxx        # Bug 修复
refactor/xxx   # 重构
docs/xxx       # 文档
test/xxx       # 测试
release/vX.Y.Z # 发版
hotfix/xxx     # 紧急修复
```

### Commit 规范

使用 Conventional Commits 规范：

```
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
refactor: 重构（不改变功能）
test: 测试相关
chore: 构建/工具链
perf: 性能优化
style: 代码格式（不影响逻辑）
```

#### Commit 示例

```bash
# ✅ Good: 明确的 commit message
git commit -m "feat: implement analyze_log MCP tool"
git commit -m "fix: handle empty log input gracefully"
git commit -m "docs: update README with installation guide"

# ❌ Bad: 模糊的 commit message
git commit -m "update code"
git commit -m "fix bug"
git commit -m "wip"
```

---

## 提交 PR

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发和测试

```bash
# 开发代码
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化
npm run format
```

### 3. 提交代码

```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

- 在 GitHub 上创建 Pull Request
- 填写 PR 模板（描述、测试计划、相关 Issue）
- 等待 Code Review

### PR 检查清单

在提交 PR 前，确保：

- [ ] 代码通过所有测试 (`npm test`)
- [ ] 代码通过 lint 检查 (`npm run lint`)
- [ ] 代码已格式化 (`npm run format`)
- [ ] TypeScript 编译成功 (`npm run build`)
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] Commit message 符合规范
- [ ] PR 描述清晰完整

---

## 测试规范

### 测试文件命名

```
单元测试：tests/unit/*.test.ts
集成测试：tests/integration/*.test.ts
E2E 测试：tests/e2e/*.test.ts
测试数据：tests/fixtures/*
```

### 测试覆盖率要求

| 版本 | 覆盖率目标 |
|------|-----------|
| v0.1.0 | 50% |
| v0.2.0 | 60% |
| v0.3.0 | 70% |
| v0.4.0 | 75% |
| v0.5.0 | 80% |
| v1.0.0 | 85% |

### 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeLog } from '../src/mcp-server/tools/analyze_log';

describe('analyzeLog', () => {
  it('should parse paste input correctly', async () => {
    const result = await analyzeLog({
      source: 'paste',
      content: '[2026-01-15 10:00:00] INFO test message'
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].level).toBe('INFO');
  });

  it('should handle empty input gracefully', async () => {
    const result = await analyzeLog({
      source: 'paste',
      content: ''
    });

    expect(result.events).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });
});
```

---

## 文档规范

### 文档类型

| 文档 | 位置 | 说明 |
|------|------|------|
| README | `/README.md` | 项目介绍和快速开始 |
| API 文档 | `/docs/api/` | MCP Tools API 参考 |
| 架构文档 | `/docs/architecture/` | 技术架构设计 |
| 用户指南 | `/docs/user-guide/` | 使用教程 |
| 部署指南 | `/docs/deployment/` | 部署说明 |

### Markdown 规范

1. **标题层级**：最多使用 4 级标题（H1-H4）
2. **代码块**：指定语言类型
3. **链接**：优先使用相对路径
4. **表格**：保持列对齐

#### Markdown 示例

```markdown
## 功能说明

### 基本用法

```typescript
const result = analyzeLog({ source: 'paste', content: log });
```

| 参数 | 类型 | 说明 |
|------|------|------|
| source | string | 数据源类型 |

参考 [API 文档](docs/api/mcp-tools.md) 了解更多。
```

---

## Code Review 标准

### 必查项

- [ ] 代码符合规范
- [ ] 测试覆盖率达标
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 无安全漏洞

### 建议项

- [ ] 代码可读性好
- [ ] 命名清晰
- [ ] 注释适当
- [ ] 性能合理
- [ ] 错误处理完善

---

## 发布流程

### 版本号规范

使用 Semantic Versioning（语义化版本）：

```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 变化
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的问题修复
```

### 发布步骤

1. 更新 `CHANGELOG.md`
2. 更新版本号：`npm version <type>`
3. 创建 GitHub Release
4. 自动发布到 npm（通过 GitHub Actions）

---

## 获取帮助

- **GitHub Issue**: 提交 Bug 报告或功能建议
- **GitHub Discussion**: 提问和讨论
- **Email**: 联系维护者

---

## 许可证

本项目采用 MIT 许可证。贡献的代码将自动采用相同许可证。

---

感谢你的贡献！🎉