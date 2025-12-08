## @solen/server/stores 使用说明（中文）

[English](./README.md)

一个统一的存储层，支持内存/Redis、异步 API、可选 TTL、自动前缀。

### 安装
```bash
npm i @solen/server
# 或 pnpm add @solen/server
```

### 应用启动时初始化（只调用一次）
```ts
import stores, { initStores } from '@solen/server/stores';
import Redis from 'ioredis';

// 内存（默认）
initStores({ type: 'memory', prefix: 'solen_stores_' });

// Redis
const redis = new Redis();
initStores({ type: 'redis', db: redis, prefix: 'solen_stores_' });
```

### 业务代码使用
```ts
import stores from '@solen/server/stores';

await stores.set('user:1', { name: 'John' });        // 第三参为 TTL(毫秒，可选)
const user = await stores.get<{ name: string }>('user:1');
await stores.del('user:1');
```

### TTL
```ts
await stores.set('session:token', { uid: 123 }, 60_000); // 60 秒过期
```
- 内存驱动：get 时检查并清理过期
- Redis 驱动：使用 EXPIRE/PEXPIRE

### Key 前缀
所有 key 都会写入为 `<prefix><key>`，业务只传逻辑 key（如 `'user:1'`）。

### API
- `initStores(options)` — 启动时初始化
- `stores.set(key, value, ttlMs?)`
- `stores.get<T>(key): Promise<T|null>`
- `stores.del(key)`

