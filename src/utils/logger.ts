/**
 * Logger utility for structured and level-based logging
 *
 * This provides consistent logging across the application with:
 * - Different log levels (debug, info, warn, error)
 * - Ability to control verbosity in different environments
 * - Context information for each log message
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Default log level based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production'
  ? LogLevel.INFO  // In production, only show INFO and above
  : LogLevel.DEBUG; // In development, show everything

// Get configured log level, defaulting to environment-specific setting
const CURRENT_LOG_LEVEL = (() => {
  const configuredLevel = process.env.LOG_LEVEL;
  if (!configuredLevel) return DEFAULT_LOG_LEVEL;

  switch (configuredLevel.toLowerCase()) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    default: return DEFAULT_LOG_LEVEL;
  }
})();

interface LogOptions {
  context?: string;
  data?: any;
}

/**
 * Core logging function that handles level filtering and formatting
 */
function log(level: LogLevel, message: string, options: LogOptions = {}) {
  // Skip if this log level is below the current setting
  if (level < CURRENT_LOG_LEVEL) return;

  const { context, data } = options;

  // Format the message with a timestamp and context if provided
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  const formattedMessage = `${timestamp} ${LogLevel[level]}: ${contextStr}${message}`;

  // Choose the appropriate console method based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage, data ? data : '');
      break;
    case LogLevel.INFO:
      console.log(formattedMessage, data ? data : '');
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, data ? data : '');
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage, data ? data : '');
      break;
  }
}

/**
 * Logger class for maintaining context across multiple log calls
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, data?: any) {
    log(LogLevel.DEBUG, message, { context: this.context, data });
  }

  info(message: string, data?: any) {
    log(LogLevel.INFO, message, { context: this.context, data });
  }

  warn(message: string, data?: any) {
    log(LogLevel.WARN, message, { context: this.context, data });
  }

  error(message: string, data?: any) {
    log(LogLevel.ERROR, message, { context: this.context, data });
  }
}

/**
 * Create a new logger instance with the given context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
