---
layout: home

hero:
  name: Kafka Log Analyzer
  text: 智能 Kafka 日志分析工具
  tagline: 为 Claude Code 提供 Kafka 日志分析、异常检测和源码联动
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/
    - theme: alt
      text: API 参考
      link: /zh/api/mcp-tools
    - theme: alt
      text: GitHub
      link: https://github.com/saqqdy/kafka-log-analyzer

features:
  - icon: 📊
    title: 智能日志分析
    details: 自动解析 Kafka 日志，提取关键事件并检测异常模式
  - icon: 🔍
    title: 实时监控
    details: 集成 Prometheus 和 Kafka Exporter，实时监控 Consumer Lag
  - icon: 🚨
    title: 异常检测
    details: 内置 7 种异常检测器，自动识别 Rebalance 风暴、Lag 突增等问题
  - icon: 📈
    title: 时间线分析
    details: 按时间窗口统计事件分布，快速定位问题发生的时间点
  - icon: 🔗
    title: 源码联动
    details: 点击事件跳转到源码位置，加速问题排查
  - icon: 🤖
    title: Claude Code 集成
    details: 原生支持 Claude Code，通过 /kafka-analyze 命令快速调用
---