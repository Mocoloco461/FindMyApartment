// Structured Logger with Timestamps and Levels

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export const logger = {
  debug: (message: string, meta?: any) => log('DEBUG', message, meta),
  info: (message: string, meta?: any) => log('INFO', message, meta),
  warn: (message: string, meta?: any) => log('WARN', message, meta),
  error: (message: string, error?: any) => log('ERROR', message, error),
};

function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (level === 'ERROR') {
    if (meta instanceof Error) {
      console.error(`${prefix} ❌ ${message}\nStack: ${meta.stack}`);
    } else if (meta) {
      console.error(`${prefix} ❌ ${message}`, meta);
    } else {
      console.error(`${prefix} ❌ ${message}`);
    }
    return;
  }

  if (level === 'WARN') {
    console.warn(`${prefix} ⚠️ ${message}`, meta ? meta : '');
    return;
  }

  if (level === 'INFO') {
    console.log(`${prefix} ℹ️ ${message}`, meta ? meta : '');
    return;
  }

  // DEBUG
  if (process.env.DEBUG) {
    console.debug(`${prefix} 🔍 ${message}`, meta ? meta : '');
  }
}
