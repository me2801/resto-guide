const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const debug = {
  log: (...args: any[]) => {
    if (isDebug) console.log('[DEBUG]', ...args);
  },
  error: (...args: any[]) => {
    if (isDebug) console.error('[DEBUG ERROR]', ...args);
  },
  info: (...args: any[]) => {
    if (isDebug) console.info('[DEBUG INFO]', ...args);
  },
  warn: (...args: any[]) => {
    if (isDebug) console.warn('[DEBUG WARN]', ...args);
  },
};
