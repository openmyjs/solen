## @solen/server /stores


API reference:
- English: [docs](./src/stores/README.md)
- 中文: [文档](./src/stores/README.zh-CN.md)

Quick usage:
- Init once: `initStores({ type: 'memory' | 'redis', db?, prefix? })`
- Use API: `import stores from '@solen/server/stores'; await stores.set/get/del(...)`
- TTL: third param of `set` (ms), works for memory & redis

Build outputs: `dist/stores/*`, exposed via `exports["./stores"]`.
