import type { StoreAdapter, StoreValue } from '../types';

/**
 * 一个最小的 Redis 客户端约束
 * 兼容 ioredis / node-redis 等，只要有 get/set/del 即可
 */
export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  /**
   * 可选：毫秒级过期（ioredis 支持 pexpire）
   */
  pexpire?(key: string, ttlMs: number): Promise<unknown>;
  /**
   * 可选：秒级过期
   */
  expire?(key: string, ttlSeconds: number): Promise<unknown>;
}

export interface RedisStoreConfig {
  /**
   * 已经创建好的 Redis 客户端实例
   * 例如：const client = new Redis(options)
   */
  client: RedisLikeClient;
}

/**
 * 基于 Redis 的存储实现
 * 用于 type: 'redis' 的场景
 */
class RedisAdapter implements StoreAdapter {
  private readonly client: RedisLikeClient;

  constructor(client: RedisLikeClient) {
    this.client = client;
  }

  async set(key: string, value: StoreValue, ttlMs?: number): Promise<void> {
    // 统一使用 JSON 序列化，保证与内存实现的数据结构对齐
    const serialized = JSON.stringify(value);
    await this.client.set(key, serialized);

    if (typeof ttlMs === 'number' && ttlMs > 0) {
      if (this.client.pexpire) {
        await this.client.pexpire(key, ttlMs);
      } else if (this.client.expire) {
        await this.client.expire(key, Math.ceil(ttlMs / 1000));
      }
    }
  }

  async get<T = StoreValue>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // 兼容非 JSON 的旧数据，直接返回原始字符串
      return raw as unknown as T;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export function createRedisStore(
  config: RedisStoreConfig | RedisLikeClient,
): StoreAdapter {
  const client: RedisLikeClient =
    'get' in config && 'set' in config && 'del' in config
      ? (config as RedisLikeClient)
      : (config as RedisStoreConfig).client;

  return new RedisAdapter(client);
}


