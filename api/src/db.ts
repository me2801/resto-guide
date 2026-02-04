import postgres from 'postgres';
import { config } from './config.js';

let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!sql) {
    if (!config.databaseUrl) {
      throw new Error('SUPABASE_DB_URL is not configured');
    }
    sql = postgres(config.databaseUrl);
  }
  return sql;
}

export function t(table: string): string {
  return `${config.dbPrefix}${table}`;
}

export { config } from './config.js';
