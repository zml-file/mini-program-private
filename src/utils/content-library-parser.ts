/**
 * 内容库数据解析工具
 * 将接口返回的数据转换为熟悉的链表格式
 */

import type { Four } from '@/api/data';

// ==================== 类型定义 ====================

/**
 * 库内容节点
 */
export interface ContentNode {
  id: string;
  text: string;
  symbol?: string; // 符号：@、D、Z、AZ、AD 等
  next: string | null;
}

/**
 * 单个库的结构
 */
export interface Library {
  libraryId: string;
  libraryName: string;
  stage: number;
  contents: ContentNode[];
}

/**
 * 问答库结构
 */
export interface QALibrary {
  libraryId: string;
  libraryName: string;
  stage: number;
  items: QAItem[];
}

/**
 * 问答项
 */
export interface QAItem {
  id: string;
  keywords: string[];
  answers: QAAnswer[];
}

/**
 * 问答答案
 */
export interface QAAnswer {
  id: string;
  text: string;
  next: string | null;
}

/**
 * 解析后的完整内容库数据
 */
export interface ParsedContentLibrary {
  contentLibraries: Record<string, Library>;
  leaveLibraries: Record<string, Library>;
  proactiveLibraries: Record<string, Library>;
  qaLibraries: Record<string, QALibrary>;
}

// ==================== 常量定义 ====================

/**
 * 仓库ID到库类型的映射
 */
export const WAREHOUSE_TYPE_MAP: Record<number, { type: string; stage: number; name: string }> = {
  // 内容库 (warehouseId: 0, 1, 2, 6, 8, 9, 10, 11, 13, 14, 16, 18, 22, 23, 24, 25, 30-50+)
  0: { type: 'content', stage: 1, name: '内容库0' },
  1: { type: 'content', stage: 1, name: '内容库1' },
  2: { type: 'content', stage: 1, name: '内容库2' },
  6: { type: 'content', stage: 1, name: '内容库6' },
  8: { type: 'content', stage: 1, name: '内容库8' },
  9: { type: 'content', stage: 1, name: '内容库9' },
  10: { type: 'content', stage: 1, name: '内容库10' },
  11: { type: 'content', stage: 1, name: '内容库11' },
  13: { type: 'content', stage: 1, name: '内容库13' },
  14: { type: 'content', stage: 1, name: '内容库14' },
  16: { type: 'content', stage: 1, name: '内容库16' },
  18: { type: 'content', stage: 1, name: '内容库18' },
  22: { type: 'content', stage: 1, name: '内容库22' },
  23: { type: 'content', stage: 1, name: '内容库23' },
  24: { type: 'content', stage: 1, name: '内容库24' },
  25: { type: 'content', stage: 1, name: '内容库25' },

  // 离开库 (warehouseId: 31, 32, 35, 67, 68, 69, 70, 80, 81, 94, 95, 96, 97, 98, 99)
  31: { type: 'leave', stage: 1, name: '离开库0' },
  32: { type: 'leave', stage: 1, name: '离开库1' },
  35: { type: 'leave', stage: 1, name: '离开库2' },
  38: { type: 'leave', stage: 1, name: '离开库3' },
  67: { type: 'leave', stage: 1, name: '离开库4' },
  68: { type: 'leave', stage: 1, name: '离开库5' },
  69: { type: 'leave', stage: 1, name: '离开库6' },
  70: { type: 'leave', stage: 1, name: '离开库7' },
  80: { type: 'leave', stage: 1, name: '离开库8' },
  81: { type: 'leave', stage: 1, name: '离开库9' },
  94: { type: 'leave', stage: 1, name: '离开库10' },
  95: { type: 'leave', stage: 1, name: '离开库11' },
  96: { type: 'leave', stage: 1, name: '离开库12' },
  97: { type: 'leave', stage: 1, name: '离开库13' },
  98: { type: 'leave', stage: 1, name: '离开库14' },
  99: { type: 'leave', stage: 1, name: '离开库15' },

  // 对方找库 (warehouseId: 47, 106)
  47: { type: 'proactive', stage: 1, name: '对方找库1' },

  // 问答库 (warehouseId: 48)
  48: { type: 'qa', stage: 1, name: '问答库1' },
};

/**
 * 符号类型枚举
 */
const SYMBOL_PATTERN = /\n\s*(AD|AZ|D|Z|@)\s*\n?/g;

// ==================== 解析函数 ====================

/**
 * 生成唯一的节点ID
 */
let nodeIdCounter = 0;
function generateNodeId(prefix: string): string {
  return `${prefix}_${nodeIdCounter++}`;
}

/**
 * 重置节点ID计数器（用于每次新的解析）
 */
function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

/**
 * 解析内容详情，将其分解为链表节点
 */
function parseContentDetail(contentDetail: string, prefix: string): ContentNode[] {
  if (!contentDetail) return [];

  const nodes: ContentNode[] = [];

  // 使用正则表达式分割内容
  const parts = contentDetail.split(SYMBOL_PATTERN);

  // 提取所有符号
  const symbols: string[] = [];
  let match;
  const regex = new RegExp(SYMBOL_PATTERN.source, 'g');
  while ((match = regex.exec(contentDetail)) !== null) {
    symbols.push(match[1]);
  }

  // 构建节点链表
  let prevId: string | null = null;
  let symbolIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const nodeId = generateNodeId(prefix);

    // 确定当前节点的符号
    // 符号位于内容之前的换行符之后
    let symbol: string | undefined;
    if (symbolIndex < symbols.length) {
      symbol = symbols[symbolIndex];
      symbolIndex++;
    }

    // 跳过第一个符号（它是起始符号，不是节点符号）
    if (i === 0) {
      symbol = undefined;
      symbolIndex = 0;
    }

    nodes.push({
      id: nodeId,
      text: part,
      symbol,
      next: null,
    });

    // 更新前一个节点的 next 指针
    if (prevId !== null) {
      const prevNode = nodes[nodes.length - 2];
      if (prevNode) {
        prevNode.next = nodeId;
      }
    }
    prevId = nodeId;
  }

  return nodes;
}

/**
 * 解析 JSON 数组格式的内容
 */
function parseJSONArrayContent(contentDetail: string, prefix: string): ContentNode[] | QAAnswer[] {
  if (!contentDetail) return [];

  try {
    // 尝试解析为数组
    const parsed = JSON.parse(contentDetail);
    if (!Array.isArray(parsed)) return [];

    const nodes: ContentNode[] = [];
    let prevId: string | null = null;

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      const nodeId = generateNodeId(prefix);

      nodes.push({
        id: nodeId,
        text: String(item),
        next: null,
      });

      if (prevId !== null) {
        const prevNode = nodes[i - 1];
        if (prevNode) {
          prevNode.next = nodeId;
        }
      }
      prevId = nodeId;
    }

    return nodes;
  } catch (error) {
    // 不是 JSON 数组，按普通内容处理
    return parseContentDetail(contentDetail, prefix);
  }
}

/**
 * 解析接口数据为目标格式
 */
export function parseContentLibraryData(
  apiData: Four.GetAllContent.Data
): ParsedContentLibrary {
  console.log('[ContentLibraryParser] 开始解析内容库数据...');
  resetNodeIdCounter();

  const result: ParsedContentLibrary = {
    contentLibraries: {},
    leaveLibraries: {},
    proactiveLibraries: {},
    qaLibraries: {},
  };

  // 按仓库ID分组数据
  const groupedByWarehouse: Record<number, Four.GetAllContent.ContentItem[]> = {};
  for (const item of apiData) {
    if (!groupedByWarehouse[item.warehouseId]) {
      groupedByWarehouse[item.warehouseId] = [];
    }
    groupedByWarehouse[item.warehouseId].push(item);
  }

  // 解析每个仓库的数据
  for (const [warehouseId, items] of Object.entries(groupedByWarehouse)) {
    const id = Number(warehouseId);
    const config = WAREHOUSE_TYPE_MAP[id];

    if (!config) {
      console.warn(`[ContentLibraryParser] 未找到仓库ID ${id} 的配置，跳过`);
      continue;
    }

    const libraryId = `${config.type}_${id}`;
    const prefix = libraryId;
    resetNodeIdCounter(); // 每个仓库重置计数器

    const allContents: ContentNode[] = [];

    // 解析每个内容项
    for (const item of items) {
      let contents: ContentNode[];

      // 根据 contentType 判断解析方式
      if (item.contentDetail?.startsWith('[')) {
        contents = parseJSONArrayContent(item.contentDetail, prefix) as ContentNode[];
      } else {
        contents = parseContentDetail(item.contentDetail || '', prefix);
      }

      // 添加到总内容列表
      allContents.push(...contents);
    }

    // 根据类型存储到对应的结果中
    if (config.type === 'content') {
      result.contentLibraries[libraryId] = {
        libraryId,
        libraryName: config.name,
        stage: config.stage,
        contents: allContents,
      };
    } else if (config.type === 'leave') {
      result.leaveLibraries[libraryId] = {
        libraryId,
        libraryName: config.name,
        stage: config.stage,
        contents: allContents,
      };
    } else if (config.type === 'proactive') {
      result.proactiveLibraries[libraryId] = {
        libraryId,
        libraryName: config.name,
        stage: config.stage,
        contents: allContents,
      };
    } else if (config.type === 'qa') {
      // 问答库需要特殊处理
      // 暂时按普通库存储
      result.qaLibraries[libraryId] = {
        libraryId,
        libraryName: config.name,
        stage: config.stage,
        items: [],
      };
    }
  }

  console.log('[ContentLibraryParser] 解析完成:');
  console.log('  - 内容库:', Object.keys(result.contentLibraries).length);
  console.log('  - 离开库:', Object.keys(result.leaveLibraries).length);
  console.log('  - 对方找库:', Object.keys(result.proactiveLibraries).length);
  console.log('  - 问答库:', Object.keys(result.qaLibraries).length);

  return result;
}

/**
 * 获取特定类型的内容库
 */
export function getContentLibrary(
  data: ParsedContentLibrary,
  type: 'content' | 'leave' | 'proactive' | 'qa'
): Record<string, Library | QALibrary> {
  switch (type) {
    case 'content':
      return data.contentLibraries;
    case 'leave':
      return data.leaveLibraries;
    case 'proactive':
      return data.proactiveLibraries;
    case 'qa':
      return data.qaLibraries;
  }
}

/**
 * 根据仓库ID获取内容库
 */
export function getLibraryByWarehouseId(
  data: ParsedContentLibrary,
  warehouseId: number
): Library | QALibrary | undefined {
  const config = WAREHOUSE_TYPE_MAP[warehouseId];
  if (!config) return undefined;

  const libraryId = `${config.type}_${warehouseId}`;
  const libraryMap = getContentLibrary(data, config.type as any);

  return libraryMap[libraryId];
}

export default {
  parseContentLibraryData,
  getContentLibrary,
  getLibraryByWarehouseId,
};
