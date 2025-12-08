## @solen/stores 使用说明（中文）

[English Documentation](./README.md)

`@solen/stores` 提供了一个统一的存储层，支持：

- 内存存储（`type: 'memory'`，基于 `Map`）
- Redis 存储（`type: 'redis'`，基于传入的 Redis 客户端）
- 统一的 Key 前缀（不需要在业务中手动拼接）
- 统一的 API：`set / get / del`（异步 Promise 形式）
- 可选 TTL（过期时间，毫秒）

> 包导入名以你项目实际配置为准，下面示例统一用：`@solen/stores`。

---

### 一、应用启动时初始化（与业务调用分离）

#### 1. 使用内存存储（开发环境 / 简单场景）

```ts
import stores, { initStores } from '@solen/stores';

// 在项目启动时调用一次（只负责初始化）
initStores({
  type: 'memory',
  // 可选：自定义统一前缀，不传则默认 'solen_stores_'
  prefix: 'solen_stores_',
});

// 业务代码中只关心读写，不再负责初始化
await stores.set('foo', 'bar');
```

#### 2. 使用 Redis 存储（生产环境 / 分布式场景）

```ts
import stores, { initStores } from '@solen/stores';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // 其他 Redis 配置...
});

// 在项目启动时调用一次（只负责初始化）
initStores({
  type: 'redis',
  db: redis,               // 直接传入 Redis 客户端实例
  prefix: 'solen_stores_', // 可选统一前缀
});
```

> 注意：Redis 连接是「常驻」的，建议在应用启动时创建一次，后续业务代码只通过 `stores` 来操作数据，不要在每个请求里新建 Redis 连接。

---

### 二、在业务代码中使用（假设已在启动阶段初始化）

初始化完成后，在任何地方都可以直接导入并使用统一的 API：

```ts
import stores from '@solen/stores'; // 假设应用启动时已经调用过 initStores

// 1. 存储对象（不带过期时间）
await stores.set('user:1', { name: 'John', age: 30 });

// 2. 读取对象
const user = await stores.get<{ name: string; age: number }>('user:1');

// 3. 存储数组
await stores.set('items', [1, 2, 3, 4, 5]);
const items = await stores.get<number[]>('items');

// 4. 存储嵌套对象
await stores.set('config', {
  api: { baseUrl: 'https://api.example.com' },
  features: ['feature1', 'feature2'],
});
const config = await stores.get<{
  api: { baseUrl: string };
  features: string[];
}>('config');

// 5. 删除 key
await stores.del('user:1');
```

---

### 三、TTL（过期时间）使用

`set` 方法第三个参数支持 TTL（毫秒），在 **memory** 和 **redis** 下行为一致：

```ts
// 设置 key，在 60 秒后自动过期
await stores.set('session:token', { uid: 123 }, 60_000);

// 过期之前可以正常读取
const session = await stores.get<{ uid: number }>('session:token');

// 过期之后，get 会返回 null
```

- **memory 模式**：内部使用 `expireAt`（时间戳）模拟过期，`get` 时会检查并自动删除已过期的数据。
- **redis 模式**：内部使用 `PEXPIRE` 或 `EXPIRE` 设置 Redis key 的过期时间。

---

### 四、Key 前缀说明

所有通过 `stores` 写入的 key，都会自动加上统一前缀：

```ts
import stores, { initStores } from '@solen/stores';
import Redis from 'ioredis';

const redis = new Redis();

initStores({
  type: 'redis',
  db: redis,
  prefix: 'solen_stores_',
});

await stores.set('user:1', { name: 'John' });
// 实际在底层存储中的 key 为：'solen_stores_user:1'
```

- 业务代码里只需要关心业务 key（如 `'user:1'`），不需要手动拼接前缀。
- 可以通过修改 `prefix` 来区分不同项目 / 不同环境的数据命名空间。

