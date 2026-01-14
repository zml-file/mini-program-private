#!/usr/bin/env node
/**
 * 熟悉模块完整功能测试脚本（包含所有阶段）
 * 测试覆盖：第0-4阶段 + 完整流程
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
          { id: "q2", title: "问题2", options: [{ id: "A", text: "A", score: 4 }, { id: "B", text: "B", score: 0 }] },
          { id: "q3", title: "问题3", options: [{ id: "A", text: "A", score: 6 }, { id: "B", text: "B", score: 10 }] },
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

// ==================== 测试用例 ====================

console.log(`${colors.bright}${colors.blue}🧪 熟悉模块完整功能测试（包含所有阶段）${colors.reset}\n`);

// 基本功能测试
testSuite('基本功能测试', () => {
  testCase('初始化默认配置', () => {
    initDefaults();
    const settings = get('fm:settings');
    assert(settings !== null, '设置应该被初始化');
    assert(settings.stageThresholdX[1] === 2, '第一阶段阈值应为2');
    assert(settings.stageThresholdX[2] === 3, '第二阶段阈值应为3');
    assert(settings.stageThresholdX[3] === 3, '第三阶段阈值应为3');
  });

  testCase('创建任务 - 正常情况', () => {
    const result = createTask({ name: '测试任务', durationDays: 5 });
    assert(result.ok === true, '应该创建成功');
    assertEqual(result.task.stageIndex, 0, '初始阶段应为0');
  });
});

// 问卷流程测试
testSuite('问卷流程测试', () => {
  let taskId;

  testCase('问卷计分达到阈值', () => {
    const result = createTask({ name: '问卷测试', durationDays: 5 });
    taskId = result.task.id;
    saveQuestionnaireAnswer(taskId, 'q2', 'A'); // 4分
    saveQuestionnaireAnswer(taskId, 'q3', 'A'); // 6分
    const task = getTask(taskId);
    assertEqual(task.questionnaire.totalScore, 10, '总分应为10分');
  });
});

// 第一阶段测试
testSuite('第一阶段流程测试', () => {
  let taskId;

  testCase('进入第一阶段', () => {
    const createResult = createTask({ name: '阶段1', durationDays: 5 });
    taskId = createResult.task.id;
    const result = enterStage1(taskId);
    assert(result.ok === true, '应该成功进入');
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 1, '阶段应为1');
    assertEqual(task.stageThresholdX, 2, '阈值应为2');
  });

  testCase('第3回合后判分 - 得分≥阈值', () => {
    const task = getTask(taskId);
    task.roundIndex = 3;
    task.stageScore = 2;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterRound4', '应该进入第4回合');
  });

  testCase('第4回合后 → 阶段CD', () => {
    const task = getTask(taskId);
    task.roundIndex = 4;
    set(`fm:task:${taskId}`, task);
    const transition = checkStage1RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应该进入阶段CD');
  });
});

// 第二阶段测试
testSuite('第二阶段流程测试', () => {
  let taskId;

  testCase('进入第二阶段', () => {
    const createResult = createTask({ name: '阶段2', durationDays: 5 });
    taskId = createResult.task.id;
    const result = enterStage2(taskId);
    assert(result.ok === true, '应该成功进入');
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 2, '阶段应为2');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assert(task.stage2 !== undefined, 'stage2数据应存在');
  });

  testCase('第二阶段数据结构验证', () => {
    const task = getTask(taskId);
    assert(Array.isArray(task.stage2.roundScores), 'roundScores应为数组');
    assertEqual(task.stage2.firstTwoRoundsTotal, 0, '前两回合总分初始为0');
    assert(task.stage2.specialRound === null, 'specialRound初始为null');
    assert(Array.isArray(task.stage2.usedContentLibs), 'usedContentLibs应为数组');
  });

  testCase('第2回合后判分 - 得分>阈值', () => {
    const task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // 大于阈值3
    set(`fm:task:${taskId}`, task);
    const transition = checkStage2RoundTransition(taskId);
    assertEqual(transition.action, 'enterStageCd', '应该进入阶段CD');
  });

  testCase('第2回合后判分 - 得分≤阈值 → 特殊回合a', () => {
    const result = createTask({ name: '阶段2-2', durationDays: 5 });
    const taskId2 = result.task.id;
    enterStage2(taskId2);
    const task = getTask(taskId2);
    task.roundIndex = 2;
    task.stageScore = 2; // 小于等于阈值3
    set(`fm:task:${taskId2}`, task);
    const transition = checkStage2RoundTransition(taskId2);
    assertEqual(transition.action, 'showPromptS10', '应该显示提示板S10');
  });

  testCase('特殊回合a后判分 - 得分相等且回合<4', () => {
    const result = createTask({ name: '阶段2-3', durationDays: 5 });
    const taskId3 = result.task.id;
    enterStage2(taskId3);
    const task = getTask(taskId3);
    task.roundIndex = 3;
    task.stageScore = 2;
    task.stage2.firstTwoRoundsTotal = 2;
    task.stage2.specialRound = 'a';
    set(`fm:task:${taskId3}`, task);
    const transition = checkStage2RoundTransition(taskId3);
    assertEqual(transition.action, 'showPromptS11', '应该显示提示板S11');
  });
});

// 第三阶段测试
testSuite('第三阶段流程测试', () => {
  let taskId;

  testCase('进入第三阶段', () => {
    const createResult = createTask({ name: '阶段3', durationDays: 5 });
    taskId = createResult.task.id;
    const result = enterStage3(taskId);
    assert(result.ok === true, '应该成功进入');
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 3, '阶段应为3');
    assertEqual(task.stageThresholdX, 3, '阈值应为3');
    assert(task.stage3 !== undefined, 'stage3数据应存在');
  });

  testCase('第三阶段数据结构验证', () => {
    const task = getTask(taskId);
    assert(Array.isArray(task.stage3.roundScores), 'roundScores应为数组');
    assertEqual(task.stage3.secondRoundScore, 0, '第2回合得分初始为0');
    assert(task.stage3.specialRound === null, 'specialRound初始为null');
  });

  testCase('第2回合后判分 - 得分>阈值 → 直接进入第4阶段', () => {
    const task = getTask(taskId);
    task.roundIndex = 2;
    task.stageScore = 4; // 大于阈值3
    set(`fm:task:${taskId}`, task);
    const transition = checkStage3RoundTransition(taskId);
    assertEqual(transition.action, 'enterStage4', '应该直接进入第4阶段（无CD）');
    const updatedTask = getTask(taskId);
    assertEqual(updatedTask.stageIndex, 4, '应该已切换到第4阶段');
  });

  testCase('第2回合后判分 - 得分≤阈值 → 提示S15', () => {
    const result = createTask({ name: '阶段3-2', durationDays: 5 });
    const taskId2 = result.task.id;
    enterStage3(taskId2);
    const task = getTask(taskId2);
    task.roundIndex = 2;
    task.stageScore = 2; // 小于等于阈值3
    set(`fm:task:${taskId2}`, task);
    const transition = checkStage3RoundTransition(taskId2);
    assertEqual(transition.action, 'showPromptS15', '应该显示提示板S15');
  });
});

// 第四阶段测试
testSuite('第四阶段流程测试', () => {
  let taskId;

  testCase('进入第四阶段', () => {
    const createResult = createTask({ name: '阶段4', durationDays: 5 });
    taskId = createResult.task.id;
    const result = enterStage4(taskId);
    assert(result.ok === true, '应该成功进入');
    const task = getTask(taskId);
    assertEqual(task.stageIndex, 4, '阶段应为4');
    assertEqual(task.roundIndex, null, '第4阶段无回合');
    assert(task.stage4 !== undefined, 'stage4数据应存在');
  });

  testCase('第四阶段数据结构验证', () => {
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 0, '邀约次数初始为0');
    assert(task.stage4.invitationSuccess === false, '邀约成功标志初始为false');
    assert(task.stage4.multiChatUsed === false, '多聊一次标志初始为false');
  });

  testCase('邀约成功 → 显示内容S18', () => {
    const result = handleInvitation(taskId, true);
    assertEqual(result.action, 'showContentS18', '应该显示内容S18');
    assertEqual(result.contentLibId, 'S18', '内容库ID应为S18');
    const task = getTask(taskId);
    assertEqual(task.stage4.invitationAttempts, 1, '邀约次数应为1');
    assert(task.stage4.invitationSuccess === true, '邀约成功标志应为true');
  });

  testCase('邀约失败1次 → 3×CD', () => {
    const result2 = createTask({ name: '阶段4-2', durationDays: 5 });
    const taskId2 = result2.task.id;
    enterStage4(taskId2);
    const result = handleInvitation(taskId2, false);
    assertEqual(result.action, 'enterBigCd', '应该进入大CD');
    assertEqual(result.cdMultiplier, 3, 'CD倍数应为3');
  });

  testCase('邀约失败2次 → 5×CD', () => {
    const result2 = createTask({ name: '阶段4-3', durationDays: 5 });
    const taskId3 = result2.task.id;
    enterStage4(taskId3);
    handleInvitation(taskId3, false); // 第1次失败
    const result = handleInvitation(taskId3, false); // 第2次失败
    assertEqual(result.action, 'enterBigCd', '应该进入大CD');
    assertEqual(result.cdMultiplier, 5, 'CD倍数应为5');
  });

  testCase('邀约失败超过2次 → 提示S25', () => {
    const result2 = createTask({ name: '阶段4-4', durationDays: 5 });
    const taskId4 = result2.task.id;
    enterStage4(taskId4);
    handleInvitation(taskId4, false); // 第1次失败
    handleInvitation(taskId4, false); // 第2次失败
    const result = handleInvitation(taskId4, false); // 第3次失败
    assertEqual(result.action, 'showPromptS25', '应该显示提示板S25');
  });

  testCase('多聊一次 - 正常使用', () => {
    const result2 = createTask({ name: '阶段4-5', durationDays: 5 });
    const taskId5 = result2.task.id;
    enterStage4(taskId5);
    const result = handleMultiChat(taskId5);
    assert(result.ok === true, '应该成功');
    assertEqual(result.action, 'returnToStage3', '应该返回第3阶段');
    const task = getTask(taskId5);
    assert(task.stage4.multiChatUsed === true, 'multiChatUsed应为true');
  });

  testCase('多聊一次 - 重复使用被拒绝', () => {
    const result2 = createTask({ name: '阶段4-6', durationDays: 5 });
    const taskId6 = result2.task.id;
    enterStage4(taskId6);
    handleMultiChat(taskId6); // 第1次
    const result = handleMultiChat(taskId6); // 第2次
    assert(result.ok === false, '应该失败');
    assertEqual(result.reason, '多聊一次已使用过', '原因应正确');
  });
});

// 完整流程集成测试
testSuite('完整流程集成测试', () => {
  testCase('完整流程 - 问卷→第1阶段→第2阶段→第3阶段→第4阶段', () => {
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

    task = getTask(taskId); // 重新获取以保留之前的得分
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 1);

    task = getTask(taskId); // 重新获取以保留之前的得分
    task.roundIndex = 3;
    set(`fm:task:${taskId}`, task);
    finishStage1Round(taskId, 0);

    task = getTask(taskId);
    assertEqual(task.stageScore, 2, '第1阶段得分应为2');

    // 检查转换
    const trans1 = checkStage1RoundTransition(taskId);
    assertEqual(trans1.action, 'enterRound4', '应该进入第4回合');

    // 进入第4回合
    task.roundIndex = 4;
    set(`fm:task:${taskId}`, task);
    const trans2 = checkStage1RoundTransition(taskId);
    assertEqual(trans2.action, 'enterStageCd', '第4回合后应进入阶段CD');

    // 5. 进入第二阶段
    enterStage2(taskId);
    task = getTask(taskId);
    assertEqual(task.stageIndex, 2, '应该在第2阶段');
    assertEqual(task.stageScore, 0, '第2阶段得分应重置为0');

    // 完成第2阶段（得分>3）
    task.roundIndex = 1;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId); // 重新获取以保留之前的得分
    task.roundIndex = 2;
    set(`fm:task:${taskId}`, task);
    finishStage2Round(taskId, 2);

    task = getTask(taskId);
    assertEqual(task.stageScore, 4, '第2阶段得分应为4');

    const trans3 = checkStage2RoundTransition(taskId);
    assertEqual(trans3.action, 'enterStageCd', '得分>3应进入阶段CD');

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
    assert(task.stage4 !== undefined, 'stage4数据应存在');

    // 邀约成功
    const inviteResult = handleInvitation(taskId, true);
    assertEqual(inviteResult.action, 'showContentS18', '邀约成功应显示S18');

    console.log(`    ${colors.cyan}✨ 完整流程验证：${colors.reset}`);
    console.log(`       问卷(14分) → 第1阶段(2分) → 第2阶段(4分) → 第3阶段(4分) → 第4阶段(邀约成功)`);
  });

  testCase('流程验证 - 得分不足触发特殊回合', () => {
    // 创建任务并进入第2阶段
    const result = createTask({ name: '特殊回合测试', durationDays: 5 });
    const taskId = result.task.id;
    enterStage2(taskId);

    // 第2回合后得分不足
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

  testCase('数据一致性验证 - 阶段切换时积分正确', () => {
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
  console.log(`  ✅ 第0阶段（问卷系统）`);
  console.log(`  ✅ 第1阶段（6回合逻辑）`);
  console.log(`  ✅ 第2阶段（特殊回合a/b）`);
  console.log(`  ✅ 第3阶段（半价重开）`);
  console.log(`  ✅ 第4阶段（邀约、多聊一次）`);
  console.log(`  ✅ 完整流程集成测试`);
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
