# @solen/packages-build

[English](README.md) | [中文](README.zh-CN.md)

一个基于 [unbuild](https://github.com/unjs/unbuild) 的 TypeScript 项目构建配置包，支持自动路径别名替换。

## 特性

- 🚀 **ESM 输出**: 将 TypeScript 项目构建为 ESM 格式
- 📦 **TypeScript 支持**: 自动生成 `.d.ts` 声明文件
- 🗺️ **Source Maps**: 生成 source map 文件，便于调试
- 🔄 **路径别名替换**: 自动将构建输出中的 `#/` 路径别名替换为相对路径
- 🧹 **自动清理**: 每次构建前自动清理输出目录

## 安装

```bash
npm install @solen/packages-build --save-dev
# 或
pnpm add @solen/packages-build -D
# 或
yarn add @solen/packages-build --dev
```

## 使用方法

### 使用 CLI 命令（推荐）

安装后，你可以直接使用 CLI 命令，无需创建 `build.config.ts`：

```bash
# 构建项目
npx solen-packages-build
# 或
npx solen-packages-build build  # 两种方式都可以

# 监听模式
npx solen-packages-build --watch
# 或
npx solen-packages-build build --watch  # 两种方式都可以
```

### Package.json 脚本

你也可以在 `package.json` 中添加构建脚本：

**方式 1: 使用 CLI 命令（无需 build.config.ts）**
```json
{
  "scripts": {
    "build": "solen-packages-build",
    "build:watch": "solen-packages-build --watch"
  }
}
```

> **提示**: `solen-packages-build` 默认执行构建操作，所以可以直接使用 `solen-packages-build` 而不需要加 `build` 参数。你也可以使用 `solen-packages-build build`，两者效果相同。

**方式 2: 直接使用 unbuild（需要 build.config.ts）**
```json
{
  "scripts": {
    "build": "unbuild",
    "build:watch": "unbuild --watch"
  }
}
```

> **注意**: 如果使用 CLI 命令 (`solen-packages-build`)，你不需要创建 `build.config.ts` - 它会自动使用默认配置。如果 `build.config.ts` 存在，则会优先使用它。

### 使用 build.config.ts 的基本用法

在项目根目录创建 `build.config.ts` 文件：

```typescript
import { defineBuildConfig, Config } from '@solen/packages-build';

// 方式 1: 使用默认配置
export default defineBuildConfig(Config);

// 方式 2: 扩展默认配置
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

### 自定义配置

你可以通过扩展默认 `Config` 来自定义配置：

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
    // 如果需要，可以添加更多入口点
  ],
  externals: ['vue', 'react'], // 外部依赖
});
```

## 路径别名支持

此包会自动将构建输出中的 `#/` 路径别名替换为相对路径。例如：

**源代码:**
```typescript
import { utils } from '#/utils';
```

**构建输出:**
```javascript
import { utils } from './utils';
```

## 默认配置

默认的 `Config` 包括：

- **格式**: ESM (ES Module)
- **输出**: `./dist` 目录
- **输入**: `./src` 目录
- **声明文件**: 已启用 (`.d.ts`)
- **Source maps**: 已启用
- **清理**: 已启用（构建前移除输出目录）

## 系统要求

- Node.js >= 14
- TypeScript >= 4.0
- unbuild >= 3.6.1

## 许可证

MIT

## 仓库

[GitHub](https://github.com/openmyjs/solen)

