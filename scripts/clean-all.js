#!/usr/bin/env node
/**
 * Clean all build outputs and node_modules across the monorepo
 */

import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const dirsToClean = [
  'node_modules',
  'TC-Frontend/node_modules',
  'TC-Backend/node_modules',
  'packages/shared-types/node_modules',
  'packages/config/node_modules',
  'TC-Backend/dist',
  'packages/shared-types/dist',
  'packages/config/dist',
  'TC-Frontend/.expo',
  'coverage',
  'TC-Backend/coverage',
  'TC-Frontend/coverage'
];

console.log('🧹 Cleaning TCWatch monorepo...\n');

for (const dir of dirsToClean) {
  const fullPath = join(rootDir, dir);
  if (existsSync(fullPath)) {
    console.log(`🗑️  Removing ${dir}...`);
    rmSync(fullPath, { recursive: true, force: true });
  }
}

// Clean package-lock files
const lockFiles = [
  'package-lock.json',
  'TC-Frontend/package-lock.json',
  'TC-Backend/package-lock.json',
  'packages/shared-types/package-lock.json',
  'packages/config/package-lock.json'
];

for (const lockFile of lockFiles) {
  const fullPath = join(rootDir, lockFile);
  if (existsSync(fullPath)) {
    console.log(`🗑️  Removing ${lockFile}...`);
    rmSync(fullPath, { force: true });
  }
}

console.log('\n✅ Clean complete!');
console.log('\n💡 To reinstall everything, run: npm run fresh');