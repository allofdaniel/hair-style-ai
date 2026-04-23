const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

type LogMethod = (...args: unknown[]) => void;

interface Logger {
  log: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const isDevLike = import.meta.env.DEV || import.meta.env.MODE === 'test';

const resolveMinimumLevel = (): LogLevel => {
  if (isDevLike) {
    return LOG_LEVELS.DEBUG;
  }
  return LOG_LEVELS.WARN;
};

const minimumLevel = resolveMinimumLevel();

const shouldLog = (level: LogLevel): boolean => level >= minimumLevel;

const getLevelForMethod = (
  method: keyof Pick<Console, 'debug' | 'info' | 'warn' | 'error' | 'log'>,
): LogLevel => {
  if (method === 'log' || method === 'debug') {
    return LOG_LEVELS.DEBUG;
  }
  if (method === 'info') {
    return LOG_LEVELS.INFO;
  }
  if (method === 'warn') {
    return LOG_LEVELS.WARN;
  }
  return LOG_LEVELS.ERROR;
};

const write = (method: keyof Pick<Console, 'debug' | 'info' | 'warn' | 'error' | 'log'>, args: unknown[]): void => {
  if (!shouldLog(getLevelForMethod(method))) {
    return;
  }

  if (typeof console !== 'undefined') {
    console[method](...args);
  }
};

export const logger: Logger = {
  log: (...args: unknown[]) => write('log', args),
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
};

export default logger;
