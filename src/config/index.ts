/**
 * 应用配置文件
 */

// 测试模式配置
export const TEST_CONFIG = {
  // 是否启用快速测试模式（所有倒计时都改为15秒）
  FAST_TEST_MODE: false,  // 已关闭，使用正常倒计时时间

  // 快速测试模式下的倒计时时间（毫秒）
  FAST_TEST_COUNTDOWN: 15 * 1000, // 15秒

  // 是否启用回合允许时间限制
  ENABLE_ROUND_TIME_LIMIT: true, // false=不限制，true=限制
};

// 获取倒计时时间（根据测试模式返回不同值）
export function getCountdownTime(originalTime: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN;
  }
  return originalTime;
}

// 获取倒计时时间（秒）
export function getCountdownTimeSeconds(originalSeconds: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN / 1000;
  }
  return originalSeconds;
}

// 获取倒计时时间（毫秒）
export function getCountdownTimeMs(originalMs: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN;
  }
  return originalMs;
}

// 获取天数倒计时（转换为秒）
export function getCountdownDays(originalDays: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN / 1000;
  }
  return originalDays * 24 * 60 * 60; // 转换为秒
}

// 获取小时倒计时（转换为秒）
export function getCountdownHours(originalHours: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN / 1000;
  }
  return originalHours * 60 * 60; // 转换为秒
}

// 获取分钟倒计时（转换为秒）
export function getCountdownMinutes(originalMinutes: number): number {
  if (TEST_CONFIG.FAST_TEST_MODE) {
    return TEST_CONFIG.FAST_TEST_COUNTDOWN / 1000;
  }
  return originalMinutes * 60; // 转换为秒
}

// 导出配置信息
export default {
  TEST_CONFIG,
  getCountdownTime,
  getCountdownTimeSeconds,
  getCountdownTimeMs,
  getCountdownDays,
  getCountdownHours,
  getCountdownMinutes,
};
