#!/usr/bin/env python3
"""Unit tests for generate_report.py.

Tests cover:
- Markdown report generation
- JSON report generation
- Slack report generation
- Report formatting and structure
"""

import json
import tempfile
from pathlib import Path
import pytest
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_report import (
    generate_markdown_report,
    generate_json_report,
    generate_slack_report,
    ReportGenerator,
)


class TestMarkdownReport:
    """Test Markdown report generation."""

    @pytest.fixture
    def sample_data(self):
        """Create sample analysis data."""
        return {
            "events": [
                {"timestamp": "2024-01-15 10:00:01", "level": "ERROR", "component": "producer", "message": "Failed to send"},
                {"timestamp": "2024-01-15 10:00:02", "level": "WARN", "component": "consumer", "message": "Lag detected"},
            ],
            "anomalies": [
                {
                    "type": "error_rate_spike",
                    "severity": "P1",
                    "component": "producer",
                    "description": "Error rate 15% exceeds threshold",
                    "recommendation": "Check broker availability",
                }
            ],
            "summary": {
                "total": 2,
                "byPriority": {"P0": 0, "P1": 1, "P2": 0, "P3": 0},
            },
        }

    def test_generate_markdown_report(self, sample_data):
        """Should generate valid Markdown report."""
        report = generate_markdown_report(sample_data)
        assert report is not None
        assert isinstance(report, str)
        assert "# Kafka Log Analysis Report" in report
        assert "Total Events" in report
        assert "P1" in report

    def test_markdown_report_structure(self, sample_data):
        """Should have correct Markdown structure."""
        report = generate_markdown_report(sample_data)
        assert "## " in report  # Has sections
        assert "**" in report  # Has bold text
        assert "-" in report or "*" in report  # Has lists

    def test_markdown_report_with_anomalies(self, sample_data):
        """Should include anomalies in Markdown report."""
        report = generate_markdown_report(sample_data)
        assert "error_rate_spike" in report or "Error Rate Spike" in report
        assert "Check broker availability" in report


class TestJSONReport:
    """Test JSON report generation."""

    @pytest.fixture
    def sample_data(self):
        """Create sample analysis data."""
        return {
            "events": [
                {"timestamp": "2024-01-15 10:00:01", "level": "ERROR", "component": "producer", "message": "Failed"},
            ],
            "anomalies": [],
            "summary": {"total": 1, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }

    def test_generate_json_report(self, sample_data):
        """Should generate valid JSON report."""
        report = generate_json_report(sample_data)
        assert report is not None
        assert isinstance(report, str)

        # Should be valid JSON
        parsed = json.loads(report)
        assert "events" in parsed
        assert "summary" in parsed

    def test_json_report_structure(self, sample_data):
        """Should have correct JSON structure."""
        report = generate_json_report(sample_data)
        parsed = json.loads(report)

        assert "events" in parsed
        assert "anomalies" in parsed
        assert "summary" in parsed
        assert isinstance(parsed["events"], list)
        assert isinstance(parsed["summary"], dict)


class TestSlackReport:
    """Test Slack report generation."""

    @pytest.fixture
    def sample_data(self):
        """Create sample analysis data."""
        return {
            "events": [
                {"timestamp": "2024-01-15 10:00:01", "level": "ERROR", "component": "producer", "message": "Failed"},
            ],
            "anomalies": [
                {
                    "type": "consumer_lag",
                    "severity": "P1",
                    "component": "consumer",
                    "description": "Lag: 15000 messages",
                }
            ],
            "summary": {"total": 1, "byPriority": {"P0": 0, "P1": 1, "P2": 0, "P3": 0}},
        }

    def test_generate_slack_report(self, sample_data):
        """Should generate valid Slack report."""
        report = generate_slack_report(sample_data)
        assert report is not None
        assert isinstance(report, str)

    def test_slack_report_formatting(self, sample_data):
        """Should use Slack-compatible formatting."""
        report = generate_slack_report(sample_data)
        # Slack uses * for bold, :emoji: for emojis
        assert "*" in report or ":" in report

    def test_slack_report_compact(self, sample_data):
        """Should be compact for Slack."""
        report = generate_slack_report(sample_data)
        # Should not be too verbose
        lines = report.split("\n")
        assert len(lines) < 50  # Reasonable length for Slack


class TestReportGenerator:
    """Test ReportGenerator class."""

    @pytest.fixture
    def generator(self):
        """Create report generator instance."""
        return ReportGenerator()

    @pytest.fixture
    def sample_data(self):
        """Create sample data."""
        return {
            "events": [],
            "anomalies": [],
            "summary": {"total": 0, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }

    def test_generate_all_formats(self, generator, sample_data):
        """Should generate all report formats."""
        md = generator.generate(sample_data, "markdown")
        json_rep = generator.generate(sample_data, "json")
        slack = generator.generate(sample_data, "slack")

        assert md is not None
        assert json_rep is not None
        assert slack is not None

    def test_invalid_format(self, generator, sample_data):
        """Should handle invalid format."""
        with pytest.raises(ValueError):
            generator.generate(sample_data, "invalid_format")


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_events(self):
        """Should handle empty events list."""
        data = {
            "events": [],
            "anomalies": [],
            "summary": {"total": 0, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }
        report = generate_markdown_report(data)
        assert report is not None
        assert "0" in report  # Should show zero events

    def test_no_anomalies(self):
        """Should handle no anomalies case."""
        data = {
            "events": [{"timestamp": "2024-01-15", "level": "INFO", "component": "test", "message": "test"}],
            "anomalies": [],
            "summary": {"total": 1, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }
        report = generate_markdown_report(data)
        assert report is not None
        assert "No anomalies" in report or "anomalies" in report.lower()

    def test_large_number_of_events(self):
        """Should handle large number of events."""
        events = [
            {"timestamp": f"2024-01-15 10:00:{i:02d}", "level": "INFO", "component": "test", "message": f"message {i}"}
            for i in range(1000)
        ]
        data = {
            "events": events,
            "anomalies": [],
            "summary": {"total": 1000, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }
        report = generate_markdown_report(data)
        assert report is not None
        assert "1000" in report

    def test_special_characters_in_messages(self):
        """Should handle special characters."""
        data = {
            "events": [
                {"timestamp": "2024-01-15", "level": "ERROR", "component": "test", "message": "Error with 中文 and emoji 🚨"}
            ],
            "anomalies": [],
            "summary": {"total": 1, "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0}},
        }
        report = generate_markdown_report(data)
        assert report is not None
        assert "中文" in report


@pytest.mark.integration
class TestIntegration:
    """Integration tests."""

    @pytest.fixture
    def fixture_path(self):
        """Get fixture path."""
        return Path(__file__).parent.parent.parent / "tests" / "fixtures" / "sample-kafka-log.txt"

    def test_full_pipeline(self, fixture_path):
        """Test full analysis pipeline."""
        if not fixture_path.exists():
            pytest.skip("Fixture file not found")

        # Parse log
        from parse_kafka_log import analyze_file
        parsed = analyze_file(fixture_path)

        # Detect anomalies
        from detect_anomalies import detect_anomalies
        anomalies_result = detect_anomalies(parsed['events'])

        # Handle both return formats
        if isinstance(anomalies_result, dict):
            anomalies = anomalies_result.get('anomalies', [])
        else:
            anomalies = anomalies_result

        # Generate reports
        data = {
            "events": parsed['events'],
            "anomalies": anomalies,
            "summary": {
                "total": len(parsed['events']),
                "byPriority": {"P0": 0, "P1": 0, "P2": 0, "P3": 0},
            },
        }

        md_report = generate_markdown_report(data)
        json_report = generate_json_report(data)
        slack_report = generate_slack_report(data)

        assert md_report is not None
        assert json_report is not None
        assert slack_report is not None

        # Validate JSON
        parsed_json = json.loads(json_report)
        assert parsed_json is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
