/**
 * 内容库数据同步工具
 * 用于在登录后同步接口数据到本地存储
 */

import api from '@/api/index';
import { parseContentLibraryData, ParsedContentLibrary, getLibraryByWarehouseId } from './content-library-parser';

// 原始接口数据类型定义
export interface ContentLibraryItem {
  id: number;
  contentCode: string;
  warehouseId: number;
  warehouseName: string;
  contentDetail: string;
  contentType: number;
  status: number;
  type: number | null;
  [key: string]: any;
}

// 本地存储的内容库数据结构（使用解析后的格式）
export interface LocalContentLibrary {
  data: ParsedContentLibrary;
  lastSyncTime: string;
  version: number;
}

// 本地存储键名
const STORAGE_KEY = 'content_library_data';

/**
 * 从接口获取内容库数据
 */
export async function fetchContentLibraryData(): Promise<ParsedContentLibrary> {
  try {
    console.log('[ContentLibrarySync] 开始获取内容库数据...');
    const response = await api.four.getAllContent();

    if (response.code === 200 && response.data) {
      console.log('[ContentLibrarySync] 成功获取内容库数据，共', response.data.length, '条原始数据');

      // 解析数据为目标格式
      const parsedData = parseContentLibraryData(response.data);
      return parsedData;
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
 * 合并解析后的内容库数据
 */
export function mergeContentLibraryData(
  existingData: ParsedContentLibrary,
  newData: ParsedContentLibrary
): ParsedContentLibrary {
  const merged: ParsedContentLibrary = {
    contentLibraries: { ...existingData.contentLibraries },
    leaveLibraries: { ...existingData.leaveLibraries },
    proactiveLibraries: { ...existingData.proactiveLibraries },
    qaLibraries: { ...existingData.qaLibraries },
  };

  // 合并内容库
  for (const [key, lib] of Object.entries(newData.contentLibraries)) {
    if (existingData.contentLibraries[key]) {
      // 已存在，合并内容节点
      merged.contentLibraries[key] = {
        ...existingData.contentLibraries[key],
        contents: [...existingData.contentLibraries[key].contents, ...lib.contents],
      };
    } else {
      merged.contentLibraries[key] = lib;
    }
  }

  // 合并离开库
  for (const [key, lib] of Object.entries(newData.leaveLibraries)) {
    if (existingData.leaveLibraries[key]) {
      merged.leaveLibraries[key] = {
        ...existingData.leaveLibraries[key],
        contents: [...existingData.leaveLibraries[key].contents, ...lib.contents],
      };
    } else {
      merged.leaveLibraries[key] = lib;
    }
  }

  // 合并对方找库
  for (const [key, lib] of Object.entries(newData.proactiveLibraries)) {
    if (existingData.proactiveLibraries[key]) {
      merged.proactiveLibraries[key] = {
        ...existingData.proactiveLibraries[key],
        contents: [...existingData.proactiveLibraries[key].contents, ...lib.contents],
      };
    } else {
      merged.proactiveLibraries[key] = lib;
    }
  }

  // 合并问答库
  for (const [key, lib] of Object.entries(newData.qaLibraries)) {
    if (existingData.qaLibraries[key]) {
      merged.qaLibraries[key] = {
        ...existingData.qaLibraries[key],
        items: [...existingData.qaLibraries[key].items, ...lib.items],
      };
    } else {
      merged.qaLibraries[key] = lib;
    }
  }

  const totalLibraries =
    Object.keys(merged.contentLibraries).length +
    Object.keys(merged.leaveLibraries).length +
    Object.keys(merged.proactiveLibraries).length +
    Object.keys(merged.qaLibraries).length;

  console.log('[ContentLibrarySync] 数据合并完成，总共', totalLibraries, '个库');
  return merged;
}

/**
 * 同步内容库数据
 * @param merge - 是否合并现有数据（true: 合并，false: 完全替换）
 * @returns 同步后的数据
 */
export async function syncContentLibrary(merge: boolean = true): Promise<LocalContentLibrary> {
  try {
    console.log('[ContentLibrarySync] 开始同步内容库数据...');

    // 1. 获取接口数据（已解析）
    const apiData = await fetchContentLibraryData();

    // 2. 获取本地数据
    const localData = getLocalContentLibrary();

    let finalData: ParsedContentLibrary;

    if (merge && localData && Object.keys(localData.data).length > 0) {
      // 合并模式：将新数据与现有数据合并
      console.log('[ContentLibrarySync] 使用合并模式');
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

    const totalLibraries =
      Object.keys(finalData.contentLibraries).length +
      Object.keys(finalData.leaveLibraries).length +
      Object.keys(finalData.proactiveLibraries).length +
      Object.keys(finalData.qaLibraries).length;

    console.log('[ContentLibrarySync] 同步完成，总共', totalLibraries, '个库');

    // 打印详细的同步数据
    console.log('[ContentLibrarySync] ========== 同步数据详情 ==========');
    console.log('[ContentLibrarySync] 同步时间:', result.lastSyncTime);
    console.log('[ContentLibrarySync] 数据版本:', result.version);

    // 打印内容库
    if (Object.keys(finalData.contentLibraries).length > 0) {
      console.log('[ContentLibrarySync] --- 内容库 ---');
      for (const [key, lib] of Object.entries(finalData.contentLibraries)) {
        console.log(`[ContentLibrarySync] 库ID: ${key}, 名称: ${lib.libraryName}, 阶段: ${lib.stage}`);
        console.log(`[ContentLibrarySync] 内容节点数量: ${lib.contents.length}`);
        if (lib.contents.length > 0) {
          lib.contents.forEach((node, index) => {
            console.log(`[ContentLibrarySync]   [${index}] id: ${node.id}, text: "${node.text.substring(0, 50)}${node.text.length > 50 ? '...' : ''}", symbol: ${node.symbol}, next: ${node.next}`);
          });
        }
      }
    }

    // 打印离开库
    if (Object.keys(finalData.leaveLibraries).length > 0) {
      console.log('[ContentLibrarySync] --- 离开库 ---');
      for (const [key, lib] of Object.entries(finalData.leaveLibraries)) {
        console.log(`[ContentLibrarySync] 库ID: ${key}, 名称: ${lib.libraryName}, 阶段: ${lib.stage}`);
        console.log(`[ContentLibrarySync] 内容节点数量: ${lib.contents.length}`);
        if (lib.contents.length > 0) {
          lib.contents.forEach((node, index) => {
            console.log(`[ContentLibrarySync]   [${index}] id: ${node.id}, text: "${node.text.substring(0, 50)}${node.text.length > 50 ? '...' : ''}", symbol: ${node.symbol}, next: ${node.next}`);
          });
        }
      }
    }

    // 打印对方找库
    if (Object.keys(finalData.proactiveLibraries).length > 0) {
      console.log('[ContentLibrarySync] --- 对方找库 ---');
      for (const [key, lib] of Object.entries(finalData.proactiveLibraries)) {
        console.log(`[ContentLibrarySync] 库ID: ${key}, 名称: ${lib.libraryName}, 阶段: ${lib.stage}`);
        console.log(`[ContentLibrarySync] 内容节点数量: ${lib.contents.length}`);
        if (lib.contents.length > 0) {
          lib.contents.forEach((node, index) => {
            console.log(`[ContentLibrarySync]   [${index}] id: ${node.id}, text: "${node.text.substring(0, 50)}${node.text.length > 50 ? '...' : ''}", symbol: ${node.symbol}, next: ${node.next}`);
          });
        }
      }
    }

    // 打印问答库
    if (Object.keys(finalData.qaLibraries).length > 0) {
      console.log('[ContentLibrarySync] --- 问答库 ---');
      for (const [key, lib] of Object.entries(finalData.qaLibraries)) {
        console.log(`[ContentLibrarySync] 库ID: ${key}, 名称: ${lib.libraryName}, 阶段: ${lib.stage}`);
        console.log(`[ContentLibrarySync] 问答项数量: ${lib.items.length}`);
      }
    }

    console.log('[ContentLibrarySync] ========== 数据详情结束 ==========');
    return result;
  } catch (error) {
    console.error('[ContentLibrarySync] 同步失败:', error);
    throw error;
  }
}

/**
 * 根据仓库ID获取内容库
 */
export function getLibraryByWarehouseId(warehouseId: number): LocalContentLibrary | null {
  const localData = getLocalContentLibrary();
  if (!localData) return null;

  return localData;
}

/**
 * 根据仓库ID获取内容库详情
 */
export function getContentLibraryById(warehouseId: number): LocalContentLibrary['data'] | null {
  const localData = getLocalContentLibrary();
  if (!localData) return null;

  return localData.data;
}

/**
 * 获取所有内容库数据
 */
export function getAllContentLibraryData(): LocalContentLibrary | null {
  return getLocalContentLibrary();
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
  getLibraryByWarehouseId,
  getContentLibraryById,
  getAllContentLibraryData,
  clearLocalContentLibrary,
};
