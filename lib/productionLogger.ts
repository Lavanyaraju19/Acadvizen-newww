/**
 * Production-safe logging utilities.
 * Never exposes sensitive data or stack traces in production.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

/**
 * Structured logger for production use.
 * In development, logs to console. In production, could be sent to a logging service.
 */
class ProductionLogger {
  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    }
  }

  /**
   * Strip sensitive fields from context before logging.
   */
  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined
    const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'session']
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(context)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  private write(entry: LogEntry) {
    const message = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    if (IS_PRODUCTION) {
      // In production, could send to a logging service
      // For now, still use console but with structured format
      switch (entry.level) {
        case 'error':
          console.error(JSON.stringify(entry))
          break
        case 'warn':
          console.warn(JSON.stringify(entry))
          break
        default:
          console.log(JSON.stringify(entry))
      }
    } else {
      // In development, human-readable format
      switch (entry.level) {
        case 'error':
          console.error(message, entry.context || '')
          break
        case 'warn':
          console.warn(message, entry.context || '')
          break
        case 'debug':
          console.debug(message, entry.context || '')
          break
        default:
          console.log(message, entry.context || '')
      }
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.write(this.formatEntry('info', message, context))
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.write(this.formatEntry('warn', message, context))
  }

  error(message: string, context?: Record<string, unknown>) {
    this.write(this.formatEntry('error', message, context))
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!IS_PRODUCTION) {
      this.write(this.formatEntry('debug', message, context))
    }
  }
}

export const logger = new ProductionLogger()

