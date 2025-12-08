import type { StoreAdapter, StoreValue } from '../types';

/**
 * 基于内存 Map 的存储实现
 * 用于 type: 'memory' 的场景
 */
class MemoryAdapter implements StoreAdapter {
  private readonly data = new Map<
    string,
    { value: StoreValue; expireAt?: number }
  >();

  async set(key: string, value: StoreValue, ttlMs?: number): Promise<void> {
    const record: { value: StoreValue; expireAt?: number } = { value };
    if (typeof ttlMs === 'number' && ttlMs > 0) {
      record.expireAt = Date.now() + ttlMs;
    }
    this.data.set(key, record);
  }

  async get<T = StoreValue>(key: string): Promise<T | null> {
    const record = this.data.get(key);
    if (!record) return null;

    if (record.expireAt && record.expireAt <= Date.now()) {
      // 过期后自动删除
      this.data.delete(key);
      return null;
    }

    return (record.value as T | undefined) ?? null;
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}

export function createMemoryStore(): StoreAdapter {
  return new MemoryAdapter();
}


