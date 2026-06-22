# kafka-log-analyzer 开发计划

---

## 一、开发概览

### 项目背景

将现有 Skill `kafka-log-analyzer` 升级为完整的 Claude Code Plugin，实现：

- MCP Server 集成实时数据源
- 命令化交互体验
- Hook 自动触发
- 历史趋势分析
- 团队协作能力

### 开发周期

**总周期**：8 周（2026-06-22 ~ 2026-08-11）

| 阶段 | 周期 | 目标 |
|------|------|------|
| 阶段 1：骨架 | 第 1-2 周 | Plugin 结构 + 基础分析能力 |
| 阶段 2：数据源 | 第 3-4 周 | Prometheus + Kafka Exporter 集成 |
| 阶段 3：自动化 | 第 5-6 周 | Hook + 推送集成 |
| 阶段 4：智能化 | 第 7-8 周 | 历史对比 + 正式发布 |

### 开发团队

| 角色 | 负责人 | 职责 |
|------|--------|------|
| 项目负责人 | saqqdy | 架构设计、核心开发、发版 |
| 开发者 | TBD | 功能开发、测试 |
| Code Reviewer | TBD | 代码审查、质量把控 |

---

## 二、技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Runtime                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   Commands    │  │     Hooks     │  │   Prompts     │      │
│  │               │  │               │  │               │      │
│  │ /kafka-analyze│  │ on_alert      │  │ kafka_diag    │      │
│  │ /kafka-lag    │  │ scheduled     │  │               │      │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘      │
│          │                  │                                   │
│          └──────────────────┼───────────────────────────────────┤
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    MCP Server                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │   Tools     │  │  Resources  │  │  Prompts    │    │  │
│  │  │             │  │             │  │             │    │  │
│  │  │ analyze_log │  │ kafka://    │  │             │    │  │
│  │  │ get_lag     │  │ metrics     │  │             │    │  │
│  │  │ timeline    │  │ history     │  │             │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │         │                                                    │
│  │         ▼                                                    │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Analysis Engine                        │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│  │  │
│  │  │  │ Python      │  │  Anomaly    │  │  Report     ││  │  │
│  │  │  │ Scripts     │  │  Detector   │  │  Generator  ││  │  │
│  │  │  │ (复用现有)   │  │  (7种检测器)│  │             ││  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘│  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Data Layer                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ Prometheus  │  │    Loki     │  │   SQLite    │    │  │
│  │  │ Exporter    │  │   (日志)    │  │  (历史)     │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术选型 | 版本要求 | 理由 |
|------|----------|----------|------|
| **运行时** | Node.js | >= 18.0 | Claude Code 原生环境 |
| **语言** | TypeScript | >= 5.0 | 类型安全 + 工具链 |
| **MCP SDK** | @modelcontextprotocol/sdk | ^1.0 | Claude 官方 SDK |
| **HTTP 客户端** | axios | ^1.6 | 数据源连接 |
| **持久化** | better-sqlite3 | ^9.0 | 零配置 SQLite |
| **测试框架** | Vitest | ^1.0 | 快速 + TypeScript 原生 |
| **日志解析** | Python 脚本 | 3.8+ | 复用现有资产 |
| **进程管理** | PM2 | ^5.0 | 生产部署（可选） |

### 目录结构

```
kafka-log-analyzer/
├── src/
│   ├── index.ts                    # 入口
│   ├── commands/
│   │   ├── kafka-analyze.ts        # 主命令
│   │   ├── kafka-lag.ts            # Lag 查询命令
│   │   └── kafka-timeline.ts       # 时间线命令
│   ├── mcp-server/
│   │   ├── index.ts                # MCP Server 入口
│   │   ├── tools/
│   │   │   ├── analyze_log.ts      # 日志分析 Tool
│   │   │   ├── get_lag.ts          # Lag 查询 Tool
│   │   │   ├── timeline.ts         # 时间线 Tool
│   │   │   └── generate_report.ts  # 报告生成 Tool
│   │   ├── resources/
│   │   │   ├── metrics.ts          # 实时指标 Resource
│   │   │   └── history.ts          # 历史 Resource
│   │   └── connectors/
│   │       ├── prometheus.ts       # Prometheus 连接器
│   │       ├── kafka-exporter.ts   # Kafka Exporter 连接器
│   │       └── loki.ts             # Loki 连接器
│   ├── hooks/
│   │   ├── on-grafana-alert.ts     # Grafana 告警 Hook
│   │   └── scheduled-check.ts      # 定时检查 Hook
│   ├── integrations/
│   │   ├── feishu.ts               # 飞书推送
│   │   ├── slack.ts                # Slack 推送
│   │   └── jira.ts                 # JIRA 集成
│   ├── storage/
│   │   ├── sqlite.ts               # SQLite 管理
│   │   └── baseline.ts             # 基线管理
│   ├── analysis/
│   │   ├── parser.ts               # Python 脚本调用
│   │   ├── detector.ts             # 异常检测封装
│   │   └── comparator.ts           # 历史对比
│   └── utils/
│       ├── logger.ts               # 日志工具
│       ├── config.ts               # 配置管理
│       └── errors.ts               # 错误处理
├── scripts/                        # Python 脚本（复用）
│   ├── parse_kafka_log.py
│   ├── detect_anomalies.py
│   └── generate_report.py
├── references/                     # 参考文档（复用）
│   ├── kafka-patterns.md
│   ├── error-codes.md
│   └── tuning-guide.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── dist/                           # 编译产物
├── plugin.json                     # Plugin manifest
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── README.md
├── CHANGELOG.md
└── internal/
    ├── plugin-migration-plan.md    # 技术方案
    ├── release-plan.md             # 发版计划
    └── development-plan.md         # 本文档
```

---

## 三、开发阶段详情

### 阶段 1：Plugin 骨架（第 1-2 周）

#### 1.1 项目初始化（第 1 周，Day 1-3）

**目标**：搭建项目结构，配置开发环境

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 创建目录结构 | 1h | 目录树 |
| 初始化 package.json | 0.5h | package.json |
| 配置 TypeScript | 0.5h | tsconfig.json |
| 配置 Vitest | 0.5h | vitest.config.ts |
| 配置 ESLint + Prettier | 0.5h | .eslintrc, .prettierrc |
| 创建 .gitignore | 0.25h | .gitignore |
| 复制现有资产 | 0.5h | scripts/, references/ |
| 编写 README.md | 1h | README.md |

**验收标准**：

- [ ] `npm install` 成功
- [ ] `npm run build` 编译成功
- [ ] `npm test` 运行成功（无测试也可）
- [ ] 目录结构符合规范

#### 1.2 MCP Server 入口（第 1 周，Day 4-5）

**目标**：实现 MCP Server 基础框架

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 创建 MCP Server 入口 | 2h | src/mcp-server/index.ts |
| 注册 Tool 路由 | 2h | Tool 注册逻辑 |
| 实现错误处理 | 1h | 错误处理中间件 |
| 实现日志记录 | 1h | 日志工具 |
| 编写单元测试 | 1h | tests/unit/mcp-server.test.ts |

**验收标准**：

- [ ] MCP Server 可启动
- [ ] Tool 注册成功
- [ ] 错误处理正确
- [ ] 日志输出正常

#### 1.3 analyze_log Tool（第 2 周，Day 1-3）

**目标**：实现核心分析能力

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 analyze_log Tool | 4h | src/mcp-server/tools/analyze_log.ts |
| 集成 Python 脚本调用 | 3h | src/analysis/parser.ts |
| 实现 paste 输入处理 | 2h | paste 输入逻辑 |
| 实现 file 输入处理 | 2h | file 输入逻辑 |
| 编写单元测试 | 2h | tests/unit/analyze_log.test.ts |
| 编写集成测试 | 2h | tests/integration/analyze_log.test.ts |

**验收标准**：

- [ ] paste 输入正常工作
- [ ] file 输入正常工作
- [ ] 输出结构化 JSON
- [ ] 测试覆盖率 > 60%

#### 1.4 /kafka-analyze 命令（第 2 周，Day 4-5）

**目标**：实现命令行交互

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现命令解析 | 2h | 参数解析逻辑 |
| 实现 Markdown 输出 | 2h | 报告格式化 |
| 实现错误提示 | 1h | 友好错误信息 |
| 编写 E2E 测试 | 2h | tests/e2e/command.test.ts |
| 编写文档 | 1h | 命令使用文档 |

**验收标准**：

- [ ] 命令可执行
- [ ] 参数解析正确
- [ ] 输出格式美观
- [ ] 错误提示清晰

---

### 阶段 2：数据源集成（第 3-4 周）

#### 2.1 Prometheus 连接器（第 3 周，Day 1-3）

**目标**：接入 Prometheus 查询能力

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Prometheus 客户端 | 3h | src/mcp-server/connectors/prometheus.ts |
| 实现查询模板 | 2h | 常用查询模板 |
| 实现错误处理 | 1h | 连接失败处理 |
| 实现重试机制 | 1h | 重试逻辑 |
| 编写单元测试 | 2h | tests/unit/prometheus.test.ts |
| 编写集成测试 | 2h | tests/integration/prometheus.test.ts |

**验收标准**：

- [ ] 连接 Prometheus 成功
- [ ] 查询返回正确数据
- [ ] 错误处理正确
- [ ] 测试覆盖率 > 70%

#### 2.2 get_lag Tool（第 3 周，Day 4-5）

**目标**：实现 Consumer Lag 查询

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 get_lag Tool | 3h | src/mcp-server/tools/get_lag.ts |
| 集成 Prometheus 查询 | 2h | Lag 查询逻辑 |
| 实现过滤参数 | 2h | cluster/group/topic 过滤 |
| 编写单元测试 | 2h | tests/unit/get_lag.test.ts |
| 编写文档 | 1h | Tool 使用文档 |

**验收标准**：

- [ ] Lag 查询正确
- [ ] 过滤参数正常
- [ ] 输出结构化
- [ ] 测试覆盖率 > 70%

#### 2.3 Kafka Exporter 集成（第 4 周，Day 1-2）

**目标**：直接查询 Kafka Exporter

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Exporter 连接器 | 3h | src/mcp-server/connectors/kafka-exporter.ts |
| 实现指标查询 | 2h | 指标查询逻辑 |
| 编写单元测试 | 2h | tests/unit/kafka-exporter.test.ts |

#### 2.4 Loki 集成（第 4 周，Day 3-4）

**目标**：接入 Loki 日志查询

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Loki 连接器 | 3h | src/mcp-server/connectors/loki.ts |
| 实现 LogQL 查询 | 2h | 查询逻辑 |
| 集成到 analyze_log | 2h | source: "loki" 支持 |
| 编写单元测试 | 2h | tests/unit/loki.test.ts |

#### 2.5 MCP Resources（第 4 周，Day 5）

**目标**：实现实时指标流

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Metrics Resource | 2h | src/mcp-server/resources/metrics.ts |
| 实现订阅机制 | 2h | 实时推送 |
| 编写测试 | 1h | tests/unit/resources.test.ts |

---

### 阶段 3：自动化集成（第 5-6 周）

#### 3.1 Hook 框架（第 5 周，Day 1-2）

**目标**：搭建 Hook 处理框架

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Hook 基础框架 | 3h | src/hooks/base.ts |
| 实现 Hook 注册 | 2h | Hook 注册逻辑 |
| 实现去重机制 | 2h | 去重逻辑 |
| 编写测试 | 2h | tests/unit/hooks.test.ts |

#### 3.2 Grafana 告警 Hook（第 5 周，Day 3-5）

**目标**：实现 Grafana 告警自动触发

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Webhook 接收 | 2h | Webhook 端点 |
| 解析告警内容 | 2h | 告警解析 |
| 触发分析流程 | 2h | 自动触发 |
| 编写测试 | 2h | tests/unit/grafana-hook.test.ts |
| 编写文档 | 1h | Hook 配置文档 |

#### 3.3 飞书推送（第 6 周，Day 1-2）

**目标**：实现飞书 Webhook 推送

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现飞书客户端 | 2h | src/integrations/feishu.ts |
| 实现消息格式化 | 2h | 飞书卡片格式 |
| 编写测试 | 1h | tests/unit/feishu.test.ts |

#### 3.4 Slack 推送（第 6 周，Day 3）

**目标**：实现 Slack Webhook 推送

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 Slack 客户端 | 2h | src/integrations/slack.ts |
| 实现消息格式化 | 1h | Slack Block Kit |
| 编写测试 | 1h | tests/unit/slack.test.ts |

#### 3.5 Hook 去重合并（第 6 周，Day 4-5）

**目标**：防止 Hook 风暴

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现去重逻辑 | 2h | 基于时间窗口去重 |
| 实现合并逻辑 | 2h | 相同告警合并 |
| 实现限流 | 2h | 速率限制 |
| 编写测试 | 2h | tests/unit/dedup.test.ts |

---

### 阶段 4：智能化能力（第 7-8 周）

#### 4.1 SQLite 持久化（第 7 周，Day 1-2）

**目标**：实现历史数据存储

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现 SQLite 管理 | 3h | src/storage/sqlite.ts |
| 设计数据模型 | 2h | 表结构设计 |
| 实现 CRUD 操作 | 2h | 数据访问层 |
| 编写测试 | 2h | tests/unit/storage.test.ts |

#### 4.2 历史查询（第 7 周，Day 3-4）

**目标**：实现历史分析记录查询

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现查询接口 | 2h | 历史查询 API |
| 实现过滤参数 | 2h | 时间/优先级过滤 |
| 实现 History Resource | 2h | src/mcp-server/resources/history.ts |
| 编写测试 | 2h | tests/unit/history.test.ts |

#### 4.3 趋势对比（第 7 周，Day 5）

**目标**：实现历史趋势对比

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现对比逻辑 | 3h | src/analysis/comparator.ts |
| 实现倍数检测 | 2h | 异常倍数计算 |
| 编写测试 | 2h | tests/unit/comparator.test.ts |

#### 4.4 基线管理（第 8 周，Day 1-2）

**目标**：实现基线数据管理

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现基线计算 | 2h | src/storage/baseline.ts |
| 实现基线对比 | 2h | 与基线偏差检测 |
| 编写测试 | 2h | tests/unit/baseline.test.ts |

#### 4.5 数据清理（第 8 周，Day 3）

**目标**：实现历史数据清理策略

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| 实现清理策略 | 2h | 自动清理逻辑 |
| 实现清理任务 | 1h | 定时清理 |
| 编写测试 | 1h | tests/unit/cleanup.test.ts |

#### 4.6 最终测试与文档（第 8 周，Day 4-5）

**目标**：全面测试和文档完善

**任务清单**：

| 任务 | 预计工时 | 产出物 |
|------|----------|--------|
| E2E 测试完善 | 4h | tests/e2e/* |
| 性能测试 | 2h | 性能基准测试 |
| 文档完善 | 3h | README, API 文档 |
| Code Review | 2h | 代码审查 |
| Bug 修复 | 2h | 遗留问题修复 |

---

## 四、开发规范

### 代码规范

#### 命名规范

```
文件名：kebab-case.ts
类名：PascalCase
函数名：camelCase
常量：UPPER_SNAKE_CASE
接口：IPascalCase（可选前缀）
类型：PascalCase
```

#### 目录规范

```
src/
├── commands/      # 命令处理器
├── mcp-server/    # MCP Server 实现
├── hooks/         # Hook 处理器
├── integrations/  # 外部集成
├── storage/       # 数据存储
├── analysis/      # 分析逻辑
└── utils/         # 工具函数
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
import { config } from '../utils/config';
```

### Git 规范

#### 分支命名

```
feature/xxx    # 新功能
fix/xxx        # Bug 修复
refactor/xxx   # 重构
docs/xxx       # 文档
test/xxx       # 测试
release/vX.Y.Z # 发版
hotfix/xxx     # 紧急修复
```

#### Commit 规范

```
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
refactor: 重构
test: 测试相关
chore: 构建/工具链
perf: 性能优化
style: 代码格式

示例：
feat: implement analyze_log Tool
fix: handle Prometheus connection timeout
docs: update README with installation guide
```

### 测试规范

#### 测试文件命名

```
单元测试：tests/unit/*.test.ts
集成测试：tests/integration/*.test.ts
E2E 测试：tests/e2e/*.test.ts
测试数据：tests/fixtures/*
```

#### 测试覆盖率要求

| 版本 | 覆盖率目标 |
|------|-----------|
| v0.1.0 | 50% |
| v0.2.0 | 60% |
| v0.3.0 | 70% |
| v0.4.0 | 75% |
| v0.5.0 | 80% |
| v1.0.0 | 85% |

#### 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeLog } from '../src/mcp-server/tools/analyze_log';

describe('analyzeLog', () => {
  let tool: ReturnType<typeof analyzeLog>;

  beforeEach(() => {
    tool = analyzeLog;
  });

  it('should parse paste input correctly', async () => {
    const result = await tool.handler({
      source: 'paste',
      content: '[2026-01-15 10:00:00] INFO test message'
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].level).toBe('INFO');
  });

  it('should handle empty input gracefully', async () => {
    const result = await tool.handler({
      source: 'paste',
      content: ''
    });

    expect(result.events).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });
});
```

---

## 五、开发流程

### 每日流程

```
09:00 - 09:30  查看昨日进展，规划今日任务
09:30 - 12:00  开发时间（专注编码）
12:00 - 13:00  午休
13:00 - 15:00  开发时间
15:00 - 15:30  Code Review / 讨论
15:30 - 18:00  开发时间
18:00 - 18:30  提交代码，更新进度
```

### 任务管理

```
1. 从计划中提取本周任务
2. 创建 GitHub Issue（如有）
3. 创建 feature 分支
4. 开发 + 提交
5. 创建 PR
6. Code Review
7. 合并到 develop
```

### 进度跟踪

| 阶段 | 开始日期 | 结束日期 | 状态 |
|------|----------|----------|------|
| 阶段 1：骨架 | 2026-06-23 | 2026-06-30 | ⏳ 待开始 |
| 阶段 2：数据源 | 2026-07-01 | 2026-07-14 | ⏳ 待开始 |
| 阶段 3：自动化 | 2026-07-15 | 2026-07-28 | ⏳ 待开始 |
| 阶段 4：智能化 | 2026-07-29 | 2026-08-11 | ⏳ 待开始 |

---

## 六、质量保证

### Code Review 标准

#### 必查项

- [ ] 代码符合规范
- [ ] 测试覆盖率达标
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 无安全漏洞

#### 建议项

- [ ] 代码可读性好
- [ ] 命名清晰
- [ ] 注释适当
- [ ] 性能合理
- [ ] 错误处理完善

### 持续集成

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### 性能基准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 日志解析速度 | > 10,000 行/秒 | 基准测试 |
| 分析延迟（1MB） | < 5s | 集成测试 |
| MCP Tool 响应 | < 500ms | 性能监控 |
| Hook 触发延迟 | < 30s | E2E 测试 |
| 内存占用（空闲） | < 100MB | 资源监控 |

---

## 七、风险与应对

### 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| MCP SDK API 变化 | 中 | 高 | 锁定版本，关注 Changelog |
| Python 脚本集成问题 | 中 | 中 | 提前验证，准备备选方案 |
| Prometheus 连接不稳定 | 高 | 中 | 实现降级策略 |
| SQLite 性能瓶颈 | 低 | 中 | 定期清理，考虑迁移 |

### 进度风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 需求变更 | 中 | 高 | 控制范围，延迟到下版本 |
| 技术难点延期 | 中 | 中 | 预留 Buffer，提前攻关 |
| 人员变动 | 低 | 高 | 文档完善，知识共享 |
| 外部依赖延期 | 中 | 中 | 准备 Mock，并行开发 |

---

## 八、文档计划

### 技术文档

| 文档 | 负责人 | 状态 | 预计完成 |
|------|--------|------|----------|
| API 文档 | 开发者 | ⏳ | v1.0.0 |
| 架构设计文档 | saqqdy | ⏳ | v0.3.0 |
| 部署指南 | 开发者 | ⏳ | v1.0.0 |
| 故障排查指南 | 开发者 | ⏳ | v1.0.0 |

### 用户文档

| 文档 | 负责人 | 状态 | 预计完成 |
|------|--------|------|----------|
| README.md | saqqdy | ⏳ | v0.1.0 |
| 快速开始指南 | 开发者 | ⏳ | v1.0.0 |
| 命令参考 | 开发者 | ⏳ | v1.0.0 |
| 配置参考 | 开发者 | ⏳ | v1.0.0 |

---

## 九、沟通计划

### 定期会议

| 会议 | 频率 | 参与者 | 内容 |
|------|------|--------|------|
| 站会 | 每日 | 开发团队 | 昨日进展、今日计划、阻碍问题 |
| 周会 | 每周 | 开发团队 | 本周总结、下周计划、风险讨论 |
| 里程碑评审 | 每阶段 | 干系人 | 阶段成果演示、反馈收集 |

### 沟通渠道

| 渠道 | 用途 | 响应时间 |
|------|------|----------|
| GitHub Issue | 任务跟踪、Bug 报告 | 1 工作日 |
| 飞书群 | 日常沟通、问题讨论 | 2 小时 |
| 邮件 | 正式通知、文档分享 | 1 工作日 |
| GitHub PR | Code Review | 1 工作日 |

---

## 十、附录

### 开发环境配置

```bash
# 克隆仓库
git clone https://github.com/xxx/kafka-log-analyzer.git
cd kafka-log-analyzer

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入配置

# 启动开发模式
npm run dev

# 运行测试
npm test

# 构建产物
npm run build
```

### 常用命令

```bash
# 开发
npm run dev           # 启动开发模式（watch）
npm run build         # 构建产物
npm test              # 运行测试
npm run lint          # 运行 Lint
npm run format        # 格式化代码

# 发版
npm version patch     # 升级修订版本
npm version minor     # 升级次版本
npm version major     # 升级主版本
npm publish           # 发布到 npm

# Git
git checkout -b feature/xxx    # 创建功能分支
git add .                       # 暂存所有更改
git commit -m "feat: xxx"       # 提交
git push origin feature/xxx     # 推送
```

### 参考链接

| 资源 | 链接 |
|------|------|
| MCP 协议规范 | https://modelcontextprotocol.io/ |
| Claude Code Plugin 文档 | https://docs.anthropic.com/claude-code/plugins |
| TypeScript 手册 | https://www.typescriptlang.org/docs/ |
| Vitest 文档 | https://vitest.dev/ |
| Prometheus HTTP API | https://prometheus.io/docs/prometheus/latest/querying/api/ |
| Kafka Exporter | https://github.com/danielqsj/kafka_exporter |
