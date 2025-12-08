import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { defineBuildConfig } from 'unbuild';

import type { BuildConfig } from 'unbuild';

/**
 * 递归处理目录中的文件，替换路径别名
 * @param distDir 构建输出目录
 */

function replaceAliases(distDir: string) {
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    const fullPath = resolve(distDir, entry.name);
    if (entry.isDirectory()) {
      replaceAliases(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const content = readFileSync(fullPath, 'utf-8');
      const replaced = content.replace(
        /from\s+["'](#\/[^"']+)["']/g,
        (_, alias) => {
          const path = alias.replace(/^#\//, '');
          const currentDir = dirname(fullPath);
          const targetPath = resolve(distDir, path);
          const relative = resolve(currentDir, targetPath)
            .replace(resolve(currentDir), '.')
            .replace(/\\/g, '/');
          return `from "${relative.startsWith('.') ? relative : `./${relative}`}"`;
        },
      );
      if (content !== replaced) {
        writeFileSync(fullPath, replaced, 'utf-8');
      }
    }
  }
}

/**
 * unbuild 构建配置
 * 用于构建 TypeScript 包，输出 ESM 格式的 JavaScript 文件
 */
const Config: BuildConfig = {
  // 构建前清理输出目录，确保每次构建都是干净的状态
  clean: true,
  // 生成 TypeScript 声明文件 (.d.ts)，供其他项目使用本包时获得类型提示
  declaration: true,
  // 生成 source map 文件，便于调试和错误追踪
  sourcemap: true,

  /**
   * 构建入口配置
   * 可以配置多个入口点，每个入口点独立构建
   */
  entries: [
    {
      // 使用 mkdist builder 进行构建
      // mkdist 是一个轻量级的构建工具，适合构建库和包
      builder: 'mkdist',
      // 源代码目录，从这里读取源文件进行构建
      input: './src',
      // 构建输出目录，构建后的文件将输出到这里
      outDir: './dist',
      // 输出格式为 ESM (ES Module)，使用 import/export 语法
      format: 'esm',
      // 输出文件扩展名为 .js（即使源文件是 .ts）
      ext: 'js',
      // 为当前入口点生成声明文件
      declaration: true,
    },
  ],

  /**
   * 外部依赖配置
   * 这些依赖不会被打包进构建产物中，而是作为外部依赖引用
   * 避免重复打包，减小构建产物体积
   */
  externals: [],

  /**
   * 构建钩子函数
   * 在构建生命周期的不同阶段执行自定义逻辑
   */
  hooks: {
    /**
     * 构建完成后的钩子函数
     * 在所有构建任务完成后执行，用于后处理构建产物
     *
     * @param ctx 构建上下文对象，包含构建选项和结果信息
     */
    'build:done'(ctx) {
      // 获取项目根目录，如果配置中没有指定则使用当前工作目录
      const rootDir = ctx.options.rootDir || process.cwd();

      // 遍历所有构建入口点，处理每个入口点的输出目录
      // 因为可能有多个入口点，每个入口点可能有不同的输出目录
      for (const entry of ctx.options.entries || []) {
        // 获取当前入口点的输出目录，默认为 "./dist"
        const outDir = entry.outDir || './dist';
        // 将相对路径解析为绝对路径
        const distDir = resolve(rootDir, outDir);

        // 检查输出目录是否存在且包含文件
        try {
          // 如果目录存在且不为空，则处理其中的文件
          if (readdirSync(distDir).length > 0) {
            // 递归处理输出目录中的所有文件，替换路径别名
            // 将构建产物中的 #/ 别名路径替换为相对路径
            replaceAliases(distDir);
          }
        } catch {
          // 如果目录不存在或无法读取（权限问题等），则跳过处理
          // 这种情况不应该中断构建流程，所以静默处理
        }
      }
    },
  },
};

export { defineBuildConfig, Config };
