# Kafka Log Analyzer — Claude Code Guide

## Project Overview

Kafka Log Analyzer 是一个 Claude Code Plugin，用于智能分析 Kafka 日志，支持实时监控、异常检测和源码联动。

## Architecture

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
scripts/                 # Python 分析脚本（复用现有）
references/              # 参考文档（复用现有）
tests/                   # 测试
```

## Development Commands

```bash
npm install          # 安装依赖
npm run build        # 构建 TypeScript
npm run dev          # 监听模式开发
npm test             # 运行测试
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## Key Principles

1. **复用现有资产** — Python 脚本和参考文档直接复用
2. **MCP First** — 核心能力通过 MCP Tool 暴露
3. **命令友好** — 提供易用的命令行接口
4. **渐进式架构** — 分阶段实现功能

## Code Style

- TypeScript 5.0+，strict mode
- 文件命名：kebab-case
- 导出：named exports，不用 default
- 测试：vitest，放在 `tests/` 目录

## Version Plan

- v0.1.0: Plugin 骨架 + 基础分析能力
- v0.2.0: 命令完善 + 参数化控制
- v0.3.0: Prometheus 数据源集成
- 完整路线图见 `internal/release-plan.md`
