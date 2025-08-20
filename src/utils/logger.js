import { __DEV__ } from "../config/constants"

class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000
  }

  log(level, message, ...args) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      args,
    }

    // Store log entry
    this.logs.push(logEntry)

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output in development
    if (__DEV__) {
      const consoleMethod = console[level] || console.log;
      // Convert error-like args to readable strings for console output
      const safeArgs = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === 'object') return JSON.stringify(arg);
        return arg;
      });
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}]`, message, ...safeArgs);
    }
  }

  debug(message, ...args) {
    this.log("debug", message, ...args)
  }

  info(message, ...args) {
    this.log("info", message, ...args)
  }

  warn(message, ...args) {
    this.log("warn", message, ...args)
  }

  error(message, ...args) {
    // Convert error-like args to readable strings
    const safeArgs = args.map(arg => {
      if (arg instanceof Error) return arg.message;
      if (typeof arg === 'object') return JSON.stringify(arg);
      return arg;
    });
    this.log("error", message, ...safeArgs);
  }

  // Performance logging
  time(label) {
    if (__DEV__) {
      console.time(label)
    }
  }

  timeEnd(label) {
    if (__DEV__) {
      console.timeEnd(label)
    }
  }

  // Get logs for debugging
  getLogs(level = null, limit = 100) {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = this.logs.filter((log) => log.level === level)
    }

    return filteredLogs.slice(-limit)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // Export logs
  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
