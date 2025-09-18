import { z } from 'zod';

// Environment validation schemas
export const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

export const backendEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // External APIs
  TMDB_API_KEY: z.string().min(1),
  WATCHMODE_API_KEY: z.string().min(1),
  TVDB_API_KEY: z.string().min(1),
  TVMAZE_API_KEY: z.string().optional(),

  // Meilisearch
  MEILISEARCH_HOST: z.string().url(),
  MEILISEARCH_MASTER_KEY: z.string().min(1),

  // Temporal
  TEMPORAL_ADDRESS: z.string().min(1),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  TEMPORAL_TASK_QUEUE: z.string().default('tcwatch-tasks'),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // File Storage
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Health Check
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000),
});

export const frontendEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),

  // API
  API_URL: z.string().url(),

  // Supabase (client-side)
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Analytics
  EXPO_PUBLIC_ANALYTICS_ID: z.string().optional(),

  // App Configuration
  EXPO_PUBLIC_APP_NAME: z.string().default('TCWatch'),
  EXPO_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // Feature Flags
  EXPO_PUBLIC_ENABLE_SOCIAL_FEATURES: z.string().transform(val => val === 'true').default('true'),
  EXPO_PUBLIC_ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  EXPO_PUBLIC_ENABLE_BETA_FEATURES: z.string().transform(val => val === 'true').default('false'),

  // External Services
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type BackendEnv = z.infer<typeof backendEnvSchema>;
export type FrontendEnv = z.infer<typeof frontendEnvSchema>;
export type NodeEnv = z.infer<typeof nodeEnvSchema>;

// Environment validation helpers
export function validateBackendEnv(env: Record<string, string | undefined>): BackendEnv {
  try {
    return backendEnvSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid backend environment variables:', error);
    process.exit(1);
  }
}

export function validateFrontendEnv(env: Record<string, string | undefined>): FrontendEnv {
  try {
    return frontendEnvSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid frontend environment variables:', error);
    process.exit(1);
  }
}

// Environment helpers
export function isDevelopment(env: NodeEnv): boolean {
  return env === 'development';
}

export function isProduction(env: NodeEnv): boolean {
  return env === 'production';
}

export function isTest(env: NodeEnv): boolean {
  return env === 'test';
}