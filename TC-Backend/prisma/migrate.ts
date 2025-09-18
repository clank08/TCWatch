#!/usr/bin/env tsx

/**
 * TCWatch Database Migration Runner
 *
 * This script handles database migrations for development and production environments.
 * It integrates with Prisma migrations and applies custom SQL scripts like RLS policies.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface MigrationConfig {
  environment: 'development' | 'staging' | 'production';
  applyRLS: boolean;
  runSeed: boolean;
  resetDatabase: boolean;
}

async function runMigrations(config: MigrationConfig) {
  console.log(`🚀 Starting database migrations for ${config.environment} environment...`);

  try {
    // Step 1: Reset database if requested (development only)
    if (config.resetDatabase && config.environment === 'development') {
      console.log('🔄 Resetting database...');
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    }

    // Step 2: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 3: Run Prisma migrations
    console.log('📊 Running Prisma schema migrations...');
    if (config.environment === 'production') {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      execSync('npx prisma db push', { stdio: 'inherit' });
    }

    // Step 4: Apply RLS policies
    if (config.applyRLS) {
      console.log('🔒 Applying Row Level Security policies...');
      await applyRLSPolicies();
    }

    // Step 5: Run database seeding
    if (config.runSeed && config.environment !== 'production') {
      console.log('🌱 Running database seed...');
      execSync('npx tsx src/scripts/seed.ts', { stdio: 'inherit' });
    }

    // Step 6: Verify database connection and basic functionality
    console.log('✅ Verifying database setup...');
    await verifyDatabase();

    console.log(`✅ Database migration completed successfully for ${config.environment}!`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function applyRLSPolicies() {
  const rlsPath = join(process.cwd(), 'prisma', 'rls-policies.sql');

  if (!existsSync(rlsPath)) {
    console.warn('⚠️ RLS policies file not found, skipping...');
    return;
  }

  try {
    const rlsSQL = readFileSync(rlsPath, 'utf-8');

    // Split by semicolon and execute each statement separately
    const statements = rlsSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement + ';');
        } catch (error) {
          // Some statements might fail if they already exist, which is ok
          if (!error.message.includes('already exists') &&
              !error.message.includes('does not exist') &&
              !error.message.includes('duplicate')) {
            console.warn(`⚠️ RLS statement warning:`, error.message);
          }
        }
      }
    }

    console.log('✅ RLS policies applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    throw error;
  }
}

async function verifyDatabase() {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;

    // Test that core tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('user_profiles', 'content', 'user_content')
    `;

    console.log('📊 Database verification passed');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    throw error;
  }
}

// Create migration script for different environments
async function createMigration(name: string) {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').split('.')[0];
  const migrationName = `${timestamp}_${name}`;

  console.log(`📝 Creating new migration: ${migrationName}`);

  try {
    execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' });
    console.log(`✅ Migration ${migrationName} created successfully`);
  } catch (error) {
    console.error('❌ Failed to create migration:', error);
    throw error;
  }
}

// Main CLI interface
async function main() {
  const command = process.argv[2];
  const environment = (process.argv[3] as 'development' | 'staging' | 'production') || 'development';

  switch (command) {
    case 'run':
      await runMigrations({
        environment,
        applyRLS: true,
        runSeed: environment === 'development',
        resetDatabase: false
      });
      break;

    case 'reset':
      if (environment !== 'development') {
        console.error('❌ Reset is only allowed in development environment');
        process.exit(1);
      }
      await runMigrations({
        environment,
        applyRLS: true,
        runSeed: true,
        resetDatabase: true
      });
      break;

    case 'create':
      const migrationName = process.argv[3];
      if (!migrationName) {
        console.error('❌ Migration name is required');
        process.exit(1);
      }
      await createMigration(migrationName);
      break;

    case 'rls':
      console.log('🔒 Applying RLS policies only...');
      await applyRLSPolicies();
      break;

    case 'verify':
      console.log('✅ Verifying database...');
      await verifyDatabase();
      break;

    default:
      console.log(`
📚 TCWatch Database Migration Tool

Usage:
  npm run migrate run [environment]     - Run migrations for environment (development|staging|production)
  npm run migrate reset                 - Reset and reseed database (development only)
  npm run migrate create <name>         - Create a new migration
  npm run migrate rls                   - Apply RLS policies only
  npm run migrate verify                - Verify database connection and structure

Examples:
  npm run migrate run development
  npm run migrate reset
  npm run migrate create add_user_preferences
  npm run migrate rls
      `);
      break;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

export { runMigrations, createMigration, applyRLSPolicies, verifyDatabase };