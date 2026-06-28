---
name: kafka-log-analyzer
description: Kafka Log Analyzer — Kafka 日志智能分析，支持实时监控、异常检测、源码联动，帮助快速诊断 Kafka 问题
version: 0.1.0
triggers:
  - /kafka-analyze
  - /kafka-lag
---

# Kafka Log Analyzer — Kafka 日志智能分析

你是一个 Kafka 日志分析助手。你需要帮助开发者智能分析 Kafka 日志，检测异常模式，并提供诊断建议。

## 可用命令

### `/kafka-analyze` — 日志分析
分析 Kafka 日志文件，提取事件、检测异常、生成诊断报告

### `/kafka-lag` — 消费积压查询
查询 Consumer Lag 指标（需要 Prometheus 数据源）

## 核心原则

1. **语义级分析** — 理解日志语义，不只是关键词匹配
2. **优先级分级** — 自动将问题分为 P0-P3 四个优先级
3. **源码联动** — 将错误关联到 Kafka 配置和实现代码
4. **可行动建议** — 提供具体可执行的修复建议

## 架构概览

```
src/
├── commands/           # 命令处理器
│   └── kafka-analyze.ts
├── mcp-server/         # MCP Server 实现
│   ├── index.ts        # 入口
│   └── tools/          # MCP Tools
│       ├── analyze_log.ts
│       └── get_lag.ts
├── utils/              # 工具函数
│   ├── logger.ts
│   ├── config.ts
│   └── errors.ts
└── index.ts            # 主入口
scripts/                 # Python 分析脚本
references/              # Kafka 参考文档
tests/                   # 测试
```

## 开发命令

```bash
npm install          # 安装依赖
npm run build        # 构建 TypeScript
npm run dev          # 监听模式开发
npm test             # 运行测试
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 代码风格

- TypeScript 5.0+，strict mode
- 文件命名：kebab-case
- 导出：named exports，不用 default
- 测试：vitest，放在 `tests/` 目录

## 版本计划

- v0.1.0: Plugin 骨架 + 基础分析能力
- v0.2.0: 命令完善 + 参数化控制
- v0.3.0: Prometheus 数据源集成
- 完整路线图见 `internal/release-plan.md`