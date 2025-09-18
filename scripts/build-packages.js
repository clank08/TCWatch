#!/usr/bin/env node
/**
 * Build all shared packages in dependency order
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const packages = [
  'packages/shared-types',
  'packages/config'
];

console.log('🔨 Building shared packages...\n');

for (const pkg of packages) {
  const pkgPath = join(rootDir, pkg);
  const pkgName = pkg.split('/').pop();

  console.log(`📦 Building ${pkgName}...`);

  try {
    execSync('npm run build', {
      cwd: pkgPath,
      stdio: 'inherit'
    });
    console.log(`✅ ${pkgName} built successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${pkgName}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 All packages built successfully!');