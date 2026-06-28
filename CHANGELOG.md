# Changelog

## 0.1.0 (2026-06-28)

### 🚀 Features

- **cli**: add zero-install CLI for quick experience
  - `npx kafka-log-analyze --source file --path server.log` — analyze log file
  - `npx kafka-log-analyze --source paste` — paste log content
  - Multiple output formats: markdown, JSON, Slack
- **mcp**: add MCP Server with tool registration
  - `analyze_log` tool — parse logs, detect anomalies, classify priorities
  - `get_lag` tool placeholder (Phase 2)
- **analysis**: add intelligent log parsing engine
  - Multi-format support: text and JSON Kafka logs
  - 11 event types: send_success, send_failure, consumer_lag, rebalance, etc.
  - 7 anomaly detectors: error spikes, rebalance storms, lag spikes, etc.
  - Priority classification: P0-P3 automatic grading
- **skill**: add Claude Code skill definition (`.claude/skills/kafka-log-analyzer/skill.md`)
  - `/kafka-analyze` command for quick analysis
  - Source code linking for error diagnosis
- **utils**: add formatting utilities
  - `formatReport()` — Markdown report generation
  - `formatSlack()` — Slack-optimized output
  - `formatJSON()` — Structured JSON output

### 📝 Documentation

- add comprehensive documentation suite
  - Architecture design with data flow diagrams
  - MCP Tools API reference with complete schemas
  - Deployment guide covering multiple options
  - Contributing guide with development standards
- add README.md and README_CN.md
  - Quick experience guide (30 seconds)
  - Feature comparison table
  - Multiple installation methods
  - Usage examples with output
- add VitePress documentation site (`docs/`)
  - Landing page with feature highlights
  - API reference for MCP tools
  - Architecture overview
  - Quick start guide

### 🔧 Chores

- add initial project configuration (TypeScript 5.0, tsup, vitest, ESLint 9, Prettier)
- add CI/CD workflows — lint, typecheck, test, build, release
- add `bin` field to package.json for CLI entry point
- add test fixtures for Kafka log samples
- add environment configuration template (`.env.example`)

### 🔄 Project Structure

- migrate source code to `src/` directory
  - `src/index.ts` — Public API exports
  - `src/cli.ts` — CLI entry point
  - `src/mcp-server/` — MCP Server implementation
  - `src/utils/` — Utilities (config, format)
- add Python analysis scripts (`scripts/`)
- add Kafka reference docs (`references/`)
