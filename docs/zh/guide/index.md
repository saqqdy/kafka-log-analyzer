# 介绍

> Kafka Log Analyzer 是一个 Claude Code Plugin，用于智能分析 Kafka 日志，支持实时监控、异常检测和源码联动。

## 什么是 Kafka Log Analyzer？

Kafka Log Analyzer 是专为 Kafka 运维和开发人员打造的智能分析工具。它能够：

- **解析 Kafka 日志** — 自动提取关键事件，包括 Producer、Consumer、Broker 相关信息
- **检测异常模式** — 内置 7 种异常检测器，识别 Rebalance 风暴、Lag 突增、Leader 切换等问题
- **实时监控** — 集成 Prometheus 和 Kafka Exporter，实时获取 Consumer Lag 指标
- **源码联动** — 点击事件跳转到源码位置，加速问题排查

## 为什么选择 Kafka Log Analyzer？

### 🚀 开箱即用

作为 Claude Code Plugin，无需独立部署，直接在对话中调用分析能力。

### 🎯 精准定位

自动识别问题类型并给出优先级（P0-P3），让你专注于最重要的问题。

### 📊 可视化分析

生成 Markdown 格式的诊断报告，包含统计摘要和详细事件列表。

### 🔧 高度可配置

支持自定义检测规则、关注点过滤和时间窗口设置。

## 快速开始

```bash
# 安装插件
claude --plugin-dir .

# 在 Claude Code 中调用
/kafka-analyze --source file --path /var/log/kafka/server.log
```

## 功能特性

| 功能 | 说明 | 状态 |
|------|------|------|
| 日志解析 | 解析 Kafka 日志，提取事件 | ✅ 已完成 |
| 异常检测 | 7 种异常检测器 | ✅ 已完成 |
| 时间线分析 | 按时间窗口统计 | ✅ 已完成 |
| Consumer Lag 监控 | Prometheus 集成 | 🚧 开发中 |
| 历史对比 | 趋势分析和基线对比 | 📋 计划中 |

## 下一步

- [快速开始](/zh/guide/quick-start) — 5 分钟上手指南
- [命令参考](/zh/guide/commands) — 完整命令文档
- [配置](/zh/guide/configuration) — 自定义配置选项