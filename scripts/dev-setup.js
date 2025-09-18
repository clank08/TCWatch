#!/usr/bin/env node
/**
 * Development setup script for TCWatch monorepo
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Setting up TCWatch development environment...\n');

// Install root dependencies
console.log('📦 Installing root dependencies...');
try {
  execSync('npm install', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ Root dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install root dependencies:', error.message);
  process.exit(1);
}

// Build shared packages
console.log('🔨 Building shared packages...');
try {
  execSync('npm run packages:build', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ Shared packages built\n');
} catch (error) {
  console.error('❌ Failed to build shared packages:', error.message);
  process.exit(1);
}

// Setup Husky
console.log('🐺 Setting up Husky...');
try {
  execSync('npx husky install', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ Husky setup complete\n');
} catch (error) {
  console.error('❌ Failed to setup Husky:', error.message);
  process.exit(1);
}

// Check backend environment
const backendEnvPath = join(rootDir, 'TC-Backend', '.env');
if (!existsSync(backendEnvPath)) {
  console.log('⚠️  Backend .env file not found');
  console.log('   Run: npm run backend:setup to create from template\n');
}

// Success message
console.log('🎉 Development environment setup complete!');
console.log('\n📋 Next steps:');
console.log('   • Frontend: npm run frontend:dev');
console.log('   • Backend: npm run backend:dev');
console.log('   • Backend Docker: npm run backend:docker:dev');
console.log('\n💡 Useful commands:');
console.log('   • npm run lint - Lint all workspaces');
console.log('   • npm run format - Format all files');
console.log('   • npm run type-check - Check TypeScript types');
console.log('   • npm run test - Run all tests');