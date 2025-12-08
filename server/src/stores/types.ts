/**
 * Store 存储的数据类型
 */
export type StoreValue =
  | string
  | number
  | boolean
  | object
  | any[]
  | null
  | undefined;

/**
 * 可选的存储驱动类型
 */
export type StoreDriver = 'memory' | 'redis';

/**
 * 底层适配器统一接口（memory / redis 都实现这一套）
 * 统一用 Promise 风格，方便兼容异步的 redis 客户端
 */
export interface StoreAdapter {
  /** 设置值 */
  set(key: string, value: StoreValue, ttlMs?: number): Promise<void>;
  /** 获取值，不存在时返回 null */
  get<T = StoreValue>(key: string): Promise<T | null>;
  /** 删除值（可选实现） */
  del?(key: string): Promise<void>;
}

/**
 * 对外暴露的 Store 实例接口
 * 与 Redis 的 get/set 语义对齐（均为异步）
 */
export interface StoreInstance {
  /** 设置值 */
  set(key: string, value: StoreValue, ttlMs?: number): Promise<void>;
  /** 获取值，不存在时返回 null */
  get<T = StoreValue>(key: string): Promise<T | null>;
  /** 删除某个 key */
  del(key: string): Promise<void>;
}

/**
 * 初始化 stores 时的配置
 */
export interface StoreInitOptions {
  /**
   * 存储驱动类型：
   * - memory：使用内存 Map
   * - redis：使用 Redis 客户端
   */
  type: StoreDriver;

  /**
   * key 统一前缀（不需要在 get/set 时手动传）
   * 例如 prefix: 'solen:'，实际写入的是 `solen:${key}`
   */
  prefix?: string;

  /**
   * redis 客户端实例：
   * - 直接传入已创建好的 Redis client，例如 new Redis(...)
   */
  db?: any;
}

export type { StoreInstance as Stores, StoreValue as StoresValue };


