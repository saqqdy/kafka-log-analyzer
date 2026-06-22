# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-23

### Added
- Initial project structure with TypeScript configuration
- MCP Server entry point with tool registration
- `analyze_log` tool for Kafka log analysis
  - Support for `paste` and `file` input modes
  - Integration with Python parsing scripts
  - Anomaly detection and priority classification
- `/kafka-analyze` command
  - Command-line argument parsing
  - Multiple output formats: Markdown, JSON, Slack
  - Focus area filtering (producer, consumer, broker, lag, error)
  - Timeline analysis support
- `get_lag` tool placeholder (Phase 2)
- Unit tests with Vitest
- Test fixtures for Kafka log samples
- ESLint + Prettier configuration
- Environment configuration template

### Changed
- Migrated source code to `src/` directory structure
- Updated package.json with proper exports

### Security
- Added .gitignore for sensitive files

## [Unreleased]

### Planned
- Prometheus connector (v0.3.0)
- Kafka Exporter integration (v0.3.0)
- Loki log source support (v0.3.0)
- Grafana alert Hook (v0.4.0)
- Feishu/Slack/JIRA integrations (v0.4.0)
- SQLite persistence (v0.5.0)
- Historical trend analysis (v0.5.0)
