import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './packages/drizzle/migrations',
  schema: './packages/drizzle/lib/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env['DB_FILE_NAME']!,
  },
});
