## @solen/server /stores

[English](./README.md)

使用文档请参见 `@solen/server/stores`：
- 统一存储：内存 / Redis，`set / get / del`，可选 TTL
- 全局前缀：`prefix` 可配置
- 初始化：应用启动时调用 `initStores`
- 业务调用：直接 `import stores from '@solen/server/stores'`

构建产物位于 `dist/stores/*`，默认导出在 `exports["./stores"]`。
