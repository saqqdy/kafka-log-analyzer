# 快速开始

> 5 分钟快速上手 Kafka Log Analyzer

## 前置条件

- Node.js >= 18.0
- Python >= 3.8（用于日志解析脚本）
- Claude Code CLI

## 安装

### 方式 1：本地开发安装

```bash
# 克隆仓库
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer

# 安装依赖
npm install

# 构建
npm run build

# 加载插件
claude --plugin-dir .
```

### 方式 2：从 npm 安装（发布后）

```bash
claude plugin install kafka-log-analyzer
```

### 方式 3：从 GitHub 市场安装

```bash
claude plugin marketplace add https://github.com/saqqdy/kafka-log-analyzer
claude plugin install kafka-log-analyzer
```

## 验证安装

```bash
# 查看已安装插件
claude plugin list

# 预期输出
kafka-log-analyzer@0.1.0
```

## 基本使用

### 1. 分析日志文件

```bash
/kafka-analyze --source file --path /var/log/kafka/server.log
```

### 2. 粘贴日志分析

在 Claude Code 对话中：

```
/kafka-analyze

[粘贴 Kafka 日志内容]
```

### 3. 指定关注点

```bash
# 只关注 Producer 和错误
/kafka-analyze --focus producer,error --source file --path server.log
```

### 4. 指定时间窗口

```bash
# 分析最近 1 小时
/kafka-analyze --timeline 1h --source file --path server.log
```

## 分析结果示例

```markdown
## Kafka Log Analysis Report

### Summary
- Total Events: 1,247
- Errors: 23
- Warnings: 156

### By Priority
- P0 (Critical): 2
- P1 (High): 8
- P2 (Medium): 45
- P3 (Low): 172

### Top Anomalies

#### 1. Consumer Lag Spike (P1)
- **Component**: consumer
- **Description**: Consumer lag exceeded 10,000 messages
- **Affected Events**: 15
- **Recommendation**: Check consumer processing speed and consider scaling

#### 2. Rebalance Storm (P0)
- **Component**: consumer
- **Description**: 5 rebalances in 5 minutes
- **Affected Events**: 5
- **Recommendation**: Review consumer group configuration
```

## 下一步

- [命令参考](/zh/guide/commands) — 完整命令参数说明
- [配置](/zh/guide/configuration) — 环境变量和数据源配置
- [API 参考](/zh/api/mcp-tools) — MCP Tools API 文档