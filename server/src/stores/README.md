## @solen/stores Usage (English)

[简体中文文档](./README.zh-CN.md)

`@solen/stores` provides a unified storage layer with:

- In-memory storage (`type: 'memory'`, based on `Map`)
- Redis storage (`type: 'redis'`, based on a provided Redis client)
- Unified key prefix (no need to manually add prefixes in business code)
- Unified async API: `set / get / del` (Promise-based)
- Optional TTL (time-to-live in milliseconds)

> The import path depends on your project setup. In the examples below we use `@solen/stores`.

---

### 1. Initialization on App Startup (separate from usage)

#### 1.1 Use Memory Store (development / simple scenarios)

```ts
import stores, { initStores } from '@solen/stores';

// Call once when the application starts
initStores({
  type: 'memory',
  // Optional: custom global prefix, default is 'solen_stores_'
  prefix: 'solen_stores_',
});

// In business code, just use stores.get/set/del
await stores.set('foo', 'bar');
```

#### 1.2 Use Redis Store (production / distributed scenarios)

```ts
import stores, { initStores } from '@solen/stores';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // other Redis options...
});

// Call once when the application starts
initStores({
  type: 'redis',
  db: redis,               // pass existing Redis client instance
  prefix: 'solen_stores_', // optional global prefix
});
```

> Note: the Redis connection is **long-lived**.  
> It is recommended to create the Redis client once at startup and then use `stores` everywhere, instead of creating a new Redis connection on each request.

---

### 2. Use in Business Code (after initialization)

After initialization, you can import and use the unified API anywhere:

```ts
import stores from '@solen/stores'; // initStores should have been called during app startup

// 1. Store an object (without TTL)
await stores.set('user:1', { name: 'John', age: 30 });

// 2. Read an object
const user = await stores.get<{ name: string; age: number }>('user:1');

// 3. Store an array
await stores.set('items', [1, 2, 3, 4, 5]);
const items = await stores.get<number[]>('items');

// 4. Store a nested object
await stores.set('config', {
  api: { baseUrl: 'https://api.example.com' },
  features: ['feature1', 'feature2'],
});
const config = await stores.get<{
  api: { baseUrl: string };
  features: string[];
}>('config');

// 5. Delete a key
await stores.del('user:1');
```

---

### 3. TTL (Time-To-Live) Usage

The third parameter of `set` is TTL in milliseconds.  
It behaves the same in both **memory** and **redis** modes:

```ts
// Set a key that will expire in 60 seconds
await stores.set('session:token', { uid: 123 }, 60_000);

// Before expiration, you can read it normally
const session = await stores.get<{ uid: number }>('session:token');

// After expiration, get will return null
```

- **memory mode**: internally uses `expireAt` (timestamp) to simulate expiration; `get` will check and automatically remove expired values.
- **redis mode**: internally uses `PEXPIRE` or `EXPIRE` to set the Redis key TTL.

---

### 4. Key Prefix

All keys written via `stores` will automatically get the global prefix:

```ts
import { initStores } from '@solen/stores';
import Redis from 'ioredis';

const redis = new Redis();

initStores({
  type: 'redis',
  db: redis,
  prefix: 'solen_stores_',
});

await stores.set('user:1', { name: 'John' });
// The actual key in the underlying store is: 'solen_stores_user:1'
```

- In your business code you only care about logical keys like `'user:1'`; you do **not** need to manually add the prefix.
- You can change `prefix` to separate different projects/environments (namespacing).

