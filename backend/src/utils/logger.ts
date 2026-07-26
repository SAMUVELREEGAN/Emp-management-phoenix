import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(formatMessage('info', message), meta ?? '');
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(formatMessage('warn', message), meta ?? '');
  },
  error: (message: string, meta?: unknown) => {
    console.error(formatMessage('error', message), meta ?? '');
  },
  debug: (message: string, meta?: unknown) => {
    if (env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message), meta ?? '');
    }
  },
};
