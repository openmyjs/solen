import type {
  StoreAdapter,
  StoreInstance,
  StoreInitOptions,
  StoreValue,
} from './types';
import { createMemoryStore } from './map';
import { createRedisStore } from './redis';

let storesType: 'memory' | 'redis' = 'memory';

/**
 * 全局单例的底层适配器 & key 前缀
 * - 通过 initStores 进行初始化
 * - 调用方只关心 stores.get/set/del
 */
let adapter: StoreAdapter = createMemoryStore();
let keyPrefix = 'solen_stores_'; // 默认统一前缀

function withPrefix(key: string): string {
  return `${keyPrefix}${key}`;
}

/**
 * 初始化全局 stores（与调用分离）：
 *
 * 项目启动时调用一次：
 * - initStores({ type: 'memory' })
 * - initStores({ type: 'redis', db: redisClient })
 */
function initStores(options: StoreInitOptions): void {
  keyPrefix = options.prefix ?? 'solen_stores_';

  if (options.type === 'redis') {
    storesType = 'redis';
    adapter = createRedisStore(options.db);
  } else {
    storesType = 'memory';
    adapter = createMemoryStore();
  }
}

/**
 * 对外暴露的统一 API
 * - 与 redis 的 get/set 语义对齐（异步）
 * - 自动追加统一前缀
 */
async function set(
  key: string,
  value: StoreValue,
  ttlMs?: number,
): Promise<void> {
  await adapter.set(withPrefix(key), value, ttlMs);
}

async function get<T = StoreValue>(key: string): Promise<T | null> {
  return adapter.get<T>(withPrefix(key));
}

async function del(key: string): Promise<void> {
  if (typeof adapter.del === 'function') {
    await adapter.del(withPrefix(key));
  }
}

/**
 * 默认导出：
 * - 仅作为一个具有 get/set/del 的实例（stores.get(...)）
 * - 初始化改为显式调用 initStores(options)
 *
 * 使用示例：
 *   import stores, { initStores } from '@solen/server-stores';
 *
 *   // 初始化（项目启动时调用一次）
 *   initStores({ type: 'memory' });
 *
 *   // 业务中直接使用
 *   await stores.set('foo', 'bar');
 */
const stores: StoreInstance = {
  set,
  get,
  del,
};

export default stores;
export { initStores ,storesType};
export type { StoreInstance, StoreInitOptions, StoreValue };

