type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  data?: Record<string, any>;
  error?: string;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const module = entry.module ? ` [${entry.module}]` : '';
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  const error = entry.error ? ` ERROR: ${entry.error}` : '';
  return `${base}${module} ${entry.message}${data}${error}`;
}

function log(entry: LogEntry) {
  const formatted = formatLog(entry);
  switch (entry.level) {
    case 'error': console.error(formatted); break;
    case 'warn': console.warn(formatted); break;
    default: console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, module?: string, data?: Record<string, any>) => 
    log({ level: 'debug', message, timestamp: new Date().toISOString(), module, data }),
  info: (message: string, module?: string, data?: Record<string, any>) => 
    log({ level: 'info', message, timestamp: new Date().toISOString(), module, data }),
  warn: (message: string, module?: string, data?: Record<string, any>) => 
    log({ level: 'warn', message, timestamp: new Date().toISOString(), module, data }),
  error: (message: string, module?: string, error?: Error, data?: Record<string, any>) => 
    log({ level: 'error', message, timestamp: new Date().toISOString(), module, data, error: error?.message }),
};
