## @solen/server /stores

使用文档：
- 英文版：[docs](./src/stores/README.md)
- 中文版：[文档](./src/stores/README.zh-CN.md)

快速使用：
- 启动初始化：`initStores({ type: 'memory' | 'redis', db?, prefix? })`
- 业务调用：`import stores from '@solen/server/stores'; await stores.set/get/del(...)`
- TTL：`set` 的第三个参数（毫秒），内存/Redis 一致

构建产物位于 `dist/stores/*`，通过 `exports["./stores"]` 暴露。
