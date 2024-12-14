import { z } from 'zod';

const configSchema = z.object({
  ROOT_PATH: z.string({
    required_error: 'ROOT_PATH environment variable is required',
  }),
  DB_FILE_NAME: z.string({
    required_error: 'DB_FILE_NAME environment variable is required',
  }),
});

export const MY_CONFIG = configSchema.parse({
  ROOT_PATH: process.env['ROOT_PATH'],
  DB_FILE_NAME: process.env['DB_FILE_NAME'],
});
