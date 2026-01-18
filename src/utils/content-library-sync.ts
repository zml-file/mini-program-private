/**
 * 内容库数据同步工具
 * 用于在登录后同步接口数据到本地存储
 */

import api from '@/api/index';

// 内容库数据类型定义
export interface ContentLibraryItem {
  id: number;
  contentCode: string;
  warehouseId: number;
  warehouseName: string;
  content: string;
  nextContent?: string;
  symbol?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: any;
}

// 本地存储的内容库数据结构
export interface LocalContentLibrary {
  data: ContentLibraryItem[];
  lastSyncTime: string;
  version: number;
}

// 本地存储键名
const STORAGE_KEY = 'content_library_data';

/**
 * 从接口获取内容库数据
 */
export async function fetchContentLibraryData(): Promise<ContentLibraryItem[]> {
  try {
    console.log('[ContentLibrarySync] 开始获取内容库数据...');
    const response = await api.four.getAllContent();

    if (response.code === 200 && response.data) {
      console.log('[ContentLibrarySync] 成功获取内容库数据，共', response.data.length, '条');
      return response.data;
    } else {
      console.error('[ContentLibrarySync] 接口返回错误:', response.message);
      throw new Error(response.message || '获取内容库数据失败');
    }
  } catch (error) {
    console.error('[ContentLibrarySync] 获取内容库数据失败:', error);
    throw error;
  }
}

/**
 * 从本地存储获取内容库数据
 */
export function getLocalContentLibrary(): LocalContentLibrary | null {
  try {
    const data = uni.getStorageSync(STORAGE_KEY);
    if (data) {
      console.log('[ContentLibrarySync] 从本地存储获取数据，共', data.data?.length || 0, '条');
      return data;
    }
    return null;
  } catch (error) {
    console.error('[ContentLibrarySync] 读取本地存储失败:', error);
    return null;
  }
}

/**
 * 保存内容库数据到本地存储
 */
export function saveLocalContentLibrary(data: ContentLibraryItem[]): void {
  try {
    const localData: LocalContentLibrary = {
      data,
      lastSyncTime: new Date().toISOString(),
      version: Date.now(),
    };

    uni.setStorageSync(STORAGE_KEY, localData);
    console.log('[ContentLibrarySync] 成功保存到本地存储，共', data.length, '条数据');
  } catch (error) {
    console.error('[ContentLibrarySync] 保存本地存储失败:', error);
    throw error;
  }
}

/**
 * 检查数据是否重复
 * 根据 id 和 contentCode 判断
 */
export function isDuplicate(
  newItem: ContentLibraryItem,
  existingData: ContentLibraryItem[]
): boolean {
  return existingData.some(
    item => item.id === newItem.id || item.contentCode === newItem.contentCode
  );
}

/**
 * 合并数据，过滤重复项
 */
export function mergeContentLibraryData(
  existingData: ContentLibraryItem[],
  newData: ContentLibraryItem[]
): ContentLibraryItem[] {
  const merged = [...existingData];
  let addedCount = 0;
  let skippedCount = 0;

  newData.forEach(newItem => {
    if (!isDuplicate(newItem, merged)) {
      merged.push(newItem);
      addedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log('[ContentLibrarySync] 数据合并完成：新增', addedCount, '条，跳过重复', skippedCount, '条');
  return merged;
}

/**
 * 同步内容库数据
 * @param merge - 是否合并现有数据（true: 合并去重，false: 完全替换）
 * @returns 同步后的数据
 */
export async function syncContentLibrary(merge: boolean = true): Promise<LocalContentLibrary> {
  try {
    console.log('[ContentLibrarySync] 开始同步内容库数据...');

    // 1. 获取接口数据
    const apiData = await fetchContentLibraryData();

    // 2. 获取本地数据
    const localData = getLocalContentLibrary();

    let finalData: ContentLibraryItem[];

    if (merge && localData && localData.data.length > 0) {
      // 合并模式：将新数据与现有数据合并，去除重复
      console.log('[ContentLibrarySync] 使用合并模式，现有数据', localData.data.length, '条');
      finalData = mergeContentLibraryData(localData.data, apiData);
    } else {
      // 替换模式：直接使用新数据
      console.log('[ContentLibrarySync] 使用替换模式');
      finalData = apiData;
    }

    // 3. 保存到本地存储
    saveLocalContentLibrary(finalData);

    const result: LocalContentLibrary = {
      data: finalData,
      lastSyncTime: new Date().toISOString(),
      version: Date.now(),
    };

    console.log('[ContentLibrarySync] 同步完成，最终数据共', finalData.length, '条');
    return result;
  } catch (error) {
    console.error('[ContentLibrarySync] 同步失败:', error);
    throw error;
  }
}

/**
 * 根据仓库ID获取内容
 */
export function getContentsByWarehouse(warehouseId: number): ContentLibraryItem[] {
  const localData = getLocalContentLibrary();
  if (!localData) return [];

  return localData.data.filter(item => item.warehouseId === warehouseId);
}

/**
 * 根据内容编码获取内容详情
 */
export function getContentByCode(contentCode: string): ContentLibraryItem | undefined {
  const localData = getLocalContentLibrary();
  if (!localData) return undefined;

  return localData.data.find(item => item.contentCode === contentCode);
}

/**
 * 根据ID获取内容详情
 */
export function getContentById(id: number): ContentLibraryItem | undefined {
  const localData = getLocalContentLibrary();
  if (!localData) return undefined;

  return localData.data.find(item => item.id === id);
}

/**
 * 清除本地存储的内容库数据
 */
export function clearLocalContentLibrary(): void {
  try {
    uni.removeStorageSync(STORAGE_KEY);
    console.log('[ContentLibrarySync] 已清除本地存储数据');
  } catch (error) {
    console.error('[ContentLibrarySync] 清除本地存储失败:', error);
  }
}

export default {
  fetchContentLibraryData,
  getLocalContentLibrary,
  saveLocalContentLibrary,
  syncContentLibrary,
  getContentsByWarehouse,
  getContentByCode,
  getContentById,
  clearLocalContentLibrary,
};
