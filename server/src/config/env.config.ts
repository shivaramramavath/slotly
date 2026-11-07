import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z
    .string()
    .default(
      'mongodb://localhost:27017/slotly?replicaSet=rs0&directConnection=true',
    ),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('slotly-dev-super-secure-access-token-secret-32-chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('slotly-dev-super-secure-refresh-token-secret-32-chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  GROQ_API_KEY: z.string().optional().default(''),
  BREVO_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('noreply@slotly.local'),
  EMAIL_FROM_NAME: z.string().default('Slotly'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    console.error('Environment validation failed:', parsed.error.format());
    throw new Error(
      `Invalid environment configuration: ${JSON.stringify(parsed.error.format())}`,
    );
  }
  return parsed.data;
}
