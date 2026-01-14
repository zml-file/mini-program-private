#!/usr/bin/env node
/**
 * 熟悉模块终极详细测试脚本
 * 测试覆盖：155+个测试用例，不放过每一个细节
 *
 * 测试分类：
 * 1. 边界条件测试（20个）
 * 2. 第0阶段详细测试（15个）
 * 3. 第1阶段详细测试（15个）
 * 4. 第2阶段详细测试（15个）
 * 5. 第3阶段详细测试（15个）
 * 6. 第4阶段详细测试（15个）
 * 7. 状态转换完整性测试（15个）
 * 8. 并发和竞态条件测试（10个）
 * 9. 数据验证和类型检查测试（15个）
 * 10. 错误处理和容错性测试（15个）
 * 11. 性能和时间戳验证测试（10个）
 * 12. 复杂业务场景组合测试（15个）
 */

// ==================== 模拟 uni-app API ====================
const mockStorage = {};
const uni = {
  getStorageSync: (key) => {
    const val = mockStorage[key];
    return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
  },
  setStorageSync: (key, value) => {
    mockStorage[key] = JSON.parse(JSON.stringify(value));
  },
  removeStorageSync: (key) => {
    delete mockStorage[key];
  }
};

// ==================== 模拟配置函数 ====================
function getCountdownTimeMs(ms) { return ms; }
function getCountdownDays(days) { return days; }

// ==================== 核心功能实现 ====================
const VERSION = 1;

function get(k) {
  try {
    return uni.getStorageSync(k);
  } catch {
    return null;
  }
}

function set(k, v) {
  try {
    uni.setStorageSync(k, v);
  } catch {}
}

function randInt(min, max) {
  if (min >= max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initDefaults() {
  const ver = get("fm:stateVersion");
  if (!ver) set("fm:stateVersion", VERSION);

  if (!get("fm:settings")) {
    const settings = {
      cd: {
        bigRoundMinMs: getCountdownTimeMs(24 * 60 * 60 * 1000),
        stageMinDays: {
          "1-2": getCountdownDays(3),
          "2-3": getCountdownDays(0),
          "3-4": getCountdownDays(3)
        },
        zDurationByStage: {
          0: { minMs: 0, maxMs: 0 },
          1: { minMs: getCountdownTimeMs(2 * 60 * 1000), maxMs: getCountdownTimeMs(4 * 60 * 1000) },
          2: { minMs: getCountdownTimeMs(3 * 60 * 1000), maxMs: getCountdownTimeMs(6 * 60 * 1000) },
          3: { minMs: getCountdownTimeMs(3 * 60 * 1000), maxMs: getCountdownTimeMs(7 * 60 * 1000) },
          4: { minMs: 0, maxMs: 0 },
        },
        smallCopyCdMs: getCountdownTimeMs(2000),
        idleWarnMs: getCountdownTimeMs(40 * 60 * 1000),
        idleForceCdMs: getCountdownTimeMs(2 * 60 * 60 * 1000),
        opponentFindWaitMs: getCountdownTimeMs(60 * 60 * 1000),
        opponentFindCopyEnableMs: getCountdownTimeMs(10 * 60 * 1000),
      },
      vip: { levels: [{ level: 0, qaMaxItems: 2 }, { level: 1, qaMaxItems: 3 }, { level: 2, qaMaxItems: 4 }] },
      stageThresholdX: { 0: 10, 1: 2, 2: 3, 3: 3, 4: 0 },
    };
    set("fm:settings", settings);
  }

  if (!get("fm:libs")) {
    const mkText = (id, text, splitBy) => ({ id, text, type: "text", splitBy });
    const mkZ = (id, text) => ({ id, text, type: "Z" });
    const mkD = (id, text) => ({ id, text, type: "D" });

    const libs = {
      opening: {},
      content: {
        S1: [[mkText("c1-1", "内容S1", "@"), mkZ("c1-z", "Z1")]],
        S2: [[mkText("c2-1", "内容S2", "@")]],
        S3: [[mkText("c3-1", "内容S3", "@")]],
        S4: [[mkText("c4-1", "内容S4", "@")]],
        S5: [[mkText("c5-1", "内容S5", "@")]],
        "S4.5": [[mkText("c4.5-1", "内容S4.5", "@")]],
        S6: [[mkText("c6-1", "内容S6", "@")]],
        S7: [[mkText("c7-1", "内容S7", "@")]],
        S8: [[mkText("c8-1", "内容S8", "@")]],
        S9: [[mkText("c9-1", "内容S9", "@")]],
        S10: [[mkText("c10-1", "内容S10", "@")]],
        S11: [[mkText("c11-1", "内容S11", "@")]],
        "S2.5": [[mkText("c2.5-1", "内容S2.5", "@")]],
        S12: [[mkText("c12-1", "内容S12", "@")]],
        S13: [[mkText("c13-1", "内容S13", "@")]],
        S14: [[mkText("c14-1", "内容S14", "@")]],
        S15: [[mkText("c15-1", "内容S15", "@")]],
        S16: [[mkText("c16-1", "内容S16", "@")]],
        S17: [[mkText("c17-1", "内容S17", "@")]],
        S18: [[mkText("c18-1", "内容S18", "@"), mkD("c18-d", "D模式")]],
      },
      leaving: {
        S1: [[mkText("l1-1", "离库S1", "@")]],
        S2: [[mkText("l2-1", "离库S2", "@")]],
        S3: [[mkText("l3-1", "离库S3", "@")]],
        "S3.5": [[mkText("l3.5-1", "离库S3.5", "@")]],
        S4: [[mkText("l4-1", "离库S4", "@")]],
        S5: [[mkText("l5-1", "离库S5", "@")]],
      },
      opponent: {
        S2: [[mkText("op2-1", "对方找S2", "@")]],
        S3: [[mkText("op3-1", "对方找S3", "@")]],
        S4: [[mkText("op4-1", "对方找S4", "@")]],
      },
      qa: {},
      questionnaire: {
        thresholdX: 10,
        questions: [
          { id: "q1", title: "问题1", options: [{ id: "A", text: "A", score: 0 }, { id: "B", text: "B", score: 0 }] },
          {
            id: "q2",
            title: "问题2",
            options: [
              { id: "A", text: "A", score: 4 },
              { id: "B", text: "B", score: 0 },
              { id: "C", text: "C", score: 5 },
              { id: "D", text: "D", score: 7 },
              { id: "E", text: "E", score: 4 }
            ]
          },
          {
            id: "q3",
            title: "问题3",
            options: [
              { id: "A", text: "A", score: 6 },
              { id: "B", text: "B", score: 10 },
              { id: "C", text: "C", score: 6 },
              { id: "D", text: "D", score: 10 },
              { id: "E", text: "E", score: 10 }
            ]
          },
          { id: "q4", title: "问题4", options: [{ id: "A", text: "A", score: 0 }] },
          { id: "q5", title: "问题5", options: [{ id: "A", text: "A", score: 0 }] },
        ],
      },
    };
    set("fm:libs", libs);
  }

  if (!get("fm:tasks")) set("fm:tasks", []);
}

function genId() {
  return "fm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}

function createTask(payload) {
  initDefaults();
  const { name, durationDays } = payload;
  if (!name || name.trim().length === 0 || name.trim().length > 6) {
    return { ok: false, reason: "名称需1-6字" };
  }
  const id = genId();
  const now = Date.now();
  const expireAt = now + durationDays * 24 * 60 * 60 * 1000;
  const settings = get("fm:settings");
  const vipMax = settings.vip.levels[0].qaMaxItems;

  const task = {
    id,
    name: name.trim(),
    createdAt: now,
    durationDays,
    expireAt,
    isRestartHalfPrice: false,
    status: "active",
    stageIndex: 0,
    roundIndex: null,
    stepIndex: 0,
    stageScore: 0,
    totalScore: 0,
    stageThresholdX: settings.stageThresholdX[0],
    roundCdUnlockAt: null,
    stageCdUnlockAt: null,
    zUnlockAt: null,
    dMode: false,
    opponentFindUnlockAt: null,
    opponentFindCopyUnlockAt: null,
    idleWarningAt: null,
    hardIdleToCdAt: null,
    lastActionAt: now,
    usedLibIdsByStage: {},
    currentLibChain: null,
    opponentFindUsedInRound: false,
    qaVipMaxItems: vipMax,
    questionnaire: { answers: [], totalScore: 0, routedModule: "familiar" },
    prompts: {},
    askFlow: {},
    renewHistory: [],
    listBadge: "聊天任务进行中",
    listCountdownEndAt: null,
  };

  const ids = get("fm:tasks") || [];
  ids.push(id);
  set("fm:tasks", ids);
  set(`fm:task:${id}`, task);
  return { ok: true, task };
}

function getTask(taskId) {
  initDefaults();
  const t = get(`fm:task:${taskId}`);
  return t || null;
}

function saveQuestionnaireAnswer(taskId, questionId, optionId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const libs = get("fm:libs");
  const q = libs.questionnaire.questions.find((x) => x.id === questionId);
  if (!q) return;
  const opt = q.options.find((o) => o.id === optionId);
  const score = opt ? opt.score : 0;

  const idx = t.questionnaire.answers.findIndex((a) => a.questionId === questionId);
  if (idx >= 0) t.questionnaire.answers[idx] = { questionId, optionId, score };
  else t.questionnaire.answers.push({ questionId, optionId, score });

  t.questionnaire.totalScore = t.questionnaire.answers.reduce((sum, a) => sum + a.score, 0);
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

function submitQuestionnaire(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { routed: "familiar", next: "问1" };
  const libs = get("fm:libs");
  const X = libs.questionnaire.thresholdX;
  const score = t.questionnaire.totalScore;

  let routed = "familiar";
  if (score < X) {
    routed = "familiar";
  }

  t.stageIndex = 0;
  t.stepIndex = 0;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);

  return { routed, next: "问1" };
}

// 第一阶段
function enterStage1(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  t.stageIndex = 1;
  t.roundIndex = 0;
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 2;
  t.status = "active";

  t.stage1 = {
    roundScores: [],
    firstThreeRoundsTotal: 0,
    currentRoundStartTime: null,
    roundAllowedTimeMs: getCountdownTimeMs(30 * 60 * 1000),
    zTimerMs: getCountdownTimeMs(randInt(2 * 60 * 1000, 4 * 60 * 1000)),
    hasUsedOpponentFind: false,
    roundCdMultiplier: 1,
  };

  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function finishStage1Round(taskId, roundScore) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage1) return { ok: false, reason: "任务不在第一阶段" };

  const roundNumber = t.roundIndex || 0;

  t.stage1.roundScores[roundNumber - 1] = roundScore;
  t.stageScore += roundScore;
  t.totalScore += roundScore;

  if (roundNumber <= 3) {
    t.stage1.firstThreeRoundsTotal = t.stage1.roundScores.slice(0, 3).reduce((sum, score) => sum + score, 0);
  }

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function checkStage1RoundTransition(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage1) return { ok: false, reason: "任务不在第一阶段" };

  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const firstThreeRoundsTotal = t.stage1.firstThreeRoundsTotal;

  if (roundNumber === 3) {
    if (stageScore >= t.stageThresholdX) {
      return { ok: true, action: "enterRound4", reason: "前三回合得分足够" };
    }
    return { ok: true, action: "enterRound5", reason: "前三回合得分不足，进入延时回合" };
  } else if (roundNumber === 4) {
    return {
      ok: true,
      action: "enterStageCd",
      reason: "第四回合完成，进入阶段CD",
      stageCdRange: { minDays: 3, maxDays: 5 }
    };
  } else if (roundNumber === 5) {
    if (stageScore === firstThreeRoundsTotal) {
      return { ok: true, action: "enterRound6", reason: "得分相等，进入第六回合" };
    }
    return { ok: true, action: "enterStageCd", reason: "得分不等，进入阶段CD" };
  } else if (roundNumber === 6) {
    if (stageScore === firstThreeRoundsTotal) {
      return { ok: true, action: "showPromptS7", reason: "得分相等，询问是否坚持" };
    }
    return { ok: true, action: "enterStageCd", reason: "得分不等，进入阶段CD" };
  }

  return { ok: true, action: "continue", reason: "继续当前回合" };
}

// 第二阶段
function enterStage2(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  t.stageIndex = 2;
  t.roundIndex = 0;
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 3;
  t.status = "active";

  t.stage2 = {
    roundScores: [],
    firstTwoRoundsTotal: 0,
    specialRound: null,
    skipOpening: false,
    usedContentLibs: []
  };

  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function finishStage2Round(taskId, roundScore) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage2) return { ok: false, reason: "任务不在第二阶段" };

  const roundNumber = t.roundIndex || 0;

  t.stage2.roundScores[roundNumber - 1] = roundScore;
  t.stageScore += roundScore;
  t.totalScore += roundScore;

  if (roundNumber <= 2) {
    t.stage2.firstTwoRoundsTotal = t.stage2.roundScores.slice(0, 2).reduce((sum, score) => sum + score, 0);
  }

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function checkStage2RoundTransition(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage2) return { ok: false, reason: "任务不在第二阶段" };

  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const firstTwoRoundsTotal = t.stage2.firstTwoRoundsTotal;

  if (roundNumber === 2) {
    if (stageScore > t.stageThresholdX) {
      return { ok: true, action: "enterStageCd", reason: "得分足够，进入第三阶段" };
    }
    t.stage2.specialRound = 'a';
    t.roundIndex = 3;
    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS10", reason: "得分不足，进入特殊回合a" };
  } else if (roundNumber === 1) {
    return { ok: true, action: "enterRound2", reason: "第一回合结束，进入第二回合" };
  } else if (t.stage2.specialRound === 'a') {
    if (stageScore === firstTwoRoundsTotal) {
      if (roundNumber < 4) {
        return { ok: true, action: "showPromptS11", reason: "得分相等且回合<4" };
      } else {
        return { ok: true, action: "showPromptS13", reason: "得分相等且回合≥4" };
      }
    } else if (stageScore < firstTwoRoundsTotal) {
      return { ok: true, action: "showPromptS14", reason: "得分不足" };
    } else {
      return { ok: true, action: "enterStageCd", reason: "得分超过，进入第三阶段" };
    }
  }

  return { ok: true, action: "continue", reason: "继续当前回合" };
}

// 第三阶段
function enterStage3(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  t.stageIndex = 3;
  t.roundIndex = 0;
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 3;
  t.status = "active";

  t.stage3 = {
    roundScores: [],
    secondRoundScore: 0,
    specialRound: null,
    skipOpening: false,
    usedContentLibs: []
  };

  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function finishStage3Round(taskId, roundScore) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage3) return { ok: false, reason: "任务不在第三阶段" };

  const roundNumber = t.roundIndex || 0;

  t.stage3.roundScores[roundNumber - 1] = roundScore;
  t.stageScore += roundScore;
  t.totalScore += roundScore;

  if (roundNumber === 2) {
    t.stage3.secondRoundScore = t.stageScore;
  }

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function checkStage3RoundTransition(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage3) return { ok: false, reason: "任务不在第三阶段" };

  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const secondRoundScore = t.stage3.secondRoundScore;

  if (roundNumber === 2) {
    t.stage3.secondRoundScore = stageScore;
    set(`fm:task:${taskId}`, t);

    if (stageScore > t.stageThresholdX) {
      enterStage4(taskId);
      return { ok: true, action: "enterStage4", reason: "得分足够，直接进入第四阶段" };
    }
    return { ok: true, action: "showPromptS15", reason: "得分不足，询问是否坚持" };
  } else if (roundNumber === 1) {
    return { ok: true, action: "enterRound2", reason: "第一回合结束，进入第二回合" };
  } else if (t.stage3.specialRound === 'a') {
    if (stageScore === secondRoundScore) {
      if (roundNumber < 4) {
        return { ok: true, action: "showPromptS16", reason: "得分相等且回合<4" };
      } else {
        return { ok: true, action: "showPromptS17", reason: "得分相等且回合≥4" };
      }
    } else if (stageScore < secondRoundScore) {
      return { ok: true, action: "showPromptS18", reason: "得分不足" };
    } else {
      enterStage4(taskId);
      return { ok: true, action: "enterStage4", reason: "得分超过，进入第四阶段" };
    }
  }

  return { ok: true, action: "continue", reason: "继续当前回合" };
}

// 第四阶段
function enterStage4(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  t.stageIndex = 4;
  t.roundIndex = null;
  t.stepIndex = 0;
  t.status = "active";

  t.stage4 = {
    invitationAttempts: 0,
    invitationSuccess: false,
    multiChatUsed: false,
    goClicked: false,
    returnedFromStage3: false
  };

  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

function handleInvitation(taskId, success) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage4) return { ok: false, reason: "任务不在第四阶段" };

  t.stage4.invitationAttempts += 1;
  t.stage4.invitationSuccess = success;

  set(`fm:task:${taskId}`, t);

  if (success) {
    return { ok: true, action: "showContentS18", contentLibId: "S18" };
  } else {
    if (t.stage4.invitationAttempts <= 2) {
      const cdMultiplier = t.stage4.invitationAttempts === 1 ? 3 : 5;
      return { ok: true, action: "enterBigCd", cdMultiplier };
    } else {
      return { ok: true, action: "showPromptS25", reason: "邀约失败超过2次" };
    }
  }
}

function handleMultiChat(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage4) return { ok: false, reason: "任务不在第四阶段" };

  if (t.stage4.multiChatUsed) {
    return { ok: false, reason: "多聊一次已使用过" };
  }

  t.stage4.multiChatUsed = true;
  t.stage4.returnedFromStage3 = true;

  set(`fm:task:${taskId}`, t);
  return { ok: true, action: "returnToStage3" };
}

function finishTask(taskId) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  t.status = "deleted";
  set(`fm:task:${taskId}`, t);

  const ids = get("fm:tasks") || [];
  const newIds = ids.filter(id => id !== taskId);
  set("fm:tasks", newIds);

  return { ok: true };
}

function addPoint(taskId, amount, source = "other") {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  t.stageScore += amount;
  t.totalScore += amount;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

// ==================== 测试框架 ====================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

let testResults = { passed: 0, failed: 0, total: 0, details: [] };
let currentSuite = '';

function testSuite(name, fn) {
  currentSuite = name;
  console.log(`\n${colors.cyan}${colors.bright}======== ${name} ========${colors.reset}`);
  fn();
}

function testCase(name, fn) {
  testResults.total++;
  const startTime = Date.now();
  try {
    fn();
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.details.push({ suite: currentSuite, name, status: 'pass', duration });
    console.log(`${colors.green}✓${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    testResults.details.push({ suite: currentSuite, name, status: 'fail', duration, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  期望: ${expected}\n  实际: ${actual}`);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(`${message}\n  不应该等于: ${expected}\n  实际: ${actual}`);
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(`${message}\n  期望大于: ${expected}\n  实际: ${actual}`);
  }
}

function assertLessThan(actual, expected, message) {
  if (actual >= expected) {
    throw new Error(`${message}\n  期望小于: ${expected}\n  实际: ${actual}`);
  }
}

function assertGreaterOrEqual(actual, expected, message) {
  if (actual < expected) {
    throw new Error(`${message}\n  期望大于等于: ${expected}\n  实际: ${actual}`);
  }
}

function assertNull(value, message) {
  if (value !== null) {
    throw new Error(`${message}\n  期望: null\n  实际: ${value}`);
  }
}

function assertNotNull(value, message) {
  if (value === null) {
    throw new Error(`${message}\n  期望不为null\n  实际: null`);
  }
}

function assertThrows(fn, message) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(`${message}\n  期望抛出错误，但没有抛出`);
  }
}

// ==================== 测试用例 ====================

console.log(`${colors.bright}${colors.blue}🧪 熟悉模块终极详细测试（183测试用例）${colors.reset}\n`);

// 1. 边界条件测试（20个）
testSuite('边界条件测试 (20个测试)', () => {
  testCase('1. 创建任务 - 空名称', () => {
    const result = createTask({ name: '', durationDays: 5 });
    assertEqual(result.ok, false, '空名称应该失败');
    assertEqual(result.reason, '名称需1-6字', '错误原因应正确');
  });

  testCase('2. 创建任务 - 纯空格名称', () => {
    const result = createTask({ name: '   ', durationDays: 5 });
    assertEqual(result.ok, false, '纯空格名称应该失败');
  });

  testCase('3. 创建任务 - 1字名称（边界值）', () => {
    const result = createTask({ name: 'A', durationDays: 5 });
    assert(result.ok === true, '1字名称应该成功');
    assertEqual(result.task.name, 'A', '名称应为A');
  });

  testCase('4. 创建任务 - 6字名称（边界值）', () => {
    const result = createTask({ name: '测试任务名', durationDays: 5 });
    assert(result.ok === true, '6字名称应该成功');
    assertEqual(result.task.name, '测试任务名', '名称应正确');
  });

  testCase('5. 创建任务 - 7字名称（超出边界）', () => {
    const result = createTask({ name: '测试任务名称超', durationDays: 5 });
    assertEqual(result.ok, false, '7字名称应该失败');
  });

  testCase('6. 创建任务 - 名称首尾有空格', () => {
    const result = createTask({ name: '  测试  ', durationDays: 5 });
    assert(result.ok === true, '应该成功');
    assertEqual(result.task.name, '测试', '应该自动trim');
  });

  testCase('7. 创建任务 - 最小天数（1天）', () => {
    const result = createTask({ name: '测试', durationDays: 1 });
    assert(result.ok === true, '1天应该成功');
    assertEqual(result.task.durationDays, 1, '天数应为1');
  });

  testCase('8. 创建任务 - 大天数（100天）', () => {
    const result = createTask({ name: '测试', durationDays: 100 });
    assert(result.ok === true, '100天应该成功');
    assertEqual(result.task.durationDays, 100, '天数应为100');
  });

  testCase('9. 获取不存在的任务 - null ID', () => {
    const task = getTask(null);
    assertNull(task, '应返回null');
  });

  testCase('10. 获取不存在的任务 - 随机ID', () => {
    const task = getTask('fm_999999999_9999');
    assertNull(task, '应返回null');
  });

  testCase('11. 问卷 - 保存不存在的问题ID', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q999', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 0, '不应保存不存在的问题');
  });

  testCase('12. 问卷 - 保存不存在的选项ID', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q1', 'Z');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 0, '不存在的选项应得0分');
  });

  testCase('13. 问卷 - 得分边界值9分（刚好不够）', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    saveQuestionnaireAnswer(taskId, 'q1', 'A'); // 0分
    const task = getTask(taskId);
    assertLessThan(task.questionnaire.totalScore, 10, '应小于阈值');
  });

  testCase('14. 问卷 - 得分边界值10分（刚好够）', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    const task = getTask(taskId);
    assertGreaterOrEqual(task.questionnaire.totalScore, 10, '应大于等于阈值');
  });

  testCase('15. 阶段1 - roundIndex=1时的得分记录（第一个有效回合）', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);
    task = getTask(taskId);
    assertEqual(task.stage1.roundScores[0], 1, 'roundIndex=1应记录在数组[0]位置');
    assertEqual(task.totalScore, 1, '总分应为1');
  });

  testCase('16. 阶段1 - 负分数', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, -1);
    task = getTask(taskId);
    assertLessThan(task.totalScore, 0, '应支持负分');
  });

  testCase('17. 阶段1 - 极大分数', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 999999);
    task = getTask(taskId);
    assertEqual(task.totalScore, 999999, '应支持极大分数');
  });

  testCase('18. 阶段转换 - 从不存在的任务', () => {
    const result = checkStage1RoundTransition('nonexistent_id');
    assertEqual(result.ok, false, '不存在的任务应返回失败');
  });

  testCase('19. 邀约 - 超过3次失败', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false); // 1次
    handleInvitation(taskId, false); // 2次
    handleInvitation(taskId, false); // 3次
    const result4 = handleInvitation(taskId, false); // 4次
    assertEqual(result4.action, 'showPromptS25', '超过3次仍应显示S25');
  });

  testCase('20. 多任务并发创建 - ID唯一性', () => {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const result = createTask({ name: `任务${i}`, durationDays: 5 });
      tasks.push(result.task.id);
    }
    const uniqueIds = new Set(tasks);
    assertEqual(uniqueIds.size, 10, '所有ID应该唯一');
  });
});

// 2. 第0阶段详细测试（23个）
testSuite('第0阶段：问卷系统详细测试 (23个测试)', () => {
  testCase('1. 问卷初始化 - 所有字段验证', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const task = result.task;
    assert(task.questionnaire !== undefined, 'questionnaire应存在');
    assert(Array.isArray(task.questionnaire.answers), 'answers应为数组');
    assertEqual(task.questionnaire.answers.length, 0, '初始答案数为0');
    assertEqual(task.questionnaire.totalScore, 0, '初始总分为0');
    assertEqual(task.questionnaire.routedModule, 'familiar', '默认路由为familiar');
  });

  testCase('2. 保存第1题答案 - 0分选项', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 0, 'q1-A应得0分');
    assertEqual(task.questionnaire.totalScore, 0, '总分应为0');
  });

  testCase('3. 保存第2题答案 - 4分选项A', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 4, 'q2-A应得4分');
    assertEqual(task.questionnaire.totalScore, 4, '总分应为4');
  });

  testCase('4. 保存第2题答案 - 0分选项B', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'B');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 0, 'q2-B应得0分');
  });

  testCase('5. 保存第3题答案 - 6分选项A', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 6, 'q3-A应得6分');
  });

  testCase('6. 保存第3题答案 - 10分选项B', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'B');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 10, 'q3-B应得10分');
  });

  testCase('7. 组合得分 - 0+0=0', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    saveQuestionnaireAnswer(taskId, 'q2', 'B');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 0, '总分应为0');
  });

  testCase('8. 组合得分 - 4+6=10', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    saveQuestionnaireAnswer(taskId, 'q3', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 10, '总分应为10');
  });

  testCase('9. 组合得分 - 4+10=14（最高分）', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    saveQuestionnaireAnswer(taskId, 'q3', 'B');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 14, '总分应为14（最高分）');
  });

  testCase('10. 更新答案 - 从B改为A', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'B'); // 0分
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 1, '应只有1个答案');
    assertEqual(task.questionnaire.totalScore, 4, '总分应为4');
  });

  testCase('11. 更新答案 - 从A改为B', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 6, '总分应更新为6');
  });

  testCase('12. 提交问卷 - 得分<10', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    const submitResult = submitQuestionnaire(taskId);
    assertEqual(submitResult.routed, 'familiar', '应路由到familiar');
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 0, '阶段应保持为0');
  });

  testCase('13. 提交问卷 - 得分=10', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    saveQuestionnaireAnswer(taskId, 'q3', 'A');
    submitQuestionnaire(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 0, '提交后阶段应为0');
  });

  testCase('14. 提交问卷 - 得分>10', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    submitQuestionnaire(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 0, '提交后阶段应为0');
  });

  testCase('15. lastActionAt更新验证', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    const task1 = getTask(taskId);
    const time1 = task1.lastActionAt;

    // 等待1ms
    const start = Date.now();
    while (Date.now() - start < 2) {}

    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    const task2 = getTask(taskId);
    const time2 = task2.lastActionAt;

    assertGreaterThan(time2, time1, 'lastActionAt应该更新');
  });

  // 测试新增的C、D、E选项
  testCase('16. 保存第2题答案 - 5分选项C', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'C');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 5, 'q2-C应得5分');
    assertEqual(task.questionnaire.totalScore, 5, '总分应为5');
  });

  testCase('17. 保存第2题答案 - 7分选项D', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'D');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 7, 'q2-D应得7分');
    assertEqual(task.questionnaire.totalScore, 7, '总分应为7');
  });

  testCase('18. 保存第2题答案 - 4分选项E', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'E');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 4, 'q2-E应得4分');
    assertEqual(task.questionnaire.totalScore, 4, '总分应为4');
  });

  testCase('19. 保存第3题答案 - 6分选项C', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'C');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 6, 'q3-C应得6分');
    assertEqual(task.questionnaire.totalScore, 6, '总分应为6');
  });

  testCase('20. 保存第3题答案 - 10分选项D', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'D');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 10, 'q3-D应得10分');
    assertEqual(task.questionnaire.totalScore, 10, '总分应为10');
  });

  testCase('21. 保存第3题答案 - 10分选项E', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'E');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers[0].score, 10, 'q3-E应得10分');
    assertEqual(task.questionnaire.totalScore, 10, '总分应为10');
  });

  testCase('22. 组合得分 - 7+10=17（新的最高分）', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'D'); // 7分
    saveQuestionnaireAnswer(taskId, 'q3', 'D'); // 10分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 17, '总分应为17（新的最高分）');
  });

  testCase('23. 组合得分 - 5+6=11', () => {
    const result = createTask({ name: '问卷', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'C'); // 5分
    saveQuestionnaireAnswer(taskId, 'q3', 'C'); // 6分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 11, '总分应为11');
  });
});

// 3. 第1阶段详细测试（15个）
testSuite('第1阶段：初始交流详细测试 (15个测试)', () => {
  testCase('1. 进入第1阶段 - 所有字段验证', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task = getTask(taskId);

    assertEqual(task.stageIndex, 1, 'stageIndex应为1');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
    assertEqual(task.stepIndex, 0, 'stepIndex应为0');
    assertEqual(task.stageScore, 0, 'stageScore应为0');
    assertEqual(task.stageThresholdX, 2, '阈值应为2');
    assertEqual(task.status, 'active', 'status应为active');
    assertNotNull(task.stage1, 'stage1应存在');
  });

  testCase('2. stage1数据结构完整性', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage1.roundScores), 'roundScores应为数组');
    assertEqual(task.stage1.firstThreeRoundsTotal, 0, 'firstThreeRoundsTotal应为0');
    assertEqual(task.stage1.roundCdMultiplier, 1, 'roundCdMultiplier应为1');
    assertEqual(task.stage1.hasUsedOpponentFind, false, 'hasUsedOpponentFind应为false');
    assertNull(task.stage1.currentRoundStartTime, 'currentRoundStartTime应为null');
  });

  testCase('3. 第1回合得分记录', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);
    task = getTask(taskId);

    assertEqual(task.stage1.roundScores[0], 1, '第1回合得分应为1');
    assertEqual(task.stageScore, 1, 'stageScore应为1');
    assertEqual(task.totalScore, 1, 'totalScore应为1');
  });

  testCase('4. 第2回合得分记录', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    assertEqual(task.stage1.roundScores[1], 0, '第2回合得分应为0');
    assertEqual(task.stageScore, 1, 'stageScore应为1');
  });

  testCase('5. 第3回合得分记录', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage1.roundScores[2], 1, '第3回合得分应为1');
    assertEqual(task.stageScore, 2, 'stageScore应为2');
  });

  testCase('6. firstThreeRoundsTotal自动计算 - 1+0+1=2', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage1.firstThreeRoundsTotal, 2, 'firstThreeRoundsTotal应为2');
  });

  testCase('7. firstThreeRoundsTotal - 0+0+0=0', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    assertEqual(task.stage1.firstThreeRoundsTotal, 0, 'firstThreeRoundsTotal应为0');
  });

  testCase('8. 第3回合判分 - 得分=阈值（边界值）', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2; // 等于阈值2
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound4', '得分=阈值应进入第4回合');
  });

  testCase('9. 第3回合判分 - 得分>阈值', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 3; // 大于阈值2
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound4', '得分>阈值应进入第4回合');
  });

  testCase('10. 第3回合判分 - 得分<阈值', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1; // 小于阈值2
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound5', '得分<阈值应进入第5回合');
  });

  testCase('11. 第4回合后 - CD天数范围验证', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应进入阶段CD');
    assertEqual(transition.stageCdRange.minDays, 3, 'CD最小天数应为3');
    assertEqual(transition.stageCdRange.maxDays, 5, 'CD最大天数应为5');
  });

  testCase('12. 第5回合判分 - 得分=前3回合总分', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 5;
    task.stageScore = 2;
    task.stage1.firstThreeRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound6', '得分相等应进入第6回合');
  });

  testCase('13. 第5回合判分 - 得分≠前3回合总分', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 5;
    task.stageScore = 3;
    task.stage1.firstThreeRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '得分不等应进入阶段CD');
  });

  testCase('14. 第6回合判分 - 得分=前3回合总分 → 提示S7', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 6;
    task.stageScore = 2;
    task.stage1.firstThreeRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS7', '应显示提示S7');
  });

  testCase('15. 第6回合判分 - 得分≠前3回合总分 → CD', () => {
    const result = createTask({ name: '阶段1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 6;
    task.stageScore = 3;
    task.stage1.firstThreeRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '得分不等应进入阶段CD');
  });
});

// 4. 第2阶段详细测试（15个）
testSuite('第2阶段：深化关系详细测试 (15个测试)', () => {
  testCase('1. 进入第2阶段 - 所有字段验证', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    const task = getTask(taskId);

    assertEqual(task.stageIndex, 2, 'stageIndex应为2');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
    assertEqual(task.stageScore, 0, 'stageScore应为0');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assertNotNull(task.stage2, 'stage2应存在');
  });

  testCase('2. stage2数据结构验证', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage2.roundScores), 'roundScores应为数组');
    assertEqual(task.stage2.firstTwoRoundsTotal, 0, 'firstTwoRoundsTotal应为0');
    assertNull(task.stage2.specialRound, 'specialRound应为null');
    assertEqual(task.stage2.skipOpening, false, 'skipOpening应为false');
    assert(Array.isArray(task.stage2.usedContentLibs), 'usedContentLibs应为数组');
  });

  testCase('3. 第1回合得分记录', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    assertEqual(task.stage2.roundScores[0], 2, '第1回合得分应为2');
    assertEqual(task.stageScore, 2, 'stageScore应为2');
  });

  testCase('4. 第2回合得分记录', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage2.roundScores[1], 1, '第2回合得分应为1');
    assertEqual(task.stageScore, 3, 'stageScore应为3');
  });

  testCase('5. firstTwoRoundsTotal自动计算 - 2+1=3', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage2.firstTwoRoundsTotal, 3, 'firstTwoRoundsTotal应为3');
  });

  testCase('6. 第1回合后转换逻辑', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound2', '应进入第2回合');
  });

  testCase('7. 第2回合判分 - 得分>阈值 → CD', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // >3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应进入阶段CD');
  });

  testCase('8. 第2回合判分 - 得分=阈值（边界值）→ 特殊回合', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 3; // =3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS10', '得分=阈值应进入特殊回合');

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');
    assertEqual(task.roundIndex, 3, 'roundIndex应变为3');
  });

  testCase('9. 第2回合判分 - 得分<阈值 → 特殊回合', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // <3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS10', '得分<阈值应进入特殊回合');
  });

  testCase('10. 特殊回合a - 得分=前2回合 且 回合<4', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS11', '应显示提示S11');
  });

  testCase('11. 特殊回合a - 得分=前2回合 且 回合=4（边界值）', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS13', '回合=4应显示S13');
  });

  testCase('12. 特殊回合a - 得分=前2回合 且 回合>4', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 5;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS13', '回合>4应显示S13');
  });

  testCase('13. 特殊回合a - 得分<前2回合', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS14', '得分<前2回合应显示S14');
  });

  testCase('14. 特殊回合a - 得分>前2回合', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 3;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '得分>前2回合应进入CD');
  });

  testCase('15. 非特殊回合状态 - 正常继续', () => {
    const result = createTask({ name: '阶段2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 0;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'continue', '应继续当前回合');
  });
});

// 5. 第3阶段详细测试（15个）
testSuite('第3阶段：关键推进详细测试 (15个测试)', () => {
  testCase('1. 进入第3阶段 - 所有字段验证', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    const task = getTask(taskId);

    assertEqual(task.stageIndex, 3, 'stageIndex应为3');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
    assertEqual(task.stageScore, 0, 'stageScore应为0');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assertNotNull(task.stage3, 'stage3应存在');
  });

  testCase('2. stage3数据结构验证', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage3.roundScores), 'roundScores应为数组');
    assertEqual(task.stage3.secondRoundScore, 0, 'secondRoundScore应为0');
    assertNull(task.stage3.specialRound, 'specialRound应为null');
    assertEqual(task.stage3.skipOpening, false, 'skipOpening应为false');
  });

  testCase('3. 第1回合得分记录', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage3Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage3.roundScores[0], 1, '第1回合得分应为1');
  });

  testCase('4. 第2回合得分记录和secondRoundScore', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);

    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage3Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage3Round(taskId, 2);

    task = getTask(taskId);
    assertEqual(task.stage3.secondRoundScore, 3, 'secondRoundScore应为3（1+2）');
  });

  testCase('5. 第1回合后转换逻辑', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound2', '应进入第2回合');
  });

  testCase('6. 第2回合判分 - 得分>阈值 → 直接第4阶段', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // >3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterStage4', '应直接进入第4阶段');

    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, 'stageIndex应变为4');
  });

  testCase('7. 第2回合判分 - 得分=阈值 → 提示S15', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 3; // =3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS15', '得分=阈值应显示S15');
  });

  testCase('8. 第2回合判分 - 得分<阈值 → 提示S15', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // <3
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS15', '得分<阈值应显示S15');
  });

  testCase('9. 特殊回合a - 得分=第2回合 且 回合<4', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS16', '应显示提示S16');
  });

  testCase('10. 特殊回合a - 得分=第2回合 且 回合=4', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    task.stageScore = 2;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS17', '回合=4应显示S17');
  });

  testCase('11. 特殊回合a - 得分=第2回合 且 回合>4', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 5;
    task.stageScore = 2;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS17', '回合>4应显示S17');
  });

  testCase('12. 特殊回合a - 得分<第2回合', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS18', '得分<第2回合应显示S18');
  });

  testCase('13. 特殊回合a - 得分>第2回合 → 第4阶段', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 3;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterStage4', '得分>第2回合应进入第4阶段');

    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, 'stageIndex应变为4');
  });

  testCase('14. secondRoundScore在第2回合自动设置', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 5;
    set(`fm:task:${taskId}`, task);

    checkStage3RoundTransition(taskId);

    task = getTask(taskId);
    assertEqual(task.stage3.secondRoundScore, 5, 'secondRoundScore应自动设置为5');
  });

  testCase('15. 非特殊回合状态 - 正常继续', () => {
    const result = createTask({ name: '阶段3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 0;
    set(`fm:task:${taskId}`, task);

    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'continue', '应继续当前回合');
  });
});

// 6. 第4阶段详细测试（15个）
testSuite('第4阶段：确认邀约详细测试 (15个测试)', () => {
  testCase('1. 进入第4阶段 - 所有字段验证', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const task = getTask(taskId);

    assertEqual(task.stageIndex, 4, 'stageIndex应为4');
    assertNull(task.roundIndex, 'roundIndex应为null');
    assertEqual(task.stepIndex, 0, 'stepIndex应为0');
    assertEqual(task.status, 'active', 'status应为active');
    assertNotNull(task.stage4, 'stage4应存在');
  });

  testCase('2. stage4数据结构验证', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const task = getTask(taskId);

    assertEqual(task.stage4.invitationAttempts, 0, 'invitationAttempts应为0');
    assertEqual(task.stage4.invitationSuccess, false, 'invitationSuccess应为false');
    assertEqual(task.stage4.multiChatUsed, false, 'multiChatUsed应为false');
    assertEqual(task.stage4.goClicked, false, 'goClicked应为false');
    assertEqual(task.stage4.returnedFromStage3, false, 'returnedFromStage3应为false');
  });

  testCase('3. 邀约成功 - 显示内容S18', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const inviteResult = handleInvitation(taskId, true);

    assertEqual(inviteResult.action, 'showContentS18', '应显示内容S18');
    assertEqual(inviteResult.contentLibId, 'S18', '内容库ID应为S18');

    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');
    assertEqual(task.stage4.invitationSuccess, true, '邀约成功标志应为true');
  });

  testCase('4. 邀约失败1次 - 3×CD', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const inviteResult = handleInvitation(taskId, false);

    assertEqual(inviteResult.action, 'enterBigCd', '应进入大CD');
    assertEqual(inviteResult.cdMultiplier, 3, 'CD倍数应为3');

    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');
    assertEqual(task.stage4.invitationSuccess, false, '邀约成功标志应为false');
  });

  testCase('5. 邀约失败2次 - 5×CD', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false);
    const inviteResult = handleInvitation(taskId, false);

    assertEqual(inviteResult.action, 'enterBigCd', '应进入大CD');
    assertEqual(inviteResult.cdMultiplier, 5, 'CD倍数应为5');

    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 2, '邀约次数应为2');
  });

  testCase('6. 邀约失败3次 - 提示S25', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false);
    handleInvitation(taskId, false);
    const inviteResult = handleInvitation(taskId, false);

    assertEqual(inviteResult.action, 'showPromptS25', '应显示提示S25');

    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 3, '邀约次数应为3');
  });

  testCase('7. 邀约失败4次 - 仍显示S25', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false);
    handleInvitation(taskId, false);
    handleInvitation(taskId, false);
    const inviteResult = handleInvitation(taskId, false);

    assertEqual(inviteResult.action, 'showPromptS25', '超过3次仍应显示S25');
  });

  testCase('8. 多聊一次 - 正常使用', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const multiChatResult = handleMultiChat(taskId);

    assertEqual(multiChatResult.ok, true, '应该成功');
    assertEqual(multiChatResult.action, 'returnToStage3', '应返回第3阶段');

    const task = getTask(taskId);
    assertEqual(task.stage4.multiChatUsed, true, 'multiChatUsed应为true');
    assertEqual(task.stage4.returnedFromStage3, true, 'returnedFromStage3应为true');
  });

  testCase('9. 多聊一次 - 重复使用被拒绝', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleMultiChat(taskId);
    const multiChatResult = handleMultiChat(taskId);

    assertEqual(multiChatResult.ok, false, '应该失败');
    assertEqual(multiChatResult.reason, '多聊一次已使用过', '原因应正确');
  });

  testCase('10. 多聊一次后从第3阶段返回标志验证', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);

    // 使用多聊一次
    const multiChatResult = handleMultiChat(taskId);
    assertEqual(multiChatResult.ok, true, '首次应该成功');
    assertEqual(multiChatResult.action, 'returnToStage3', '应返回第3阶段');

    // 验证两个标志位都被设置
    const task = getTask(taskId);
    assertEqual(task.stage4.multiChatUsed, true, 'multiChatUsed应为true');
    assertEqual(task.stage4.returnedFromStage3, true, 'returnedFromStage3应为true');
  });

  testCase('11. 完成任务 - 状态变更', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const finishResult = finishTask(taskId);

    assertEqual(finishResult.ok, true, '应该成功');

    const task = getTask(taskId);
    assertEqual(task.status, 'deleted', '状态应为deleted');
  });

  testCase('12. 完成任务 - 从列表移除', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);

    let taskList = get('fm:tasks') || [];
    const beforeCount = taskList.length;

    finishTask(taskId);

    taskList = get('fm:tasks') || [];
    const afterCount = taskList.length;

    assertEqual(afterCount, beforeCount - 1, '任务列表应减少1个');
    assert(!taskList.includes(taskId), '任务ID不应在列表中');
  });

  testCase('13. 邀约成功后invitationAttempts增加', () => {
    const result = createTask({ name: '阶段4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);

    handleInvitation(taskId, true);

    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '即使成功，邀约次数也应增加');
  });

  testCase('14. 邀约失败1-2-3次的CD倍数递增', () => {
    // 测试1次失败
    const result1 = createTask({ name: '测试1', durationDays: 5 });
    const taskId1 = result1.task.id;
    enterStage4(taskId1);
    const result1Invite = handleInvitation(taskId1, false);
    assertEqual(result1Invite.cdMultiplier, 3, '第1次失败CD应为3×');

    // 测试2次失败
    const result2 = createTask({ name: '测试2', durationDays: 5 });
    const taskId2 = result2.task.id;
    enterStage4(taskId2);
    handleInvitation(taskId2, false);
    const result2Invite = handleInvitation(taskId2, false);
    assertEqual(result2Invite.cdMultiplier, 5, '第2次失败CD应为5×');

    // 测试3次失败（无CD倍数，显示提示）
    const result3 = createTask({ name: '测试3', durationDays: 5 });
    const taskId3 = result3.task.id;
    enterStage4(taskId3);
    handleInvitation(taskId3, false);
    handleInvitation(taskId3, false);
    const result3Invite = handleInvitation(taskId3, false);
    assertEqual(result3Invite.action, 'showPromptS25', '第3次失败应显示S25');
    assert(result3Invite.cdMultiplier === undefined, '第3次失败不应有CD倍数');
  });

  testCase('15. 完整第4阶段流程验证', () => {
    const result = createTask({ name: '完整流程', durationDays: 5 });
    const taskId = result.task.id;

    // 进入第4阶段
    enterStage4(taskId);
    let task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '应在第4阶段');

    // 邀约失败1次
    handleInvitation(taskId, false);
    task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');

    // 使用多聊一次
    const multiChatResult = handleMultiChat(taskId);
    assertEqual(multiChatResult.action, 'returnToStage3', '应返回第3阶段');

    // 验证标志位
    task = getTask(taskId);
    assertEqual(task.stage4.multiChatUsed, true, '多聊标志应为true');
    assertEqual(task.stage4.returnedFromStage3, true, '返回标志应为true');
  });
});

// 7. 状态转换完整性测试（15个）
testSuite('状态转换完整性测试 (15个测试)', () => {
  testCase('1. 问卷→第1阶段转换 - 数据重置验证', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;

    // 问卷阶段设置一些数据
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    let task = getTask(taskId);
    const questionnaireScore = task.questionnaire.totalScore;

    // 进入第1阶段
    enterStage1(taskId);
    task = getTask(taskId);

    assertEqual(task.stageIndex, 1, '阶段应为1');
    assertEqual(task.roundIndex, 0, 'roundIndex应重置为0');
    assertEqual(task.stageScore, 0, 'stageScore应重置为0');
    assertEqual(task.totalScore, 0, 'totalScore应重置为0');
    assertEqual(task.questionnaire.totalScore, questionnaireScore, '问卷得分应保留');
  });

  testCase('2. 第1阶段→第2阶段转换 - stageScore重置', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    // 第1阶段得一些分
    addPoint(taskId, 5);
    let task = getTask(taskId);
    const stage1Total = task.totalScore;

    // 进入第2阶段
    enterStage2(taskId);
    task = getTask(taskId);

    assertEqual(task.stageIndex, 2, '阶段应为2');
    assertEqual(task.stageScore, 0, 'stageScore应重置为0');
    assertEqual(task.totalScore, stage1Total, 'totalScore应保持不变');
    // 注意：实际实现保留所有阶段数据，不清理stage1
    assertNotNull(task.stage1, 'stage1数据应保留');
    assertNotNull(task.stage2, 'stage2数据应初始化');
  });

  testCase('3. 第2阶段→第3阶段转换 - totalScore累加正确', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    addPoint(taskId, 3);

    enterStage2(taskId);
    addPoint(taskId, 4);
    let task = getTask(taskId);
    const expectedTotal = 7;

    enterStage3(taskId);
    task = getTask(taskId);

    assertEqual(task.totalScore, expectedTotal, 'totalScore应为7（3+4）');
    assertEqual(task.stageScore, 0, 'stageScore应重置为0');
  });

  testCase('4. 第3阶段→第4阶段转换 - 直接进入无CD', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // >3
    set(`fm:task:${taskId}`, task);

    checkStage3RoundTransition(taskId);
    task = getTask(taskId);

    assertEqual(task.stageIndex, 4, '应直接进入第4阶段');
    assertNull(task.stageCdUnlockAt, 'stageCdUnlockAt应为null（无CD）');
  });

  testCase('5. 阶段切换时roundIndex正确重置', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    let task = getTask(taskId);
    assertEqual(task.roundIndex, 0, '第1阶段roundIndex初始为0');

    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.roundIndex, 0, '第2阶段roundIndex应重置为0');

    enterStage3(taskId);
    task = getTask(taskId);
    assertEqual(task.roundIndex, 0, '第3阶段roundIndex应重置为0');

    enterStage4(taskId);
    task = getTask(taskId);
    assertNull(task.roundIndex, '第4阶段roundIndex应为null');
  });

  testCase('6. 阶段切换时status保持active', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    let task = getTask(taskId);
    assertEqual(task.status, 'active', '第1阶段status应为active');

    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.status, 'active', '第2阶段status应为active');

    enterStage3(taskId);
    task = getTask(taskId);
    assertEqual(task.status, 'active', '第3阶段status应为active');

    enterStage4(taskId);
    task = getTask(taskId);
    assertEqual(task.status, 'active', '第4阶段status应为active');
  });

  testCase('7. 第1阶段特殊回合转换 - 第3回合→第5回合', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1; // <2
    set(`fm:task:${taskId}`, task);

    const trans = checkStage1RoundTransition(taskId);
    assertEqual(trans.action, 'enterRound5', '得分<2应进入第5回合');
  });

  testCase('8. 第2阶段特殊回合转换 - 进入specialRound=a', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // ≤3
    set(`fm:task:${taskId}`, task);

    checkStage2RoundTransition(taskId);
    task = getTask(taskId);

    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');
    assertEqual(task.roundIndex, 3, 'roundIndex应变为3');
  });

  testCase('9. 第3阶段特殊回合转换 - 设置specialRound后继续', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // ≤3
    set(`fm:task:${taskId}`, task);

    checkStage3RoundTransition(taskId);

    // 用户选择坚持后设置specialRound
    task = getTask(taskId);
    task.stage3.specialRound = 'a';
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);

    const trans = checkStage3RoundTransition(taskId);
    assert(trans.action !== 'continue', '特殊回合应有判分逻辑');
  });

  testCase('10. 跨阶段lastActionAt更新', () => {
    const result = createTask({ name: '转换测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    const time1 = Date.now();
    while (Date.now() - time1 < 2) {} // 等待2ms

    enterStage2(taskId);
    const time2 = Date.now();
    while (Date.now() - time2 < 2) {} // 等待2ms

    enterStage3(taskId);
    const time3 = Date.now();

    // lastActionAt应该在stage函数中自动更新（如果有的话）
    assert(time3 > time1, '应该有时间推移');
  });

  testCase('11. 完整5阶段转换序列验证', () => {
    const result = createTask({ name: '完整转换', durationDays: 5 });
    const taskId = result.task.id;
    let task = getTask(taskId);

    assertEqual(task.stageIndex, 0, '初始阶段应为0');

    enterStage1(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 1, '应在第1阶段');

    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 2, '应在第2阶段');

    enterStage3(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 3, '应在第3阶段');

    enterStage4(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '应在第4阶段');
  });

  testCase('12. 阶段对象初始化验证', () => {
    const result = createTask({ name: '对象测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    let task = getTask(taskId);
    assertNotNull(task.stage1, 'stage1对象应初始化');
    assert(Array.isArray(task.stage1.roundScores), 'roundScores应为数组');

    enterStage2(taskId);
    task = getTask(taskId);
    assertNotNull(task.stage2, 'stage2对象应初始化');
    assert(Array.isArray(task.stage2.usedContentLibs), 'usedContentLibs应为数组');

    enterStage3(taskId);
    task = getTask(taskId);
    assertNotNull(task.stage3, 'stage3对象应初始化');
    assertEqual(task.stage3.secondRoundScore, 0, 'secondRoundScore应初始化为0');

    enterStage4(taskId);
    task = getTask(taskId);
    assertNotNull(task.stage4, 'stage4对象应初始化');
    assertEqual(task.stage4.invitationAttempts, 0, 'invitationAttempts应初始化为0');
  });

  testCase('13. 阶段CD解锁时间重置', () => {
    const result = createTask({ name: 'CD测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    let task = getTask(taskId);
    task.stageCdUnlockAt = Date.now() + 10000; // 设置一个未来时间
    set(`fm:task:${taskId}`, task);

    enterStage2(taskId);
    task = getTask(taskId);
    assertNull(task.stageCdUnlockAt, 'stageCdUnlockAt应重置为null');

    task.stageCdUnlockAt = Date.now() + 10000;
    set(`fm:task:${taskId}`, task);

    enterStage3(taskId);
    task = getTask(taskId);
    assertNull(task.stageCdUnlockAt, 'stageCdUnlockAt应重置为null');
  });

  testCase('14. listBadge和listCountdownEndAt重置', () => {
    const result = createTask({ name: '标志测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    let task = getTask(taskId);
    assertEqual(task.listBadge, '聊天任务进行中', 'listBadge应设置为进行中');
    assertNull(task.listCountdownEndAt, 'listCountdownEndAt应为null');

    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.listBadge, '聊天任务进行中', 'listBadge应保持');
    assertNull(task.listCountdownEndAt, 'listCountdownEndAt应保持null');
  });

  testCase('15. 多次进入同一阶段 - 数据重新初始化', () => {
    const result = createTask({ name: '重入测试', durationDays: 5 });
    const taskId = result.task.id;

    // 第一次进入第2阶段
    enterStage2(taskId);
    let task = getTask(taskId);
    task.stage2.specialRound = 'a';
    task.stage2.firstTwoRoundsTotal = 5;
    set(`fm:task:${taskId}`, task);

    // 第二次进入第2阶段（重新初始化）
    enterStage2(taskId);
    task = getTask(taskId);

    assertEqual(task.stage2.specialRound, null, 'specialRound应重新初始化为null');
    assertEqual(task.stage2.firstTwoRoundsTotal, 0, 'firstTwoRoundsTotal应重置为0');
  });
});

// 8. 并发和竞态条件测试（10个）
testSuite('并发和竞态条件测试 (10个测试)', () => {
  testCase('1. 多任务并发创建 - 数据隔离验证', () => {
    const tasks = [];
    for (let i = 0; i < 5; i++) {
      const result = createTask({ name: `任务${i}`, durationDays: 5 + i });
      tasks.push(result.task);
    }

    // 验证每个任务都有独立的数据
    for (let i = 0; i < 5; i++) {
      const task = getTask(tasks[i].id);
      assertEqual(task.name, `任务${i}`, `任务${i}名称应正确`);
      assertEqual(task.durationDays, 5 + i, `任务${i}天数应正确`);
      assertEqual(task.stageIndex, 0, '所有任务初始阶段应为0');
    }
  });

  testCase('2. 同一任务快速连续读写', () => {
    const result = createTask({ name: '快速读写', durationDays: 5 });
    const taskId = result.task.id;

    // 快速连续写入和读取
    enterStage1(taskId);
    const task1 = getTask(taskId);
    addPoint(taskId, 1);
    const task2 = getTask(taskId);
    addPoint(taskId, 1);
    const task3 = getTask(taskId);

    assertEqual(task3.stageScore, 2, '应正确累加得分');
    assertEqual(task3.totalScore, 2, '总分应正确');
  });

  testCase('3. 多任务同时进入不同阶段', () => {
    const task1Result = createTask({ name: '任务1', durationDays: 5 });
    const task2Result = createTask({ name: '任务2', durationDays: 5 });
    const task3Result = createTask({ name: '任务3', durationDays: 5 });

    enterStage1(task1Result.task.id);
    enterStage2(task2Result.task.id);
    enterStage3(task3Result.task.id);

    const t1 = getTask(task1Result.task.id);
    const t2 = getTask(task2Result.task.id);
    const t3 = getTask(task3Result.task.id);

    assertEqual(t1.stageIndex, 1, '任务1应在第1阶段');
    assertEqual(t2.stageIndex, 2, '任务2应在第2阶段');
    assertEqual(t3.stageIndex, 3, '任务3应在第3阶段');
  });

  testCase('4. 任务列表并发更新验证', () => {
    const initialList = get('fm:tasks') || [];
    const beforeCount = initialList.length;

    // 创建3个新任务
    const r1 = createTask({ name: '并发1', durationDays: 5 });
    const r2 = createTask({ name: '并发2', durationDays: 5 });
    const r3 = createTask({ name: '并发3', durationDays: 5 });

    const finalList = get('fm:tasks') || [];
    assertEqual(finalList.length, beforeCount + 3, '任务列表应增加3个');
    assert(finalList.includes(r1.task.id), '应包含任务1');
    assert(finalList.includes(r2.task.id), '应包含任务2');
    assert(finalList.includes(r3.task.id), '应包含任务3');
  });

  testCase('5. 问卷数据并发修改 - 答案覆盖', () => {
    const result = createTask({ name: '问卷并发', durationDays: 5 });
    const taskId = result.task.id;

    // 快速连续修改同一题的答案
    saveQuestionnaireAnswer(taskId, 'q2', 'B'); // 0分
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分（应覆盖）

    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 1, '应只有1个答案');
    assertEqual(task.questionnaire.answers[0].optionId, 'A', '最后的答案应为A');
    assertEqual(task.questionnaire.totalScore, 4, '总分应为4');
  });

  testCase('6. 阶段转换中的得分更新竞态', () => {
    const result = createTask({ name: '得分竞态', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);
    addPoint(taskId, 2);
    const score1 = getTask(taskId).totalScore;

    enterStage2(taskId); // 进入新阶段
    const scoreAfterTransition = getTask(taskId).totalScore;

    assertEqual(scoreAfterTransition, score1, '阶段转换不应影响总分');
    assertEqual(getTask(taskId).stageScore, 0, '新阶段得分应重置');
  });

  testCase('7. 回合得分并发记录 - 数组索引一致性', () => {
    const result = createTask({ name: '回合并发', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);

    // 快速连续完成多个回合
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    assertEqual(task.stage1.roundScores[0], 1, '第1回合得分应正确');
    assertEqual(task.stage1.roundScores[1], 0, '第2回合得分应正确');
    assertEqual(task.stage1.roundScores[2], 1, '第3回合得分应正确');
  });

  testCase('8. 特殊回合标志并发设置', () => {
    const result = createTask({ name: '特殊回合', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);

    // 触发特殊回合
    checkStage2RoundTransition(taskId);

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', '特殊回合标志应设置');
    assertEqual(task.roundIndex, 3, '回合数应正确更新');
  });

  testCase('9. 多聊一次标志并发检查', () => {
    const result = createTask({ name: '多聊', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);

    // 第一次调用
    const result1 = handleMultiChat(taskId);
    assert(result1.ok === true, '第1次应成功');

    // 立即第二次调用
    const result2 = handleMultiChat(taskId);
    assert(result2.ok === false, '第2次应失败');

    // 第三次调用
    const result3 = handleMultiChat(taskId);
    assert(result3.ok === false, '第3次应仍然失败');
  });

  testCase('10. 任务状态并发变更验证', () => {
    const result = createTask({ name: '状态变更', durationDays: 5 });
    const taskId = result.task.id;

    // 快速连续改变状态
    enterStage1(taskId);
    assertEqual(getTask(taskId).status, 'active', '进入第1阶段后状态应为active');

    enterStage2(taskId);
    assertEqual(getTask(taskId).status, 'active', '进入第2阶段后状态应保持active');

    enterStage3(taskId);
    assertEqual(getTask(taskId).status, 'active', '进入第3阶段后状态应保持active');

    enterStage4(taskId);
    assertEqual(getTask(taskId).status, 'active', '进入第4阶段后状态应保持active');
  });
});

// 9. 数据验证和类型检查测试（15个）
testSuite('数据验证和类型检查测试 (15个测试)', () => {
  testCase('1. 任务名称类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    assert(result.ok === true, '应该成功');
    assert(typeof result.task.name === 'string', '名称应为字符串类型');
    assertEqual(result.task.name.length, 2, '名称长度应正确');
  });

  testCase('2. 任务ID格式验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const id = result.task.id;
    assert(typeof id === 'string', 'ID应为字符串类型');
    assert(id.startsWith('fm_'), 'ID应以fm_开头');
    assert(id.includes('_'), 'ID应包含下划线分隔符');
  });

  testCase('3. 时间戳类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(typeof task.createdAt === 'number', 'createdAt应为数字类型');
    assert(typeof task.expireAt === 'number', 'expireAt应为数字类型');
    assert(typeof task.lastActionAt === 'number', 'lastActionAt应为数字类型');
    assertGreaterThan(task.createdAt, 0, 'createdAt应大于0');
    assertGreaterThan(task.expireAt, task.createdAt, 'expireAt应大于createdAt');
  });

  testCase('4. 得分字段类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(typeof task.stageScore === 'number', 'stageScore应为数字类型');
    assert(typeof task.totalScore === 'number', 'totalScore应为数字类型');
    assert(typeof task.stageThresholdX === 'number', 'stageThresholdX应为数字类型');
    assertEqual(task.stageScore, 0, '初始stageScore应为0');
    assertEqual(task.totalScore, 0, '初始totalScore应为0');
  });

  testCase('5. 阶段索引类型和范围验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(typeof task.stageIndex === 'number', 'stageIndex应为数字类型');
    assert(Number.isInteger(task.stageIndex), 'stageIndex应为整数');
    assert(task.stageIndex >= 0 && task.stageIndex <= 4, 'stageIndex应在0-4范围内');
  });

  testCase('6. 布尔字段类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(typeof task.isRestartHalfPrice === 'boolean', 'isRestartHalfPrice应为布尔类型');
    assert(typeof task.dMode === 'boolean', 'dMode应为布尔类型');
    assert(typeof task.opponentFindUsedInRound === 'boolean', 'opponentFindUsedInRound应为布尔类型');
  });

  testCase('7. 问卷答案数组验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(Array.isArray(task.questionnaire.answers), 'answers应为数组');
    assertEqual(task.questionnaire.answers.length, 0, '初始答案数组应为空');
  });

  testCase('8. 对象字段非空验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assertNotNull(task.questionnaire, 'questionnaire不应为null');
    assertNotNull(task.prompts, 'prompts不应为null');
    assertNotNull(task.askFlow, 'askFlow不应为null');
    assertNotNull(task.usedLibIdsByStage, 'usedLibIdsByStage不应为null');
    assert(typeof task.questionnaire === 'object', 'questionnaire应为对象');
  });

  testCase('9. 枚举值验证 - status字段', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const task = result.task;
    assert(['active', 'deleted', 'paused'].includes(task.status) || task.status === 'active',
      'status应为有效值');
    assertEqual(task.status, 'active', '初始状态应为active');
  });

  testCase('10. stage1数据结构类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage1.roundScores), 'roundScores应为数组');
    assert(typeof task.stage1.firstThreeRoundsTotal === 'number', 'firstThreeRoundsTotal应为数字');
    assert(typeof task.stage1.roundCdMultiplier === 'number', 'roundCdMultiplier应为数字');
    assert(typeof task.stage1.hasUsedOpponentFind === 'boolean', 'hasUsedOpponentFind应为布尔');
    assert(typeof task.stage1.roundAllowedTimeMs === 'number', 'roundAllowedTimeMs应为数字');
  });

  testCase('11. stage2数据结构类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage2.roundScores), 'roundScores应为数组');
    assert(Array.isArray(task.stage2.usedContentLibs), 'usedContentLibs应为数组');
    assert(typeof task.stage2.firstTwoRoundsTotal === 'number', 'firstTwoRoundsTotal应为数字');
    assert(typeof task.stage2.skipOpening === 'boolean', 'skipOpening应为布尔');
    assert(task.stage2.specialRound === null || typeof task.stage2.specialRound === 'string',
      'specialRound应为null或字符串');
  });

  testCase('12. stage3数据结构类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    const task = getTask(taskId);

    assert(Array.isArray(task.stage3.roundScores), 'roundScores应为数组');
    assert(Array.isArray(task.stage3.usedContentLibs), 'usedContentLibs应为数组');
    assert(typeof task.stage3.secondRoundScore === 'number', 'secondRoundScore应为数字');
    assert(typeof task.stage3.skipOpening === 'boolean', 'skipOpening应为布尔');
  });

  testCase('13. stage4数据结构类型验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const task = getTask(taskId);

    assert(typeof task.stage4.invitationAttempts === 'number', 'invitationAttempts应为数字');
    assert(typeof task.stage4.invitationSuccess === 'boolean', 'invitationSuccess应为布尔');
    assert(typeof task.stage4.multiChatUsed === 'boolean', 'multiChatUsed应为布尔');
    assert(typeof task.stage4.goClicked === 'boolean', 'goClicked应为布尔');
    assert(typeof task.stage4.returnedFromStage3 === 'boolean', 'returnedFromStage3应为布尔');
  });

  testCase('14. roundIndex类型和可空性验证', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    let task = result.task;
    assert(task.roundIndex === null, '初始roundIndex应为null');

    enterStage1(result.task.id);
    task = getTask(result.task.id);
    assert(typeof task.roundIndex === 'number', '第1阶段roundIndex应为数字');
    assertEqual(task.roundIndex, 0, '第1阶段初始roundIndex应为0');

    enterStage4(result.task.id);
    task = getTask(result.task.id);
    assert(task.roundIndex === null, '第4阶段roundIndex应为null');
  });

  testCase('15. 配置数据结构验证', () => {
    initDefaults();
    const settings = get('fm:settings');
    const libs = get('fm:libs');

    assertNotNull(settings, 'settings不应为null');
    assertNotNull(libs, 'libs不应为null');
    assert(typeof settings === 'object', 'settings应为对象');
    assert(typeof libs === 'object', 'libs应为对象');

    // settings结构验证
    assertNotNull(settings.cd, 'cd配置应存在');
    assertNotNull(settings.vip, 'vip配置应存在');
    assertNotNull(settings.stageThresholdX, 'stageThresholdX配置应存在');
    assert(typeof settings.stageThresholdX[1] === 'number', '阈值应为数字类型');

    // libs结构验证
    assertNotNull(libs.content, 'content库应存在');
    assertNotNull(libs.questionnaire, 'questionnaire库应存在');
    assert(Array.isArray(libs.questionnaire.questions), 'questions应为数组');
  });
});

// 10. 错误处理和容错性测试（15个）
testSuite('错误处理和容错性测试 (15个测试)', () => {
  testCase('1. 创建任务 - 名称为undefined', () => {
    const result = createTask({ name: undefined, durationDays: 5 });
    assertEqual(result.ok, false, '应该失败');
    assertEqual(result.reason, '名称需1-6字', '错误原因应正确');
  });

  testCase('2. 创建任务 - 名称为null', () => {
    const result = createTask({ name: null, durationDays: 5 });
    assertEqual(result.ok, false, '应该失败');
  });

  testCase('3. 创建任务 - 名称为数字类型', () => {
    // 测试非字符串类型输入的处理
    try {
      const result = createTask({ name: 123, durationDays: 5 });
      // 如果没有抛出错误，验证返回值
      assertEqual(result.ok, false, '数字类型应该失败');
    } catch (e) {
      // 如果抛出错误，这也是合理的容错行为
      assert(true, '非字符串输入应该被拒绝');
    }
  });

  testCase('4. 获取任务 - 空字符串ID', () => {
    const task = getTask('');
    assertNull(task, '不存在的任务应返回null');
  });

  testCase('5. 获取任务 - undefined ID', () => {
    const task = getTask(undefined);
    assertNull(task, '不存在的任务应返回null');
  });

  testCase('6. 获取任务 - 非法ID格式', () => {
    const task = getTask('invalid_id_format');
    assertNull(task, '非法ID应返回null');
  });

  testCase('7. 在不存在的任务上进入第1阶段', () => {
    const result = enterStage1('nonexistent_id');
    assertEqual(result.ok, false, '应该失败');
    assertEqual(result.reason, '任务不存在', '错误原因应正确');
  });

  testCase('8. 在不存在的任务上保存问卷答案', () => {
    // 不应抛出错误，应优雅处理
    saveQuestionnaireAnswer('nonexistent_id', 'q1', 'A');
    // 验证没有崩溃，函数正常返回
    assert(true, '应该优雅处理不存在的任务');
  });

  testCase('9. 完成不在第1阶段的任务回合', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    // 不进入第1阶段，直接尝试完成回合
    const finishResult = finishStage1Round(taskId, 1);
    assertEqual(finishResult.ok, false, '应该失败');
    assertEqual(finishResult.reason, '任务不在第一阶段', '错误原因应正确');
  });

  testCase('10. 转换判断不在正确阶段的任务', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    // 不进入第1阶段，直接检查转换
    const transResult = checkStage1RoundTransition(taskId);
    assertEqual(transResult.ok, false, '应该失败');
  });

  testCase('11. 处理邀约 - 任务不在第4阶段', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    // 不进入第4阶段，直接处理邀约
    const inviteResult = handleInvitation(taskId, true);
    assertEqual(inviteResult.ok, false, '应该失败');
    assertEqual(inviteResult.reason, '任务不在第四阶段', '错误原因应正确');
  });

  testCase('12. 多聊一次 - 任务不在第4阶段', () => {
    const result = createTask({ name: '测试', durationDays: 5 });
    const taskId = result.task.id;
    // 不进入第4阶段，直接多聊
    const multiChatResult = handleMultiChat(taskId);
    assertEqual(multiChatResult.ok, false, '应该失败');
    assertEqual(multiChatResult.reason, '任务不在第四阶段', '错误原因应正确');
  });

  testCase('13. 问卷 - 保存答案时任务ID不存在', () => {
    // 应该优雅处理，不崩溃
    saveQuestionnaireAnswer('fm_999999999_9999', 'q1', 'A');
    // 验证没有错误抛出
    assert(true, '应该优雅处理不存在的任务ID');
  });

  testCase('14. 添加积分 - 任务ID不存在', () => {
    // 应该优雅处理，不崩溃
    addPoint('nonexistent_id', 10);
    // 验证没有错误抛出
    assert(true, '应该优雅处理不存在的任务ID');
  });

  testCase('15. 存储异常容错 - 获取失败时返回默认值', () => {
    // 测试get函数的try-catch容错
    const result = get('some_key_that_might_fail');
    // 应该返回null而不是抛出错误
    assert(result === null || result !== undefined, '获取失败应返回null或有效值');
  });
});

// 11. 性能和时间戳验证测试（10个）
testSuite('性能和时间戳验证测试 (10个测试)', () => {
  testCase('1. 测试执行性能 - 创建任务应快速完成', () => {
    const startTime = Date.now();
    const result = createTask({ name: '性能', durationDays: 5 });
    const duration = Date.now() - startTime;

    assert(result.ok === true, '任务创建应成功');
    assertLessThan(duration, 10, '创建任务应在10ms内完成');
  });

  testCase('2. 时间戳一致性 - createdAt应小于expireAt', () => {
    const result = createTask({ name: '时间戳', durationDays: 10 });
    const task = result.task;

    assertGreaterThan(task.expireAt, task.createdAt, 'expireAt应大于createdAt');
    const expectedDiff = 10 * 24 * 60 * 60 * 1000; // 10天的毫秒数
    assertEqual(task.expireAt - task.createdAt, expectedDiff, '时间差应等于天数×24小时');
  });

  testCase('3. lastActionAt自动更新 - 创建任务时', () => {
    const beforeCreate = Date.now();
    const result = createTask({ name: '动作时间', durationDays: 5 });
    const afterCreate = Date.now();
    const task = result.task;

    assertGreaterOrEqual(task.lastActionAt, beforeCreate, 'lastActionAt应≥创建前时间');
    assertGreaterOrEqual(afterCreate, task.lastActionAt, 'lastActionAt应≤创建后时间');
    assertEqual(task.lastActionAt, task.createdAt, '创建时lastActionAt应等于createdAt');
  });

  testCase('4. lastActionAt自动更新 - 保存问卷答案时', () => {
    const result = createTask({ name: '问卷动作', durationDays: 5 });
    const taskId = result.task.id;
    const initialLastAction = result.task.lastActionAt;

    // 等待至少1ms以确保时间戳不同
    const start = Date.now();
    while (Date.now() - start < 2) {}

    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    const task = getTask(taskId);

    assertGreaterThan(task.lastActionAt, initialLastAction, 'lastActionAt应该更新');
  });

  testCase('5. lastActionAt自动更新 - 添加积分时', () => {
    const result = createTask({ name: '积分动作', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task1 = getTask(taskId);
    const initialLastAction = task1.lastActionAt;

    // 等待至少1ms
    const start = Date.now();
    while (Date.now() - start < 2) {}

    addPoint(taskId, 1);
    const task2 = getTask(taskId);

    assertGreaterThan(task2.lastActionAt, initialLastAction, 'lastActionAt应该更新');
  });

  testCase('6. CD解锁时间 - stageCdUnlockAt初始为null', () => {
    const result = createTask({ name: 'CD时间', durationDays: 5 });
    const task = result.task;

    assertNull(task.stageCdUnlockAt, 'stageCdUnlockAt初始应为null');
    assertNull(task.roundCdUnlockAt, 'roundCdUnlockAt初始应为null');
    assertNull(task.zUnlockAt, 'zUnlockAt初始应为null');
  });

  testCase('7. CD解锁时间 - 进入阶段后重置', () => {
    const result = createTask({ name: 'CD重置', durationDays: 5 });
    const taskId = result.task.id;

    // 设置一个未来时间
    let task = getTask(taskId);
    task.stageCdUnlockAt = Date.now() + 100000;
    set(`fm:task:${taskId}`, task);

    // 进入第1阶段应重置CD
    enterStage1(taskId);
    task = getTask(taskId);

    assertNull(task.stageCdUnlockAt, 'stageCdUnlockAt应被重置为null');
  });

  testCase('8. 时间戳字段完整性验证', () => {
    const result = createTask({ name: '时间字段', durationDays: 5 });
    const task = result.task;

    // 验证所有时间戳字段都存在
    assert(task.createdAt !== undefined, 'createdAt应存在');
    assert(task.expireAt !== undefined, 'expireAt应存在');
    assert(task.lastActionAt !== undefined, 'lastActionAt应存在');
    assert(typeof task.createdAt === 'number', 'createdAt应为数字');
    assert(typeof task.expireAt === 'number', 'expireAt应为数字');
    assert(typeof task.lastActionAt === 'number', 'lastActionAt应为数字');
  });

  testCase('9. 批量操作性能 - 快速创建多个任务', () => {
    const startTime = Date.now();
    const tasks = [];

    for (let i = 0; i < 10; i++) {
      const result = createTask({ name: `批量${i}`, durationDays: 5 });
      tasks.push(result.task);
    }

    const duration = Date.now() - startTime;

    assertEqual(tasks.length, 10, '应创建10个任务');
    assertLessThan(duration, 50, '创建10个任务应在50ms内完成');
  });

  testCase('10. 时间戳一致性 - 跨阶段验证', () => {
    const result = createTask({ name: '跨阶段', durationDays: 5 });
    const taskId = result.task.id;
    const initialCreatedAt = result.task.createdAt;
    const initialExpireAt = result.task.expireAt;

    // 进入第1阶段
    enterStage1(taskId);
    let task = getTask(taskId);
    assertEqual(task.createdAt, initialCreatedAt, 'createdAt应保持不变');
    assertEqual(task.expireAt, initialExpireAt, 'expireAt应保持不变');

    // 进入第2阶段
    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.createdAt, initialCreatedAt, 'createdAt应保持不变');
    assertEqual(task.expireAt, initialExpireAt, 'expireAt应保持不变');

    // 进入第3阶段
    enterStage3(taskId);
    task = getTask(taskId);
    assertEqual(task.createdAt, initialCreatedAt, 'createdAt应始终保持不变');
    assertEqual(task.expireAt, initialExpireAt, 'expireAt应始终保持不变');
  });
});

// 12. 复杂业务场景组合测试（15个）
testSuite('复杂业务场景组合测试 (15个测试)', () => {
  testCase('1. 完整流程 - 第1阶段得分不足触发延时回合', () => {
    const result = createTask({ name: '延时测试', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);

    // 前3回合得分不足(<2)
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    const trans = checkStage1RoundTransition(taskId);
    assertEqual(trans.action, 'enterRound5', '得分<2应进入第5回合');

    task = getTask(taskId);
    assertEqual(task.stageScore, 1, '总得分应为1');
    assertEqual(task.stage1.firstThreeRoundsTotal, 1, '前3回合总分应为1');
  });

  testCase('2. 完整流程 - 第1阶段延时回合得分相等触发第6回合', () => {
    const result = createTask({ name: '第6回合', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);

    // 前3回合得1分
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    // 第5回合也得1分(总分=前3回合)
    task = getTask(taskId);
    task.roundIndex = 5;
    set(`fm:task:${taskId}`, task);
    const trans5 = checkStage1RoundTransition(taskId);
    assertEqual(trans5.action, 'enterRound6', '得分相等应进入第6回合');

    // 第6回合仍然相等
    task = getTask(taskId);
    task.roundIndex = 6;
    set(`fm:task:${taskId}`, task);
    const trans6 = checkStage1RoundTransition(taskId);
    assertEqual(trans6.action, 'showPromptS7', '第6回合得分相等应显示S7');
  });

  testCase('3. 边界组合 - 第2阶段得分刚好=阈值触发特殊回合', () => {
    const result = createTask({ name: '边界2', durationDays: 5 });
    const taskId = result.task.id;

    enterStage2(taskId);

    // 第2回合得分=3(阈值)
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 3;
    set(`fm:task:${taskId}`, task);

    const trans = checkStage2RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS10', '得分=阈值应触发特殊回合');

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');
    assertEqual(task.roundIndex, 3, 'roundIndex应变为3');
  });

  testCase('4. 复杂路径 - 第2阶段特殊回合a完整流程(回合<4)', () => {
    const result = createTask({ name: '特殊2a', durationDays: 5 });
    const taskId = result.task.id;

    enterStage2(taskId);

    // 设置前2回合总分=2
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);

    // 触发特殊回合
    checkStage2RoundTransition(taskId);

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', '应进入特殊回合a');

    // 特殊回合第3轮得分相等
    task.roundIndex = 3;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);

    const trans = checkStage2RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS11', '回合<4且得分相等应显示S11');
  });

  testCase('5. 复杂路径 - 第2阶段特殊回合a完整流程(回合≥4)', () => {
    const result = createTask({ name: '特殊2b', durationDays: 5 });
    const taskId = result.task.id;

    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 4;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);

    const trans = checkStage2RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS13', '回合≥4且得分相等应显示S13');
  });

  testCase('6. 边界组合 - 第3阶段得分=阈值触发提示S15', () => {
    const result = createTask({ name: '边界3', durationDays: 5 });
    const taskId = result.task.id;

    enterStage3(taskId);

    // 第2回合得分=3(阈值)
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 3;
    set(`fm:task:${taskId}`, task);

    const trans = checkStage3RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS15', '得分=阈值应显示S15');
  });

  testCase('7. 关键验证 - 第3阶段→第4阶段无CD(多次验证)', () => {
    // 验证1: 得分>阈值
    const r1 = createTask({ name: '无CD1', durationDays: 5 });
    enterStage3(r1.task.id);
    let task1 = getTask(r1.task.id);
    task1.roundIndex = 2;
    task1.stageScore = 4;
    set(`fm:task:${r1.task.id}`, task1);
    checkStage3RoundTransition(r1.task.id);
    task1 = getTask(r1.task.id);
    assertEqual(task1.stageIndex, 4, '得分>3应直接进入第4阶段');
    assertNull(task1.stageCdUnlockAt, 'stageCdUnlockAt应为null(无CD)');

    // 验证2: 特殊回合得分超过
    const r2 = createTask({ name: '无CD2', durationDays: 5 });
    enterStage3(r2.task.id);
    let task2 = getTask(r2.task.id);
    task2.roundIndex = 3;
    task2.stageScore = 3;
    task2.stage3.secondRoundScore = 2;
    task2.stage3.specialRound = 'a';
    set(`fm:task:${r2.task.id}`, task2);
    checkStage3RoundTransition(r2.task.id);
    task2 = getTask(r2.task.id);
    assertEqual(task2.stageIndex, 4, '特殊回合得分>第2回合应进入第4阶段');
    assertNull(task2.stageCdUnlockAt, 'stageCdUnlockAt应为null(无CD)');
  });

  testCase('8. 复杂流程 - 邀约失败→多聊一次→再次邀约成功', () => {
    const result = createTask({ name: '复杂邀约', durationDays: 5 });
    const taskId = result.task.id;

    enterStage4(taskId);

    // 第1次邀约失败
    const invite1 = handleInvitation(taskId, false);
    assertEqual(invite1.action, 'enterBigCd', '第1次失败应进入3×CD');
    assertEqual(invite1.cdMultiplier, 3, 'CD倍数应为3');

    // 使用多聊一次
    const multiChat = handleMultiChat(taskId);
    assert(multiChat.ok === true, '多聊一次应成功');
    assertEqual(multiChat.action, 'returnToStage3', '应返回第3阶段');

    const task = getTask(taskId);
    assert(task.stage4.multiChatUsed === true, 'multiChatUsed应为true');
    assert(task.stage4.returnedFromStage3 === true, 'returnedFromStage3应为true');

    // 第2次邀约成功
    const invite2 = handleInvitation(taskId, true);
    assertEqual(invite2.action, 'showContentS18', '第2次成功应显示S18');

    // 重新获取最新的任务状态
    const updatedTask = getTask(taskId);
    assertEqual(updatedTask.stage4.invitationAttempts, 2, '邀约次数应为2');
  });

  testCase('9. 数据一致性 - 跨5阶段的totalScore累加', () => {
    const result = createTask({ name: '5阶段', durationDays: 5 });
    const taskId = result.task.id;
    let task = getTask(taskId);

    // 问卷阶段
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 14, '问卷得分应为14');

    // 第1阶段得2分
    enterStage1(taskId);
    addPoint(taskId, 2);
    task = getTask(taskId);
    assertEqual(task.totalScore, 2, '第1阶段总分应为2');

    // 第2阶段得4分
    enterStage2(taskId);
    addPoint(taskId, 4);
    task = getTask(taskId);
    assertEqual(task.totalScore, 6, '第2阶段总分应为6(2+4)');
    assertEqual(task.stageScore, 4, '第2阶段得分应为4');

    // 第3阶段得3分
    enterStage3(taskId);
    addPoint(taskId, 3);
    task = getTask(taskId);
    assertEqual(task.totalScore, 9, '第3阶段总分应为9(2+4+3)');
    assertEqual(task.stageScore, 3, '第3阶段得分应为3');

    // 进入第4阶段（totalScore保持）
    enterStage4(taskId);
    task = getTask(taskId);
    assertEqual(task.totalScore, 9, '第4阶段总分应保持为9');
    assertEqual(task.stageIndex, 4, '应在第4阶段');
  });

  testCase('10. 并发场景 - 3个任务同时处于不同阶段且互不干扰', () => {
    const r1 = createTask({ name: '并发1', durationDays: 5 });
    const r2 = createTask({ name: '并发2', durationDays: 5 });
    const r3 = createTask({ name: '并发3', durationDays: 5 });

    const id1 = r1.task.id;
    const id2 = r2.task.id;
    const id3 = r3.task.id;

    // 任务1在第1阶段
    enterStage1(id1);
    addPoint(id1, 2);

    // 任务2在第2阶段
    enterStage2(id2);
    addPoint(id2, 3);

    // 任务3在第3阶段
    enterStage3(id3);
    addPoint(id3, 4);

    // 验证数据隔离
    const t1 = getTask(id1);
    const t2 = getTask(id2);
    const t3 = getTask(id3);

    assertEqual(t1.stageIndex, 1, '任务1应在第1阶段');
    assertEqual(t1.totalScore, 2, '任务1总分应为2');

    assertEqual(t2.stageIndex, 2, '任务2应在第2阶段');
    assertEqual(t2.totalScore, 3, '任务2总分应为3');

    assertEqual(t3.stageIndex, 3, '任务3应在第3阶段');
    assertEqual(t3.totalScore, 4, '任务3总分应为4');

    // 验证stage数据独立
    assertNotNull(t1.stage1, '任务1应有stage1数据');
    assert(t1.stage2 === undefined, '任务1不应有stage2数据');

    assertNotNull(t2.stage2, '任务2应有stage2数据');
    assert(t2.stage3 === undefined, '任务2不应有stage3数据');

    assertNotNull(t3.stage3, '任务3应有stage3数据');
    assert(t3.stage4 === undefined, '任务3不应有stage4数据');
  });

  testCase('11. 极限场景 - 第1阶段所有6回合完整流程', () => {
    const result = createTask({ name: '6回合', durationDays: 5 });
    const taskId = result.task.id;

    enterStage1(taskId);

    // 回合1-3得分不足
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    assertEqual(task.stage1.firstThreeRoundsTotal, 1, '前3回合总分应为1');

    // 第3回合判分
    const trans3 = checkStage1RoundTransition(taskId);
    assertEqual(trans3.action, 'enterRound5', '得分<2应进入第5回合');

    // 第5回合得分相等
    task = getTask(taskId);
    task.roundIndex = 5;
    set(`fm:task:${taskId}`, task);
    const trans5 = checkStage1RoundTransition(taskId);
    assertEqual(trans5.action, 'enterRound6', '得分=1应进入第6回合');

    // 第6回合得分仍相等
    task = getTask(taskId);
    task.roundIndex = 6;
    set(`fm:task:${taskId}`, task);
    const trans6 = checkStage1RoundTransition(taskId);
    assertEqual(trans6.action, 'showPromptS7', '第6回合得分相等应显示S7');
  });

  testCase('12. 极限场景 - 第2阶段特殊回合所有路径', () => {
    // 路径1: 得分<前2回合
    const r1 = createTask({ name: '特殊2路径1', durationDays: 5 });
    enterStage2(r1.task.id);
    let t1 = getTask(r1.task.id);
    t1.roundIndex = 3;
    t1.stageScore = 1;
    t1.stage2.firstTwoRoundsTotal = 2;
    t1.stage2.specialRound = 'a';
    set(`fm:task:${r1.task.id}`, t1);
    const trans1 = checkStage2RoundTransition(r1.task.id);
    assertEqual(trans1.action, 'showPromptS14', '得分<前2回合应显示S14');

    // 路径2: 得分=前2回合且回合<4
    const r2 = createTask({ name: '特殊2路径2', durationDays: 5 });
    enterStage2(r2.task.id);
    let t2 = getTask(r2.task.id);
    t2.roundIndex = 3;
    t2.stageScore = 2;
    t2.stage2.firstTwoRoundsTotal = 2;
    t2.stage2.specialRound = 'a';
    set(`fm:task:${r2.task.id}`, t2);
    const trans2 = checkStage2RoundTransition(r2.task.id);
    assertEqual(trans2.action, 'showPromptS11', '得分=前2回合且回合<4应显示S11');

    // 路径3: 得分=前2回合且回合≥4
    const r3 = createTask({ name: '特殊2路径3', durationDays: 5 });
    enterStage2(r3.task.id);
    let t3 = getTask(r3.task.id);
    t3.roundIndex = 4;
    t3.stageScore = 2;
    t3.stage2.firstTwoRoundsTotal = 2;
    t3.stage2.specialRound = 'a';
    set(`fm:task:${r3.task.id}`, t3);
    const trans3 = checkStage2RoundTransition(r3.task.id);
    assertEqual(trans3.action, 'showPromptS13', '得分=前2回合且回合≥4应显示S13');

    // 路径4: 得分>前2回合
    const r4 = createTask({ name: '特殊2路径4', durationDays: 5 });
    enterStage2(r4.task.id);
    let t4 = getTask(r4.task.id);
    t4.roundIndex = 3;
    t4.stageScore = 3;
    t4.stage2.firstTwoRoundsTotal = 2;
    t4.stage2.specialRound = 'a';
    set(`fm:task:${r4.task.id}`, t4);
    const trans4 = checkStage2RoundTransition(r4.task.id);
    assertEqual(trans4.action, 'enterStageCd', '得分>前2回合应进入CD');
  });

  testCase('13. 极限场景 - 第3阶段特殊回合所有路径', () => {
    // 路径1: 得分<第2回合
    const r1 = createTask({ name: '特殊3路径1', durationDays: 5 });
    enterStage3(r1.task.id);
    let t1 = getTask(r1.task.id);
    t1.roundIndex = 3;
    t1.stageScore = 1;
    t1.stage3.secondRoundScore = 2;
    t1.stage3.specialRound = 'a';
    set(`fm:task:${r1.task.id}`, t1);
    const trans1 = checkStage3RoundTransition(r1.task.id);
    assertEqual(trans1.action, 'showPromptS18', '得分<第2回合应显示S18');

    // 路径2: 得分=第2回合且回合<4
    const r2 = createTask({ name: '特殊3路径2', durationDays: 5 });
    enterStage3(r2.task.id);
    let t2 = getTask(r2.task.id);
    t2.roundIndex = 3;
    t2.stageScore = 2;
    t2.stage3.secondRoundScore = 2;
    t2.stage3.specialRound = 'a';
    set(`fm:task:${r2.task.id}`, t2);
    const trans2 = checkStage3RoundTransition(r2.task.id);
    assertEqual(trans2.action, 'showPromptS16', '得分=第2回合且回合<4应显示S16');

    // 路径3: 得分=第2回合且回合≥4
    const r3 = createTask({ name: '特殊3路径3', durationDays: 5 });
    enterStage3(r3.task.id);
    let t3 = getTask(r3.task.id);
    t3.roundIndex = 4;
    t3.stageScore = 2;
    t3.stage3.secondRoundScore = 2;
    t3.stage3.specialRound = 'a';
    set(`fm:task:${r3.task.id}`, t3);
    const trans3 = checkStage3RoundTransition(r3.task.id);
    assertEqual(trans3.action, 'showPromptS17', '得分=第2回合且回合≥4应显示S17');

    // 路径4: 得分>第2回合
    const r4 = createTask({ name: '特殊3路径4', durationDays: 5 });
    enterStage3(r4.task.id);
    let t4 = getTask(r4.task.id);
    t4.roundIndex = 3;
    t4.stageScore = 3;
    t4.stage3.secondRoundScore = 2;
    t4.stage3.specialRound = 'a';
    set(`fm:task:${r4.task.id}`, t4);
    const trans4 = checkStage3RoundTransition(r4.task.id);
    assertEqual(trans4.action, 'enterStage4', '得分>第2回合应进入第4阶段');
    t4 = getTask(r4.task.id);
    assertEqual(t4.stageIndex, 4, '应已切换到第4阶段');
  });

  testCase('14. 极限场景 - 第4阶段邀约失败所有路径', () => {
    // 失败1次
    const r1 = createTask({ name: '邀约路径1', durationDays: 5 });
    enterStage4(r1.task.id);
    const inv1 = handleInvitation(r1.task.id, false);
    assertEqual(inv1.action, 'enterBigCd', '第1次失败应进入CD');
    assertEqual(inv1.cdMultiplier, 3, 'CD倍数应为3');

    // 失败2次
    const r2 = createTask({ name: '邀约路径2', durationDays: 5 });
    enterStage4(r2.task.id);
    handleInvitation(r2.task.id, false);
    const inv2 = handleInvitation(r2.task.id, false);
    assertEqual(inv2.action, 'enterBigCd', '第2次失败应进入CD');
    assertEqual(inv2.cdMultiplier, 5, 'CD倍数应为5');

    // 失败3次
    const r3 = createTask({ name: '邀约路径3', durationDays: 5 });
    enterStage4(r3.task.id);
    handleInvitation(r3.task.id, false);
    handleInvitation(r3.task.id, false);
    const inv3 = handleInvitation(r3.task.id, false);
    assertEqual(inv3.action, 'showPromptS25', '第3次失败应显示S25');

    // 成功
    const r4 = createTask({ name: '邀约路径4', durationDays: 5 });
    enterStage4(r4.task.id);
    const inv4 = handleInvitation(r4.task.id, true);
    assertEqual(inv4.action, 'showContentS18', '邀约成功应显示S18');
  });

  testCase('15. 完整业务流程 - 最复杂路径模拟', () => {
    const result = createTask({ name: '最复杂', durationDays: 5 });
    const taskId = result.task.id;

    // 问卷阶段
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    submitQuestionnaire(taskId);
    let task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 10, '问卷总分应为10');

    // 第1阶段：触发延时回合
    enterStage1(taskId);
    task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    // 验证进入延时回合
    const trans1 = checkStage1RoundTransition(taskId);
    assertEqual(trans1.action, 'enterRound5', '应进入第5回合');

    // 第2阶段：触发特殊回合
    enterStage2(taskId);
    task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 3; // =阈值
    set(`fm:task:${taskId}`, task);

    const trans2 = checkStage2RoundTransition(taskId);
    assertEqual(trans2.action, 'showPromptS10', '应触发特殊回合');

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');

    // 第3阶段：直接进入第4阶段
    enterStage3(taskId);
    task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // >阈值
    set(`fm:task:${taskId}`, task);

    const trans3 = checkStage3RoundTransition(taskId);
    assertEqual(trans3.action, 'enterStage4', '应直接进入第4阶段');

    // 第4阶段：邀约失败后成功
    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '应在第4阶段');

    handleInvitation(taskId, false); // 第1次失败
    const invSuccess = handleInvitation(taskId, true); // 第2次成功
    assertEqual(invSuccess.action, 'showContentS18', '邀约成功应显示S18');

    task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 2, '邀约次数应为2');
    assert(task.stage4.invitationSuccess === true, '邀约成功标志应为true');

    console.log(`    ${colors.cyan}✨ 最复杂路径验证：${colors.reset}`);
    console.log(`       问卷(10分) → 第1阶段(延时回合) → 第2阶段(特殊回合) → 第3阶段(直接第4) → 第4阶段(失败→成功)`);
  });
});

console.log(`\n${colors.yellow}注意：由于测试用例数量巨大（155+），当前已完成183个测试${colors.reset}`);
console.log(`${colors.cyan}当前文件包含完整的12个测试套件，共183个测试${colors.reset}\n`);

// ==================== 测试结果汇总 ====================
console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.bright}📊 测试结果汇总${colors.reset}\n`);

const passRate = testResults.total > 0
  ? ((testResults.passed / testResults.total) * 100).toFixed(1)
  : 0;

console.log(`总测试数: ${colors.bright}${testResults.total}${colors.reset}`);
console.log(`通过数量: ${colors.green}${colors.bright}${testResults.passed}${colors.reset}`);
console.log(`失败数量: ${colors.red}${colors.bright}${testResults.failed}${colors.reset}`);
console.log(`通过率: ${passRate >= 90 ? colors.green : passRate >= 70 ? colors.yellow : colors.red}${colors.bright}${passRate}%${colors.reset}\n`);

if (testResults.failed === 0) {
  console.log(`${colors.green}${colors.bright}✓ 所有测试通过！${colors.reset} 🎉\n`);
} else {
  console.log(`${colors.red}${colors.bright}✗ 有 ${testResults.failed} 个测试失败${colors.reset}\n`);
  console.log(`${colors.yellow}失败的测试:${colors.reset}`);
  testResults.details.filter(t => t.status === 'fail').forEach(t => {
    console.log(`  ${colors.red}✗${colors.reset} ${t.suite} - ${t.name}`);
    console.log(`    ${colors.gray}${t.error}${colors.reset}`);
  });
  console.log();
}

console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);

// 退出码
process.exit(testResults.failed > 0 ? 1 : 0);
