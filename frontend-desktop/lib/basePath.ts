const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

const withBase = (p: string): string =>
  basePath ? `${basePath}${p.startsWith('/') ? '' : '/'}${p}` : p;

export { basePath, withBase };
