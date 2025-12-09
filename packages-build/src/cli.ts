#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CLI entry point for @solen/packages-build
 * Allows users to run: npx solen-packages-build
 *
 * This CLI wrapper automatically uses build.config.ts if it exists,
 * otherwise falls back to the default configuration from this package.
 */
async function main() {
  const args = process.argv.slice(2);
  const cwd = process.cwd();

  // Check if build.config.ts exists in the current directory
  const configPath = resolve(cwd, 'build.config.ts');
  const hasConfig = existsSync(configPath);

  // If build.config.ts exists, use unbuild directly (it will read the config)
  // Otherwise, we need to use our default config
  if (hasConfig) {
    // User has their own build.config.ts, just run unbuild
    await runUnbuild(args);
  } else {
    // No config file, use our default config
    // We'll create a temporary config or use programmatic API
    await runUnbuildWithDefaultConfig(args);
  }
}

async function runUnbuild(args: string[]) {
  const { createRequire } = await import('node:module');
  const { readdirSync } = await import('node:fs');
  
  // Find workspace root by looking for pnpm-workspace.yaml
  function findWorkspaceRoot(startDir: string): string {
    let current = resolve(startDir);
    const root = resolve(current, '/');
    
    // First, try to find pnpm-workspace.yaml (most reliable indicator)
    while (current !== root) {
      const workspaceFile = resolve(current, 'pnpm-workspace.yaml');
      if (existsSync(workspaceFile)) {
        return current;
      }
      const parent = resolve(current, '..');
      // If we've reached the root or can't go up further, stop
      if (parent === current) {
        break;
      }
      current = parent;
    }
    
    // Fallback: try to find root package.json with pnpm-lock.yaml or node_modules
    // This indicates a workspace root
    current = resolve(startDir);
    while (current !== root) {
      const packageFile = resolve(current, 'package.json');
      const pnpmLock = resolve(current, 'pnpm-lock.yaml');
      const nodeModules = resolve(current, 'node_modules');
      
      if (existsSync(packageFile) && (existsSync(pnpmLock) || existsSync(nodeModules))) {
        return current;
      }
      
      const parent = resolve(current, '..');
      if (parent === current) {
        break;
      }
      current = parent;
    }
    
    return startDir; // Final fallback to current directory
  }
  
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  
  // Try multiple strategies to find unbuild
  let unbuildPath: string | null = null;
  
  // Strategy 1: Try to resolve from current working directory (user's project)
  // This is the most common case - unbuild is installed in the user's project
  try {
    const cwdPackageJson = resolve(process.cwd(), 'package.json');
    if (existsSync(cwdPackageJson)) {
      const cwdRequire = createRequire(cwdPackageJson);
      unbuildPath = cwdRequire.resolve('unbuild/dist/cli.mjs');
    }
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 2: Try to find it in workspace root node_modules (for pnpm workspace)
  // For pnpm workspace, dependencies might be hoisted to root
  if (!unbuildPath) {
    const workspaceUnbuildPath = resolve(workspaceRoot, 'node_modules/unbuild/dist/cli.mjs');
    if (existsSync(workspaceUnbuildPath)) {
      unbuildPath = workspaceUnbuildPath;
    }
  }
  
  // Strategy 3: Try to find it in pnpm .pnpm directory structure
  // For pnpm workspace with file: protocol, dependencies are in .pnpm
  if (!unbuildPath) {
    try {
      const pnpmDir = resolve(workspaceRoot, 'node_modules/.pnpm');
        if (existsSync(pnpmDir)) {
          const entries = readdirSync(pnpmDir);
          const unbuildEntry = entries.find(entry => entry.startsWith('unbuild@'));
          if (unbuildEntry) {
            const pnpmUnbuildPath = resolve(pnpmDir, `${unbuildEntry}/node_modules/unbuild/dist/cli.mjs`);
            if (existsSync(pnpmUnbuildPath)) {
              unbuildPath = pnpmUnbuildPath;
            }
          }
        }
      } catch {
      // Continue to next strategy
    }
  }
  
  // Strategy 4: Try to resolve from this package's location
  // This works when unbuild is a dependency of this package
  // But we need to be careful with pnpm's file: protocol structure
  if (!unbuildPath) {
    try {
      // First try to find package.json in the actual package location
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const packageRoot = resolve(__dirname, '..');
      const packageJsonPath = resolve(packageRoot, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        const packageRequire = createRequire(packageJsonPath);
        unbuildPath = packageRequire.resolve('unbuild/dist/cli.mjs');
      }
    } catch {
      // Continue to next strategy
    }
  }
  
  // Strategy 5: Try to find it in the package's node_modules (fallback)
  if (!unbuildPath) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageRoot = resolve(__dirname, '..');
    const fallbackPath = resolve(packageRoot, 'node_modules/unbuild/dist/cli.mjs');
    if (existsSync(fallbackPath)) {
      unbuildPath = fallbackPath;
    }
  }
  
  if (!unbuildPath) {
    // Provide helpful error message with debugging info
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageRoot = resolve(__dirname, '..');
    const cwd = process.cwd();
    
    throw new Error(
      `Cannot find unbuild. Please install unbuild as a dependency in your project:\n` +
      `  pnpm add unbuild -D\n\n` +
      `Searched locations:\n` +
      `  - ${resolve(cwd, 'node_modules/unbuild/dist/cli.mjs')}\n` +
      `  - ${resolve(workspaceRoot, 'node_modules/unbuild/dist/cli.mjs')}\n` +
      `  - ${resolve(workspaceRoot, 'node_modules/.pnpm/unbuild@*/node_modules/unbuild/dist/cli.mjs')}\n` +
      `  - ${resolve(packageRoot, 'node_modules/unbuild/dist/cli.mjs')}\n` +
      `Current working directory: ${cwd}\n` +
      `Workspace root: ${workspaceRoot}\n` +
      `Package location: ${packageRoot}`
    );
  }

  return new Promise<void>((resolve, reject) => {
    // Use spawn without shell to properly handle paths with spaces
    // When shell is false, Node.js handles the path array directly, avoiding shell path parsing issues
    const child = spawn('node', [unbuildPath, ...args], {
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runUnbuildWithDefaultConfig(args: string[]) {
  // When no build.config.ts exists, create a temporary one with default config
  const cwd = process.cwd();
  const configPath = resolve(cwd, 'build.config.ts');

  // Create temporary config file with default configuration
  const configContent = `import { defineBuildConfig, Config } from '@solen/packages-build';

export default defineBuildConfig(Config);
`;

  try {
    // Create temporary build.config.ts
    writeFileSync(configPath, configContent, 'utf-8');

    // Run unbuild (it will read the config file we just created)
    await runUnbuild(args);

    // Clean up: remove temporary config
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  } catch (error) {
    // Clean up on error
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
