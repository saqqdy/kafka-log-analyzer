# Version Roadmap

Kafka Log Analyzer evolves through themed releases, each adding monitoring and analysis capabilities.

## Current Release

### v0.1.0 — Sentinel (Released)

**Theme**: Core Analysis Engine

**Capabilities**:
- ✅ `analyze_log` tool — Parse logs, detect anomalies, classify priorities
- ✅ Multi-format support — Text and JSON Kafka logs
- ✅ 11 event types — send_success, send_failure, consumer_lag, rebalance, etc.
- ✅ 7 anomaly detectors — Error spikes, rebalance storms, lag spikes, etc.
- ✅ Priority classification — P0-P3 automatic grading
- ✅ Multiple output formats — Markdown, JSON, Slack
- ✅ `/kafka-analyze` command — Claude Code skill integration
- ✅ CLI with zero-install `npx` support

**Use Cases**:
- Quick log analysis during incidents
- Automated anomaly detection
- Team collaboration via formatted reports

## Planned Releases

### v0.2.0 — Watchtower

**Theme**: Enhanced Commands + CLI

**Planned Features**:
- Timeline analysis with interactive visualization
- Focus area filtering improvements
- Custom detection rules support
- Enhanced CLI output formatting

### v0.3.0 — Guardian

**Theme**: Prometheus + Kafka Exporter Integration

**Planned Features**:
- Real-time consumer lag monitoring
- Prometheus metrics integration
- Kafka Exporter data source
- Loki log source support
- Historical data queries

### v0.4.0 — Dispatcher

**Theme**: Alert Dispatch + Integrations

**Planned Features**:
- Grafana alert Hook integration
- Feishu/Slack/JIRA push notifications
- Custom alert rules
- Incident ticket auto-creation
- Team notification routing

### v0.5.0 — Historian

**Theme**: Historical Trends + Analysis

**Planned Features**:
- SQLite persistence layer
- Historical trend analysis
- Baseline comparison
- Pattern recognition across time
- Statistical anomaly detection

### v1.0.0 — Architect

**Theme**: Production Ready

**Planned Features**:
- Performance optimization
- Comprehensive documentation
- Enterprise features
- Multi-cluster support
- Advanced analytics dashboard

## Release Philosophy

- **Incremental Value**: Each release delivers usable features
- **Backward Compatible**: APIs remain stable across minor versions
- **Community Driven**: Roadmap shaped by user feedback

## Contributing

Have ideas for future releases? [Open an issue](https://github.com/saqqdy/kafka-log-analyzer/issues) or join discussions.

## Changelog

See [CHANGELOG.md](https://github.com/saqqdy/kafka-log-analyzer/blob/master/CHANGELOG.md) for release history.