/**
 * 同步内容库数据脚本
 * 从接口获取内容库数据并写入到 familiarMockData.js 文件
 *
 * 使用方法：
 * node scripts/sync-content-library.js [token]
 * 或：npm run sync:content [token]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const API_HOST = 'https://mini.997555.xyz';
const API_PATH = '/api/fourModule/getAllContent';
const TARGET_FILE = path.join(__dirname, '../src/mock/familiarMockData.js');

// 从命令行参数获取 token，或使用环境变量
const TOKEN = process.argv[2] || process.env.AUTH_TOKEN || '';

if (!TOKEN) {
  console.error('❌ 错误：需要提供认证 token');
  console.log('使用方法：');
  console.log('  node scripts/sync-content-library.js <your-token>');
  console.log('  或：npm run sync:content <your-token>');
  process.exit(1);
}

/**
 * 调用接口获取数据
 */
function fetchContentLibrary() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_PATH, API_HOST);

    console.log('🔄 正在请求接口:', url.href);

    const options = {
      method: 'GET',
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json',
      },
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            if (result.code === 200) {
              console.log('✅ 接口请求成功，共获取', result.data.length, '条数据');
              resolve(result.data);
            } else {
              reject(new Error(`接口返回错误：${result.message}`));
            }
          } catch (error) {
            reject(new Error(`解析响应数据失败：${error.message}`));
          }
        } else {
          reject(new Error(`HTTP 请求失败：${res.statusCode} ${res.statusMessage}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 将数据格式化为 JavaScript 代码
 */
function formatDataToJS(data) {
  console.log('🔄 开始格式化数据...');

  // 按仓库ID分组
  const groupedByWarehouse = {};
  data.forEach(item => {
    if (!groupedByWarehouse[item.warehouseId]) {
      groupedByWarehouse[item.warehouseId] = [];
    }
    groupedByWarehouse[item.warehouseId].push(item);
  });

  // 生成代码
  let code = `// ==================== 内容库数据（自动生成） ====================\n\n`;
  code += `/**\n`;
  code += ` * 内容库数据\n`;
  code += ` * 此数据由脚本自动生成，请勿手动修改\n`;
  code += ` * 生成时间：${new Date().toLocaleString('zh-CN')}\n`;
  code += ` * 数据来源：${API_HOST}${API_PATH}\n`;
  code += ` */\n\n`;

  // 生成所有内容库数据
  code += `export const CONTENT_LIBRARY_DATA = ${JSON.stringify(data, null, 2)};\n\n`;

  // 按仓库ID分组的数据
  code += `/**\n * 按仓库ID分组的内容库数据\n */\n`;
  code += `export const CONTENT_LIBRARY_BY_WAREHOUSE = ${JSON.stringify(groupedByWarehouse, null, 2)};\n\n`;

  // 生成辅助函数
  code += `/**\n`;
  code += ` * 根据仓库ID获取内容列表\n`;
  code += ` */\n`;
  code += `export function getContentsByWarehouse(warehouseId) {\n`;
  code += `  return CONTENT_LIBRARY_BY_WAREHOUSE[warehouseId] || [];\n`;
  code += `}\n\n`;

  code += `/**\n`;
  code += ` * 根据内容编码获取内容详情\n`;
  code += ` */\n`;
  code += `export function getContentByCode(contentCode) {\n`;
  code += `  return CONTENT_LIBRARY_DATA.find(item => item.contentCode === contentCode);\n`;
  code += `}\n\n`;

  code += `/**\n`;
  code += ` * 根据ID获取内容详情\n`;
  code += ` */\n`;
  code += `export function getContentById(id) {\n`;
  code += `  return CONTENT_LIBRARY_DATA.find(item => item.id === id);\n`;
  code += `}\n`;

  console.log('✅ 数据格式化完成');
  return code;
}

/**
 * 追加数据到文件末尾
 */
function appendToFile(code) {
  console.log('🔄 正在写入文件:', TARGET_FILE);

  try {
    // 读取现有文件内容
    let existingContent = '';
    if (fs.existsSync(TARGET_FILE)) {
      existingContent = fs.readFileSync(TARGET_FILE, 'utf-8');

      // 移除旧的自动生成部分（如果存在）
      const startMarker = '// ==================== 内容库数据（自动生成） ====================';
      const startIndex = existingContent.indexOf(startMarker);

      if (startIndex !== -1) {
        existingContent = existingContent.substring(0, startIndex).trimEnd();
        console.log('📝 移除旧的自动生成数据');
      }
    } else {
      console.log('⚠️  目标文件不存在，将创建新文件');
    }

    // 组合新内容
    const newContent = existingContent + '\n\n' + code;

    // 写入文件
    fs.writeFileSync(TARGET_FILE, newContent, 'utf-8');
    console.log('✅ 文件写入成功');

    return true;
  } catch (error) {
    console.error('❌ 文件写入失败:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始同步内容库数据...\n');

    // 1. 获取数据
    const data = await fetchContentLibrary();

    // 2. 格式化数据
    const code = formatDataToJS(data);

    // 3. 写入文件
    const success = appendToFile(code);

    if (success) {
      console.log('\n✅ 内容库数据同步完成！');
      console.log('📁 文件路径:', TARGET_FILE);
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
