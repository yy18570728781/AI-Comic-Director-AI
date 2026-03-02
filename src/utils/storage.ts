/**
 * localStorage 工具函数
 * 提供类型安全的存储和读取功能
 */

export const storage = {
  /**
   * 保存数据到 localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  },

  /**
   * 从 localStorage 读取数据
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to read from localStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  },

  /**
   * 删除 localStorage 中的数据
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
    }
  },

  /**
   * 清空所有 localStorage 数据
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  },

  /**
   * 检查 key 是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },
};

/**
 * 创建带命名空间的 storage
 * 用于避免 key 冲突
 */
export const createNamespacedStorage = (namespace: string) => ({
  set<T>(key: string, value: T): void {
    storage.set(`${namespace}:${key}`, value);
  },

  get<T>(key: string, defaultValue?: T): T | null {
    return storage.get(`${namespace}:${key}`, defaultValue);
  },

  remove(key: string): void {
    storage.remove(`${namespace}:${key}`);
  },

  has(key: string): boolean {
    return storage.has(`${namespace}:${key}`);
  },
});
