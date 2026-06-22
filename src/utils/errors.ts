/**
 * Custom error types
 */

export class KafkaAnalyzerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'KafkaAnalyzerError'
  }
}

export class ValidationError extends KafkaAnalyzerError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class ScriptExecutionError extends KafkaAnalyzerError {
  constructor(message: string, details?: unknown) {
    super(message, 'SCRIPT_EXECUTION_ERROR', details)
    this.name = 'ScriptExecutionError'
  }
}

export class ConnectionError extends KafkaAnalyzerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONNECTION_ERROR', details)
    this.name = 'ConnectionError'
  }
}
