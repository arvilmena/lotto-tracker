import { MY_CONFIG } from '@lotto-tracker/config';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

const sqlite = new Database(MY_CONFIG.DB_FILE_NAME);
export const db = drizzle({ client: sqlite });
