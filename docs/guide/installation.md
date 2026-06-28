# Installation

Choose the installation method that fits your workflow.

## Option 1: Claude Code Plugin (Recommended)

Kafka Log Analyzer is designed as a **Claude Code Plugin** for seamless integration.

### Method A: Plugin Marketplace

```bash
# In Claude Code, run:
/plugin marketplace add saqqdy/kafka-log-analyzer
/plugin install kafka-log-analyzer
```

### Method B: Local Install

```bash
# 1. Navigate to your project
cd your-project

# 2. Install npm package
pnpm add -D kafka-log-analyzer

# 3. Copy skill files
mkdir -p .claude/skills
cp -r node_modules/kafka-log-analyzer/.claude/skills/kafka-log-analyzer .claude/skills/
```

After installation, use `/kafka-analyze` command in Claude Code.

## Option 2: NPM Package

For programmatic usage in Node.js/TypeScript projects:

```bash
pnpm add kafka-log-analyzer
```

```typescript
import { analyzeLog } from 'kafka-log-analyzer'

const result = await analyzeLog({
  source: 'file',
  path: '/var/log/kafka/server.log',
  focus: ['producer', 'error'],
  timeline: '1h'
})

console.log(`Total Events: ${result.summary.total}`)
console.log(`P0: ${result.summary.byPriority.P0}`)
```

## Option 3: CLI (Zero-Install)

Run directly with `npx` — no installation required:

```bash
# In any directory
npx kafka-log-analyze --source file --path /var/log/kafka/server.log
npx kafka-log-analyze --source paste <<EOF
[2024-01-15 10:00:01] ERROR [producer] Failed to send record
EOF
```

## Option 4: Clone and Explore

For development or exploring examples:

```bash
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
pnpm install

# Build and run
pnpm run build
node dist/cli.js --source file --path tests/fixtures/sample-kafka-log.txt
```

## Verification

Verify your installation:

```bash
# CLI
npx kafka-log-analyze --help

# Node.js
node -e "console.log(require('kafka-log-analyzer').version)"
```

## Next Steps

- [Quick Start](/guide/quick-start) — See Kafka Log Analyzer in action
- [API Reference](/api/mcp-tools) — Explore the MCP Tools API
- [Configuration](/guide/configuration) — Configure data sources