## @solen/server/stores (English)

[简体中文文档](./README.zh-CN.md)

A unified key-value store layer with memory and Redis drivers, async API, optional TTL, and automatic key prefixing.

### Install
```bash
npm i @solen/server
# or pnpm add @solen/server
```

### Initialize once (app startup)
```ts
import stores, { initStores } from '@solen/server/stores';
import Redis from 'ioredis';

// Memory (default)
initStores({ type: 'memory', prefix: 'solen_stores_' });

// Redis
const redis = new Redis();
initStores({ type: 'redis', db: redis, prefix: 'solen_stores_' });
```

### Use in business code
```ts
import stores from '@solen/server/stores';

await stores.set('user:1', { name: 'John' });        // optional 3rd param TTL (ms)
const user = await stores.get<{ name: string }>('user:1');
await stores.del('user:1');
```

### TTL
```ts
await stores.set('session:token', { uid: 123 }, 60_000); // expires in 60s
```
- Memory driver: simulated expiry on get
- Redis driver: uses EXPIRE/PEXPIRE

### Key prefix
All keys are stored as `<prefix><key>`. You only pass logical keys, e.g. `'user:1'`.

### API surface
- `initStores(options)` — required once at startup
- `stores.set(key, value, ttlMs?)`
- `stores.get<T>(key): Promise<T|null>`
- `stores.del(key)`

