# @solen/packages-build

[English](./README.md) | [中文](./README.zh-CN.md)

A build configuration package for TypeScript projects using [unbuild](https://github.com/unjs/unbuild), with automatic path alias replacement support.

## Features

- 🚀 **ESM Output**: Builds TypeScript projects to ESM format
- 📦 **TypeScript Support**: Automatically generates `.d.ts` declaration files
- 🗺️ **Source Maps**: Generates source maps for better debugging
- 🔄 **Path Alias Replacement**: Automatically replaces `#/` path aliases with relative paths in build output
- 🧹 **Auto Clean**: Cleans output directory before each build

## Installation

```bash
npm install @solen/packages-build --save-dev
# or
pnpm add @solen/packages-build -D
# or
yarn add @solen/packages-build --dev
```

## Usage

### Using the CLI Command (Recommended)

After installation, you can use the CLI command directly without creating `build.config.ts`:

```bash
# Build your project
npx solen-packages-build
# or
npx solen-packages-build build  # Both work the same

# Watch mode
npx solen-packages-build --watch
# or
npx solen-packages-build build --watch  # Both work the same
```

### Package.json Scripts

You can also add build scripts to your `package.json`:

**Option 1: Using the CLI command (no build.config.ts needed)**
```json
{
  "scripts": {
    "build": "solen-packages-build",
    "build:watch": "solen-packages-build --watch"
  }
}
```

> **Tip**: `solen-packages-build` defaults to build operation, so you can use `solen-packages-build` directly without the `build` argument. You can also use `solen-packages-build build`, both work the same.

**Option 2: Using unbuild directly (requires build.config.ts)**
```json
{
  "scripts": {
    "build": "unbuild",
    "build:watch": "unbuild --watch"
  }
}
```

> **Note**: If you use the CLI command (`solen-packages-build`), you don't need to create `build.config.ts` - it will use the default configuration automatically. If `build.config.ts` exists, it will be used instead.

### Basic Usage with build.config.ts

Create a `build.config.ts` file in your project root:

```typescript
import { defineBuildConfig, Config } from '@solen/packages-build';

// Option 1: Use the default configuration
export default defineBuildConfig(Config);

// Option 2: Extend the default configuration
export default defineBuildConfig({
  ...Config,
  entries: [
    {
      ...Config.entries[0],
      input: './src',
      outDir: './dist',
    },
  ],
});
```

### Custom Configuration

You can customize the configuration by extending the default `Config`:

```typescript
import { defineBuildConfig, Config } from '@solen/packages-build';

export default defineBuildConfig({
  ...Config,
  entries: [
    {
      builder: 'mkdist',
      input: './src',
      outDir: './dist',
      format: 'esm',
      ext: 'js',
      declaration: true,
    },
    // Add more entries if needed
  ],
  externals: ['vue', 'react'], // External dependencies
});
```

## Path Alias Support

This package automatically replaces `#/` path aliases with relative paths in the build output. For example:

**Source code:**
```typescript
import { utils } from '#/utils';
```

**Build output:**
```javascript
import { utils } from './utils';
```

## Default Configuration

The default `Config` includes:

- **Format**: ESM (ES Module)
- **Output**: `./dist` directory
- **Input**: `./src` directory
- **Declaration files**: Enabled (`.d.ts`)
- **Source maps**: Enabled
- **Clean**: Enabled (removes output directory before build)

## Requirements

- Node.js >= 14
- TypeScript >= 4.0
- unbuild >= 3.6.1

## License

MIT

## Repository

[GitHub](https://github.com/openmyjs/solen)
