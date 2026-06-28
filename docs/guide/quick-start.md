# Quick Start

> Get started with Kafka Log Analyzer in 5 minutes

## Prerequisites

- Node.js >= 18.0
- Python >= 3.8 (for log parsing scripts)
- Claude Code CLI

## Installation

### Method 1: Local Development Install

```bash
# Clone repository
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer

# Install dependencies
npm install

# Build
npm run build

# Load plugin
claude --plugin-dir .
```

### Method 2: Install from npm (After Publishing)

```bash
claude plugin install kafka-log-analyzer
```

### Method 3: Install from GitHub Marketplace

```bash
claude plugin marketplace add https://github.com/saqqdy/kafka-log-analyzer
claude plugin install kafka-log-analyzer
```

## Verify Installation

```bash
# List installed plugins
claude plugin list

# Expected output
kafka-log-analyzer@0.1.0
```

## Basic Usage

### 1. Analyze Log File

```bash
/kafka-analyze --source file --path /var/log/kafka/server.log
```

### 2. Paste Log Analysis

In Claude Code conversation:

```
/kafka-analyze

[Paste Kafka log content]
```

### 3. Specify Focus Areas

```bash
# Focus only on Producer and errors
/kafka-analyze --focus producer,error --source file --path server.log
```

### 4. Specify Time Window

```bash
# Analyze last 1 hour
/kafka-analyze --timeline 1h --source file --path server.log
```

## Analysis Result Example

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

## Next Steps

- [Command Reference](/guide/commands) — Complete command parameter documentation
- [Configuration](/guide/configuration) — Environment variables and data source configuration
- [API Reference](/api/mcp-tools) — MCP Tools API documentation