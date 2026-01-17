import type { Four } from '@/api/data';

/**
 * 内容库数据存储键
 */
const CONTENT_LIBRARY_KEY = 'content_library_data';

/**
 * 保存内容库数据到本地存储
 */
export const saveContentLibraryData = (data: Four.GetAllContent.Data) => {
  try {
    uni.setStorageSync(CONTENT_LIBRARY_KEY, JSON.stringify(data));
    console.log('内容库数据已保存到本地存储:', data);
    return true;
  } catch (error) {
    console.error('保存内容库数据失败:', error);
    return false;
  }
};

/**
 * 从本地存储获取内容库数据
 */
export const getContentLibraryData = (): Four.GetAllContent.Data | null => {
  try {
    const dataStr = uni.getStorageSync(CONTENT_LIBRARY_KEY);
    if (dataStr) {
      return JSON.parse(dataStr);
    }
    return null;
  } catch (error) {
    console.error('获取内容库数据失败:', error);
    return null;
  }
};

/**
 * 清除内容库数据
 */
export const clearContentLibraryData = () => {
  try {
    uni.removeStorageSync(CONTENT_LIBRARY_KEY);
    console.log('内容库数据已清除');
    return true;
  } catch (error) {
    console.error('清除内容库数据失败:', error);
    return false;
  }
};

/**
 * 格式化内容库数据为可读格式
 * 将接口数据转换为易于使用的格式
 */
export const formatContentLibraryData = (data: Four.GetAllContent.Data) => {
  const formatted = data.map(item => ({
    id: item.id,
    warehouseId: item.warehouseId,
    contentCode: item.contentCode,
    contentDetail: item.contentDetail,
    contentType: item.contentType,
    status: item.status,
    type: item.type,
  }));

  console.log('格式化后的内容库数据:', formatted);
  return formatted;
};
