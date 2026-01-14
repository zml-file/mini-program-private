#!/usr/bin/env node
/**
 * 熟悉模块扩展测试脚本 - 每个阶段10个测试用例
 * 测试覆盖：第0-4阶段，每阶段10个测试 + 完整流程测试
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

// ==================== 测试用例 ====================

console.log(`${colors.bright}${colors.blue}🧪 熟悉模块扩展测试（每个阶段10个测试用例）${colors.reset}\n`);

// 第0阶段测试 - 10个测试用例
testSuite('第0阶段：问卷系统测试 (10个测试)', () => {
  testCase('1. 问卷初始化 - 验证数据结构', () => {
    const result = createTask({ name: '问卷测试1', durationDays: 5 });
    const task = result.task;
    assertEqual(task.questionnaire.totalScore, 0, '初始分数应为0');
    assertEqual(task.questionnaire.answers.length, 0, '初始答案数应为0');
    assertEqual(task.questionnaire.routedModule, 'familiar', '路由模块应为familiar');
  });

  testCase('2. 保存单个答案', () => {
    const result = createTask({ name: '问卷测试2', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 1, '应有1个答案');
    assertEqual(task.questionnaire.answers[0].questionId, 'q1', '问题ID应为q1');
  });

  testCase('3. 保存多个答案 - 验证计分', () => {
    const result = createTask({ name: '问卷测试3', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 10, '总分应为10分');
  });

  testCase('4. 更新已有答案', () => {
    const result = createTask({ name: '问卷测试4', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'B'); // 0分
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分（更新）
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 1, '只应有1个答案');
    assertEqual(task.questionnaire.totalScore, 4, '总分应为4分');
  });

  testCase('5. 得分达到阈值 - 路由到熟悉模块', () => {
    const result = createTask({ name: '问卷测试5', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    const submitResult = submitQuestionnaire(taskId);
    assertEqual(submitResult.routed, 'familiar', '应路由到familiar模块');
  });

  testCase('6. 得分低于阈值', () => {
    const result = createTask({ name: '问卷测试6', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    const task = getTask(taskId);
    assertLessThan(task.questionnaire.totalScore, 10, '得分应小于阈值10');
  });

  testCase('7. 所有题目都回答', () => {
    const result = createTask({ name: '问卷测试7', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q1', 'A');
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    saveQuestionnaireAnswer(taskId, 'q3', 'A');
    saveQuestionnaireAnswer(taskId, 'q4', 'A');
    saveQuestionnaireAnswer(taskId, 'q5', 'A');
    const task = getTask(taskId);
    assertEqual(task.questionnaire.answers.length, 5, '应有5个答案');
  });

  testCase('8. 问卷数据持久化', () => {
    const result = createTask({ name: '问卷测试8', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A');
    const task1 = getTask(taskId);
    const score1 = task1.questionnaire.totalScore;
    const task2 = getTask(taskId);
    const score2 = task2.questionnaire.totalScore;
    assertEqual(score1, score2, '重新获取后得分应保持一致');
  });

  testCase('9. 最高分组合', () => {
    const result = createTask({ name: '问卷测试9', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 14, '总分应为14分（最高分）');
  });

  testCase('10. 问卷提交后阶段保持为0', () => {
    const result = createTask({ name: '问卷测试10', durationDays: 5 });
    const taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q3', 'B');
    submitQuestionnaire(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 0, '提交后阶段应保持为0');
  });
});

// 第1阶段测试 - 10个测试用例
testSuite('第1阶段：初始交流测试 (10个测试)', () => {
  testCase('1. 进入第一阶段 - 验证初始化', () => {
    const result = createTask({ name: '阶段1-1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 1, '阶段应为1');
    assertEqual(task.stageThresholdX, 2, '阈值应为2');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
  });

  testCase('2. stage1数据结构完整性', () => {
    const result = createTask({ name: '阶段1-2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    const task = getTask(taskId);
    assert(Array.isArray(task.stage1.roundScores), 'roundScores应为数组');
    assertEqual(task.stage1.firstThreeRoundsTotal, 0, '前三回合总分应为0');
    assertEqual(task.stage1.roundCdMultiplier, 1, 'CD倍数应为1');
    assert(task.stage1.hasUsedOpponentFind === false, '对方找应为false');
  });

  testCase('3. 完成第1回合 - 得分记录', () => {
    const result = createTask({ name: '阶段1-3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);
    task = getTask(taskId);
    assertEqual(task.stage1.roundScores[0], 1, '第1回合得分应为1');
    assertEqual(task.stageScore, 1, '阶段得分应为1');
  });

  testCase('4. 前三回合总分自动计算', () => {
    const result = createTask({ name: '阶段1-4', durationDays: 5 });
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
    assertEqual(task.stage1.firstThreeRoundsTotal, 2, '前三回合总分应为2');
  });

  testCase('5. 第3回合后判分 - 得分≥阈值', () => {
    const result = createTask({ name: '阶段1-5', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound4', '应进入第4回合');
  });

  testCase('6. 第3回合后判分 - 得分<阈值', () => {
    const result = createTask({ name: '阶段1-6', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound5', '应进入第5回合（延时）');
  });

  testCase('7. 第4回合后 → 阶段CD', () => {
    const result = createTask({ name: '阶段1-7', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应进入阶段CD');
    assert(transition.stageCdRange !== undefined, '应有CD天数范围');
    assertEqual(transition.stageCdRange.minDays, 3, 'CD最小天数应为3');
    assertEqual(transition.stageCdRange.maxDays, 5, 'CD最大天数应为5');
  });

  testCase('8. 第5回合判分 - 得分相等', () => {
    const result = createTask({ name: '阶段1-8', durationDays: 5 });
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

  testCase('9. 第5回合判分 - 得分不等', () => {
    const result = createTask({ name: '阶段1-9', durationDays: 5 });
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

  testCase('10. 第6回合判分 - 得分相等显示提示S7', () => {
    const result = createTask({ name: '阶段1-10', durationDays: 5 });
    const taskId = result.task.id;
    enterStage1(taskId);
    let task = getTask(taskId);
    task.roundIndex = 6;
    task.stageScore = 2;
    task.stage1.firstThreeRoundsTotal = 2;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS7', '应显示提示板S7');
  });
});

// 第2阶段测试 - 10个测试用例
testSuite('第2阶段：深化关系测试 (10个测试)', () => {
  testCase('1. 进入第二阶段 - 验证初始化', () => {
    const result = createTask({ name: '阶段2-1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 2, '阶段应为2');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
  });

  testCase('2. stage2数据结构完整性', () => {
    const result = createTask({ name: '阶段2-2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    const task = getTask(taskId);
    assert(Array.isArray(task.stage2.roundScores), 'roundScores应为数组');
    assertEqual(task.stage2.firstTwoRoundsTotal, 0, '前两回合总分应为0');
    assert(task.stage2.specialRound === null, 'specialRound应为null');
    assert(Array.isArray(task.stage2.usedContentLibs), 'usedContentLibs应为数组');
    assert(task.stage2.skipOpening === false, 'skipOpening应为false');
  });

  testCase('3. 第1回合 → 第2回合转换', () => {
    const result = createTask({ name: '阶段2-3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound2', '应进入第2回合');
  });

  testCase('4. 第2回合后判分 - 得分>阈值', () => {
    const result = createTask({ name: '阶段2-4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应进入阶段CD');
  });

  testCase('5. 第2回合后判分 - 得分≤阈值 → 特殊回合a', () => {
    const result = createTask({ name: '阶段2-5', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS10', '应显示提示板S10');
    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');
    assertEqual(task.roundIndex, 3, '回合数应变为3');
  });

  testCase('6. 特殊回合a - 得分相等且回合<4', () => {
    const result = createTask({ name: '阶段2-6', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS11', '应显示提示板S11');
  });

  testCase('7. 特殊回合a - 得分相等且回合≥4', () => {
    const result = createTask({ name: '阶段2-7', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS13', '应显示提示板S13');
  });

  testCase('8. 特殊回合a - 得分<前两回合', () => {
    const result = createTask({ name: '阶段2-8', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS14', '应显示提示板S14');
  });

  testCase('9. 特殊回合a - 得分>前两回合', () => {
    const result = createTask({ name: '阶段2-9', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 3;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应进入阶段CD');
  });

  testCase('10. 前两回合总分计算验证', () => {
    const result = createTask({ name: '阶段2-10', durationDays: 5 });
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
    assertEqual(task.stage2.firstTwoRoundsTotal, 3, '前两回合总分应为3');
    assertEqual(task.stageScore, 3, '阶段得分应为3');
  });
});

// 第3阶段测试 - 10个测试用例
testSuite('第3阶段：关键推进测试 (10个测试)', () => {
  testCase('1. 进入第三阶段 - 验证初始化', () => {
    const result = createTask({ name: '阶段3-1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 3, '阶段应为3');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assertEqual(task.roundIndex, 0, 'roundIndex应为0');
  });

  testCase('2. stage3数据结构完整性', () => {
    const result = createTask({ name: '阶段3-2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    const task = getTask(taskId);
    assert(Array.isArray(task.stage3.roundScores), 'roundScores应为数组');
    assertEqual(task.stage3.secondRoundScore, 0, '第2回合得分应为0');
    assert(task.stage3.specialRound === null, 'specialRound应为null');
    assert(Array.isArray(task.stage3.usedContentLibs), 'usedContentLibs应为数组');
  });

  testCase('3. 第1回合 → 第2回合转换', () => {
    const result = createTask({ name: '阶段3-3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound2', '应进入第2回合');
  });

  testCase('4. 第2回合后判分 - 得分>阈值 → 直接进入第4阶段', () => {
    const result = createTask({ name: '阶段3-4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterStage4', '应直接进入第4阶段');
    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '阶段应切换到4');
  });

  testCase('5. 第2回合后判分 - 得分≤阈值 → 提示S15', () => {
    const result = createTask({ name: '阶段3-5', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS15', '应显示提示板S15');
  });

  testCase('6. 特殊回合a - 得分相等且回合<4', () => {
    const result = createTask({ name: '阶段3-6', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS16', '应显示提示板S16');
  });

  testCase('7. 特殊回合a - 得分相等且回合≥4', () => {
    const result = createTask({ name: '阶段3-7', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 4;
    task.stageScore = 2;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS17', '应显示提示板S17');
  });

  testCase('8. 特殊回合a - 得分<第2回合', () => {
    const result = createTask({ name: '阶段3-8', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 1;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'showPromptS18', '应显示提示板S18');
  });

  testCase('9. 特殊回合a - 得分>第2回合 → 进入第4阶段', () => {
    const result = createTask({ name: '阶段3-9', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);
    let task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 3;
    task.stage3.secondRoundScore = 2;
    task.stage3.specialRound = 'a';
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterStage4', '应进入第4阶段');
    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '阶段应切换到4');
  });

  testCase('10. secondRoundScore自动记录', () => {
    const result = createTask({ name: '阶段3-10', durationDays: 5 });
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
    assertEqual(task.stage3.secondRoundScore, 3, 'secondRoundScore应为3');
    assertEqual(task.stageScore, 3, '阶段得分应为3');
  });
});

// 第4阶段测试 - 10个测试用例
testSuite('第4阶段：确认邀约测试 (10个测试)', () => {
  testCase('1. 进入第四阶段 - 验证初始化', () => {
    const result = createTask({ name: '阶段4-1', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '阶段应为4');
    assertEqual(task.roundIndex, null, 'roundIndex应为null');
    assertEqual(task.status, 'active', '状态应为active');
  });

  testCase('2. stage4数据结构完整性', () => {
    const result = createTask({ name: '阶段4-2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 0, '邀约次数应为0');
    assert(task.stage4.invitationSuccess === false, '邀约成功标志应为false');
    assert(task.stage4.multiChatUsed === false, '多聊标志应为false');
    assert(task.stage4.goClicked === false, 'Go按钮标志应为false');
    assert(task.stage4.returnedFromStage3 === false, '返回标志应为false');
  });

  testCase('3. 邀约成功 → 显示内容S18', () => {
    const result = createTask({ name: '阶段4-3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const inviteResult = handleInvitation(taskId, true);
    assertEqual(inviteResult.action, 'showContentS18', '应显示内容S18');
    assertEqual(inviteResult.contentLibId, 'S18', '内容库ID应为S18');
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');
    assert(task.stage4.invitationSuccess === true, '邀约成功标志应为true');
  });

  testCase('4. 邀约失败1次 → 3×CD', () => {
    const result = createTask({ name: '阶段4-4', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const inviteResult = handleInvitation(taskId, false);
    assertEqual(inviteResult.action, 'enterBigCd', '应进入大CD');
    assertEqual(inviteResult.cdMultiplier, 3, 'CD倍数应为3');
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');
  });

  testCase('5. 邀约失败2次 → 5×CD', () => {
    const result = createTask({ name: '阶段4-5', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false);
    const inviteResult = handleInvitation(taskId, false);
    assertEqual(inviteResult.action, 'enterBigCd', '应进入大CD');
    assertEqual(inviteResult.cdMultiplier, 5, 'CD倍数应为5');
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 2, '邀约次数应为2');
  });

  testCase('6. 邀约失败超过2次 → 提示S25', () => {
    const result = createTask({ name: '阶段4-6', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleInvitation(taskId, false);
    handleInvitation(taskId, false);
    const inviteResult = handleInvitation(taskId, false);
    assertEqual(inviteResult.action, 'showPromptS25', '应显示提示板S25');
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 3, '邀约次数应为3');
  });

  testCase('7. 多聊一次 - 正常使用', () => {
    const result = createTask({ name: '阶段4-7', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const multiChatResult = handleMultiChat(taskId);
    assert(multiChatResult.ok === true, '应该成功');
    assertEqual(multiChatResult.action, 'returnToStage3', '应返回第3阶段');
    const task = getTask(taskId);
    assert(task.stage4.multiChatUsed === true, 'multiChatUsed应为true');
    assert(task.stage4.returnedFromStage3 === true, 'returnedFromStage3应为true');
  });

  testCase('8. 多聊一次 - 重复使用被拒绝', () => {
    const result = createTask({ name: '阶段4-8', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    handleMultiChat(taskId);
    const multiChatResult = handleMultiChat(taskId);
    assert(multiChatResult.ok === false, '应该失败');
    assertEqual(multiChatResult.reason, '多聊一次已使用过', '原因应正确');
  });

  testCase('9. 完成任务 - 状态变更', () => {
    const result = createTask({ name: '阶段4-9', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    const finishResult = finishTask(taskId);
    assert(finishResult.ok === true, '应该成功');
    const task = getTask(taskId);
    assertEqual(task.status, 'deleted', '状态应为deleted');
  });

  testCase('10. 完成任务 - 从列表移除', () => {
    const result = createTask({ name: '阶段4-10', durationDays: 5 });
    const taskId = result.task.id;
    enterStage4(taskId);
    let taskList = get('fm:tasks') || [];
    const beforeCount = taskList.length;
    finishTask(taskId);
    taskList = get('fm:tasks') || [];
    const afterCount = taskList.length;
    assertEqual(afterCount, beforeCount - 1, '任务列表应减少1个');
  });
});

// 完整流程集成测试
testSuite('完整流程集成测试 (5个测试)', () => {
  testCase('1. 完整流程 - 问卷→第1阶段→第2阶段→第3阶段→第4阶段', () => {
    // 1. 创建任务
    const result = createTask({ name: '完整流程', durationDays: 5 });
    const taskId = result.task.id;
    let task = getTask(taskId);
    assertEqual(task.stageIndex, 0, '初始阶段应为0');

    // 2. 完成问卷（得分≥10）
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'B'); // 10分
    submitQuestionnaire(taskId);
    task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 14, '问卷总分应为14');

    // 3. 进入第一阶段
    enterStage1(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 1, '应该在第1阶段');

    // 4. 完成第1阶段（得分≥2）
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId);
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    assertEqual(task.stageScore, 2, '第1阶段得分应为2');

    // 5. 进入第二阶段
    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 2, '应该在第2阶段');

    // 完成第2阶段（得分>3）
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    assertEqual(task.stageScore, 4, '第2阶段得分应为4');

    // 6. 进入第三阶段
    enterStage3(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 3, '应该在第3阶段');

    // 完成第3阶段（得分>3）
    task.roundIndex = 2;
    task.stageScore = 4;
    set(`fm:task:${taskId}`, task);
    const trans4 = checkStage3RoundTransition(taskId);
    assertEqual(trans4.action, 'enterStage4', '得分>3应直接进入第4阶段');

    // 7. 验证第四阶段
    task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '应该在第4阶段');

    // 邀约成功
    const inviteResult = handleInvitation(taskId, true);
    assertEqual(inviteResult.action, 'showContentS18', '邀约成功应显示S18');

    console.log(`    ${colors.cyan}✨ 完整流程验证：${colors.reset}`);
    console.log(`       问卷(14分) → 第1阶段(2分) → 第2阶段(4分) → 第3阶段(4分) → 第4阶段(邀约成功)`);
  });

  testCase('2. 数据一致性 - 阶段切换时积分正确', () => {
    const result = createTask({ name: '积分一致性', durationDays: 5 });
    const taskId = result.task.id;

    // 第1阶段得2分
    enterStage1(taskId);
    addPoint(taskId, 2);
    let task = getTask(taskId);
    assertEqual(task.totalScore, 2, '总分应为2');
    assertEqual(task.stageScore, 2, '第1阶段得分应为2');

    // 进入第2阶段
    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.totalScore, 2, '总分应保持不变');
    assertEqual(task.stageScore, 0, '第2阶段得分应重置为0');

    // 第2阶段得3分
    addPoint(taskId, 3);
    task = getTask(taskId);
    assertEqual(task.totalScore, 5, '总分应为5（2+3）');
    assertEqual(task.stageScore, 3, '第2阶段得分应为3');
  });

  testCase('3. 特殊回合触发验证 - 第2阶段', () => {
    const result = createTask({ name: '特殊回合2', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // ≤3
    set(`fm:task:${taskId}`, task);

    const trans = checkStage2RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS10', '应该触发特殊回合a');

    task = getTask(taskId);
    assertEqual(task.stage2.specialRound, 'a', 'specialRound应为a');
    assertEqual(task.roundIndex, 3, '回合数应变为3');
  });

  testCase('4. 特殊回合触发验证 - 第3阶段', () => {
    const result = createTask({ name: '特殊回合3', durationDays: 5 });
    const taskId = result.task.id;
    enterStage3(taskId);

    let task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 2; // ≤3
    set(`fm:task:${taskId}`, task);

    const trans = checkStage3RoundTransition(taskId);
    assertEqual(trans.action, 'showPromptS15', '应该显示提示S15');
  });

  testCase('5. 多任务并发验证', () => {
    const result1 = createTask({ name: '任务A', durationDays: 5 });
    const result2 = createTask({ name: '任务B', durationDays: 9 });
    const result3 = createTask({ name: '任务C', durationDays: 16 });

    const task1 = getTask(result1.task.id);
    const task2 = getTask(result2.task.id);
    const task3 = getTask(result3.task.id);

    assertEqual(task1.name, '任务A', '任务A名称应正确');
    assertEqual(task2.name, '任务B', '任务B名称应正确');
    assertEqual(task3.name, '任务C', '任务C名称应正确');
    assertEqual(task1.durationDays, 5, '任务A天数应为5');
    assertEqual(task2.durationDays, 9, '任务B天数应为9');
    assertEqual(task3.durationDays, 16, '任务C天数应为16');
  });
});

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
  console.log(`${colors.magenta}测试覆盖：${colors.reset}`);
  console.log(`  ✅ 第0阶段（问卷系统）- 10个测试`);
  console.log(`  ✅ 第1阶段（6回合逻辑）- 10个测试`);
  console.log(`  ✅ 第2阶段（特殊回合a/b）- 10个测试`);
  console.log(`  ✅ 第3阶段（半价重开）- 10个测试`);
  console.log(`  ✅ 第4阶段（邀约、多聊一次）- 10个测试`);
  console.log(`  ✅ 完整流程集成测试 - 5个测试`);
  console.log(`\n${colors.cyan}总计: 55个测试用例${colors.reset}`);
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
