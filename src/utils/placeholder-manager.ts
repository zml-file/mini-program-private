/**
 * 搜索框副标题管理工具
 * 功能：从后台获取副标题列表，定时随机更新显示
 */

import api from '@/api';
import type { ModuleCode } from '@/api/data';

// 缓存键名
const CACHE_KEY_PREFIX = 'placeholder_';
const CACHE_TIME_KEY_PREFIX = 'placeholder_time_';
const CACHE_INTERVAL_KEY_PREFIX = 'placeholder_interval_';

// 默认副标题（后台接口失败时使用）
const DEFAULT_PLACEHOLDERS: Record<string, string[]> = {
  '熟悉模块': ['请输入对方的问题', '搜索相关内容', '输入关键词查询'],
  '不熟模块': ['请输入对方的问题', '搜索相关内容', '输入关键词查询'],
  '陌生模块': ['请输入对方的问题', '搜索相关内容', '输入关键词查询'],
  '超熟模块': ['请输入对方的问题', '搜索相关内容', '输入关键词查询'],
  '免费模块': ['请输入对方的问题', '搜索相关内容', '输入关键词查询'],
};

// 默认更新间隔（小时）
const DEFAULT_UPDATE_INTERVAL = 24;

/**
 * 获取缓存的副标题列表
 */
function getCachedSubtitles(moduleCode: string): string[] | null {
  try {
    const cached = uni.getStorageSync(CACHE_KEY_PREFIX + moduleCode);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
  } catch (error) {
    console.error('[PlaceholderManager] 获取缓存失败:', error);
  }
  return null;
}

/**
 * 缓存副标题列表
 */
function setCachedSubtitles(moduleCode: string, subtitles: string[]): void {
  try {
    uni.setStorageSync(CACHE_KEY_PREFIX + moduleCode, subtitles);
    uni.setStorageSync(CACHE_TIME_KEY_PREFIX + moduleCode, Date.now());
  } catch (error) {
    console.error('[PlaceholderManager] 缓存失败:', error);
  }
}

/**
 * 获取上次更新时间
 */
function getLastUpdateTime(moduleCode: string): number {
  try {
    const time = uni.getStorageSync(CACHE_TIME_KEY_PREFIX + moduleCode);
    return time || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 获取更新间隔（小时）
 */
function getUpdateInterval(moduleCode: string): number {
  try {
    const interval = uni.getStorageSync(CACHE_INTERVAL_KEY_PREFIX + moduleCode);
    return interval || DEFAULT_UPDATE_INTERVAL;
  } catch (error) {
    return DEFAULT_UPDATE_INTERVAL;
  }
}

/**
 * 缓存更新间隔
 */
function setUpdateInterval(moduleCode: string, interval: number): void {
  try {
    uni.setStorageSync(CACHE_INTERVAL_KEY_PREFIX + moduleCode, interval);
  } catch (error) {
    console.error('[PlaceholderManager] 缓存更新间隔失败:', error);
  }
}

/**
 * 检查是否需要更新
 */
function shouldUpdate(moduleCode: string): boolean {
  const lastUpdateTime = getLastUpdateTime(moduleCode);
  const updateInterval = getUpdateInterval(moduleCode);
  const now = Date.now();
  const intervalMs = updateInterval * 60 * 60 * 1000; // 转换为毫秒

  return now - lastUpdateTime >= intervalMs;
}

/**
 * 从后台获取副标题列表
 */
async function fetchSubtitlesFromServer(moduleCode: ModuleCode): Promise<{
  subtitles: string[];
  updateInterval: number;
} | null> {
  try {
    const res = await api.common.getPlaceholderList({ moduleCode });
    if (res.data && res.data.subtitles && res.data.subtitles.length > 0) {
      return {
        subtitles: res.data.subtitles,
        updateInterval: res.data.updateInterval || DEFAULT_UPDATE_INTERVAL,
      };
    }
  } catch (error) {
    console.error('[PlaceholderManager] 获取副标题失败:', error);
  }
  return null;
}

/**
 * 随机选择一条副标题
 */
function getRandomSubtitle(subtitles: string[]): string {
  if (!subtitles || subtitles.length === 0) {
    return '请输入对方的问题';
  }
  const randomIndex = Math.floor(Math.random() * subtitles.length);
  return subtitles[randomIndex];
}

/**
 * 获取搜索框placeholder
 * @param moduleCode 模块code
 * @param forceUpdate 是否强制更新（默认false）
 * @returns placeholder文本
 */
export async function getPlaceholder(
  moduleCode: ModuleCode,
  forceUpdate: boolean = false
): Promise<string> {
  console.log('[PlaceholderManager] 获取placeholder, moduleCode:', moduleCode);

  // 检查是否需要更新
  if (forceUpdate || shouldUpdate(moduleCode)) {
    console.log('[PlaceholderManager] 需要更新，从服务器获取');
    const serverData = await fetchSubtitlesFromServer(moduleCode);

    if (serverData) {
      // 缓存新数据
      setCachedSubtitles(moduleCode, serverData.subtitles);
      setUpdateInterval(moduleCode, serverData.updateInterval);

      // 返回随机选择的副标题
      return getRandomSubtitle(serverData.subtitles);
    }
  }

  // 使用缓存数据
  const cachedSubtitles = getCachedSubtitles(moduleCode);
  if (cachedSubtitles && cachedSubtitles.length > 0) {
    console.log('[PlaceholderManager] 使用缓存数据');
    return getRandomSubtitle(cachedSubtitles);
  }

  // 使用默认数据
  console.log('[PlaceholderManager] 使用默认数据');
  const defaultSubtitles = DEFAULT_PLACEHOLDERS[moduleCode] || DEFAULT_PLACEHOLDERS['熟悉模块'];
  return getRandomSubtitle(defaultSubtitles);
}

/**
 * 预加载副标题（可在应用启动时调用）
 */
export async function preloadPlaceholders(moduleCodes: ModuleCode[]): Promise<void> {
  console.log('[PlaceholderManager] 预加载副标题');
  const promises = moduleCodes.map(moduleCode => getPlaceholder(moduleCode));
  await Promise.all(promises);
}

/**
 * 清除缓存
 */
export function clearPlaceholderCache(moduleCode?: string): void {
  try {
    if (moduleCode) {
      uni.removeStorageSync(CACHE_KEY_PREFIX + moduleCode);
      uni.removeStorageSync(CACHE_TIME_KEY_PREFIX + moduleCode);
      uni.removeStorageSync(CACHE_INTERVAL_KEY_PREFIX + moduleCode);
    } else {
      // 清除所有模块的缓存
      const allModules = Object.keys(DEFAULT_PLACEHOLDERS);
      allModules.forEach(module => {
        uni.removeStorageSync(CACHE_KEY_PREFIX + module);
        uni.removeStorageSync(CACHE_TIME_KEY_PREFIX + module);
        uni.removeStorageSync(CACHE_INTERVAL_KEY_PREFIX + module);
      });
    }
    console.log('[PlaceholderManager] 缓存已清除');
  } catch (error) {
    console.error('[PlaceholderManager] 清除缓存失败:', error);
  }
}

export default {
  getPlaceholder,
  preloadPlaceholders,
  clearPlaceholderCache,
};
