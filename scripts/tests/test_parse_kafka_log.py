#!/usr/bin/env python3
"""Unit tests for parse_kafka_log.py.

Tests cover:
- Text format parsing
- JSON format parsing
- Auto format detection
- All 11 event types
- Timeline analysis
- Error handling
"""

import json
import tempfile
from pathlib import Path
import pytest
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from parse_kafka_log import (
    parse_log_line,
    parse_text_line,
    parse_json_line,
    analyze_file,
    detect_format,
    KafkaLogEvent,
    WINDOW_MAP,
)


class TestFormatDetection:
    """Test automatic format detection."""

    def test_detect_text_format(self):
        """Should detect text format from [timestamp] pattern."""
        line = "[2024-01-15 10:00:01] INFO [main] Successfully sent record"
        assert detect_format(line) == "text"

    def test_detect_json_format_object(self):
        """Should detect JSON format from object."""
        line = '{"timestamp":"2024-01-15","level":"INFO","message":"test"}'
        assert detect_format(line) == "json"

    def test_detect_json_format_array(self):
        """Should detect JSON format from array."""
        line = '[{"timestamp":"2024-01-15","level":"INFO"}]'
        assert detect_format(line) == "json"

    def test_detect_unknown_format(self):
        """Should return unknown for unrecognized formats."""
        line = "invalid log line without proper format"
        assert detect_format(line) == "unknown"


class TestTextLineParsing:
    """Test text format log line parsing."""

    def test_parse_basic_text_line(self):
        """Should parse basic text log line."""
        line = "[2024-01-15 10:00:01] INFO [main] Successfully sent record to topic orders"
        event = parse_text_line(line)
        assert event is not None
        assert event.timestamp == "2024-01-15 10:00:01"
        assert event.level == "INFO"
        assert event.component == "main"
        assert "Successfully sent record" in event.message

    def test_parse_error_level(self):
        """Should correctly parse ERROR level."""
        line = "[2024-01-15 10:00:02] ERROR [producer] Failed to send record"
        event = parse_text_line(line)
        assert event.level == "ERROR"

    def test_parse_warn_level(self):
        """Should correctly parse WARN level."""
        line = "[2024-01-15 10:00:03] WARN [consumer] lag exceeded threshold"
        event = parse_text_line(line)
        assert event.level == "WARN"

    def test_parse_invalid_text_line(self):
        """Should return None for invalid text line."""
        line = "invalid line without timestamp"
        event = parse_text_line(line)
        assert event is None


class TestJSONLineParsing:
    """Test JSON format log line parsing."""

    def test_parse_basic_json_line(self):
        """Should parse basic JSON log line."""
        line = '{"timestamp":"2024-01-15T10:00:01Z","level":"INFO","message":"test message"}'
        event = parse_json_line(line)
        assert event is not None
        assert event.timestamp == "2024-01-15T10:00:01Z"
        assert event.level == "INFO"
        assert event.message == "test message"

    def test_parse_json_with_thread(self):
        """Should parse JSON with thread field."""
        line = '{"timestamp":"2024-01-15","level":"ERROR","thread":"producer-1","message":"error"}'
        event = parse_json_line(line)
        assert event.component == "producer-1"

    def test_parse_json_with_alternative_fields(self):
        """Should parse JSON with alternative field names."""
        line = '{"@timestamp":"2024-01-15","severity":"ERROR","msg":"test","threadName":"main"}'
        event = parse_json_line(line)
        assert event.timestamp == "2024-01-15"
        assert event.level == "ERROR"
        assert event.message == "test"
        assert event.component == "main"

    def test_parse_invalid_json_line(self):
        """Should return None for invalid JSON."""
        line = '{"invalid": json}'
        event = parse_json_line(line)
        assert event is None


class TestEventTypes:
    """Test all 11 Kafka event type detections."""

    def test_send_success_event(self):
        """Should detect send_success event."""
        line = "[2024-01-15 10:00:01] INFO [producer] Successfully sent record to topic orders partition 0 offset 100"
        event = parse_text_line(line)
        assert event.event_type == "send_success"
        assert event.topic == "orders"
        assert event.partition == 0
        assert event.offset == 100

    def test_send_failure_event(self):
        """Should detect send_failure event."""
        line = "[2024-01-15 10:00:02] ERROR [producer] Failed to send record to topic payments error: TimeoutException"
        event = parse_text_line(line)
        assert event.event_type == "send_failure"
        assert event.topic == "payments"
        assert event.error == "TimeoutException"

    def test_consumer_lag_event(self):
        """Should detect consumer_lag event."""
        line = "[2024-01-15 10:00:03] WARN [consumer] lag exceeded threshold (5000 messages)"
        event = parse_text_line(line)
        assert event.event_type == "consumer_lag"
        assert event.offset_lag == 5000

    def test_rebalance_event(self):
        """Should detect rebalance event."""
        line = "[2024-01-15 10:00:04] INFO [consumer] Consumer group order-processor rebalance initiated"
        event = parse_text_line(line)
        assert event.event_type == "rebalance"
        assert event.topic == "order-processor"

    def test_commit_failure_event(self):
        """Should detect commit_failure event."""
        line = "[2024-01-15 10:00:05] ERROR [consumer] CommitFailedException: Commit cannot be completed"
        event = parse_text_line(line)
        assert event.event_type == "commit_failure"

    def test_buffer_exhausted_event(self):
        """Should detect buffer_exhausted event."""
        line = "[2024-01-15 10:00:07] ERROR [producer] BufferExhaustedException: Buffer is full"
        event = parse_text_line(line)
        assert event.event_type == "buffer_exhausted"

    def test_leader_change_event(self):
        """Should detect leader_change event."""
        line = "[2024-01-15 10:00:06] WARN [broker] leader changed from 2 to 3 for partition orders-1"
        event = parse_text_line(line)
        assert event.event_type == "leader_change"

    def test_offset_out_of_range_event(self):
        """Should detect offset_out_of_range event."""
        line = "[2024-01-15 10:00:09] ERROR [consumer] OffsetOutOfRange: No offset for topic-partition orders-1"
        event = parse_text_line(line)
        assert event.event_type == "offset_out_of_range"

    def test_serialization_error_event(self):
        """Should detect serialization_error event."""
        line = "[2024-01-15 10:00:10] ERROR [producer] SerializationException: Error serializing key"
        event = parse_text_line(line)
        assert event.event_type == "serialization_error"

    def test_network_error_event(self):
        """Should detect network_error event."""
        line = "[2024-01-15 10:00:11] WARN [network] NetworkException: Connection to broker-3 refused"
        event = parse_text_line(line)
        assert event.event_type == "network_error"

    def test_auth_error_event(self):
        """Should detect auth_error event."""
        line = "[2024-01-15 10:00:12] ERROR [client] TopicAuthorizationException: Authorization failed"
        event = parse_text_line(line)
        assert event.event_type == "auth_error"

    def test_unknown_event_type(self):
        """Should return unknown for unrecognized event."""
        line = "[2024-01-15 10:00:13] INFO [main] Generic log message"
        event = parse_text_line(line)
        assert event.event_type == "unknown"


class TestFileAnalysis:
    """Test file analysis functionality."""

    @pytest.fixture
    def sample_log_file(self):
        """Create temporary sample log file."""
        content = """[2024-01-15 10:00:01] INFO  [main] Successfully sent record to topic orders partition 0 offset 100
[2024-01-15 10:00:02] ERROR [producer-thread-1] Failed to send record to topic payments error: TimeoutException
[2024-01-15 10:00:03] WARN  [consumer-group-1] lag exceeded threshold (5000 messages)
[2024-01-15 10:00:04] INFO  [main] Consumer group order-processor rebalance initiated
[2024-01-15 10:00:05] ERROR [consumer-group-1] CommitFailedException: Commit cannot be completed since the group has already rebalanced
"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.log', delete=False) as f:
            f.write(content)
            yield Path(f.name)
        # Cleanup
        Path(f.name).unlink()

    def test_analyze_file_basic(self, sample_log_file):
        """Should analyze file and return events."""
        result = analyze_file(sample_log_file)
        assert 'events' in result
        assert 'stats' in result
        assert result['stats']['total_lines'] == 5
        assert result['stats']['parsed_events'] == 5

    def test_analyze_file_with_timeline(self, sample_log_file):
        """Should include timeline when requested."""
        result = analyze_file(sample_log_file, timeline=True, window_seconds=60)
        assert 'timeline' in result['stats']
        assert isinstance(result['stats']['timeline'], dict)

    def test_analyze_file_format_detection(self, sample_log_file):
        """Should auto-detect format."""
        result = analyze_file(sample_log_file, fmt='auto')
        assert result['format'] == 'text'

    def test_analyze_file_stats(self, sample_log_file):
        """Should generate correct statistics."""
        result = analyze_file(sample_log_file)
        stats = result['stats']
        assert 'by_type' in stats
        assert 'by_level' in stats
        assert stats['by_level']['INFO'] == 2
        assert stats['by_level']['ERROR'] == 2
        assert stats['by_level']['WARN'] == 1


class TestTimelineAnalysis:
    """Test timeline analysis functionality."""

    def test_window_map_values(self):
        """Should have correct window mappings."""
        assert WINDOW_MAP['1m'] == 60
        assert WINDOW_MAP['5m'] == 300
        assert WINDOW_MAP['15m'] == 900
        assert WINDOW_MAP['1h'] == 3600
        assert WINDOW_MAP['6h'] == 21600
        assert WINDOW_MAP['1d'] == 86400


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_empty_line(self):
        """Should handle empty line."""
        event = parse_log_line("")
        assert event is None

    def test_whitespace_only_line(self):
        """Should handle whitespace-only line."""
        event = parse_log_line("   \t\n")
        assert event is None

    def test_mixed_format_detection(self):
        """Should handle mixed format detection."""
        # Text line should be detected as text
        text_line = "[2024-01-15] INFO [main] message"
        assert detect_format(text_line) == "text"

        # JSON line should be detected as json
        json_line = '{"timestamp":"2024-01-15"}'
        assert detect_format(json_line) == "json"

    def test_analyze_nonexistent_file(self):
        """Should handle nonexistent file gracefully."""
        with pytest.raises(FileNotFoundError):
            analyze_file(Path("/nonexistent/file.log"))


@pytest.mark.integration
class TestIntegration:
    """Integration tests with real fixtures."""

    @pytest.fixture
    def fixture_path(self):
        """Get fixture path from tests/fixtures."""
        return Path(__file__).parent.parent.parent / "tests" / "fixtures" / "sample-kafka-log.txt"

    def test_analyze_fixture_file(self, fixture_path):
        """Should analyze actual fixture file."""
        if not fixture_path.exists():
            pytest.skip("Fixture file not found")

        result = analyze_file(fixture_path)
        assert result['stats']['parsed_events'] == 10
        assert result['format'] == 'text'

    def test_fixture_event_types(self, fixture_path):
        """Should detect all event types in fixture."""
        if not fixture_path.exists():
            pytest.skip("Fixture file not found")

        result = analyze_file(fixture_path)
        event_types = {e['event_type'] for e in result['events']}
        # Should have multiple event types
        assert len(event_types) > 1
        # Should include common types
        assert 'send_success' in event_types
        assert 'send_failure' in event_types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
