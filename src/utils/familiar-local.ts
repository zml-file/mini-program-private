/**
 * Familiar Module - Local Storage Implementation (uni-app)
 * Keys: fm:settings, fm:libs, fm:tasks, fm:task:{id}, fm:stateVersion, fm:clipboard:{taskId}, fm:searchHistory:{taskId}
 * All interactions are offline and persisted in localStorage.
 */

import { getCountdownTimeMs, getCountdownDays, getCountdownHours, getCountdownMinutes } from '@/config';

type StageIndex = 0 | 1 | 2 | 3 | 4;
type DurationDays = 5 | 9 | 16;

type ChainNodeType = "text" | "Z" | "D" | "AZ" | "AD";
interface ChainNode {
  id: string;
  text: string;
  type: ChainNodeType;
  splitBy?: string; // symbol for segment separation, e.g. "@"
}
type Chain = ChainNode[];

interface QAItem {
  id: string;
  title: string;
  answerChain: Chain;
}

interface Settings {
  cd: {
    bigRoundMinMs: number; // base big round CD, can be randomized per stage
    stageMinDays: Record<string, number>; // e.g. {"1-2":3, "2-3":0, "3-4":3}
    zDurationByStage: Record<StageIndex, { minMs: number; maxMs: number }>;
    smallCopyCdMs: number;
    idleWarnMs: number;
    idleForceCdMs: number;
    opponentFindWaitMs: number;
    opponentFindCopyEnableMs: number;
  };
  vip: { levels: { level: number; qaMaxItems: number }[] };
  stageThresholdX: Record<StageIndex, number>;
}

interface Libs {
  opening: Record<string, Chain[]>;
  content: Record<string, Chain[]>;
  leaving: Record<string, Chain[]>;
  opponent: Record<string, Chain[]>;
  qa: Record<string, QAItem[]>;
  questionnaire: {
    questions: { id: string; title: string; options: { id: string; text: string; score: number }[] }[];
    thresholdX: number; // 阶段0问卷阈值
  };
}

interface UsedLibs {
  content: string[];
  opening?: string[];
  leaving?: string[];
  qa?: string[];
  opponent?: string[];
}
type UsedLibIdsByStage = Record<number, UsedLibs>;

interface CurrentLibChain {
  type: "opening" | "content" | "leaving" | "opponent" | "qa";
  libId: string;
  nodeIndex: number; // current chain node index
  segmentsCopied: number; // current node copied segment count
}

type TaskStatus = "active" | "finished" | "deleted";
type RoutedModule = "familiar" | "unfamiliar" | "stranger";

interface Task {
  id: string;
  name: string;
  createdAt: number;
  durationDays: DurationDays;
  expireAt: number;
  isRestartHalfPrice: boolean;
  status: TaskStatus;
  stageIndex: StageIndex;
  roundIndex: number | null;
  stepIndex: number | null;
  specialRound?: 'a' | 'b' | null; // 特殊回合标识（第二阶段使用）
  stageScore: number;
  totalScore: number;
  stageThresholdX: number;
  roundCdUnlockAt: number | null;
  stageCdUnlockAt: number | null;
  zUnlockAt: number | null;
  dMode: boolean;
  opponentFindUnlockAt: number | null;
  opponentFindCopyUnlockAt: number | null;
  idleWarningAt: number | null;
  hardIdleToCdAt: number | null;
  lastActionAt: number;
  usedLibIdsByStage: UsedLibIdsByStage;
  currentLibChain: CurrentLibChain | null;
  opponentFindUsedInRound: boolean;
  qaVipMaxItems: number;
  questionnaire: {
    answers: { questionId: string; optionId: string; score: number }[];
    totalScore: number;
    routedModule: RoutedModule;
  };
  prompts: Record<string, { shown: boolean; at?: number }>;
  askFlow: { ask1?: "是" | "否"; ask2?: "是" | "否"; ask3?: "是" | "否" };
  renewHistory: { days: DurationDays; cost: number; at: number; success: boolean }[];
  listBadge: "下次聊天开启倒计时" | "Z倒计时" | "D" | "对方找倒计时" | "聊天任务进行中";
  listCountdownEndAt: number | null;
  // 第一阶段新增字段
  stage1?: {
    roundScores: number[]; // 每回合得分 [round1Score, round2Score, ...]
    firstThreeRoundsTotal: number; // 前三回合总得分
    currentRoundStartTime: number | null; // 当前回合开始时间
    roundAllowedTimeMs: number; // 回合允许时间
    zTimerMs: number; // Z倒计时时间
    hasUsedOpponentFind: boolean; // 当前回合是否已使用对方找
    roundCdMultiplier: number; // 回合CD倍数 (1, 2, 3)
  };
  nextOpponentFindLibId?: string;
  // 第二阶段新增字段
  stage2?: {
    roundScores: number[];
    firstTwoRoundsTotal: number;
    specialRound: 'a' | 'b' | null;
    skipOpening: boolean;
    usedContentLibs: string[];
  };
  // 第三阶段新增字段
  stage3?: {
    roundScores: number[];
    secondRoundScore: number;
    specialRound: 'a' | 'b' | null;
    skipOpening: boolean;
    usedContentLibs: string[];
  };
  // 第四阶段新增字段
  stage4?: {
    invitationAttempts: number;
    invitationSuccess: boolean;
    multiChatUsed: boolean;
    goClicked: boolean;
    returnedFromStage3: boolean;
  };
}

interface ClipboardState {
  chainId: string;
  segmentIndex: number;
  until: number; // timestamp when small copy cd ends
}

const VERSION = 1;

// Storage helpers
const get = (k: string) => {
  try {
    return uni.getStorageSync(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: any) => {
  try {
    uni.setStorageSync(k, v);
  } catch {}
};
const remove = (k: string) => {
  try {
    uni.removeStorageSync(k);
  } catch {}
};

// Init default settings and libs
function initDefaults() {
  const ver = get("fm:stateVersion");
  if (!ver) set("fm:stateVersion", VERSION);

  if (!get("fm:settings")) {
    const settings: Settings = {
      cd: {
        bigRoundMinMs: getCountdownTimeMs(24 * 60 * 60 * 1000), // 1 day
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
        opponentFindWaitMs: getCountdownTimeMs(60 * 60 * 1000), // example
        opponentFindCopyEnableMs: getCountdownTimeMs(10 * 60 * 1000), // example
      },
      vip: { levels: [{ level: 0, qaMaxItems: 2 }, { level: 1, qaMaxItems: 3 }, { level: 2, qaMaxItems: 4 }] },
      stageThresholdX: { 0: 10, 1: 2, 2: 3, 3: 3, 4: 0 },
    };
    set("fm:settings", settings);
  }

  if (!get("fm:libs")) {
    // Minimal mock covering S1~S5, S4.5, S6~S11, S12~S16, S17~S18; leaving S1~S5; opponent S2~S4; QA S1~S3; questionnaire 5 questions
    const mkText = (id: string, text: string, splitBy?: string): ChainNode => ({ id, text, type: "text", splitBy });
    const mkZ = (id: string, text: string): ChainNode => ({ id, text, type: "Z" });
    const mkD = (id: string, text: string): ChainNode => ({ id, text, type: "D" });

    const libs: Libs = {
      opening: {
        S1: [[
          mkText("o1-1", "您好，我是XXX@很高兴能与您交流@今天想和您分享一些信息", "@"),
          mkZ("o1-2", "等待对方回复中，请稍候...")
        ]],
        S2: [[
          mkText("o2-1", "上次和您聊得不错@今天继续沟通一些事情@希望不会打扰到您", "@"),
          mkZ("o2-2", "等待对方确认，请耐心等待...")
        ]],
        S3_5: [[
          mkText("o3.5-1", "距离上次交流有一段时间了@想再次确认您的想法@看看有什么新的进展", "@"),
          mkZ("o3.5-2", "等待回应中...")
        ]],
      },
      content: {
        S1: [[
          mkText("c1-1", "关于我们之前提到的话题@我这边有一些新的想法@想听听您的意见如何AZ", "@"),
          mkZ("c1-2", "思考时间，等待对方反馈..."),
          mkText("c1-3", "如果您方便的话@我们可以深入探讨一下@看看能否找到更好的方案", "@")
        ]],
        S2: [[
          mkText("c2-1", "今天想和您推进一下我们的计划@目前进展还不错@下一步我建议这样做AZ", "@"),
          mkZ("c2-2", "等待确认中..."),
          mkText("c2-3", "您觉得这个方案可行吗@有什么需要调整的地方随时告诉我", "@")
        ]],
        S3: [[
          mkText("c3-1", "我们的合作进入了关键阶段@需要进一步强化执行@具体来说有以下几点AZ", "@"),
          mkZ("c3-2", "整理思路中，请稍候..."),
          mkText("c3-3", "第一步先做基础准备@第二步落实具体细节@第三步跟进反馈", "@")
        ]],
        S4: [[
          mkText("c4-1", "现在到了冲刺阶段@我们需要总结前期成果@同时规划下一步动作AZ", "@"),
          mkZ("c4-2", "汇总信息中..."),
          mkText("c4-3", "整体看下来效果不错@建议我们继续保持这个节奏@最后再完善一些细节", "@")
        ]],
        "S4.5": [[
          mkText("c4.5-1", "补充一些额外的信息@这些内容可能对您有帮助@请您参考一下AZ", "@"),
          mkZ("c4.5-2", "准备补充材料..."),
          mkText("c4.5-3", "以上就是我想补充的内容@如有疑问随时沟通", "@")
        ]],
        S5: [[
          mkText("c5-1", "虽然有些延迟@但我们还是要继续推进@让我们再尝试一次AZ", "@"),
          mkZ("c5-2", "重新梳理方案..."),
          mkText("c5-3", "调整后的计划更加可行@相信这次能有更好的结果", "@")
        ]],
        S6: [[
          mkText("c6-1", "进入第二阶段后@我们的重点有所调整@主要关注以下方面AZ", "@"),
          mkZ("c6-2", "分析新阶段任务..."),
          mkText("c6-3", "新阶段需要更细致的操作@请您配合好每个环节", "@")
        ]],
        S7: [[
          mkText("c7-1", "第二阶段进展顺利@我们继续按计划执行@目前没有太大偏差AZ", "@"),
          mkZ("c7-2", "核对进度中..."),
          mkText("c7-3", "保持现在的节奏@预计能按期完成目标", "@")
        ]],
        S8: [[
          mkText("c8-1", "第二阶段中期@需要做一次全面检查@确保质量达标AZ", "@"),
          mkZ("c8-2", "质量检查中..."),
          mkText("c8-3", "检查结果显示@整体符合预期@个别细节需要微调", "@")
        ]],
        S9: [[
          mkText("c9-1", "第二阶段后半程@开始准备收尾工作@同时为下一阶段做铺垫AZ", "@"),
          mkZ("c9-2", "准备衔接工作..."),
          mkText("c9-3", "收尾和铺垫同步进行@确保平稳过渡", "@")
        ]],
        S10: [[
          mkText("c10-1", "第二阶段接近尾声@总结一下经验教训@为第三阶段做好准备AZ", "@"),
          mkZ("c10-2", "总结经验中..."),
          mkText("c10-3", "经验总结完成@下一阶段会更加顺畅", "@")
        ]],
        S11: [[
          mkText("c11-1", "第二阶段最后冲刺@完善所有细节@确保万无一失AZ", "@"),
          mkZ("c11-2", "最后检查中..."),
          mkText("c11-3", "所有准备就绪@可以进入下一阶段了", "@")
        ]],
        "S2.5": [[
          mkText("c2.5-1", "这是一个特殊回合@需要您加油坚持@我们一起克服困难AZ", "@"),
          mkZ("c2.5-2", "鼓励支持中..."),
          mkText("c2.5-3", "相信您能做到@继续保持信心@我会一直支持您", "@")
        ]],
        S12: [[
          mkText("c12-1", "第三阶段开始@难度会有所提升@但相信您已经做好准备AZ", "@"),
          mkZ("c12-2", "评估新阶段任务..."),
          mkText("c12-3", "新阶段的挑战更大@但收获也会更多", "@")
        ]],
        S13: [[
          mkText("c13-1", "第三阶段持续推进@保持专注和耐心@一步一个脚印前进AZ", "@"),
          mkZ("c13-2", "稳步推进中..."),
          mkText("c13-3", "进度符合预期@继续保持当前状态", "@")
        ]],
        S14: [[
          mkText("c14-1", "第三阶段中期@需要加强执行力度@确保不偏离轨道AZ", "@"),
          mkZ("c14-2", "强化执行中..."),
          mkText("c14-3", "执行力度到位@效果开始显现", "@")
        ]],
        S15: [[
          mkText("c15-1", "第三阶段后期@开始看到成果@但不能掉以轻心AZ", "@"),
          mkZ("c15-2", "巩固成果中..."),
          mkText("c15-3", "成果需要巩固@继续保持警惕", "@")
        ]],
        S16: [[
          mkText("c16-1", "第三阶段收尾@准备最后的冲刺@向终点发起挑战AZ", "@"),
          mkZ("c16-2", "最后冲刺准备中..."),
          mkText("c16-3", "一切准备就绪@向最终目标前进", "@")
        ]],
        S17: [[
          mkText("c17-1", "现在可以马上邀约了@我建议用以下话术@成功率会更高AZ", "@"),
          mkZ("c17-2", "准备邀约话术..."),
          mkText("c17-3", "建议这样说：我们找个时间见面详聊吧@您看这周末方便吗@我们可以约个轻松的地方", "@")
        ]],
        S18: [[
          mkText("c18-1", "邀约成功了，恭喜！@接下来需要安排好见面细节@以下是一些建议AZ", "@"),
          mkZ("c18-2", "安排见面细节..."),
          mkText("c18-3", "地点选择很重要@时间安排要合理@见面前做好充分准备", "@"),
          mkD("c18-d", "D模式：您可以选择进入深度指导模式，获取更详细的见面指南")
        ]],
      },
      leaving: {
        S1: [[
          mkText("l1-1", "打扰了，今天就聊到这里@后续有什么想了解的随时联系我@祝您一切顺利", "@")
        ]],
        S2: [[
          mkText("l2-1", "（耽误您时间了，感谢您的耐心@后续有新信息我会及时告知您///打扰您了，今天的交流很愉快@期待下次继续沟通）", "@"),
          mkText("l2-2", "（那先不打扰您了，有任何问题随时联系我///我这边会准备一份详细资料，稍后发送给您@有疑问随时沟通++///您可以考虑考虑，有想法随时告诉我）", "@"),
          mkText("l2-3", "（那就先这样，有兴趣再联系我///那不打扰了，有需要随时找我）", "@")
        ]],
        S3: [[
          mkText("l3-1", "特殊回合结束了@那先不打扰您了@后续有问题随时联系我", "@")
        ]],
        "S3.5": [[
          mkText("l3.5-1", "本轮特殊任务完成@总结一下今天的进展@接下来进入休息期", "@")
        ]],
        S4: [[
          mkText("l4-1", "第二阶段本回合结束@总结一下收获@休息调整后继续", "@")
        ]],
        S5: [[
          mkText("l5-1", "第三阶段本回合完成@整体效果不错@下次继续努力", "@")
        ]],
      },
      opponent: {
        S2: [[
          mkText("op2-1", "对方主动联系了@可以这样回复：很高兴收到您的消息", "@"),
          mkText("op2-2", "我一直在等您的反馈@现在我们可以继续之前的话题", "@"),
          mkText("op2-3", "关于您提到的问题@我这边已经准备好解决方案", "@"),
          mkText("op2-4", "期待我们能够达成一致@共同推进这件事", "@")
        ]],
        S3: [[
          mkText("op3-1", "收到对方消息了@回复：感谢您主动联系", "@"),
          mkText("op3-2", "您的关注让我很欣慰@说明我们的方向是对的", "@"),
          mkText("op3-3", "针对您的疑问@我详细说明一下具体情况", "@"),
          mkText("op3-4", "相信通过沟通@我们能找到最佳方案", "@")
        ]],
        S4: [[
          mkText("op4-1", "对方主动找您了@这是好信号@回复：很高兴您主动联系", "@"),
          mkText("op4-2", "您的主动让事情变得简单@我们直接聊正事吧", "@"),
          mkText("op4-3", "关于下一步计划@我有几个建议供您参考", "@"),
          mkText("op4-4", "希望我们能保持这样的沟通频率@一起把事情做好", "@")
        ]],
      },
      qa: {
        S1: [
          {
            id: "qa1-1",
            title: "如何开始第一回合？",
            answerChain: [
              mkText("qa1-1-1", "首先要做好心理准备@然后按照系统提示逐步操作@注意把握节奏和时机", "@"),
              mkText("qa1-1-2", "开场白要自然@不要显得太刻意@让对方感觉舒适", "@")
            ]
          },
          {
            id: "qa1-2",
            title: "遇到Z怎么办？",
            answerChain: [
              mkZ("qa1-2-1", "遇到Z标记时需要等待@这是系统设定的思考时间"),
              mkText("qa1-2-2", "利用Z时间整理思路@准备下一步话术@不要着急", "@")
            ]
          },
          {
            id: "qa1-3",
            title: "对方不回复怎么办？",
            answerChain: [
              mkText("qa1-3-1", "保持耐心，不要催促@给对方足够的思考时间@过于急切反而适得其反", "@")
            ]
          },
          {
            id: "qa1-4",
            title: "什么时候使用离开库？",
            answerChain: [
              mkText("qa1-4-1", "当一个回合内容完成后@使用离开库礼貌结束@为下次沟通留下好印象", "@")
            ]
          },
        ],
        S2: [
          {
            id: "qa2-1",
            title: "第二阶段策略",
            answerChain: [
              mkText("qa2-1-1", "第二阶段重点是建立信任@节奏要稳不要急@技巧在于循序渐进", "@"),
              mkText("qa2-1-2", "注意观察对方反应@及时调整沟通方式@保持灵活性", "@")
            ]
          },
          {
            id: "qa2-2",
            title: "如何提升得分？",
            answerChain: [
              mkText("qa2-2-1", "完整走完每个流程@使用离开库可得分@对方找功能也能加分", "@")
            ]
          },
          {
            id: "qa2-3",
            title: "什么时候用对方找？",
            answerChain: [
              mkText("qa2-3-1", "在大CD期间对方找功能会激活@等待倒计时结束后可以使用@每回合只能用一次", "@")
            ]
          },
        ],
        S3: [
          {
            id: "qa3-1",
            title: "第三阶段策略",
            answerChain: [
              mkText("qa3-1-1", "第三阶段是关键期@重点在于深化关系@技巧是把握机会主动推进", "@"),
              mkText("qa3-1-2", "注意控制推进节奏@不要过于激进@稳扎稳打最重要", "@")
            ]
          },
          {
            id: "qa3-2",
            title: "特殊回合如何应对？",
            answerChain: [
              mkText("qa3-2-1", "特殊回合是补救机会@认真对待每次机会@按提示操作即可", "@")
            ]
          },
          {
            id: "qa3-3",
            title: "半价重开值得吗？",
            answerChain: [
              mkText("qa3-3-1", "如果对这段关系很看重@半价重开是很好的选择@可以重新规划策略", "@")
            ]
          },
        ],
      },
      questionnaire: {
        thresholdX: 10,
        questions: [
          { id: "q1", title: "有对方线上可交流方式吗?", options: [{ id: "A", text: "是", score: 0 }, { id: "B", text: "否", score: 0 }] },
          {
            id: "q2",
            title: "愿意让对方20天见不到您并按指引操作？",
            options: [
              { id: "A", text: "是", score: 4 },
              { id: "B", text: "否", score: 0 },
              { id: "C", text: "C", score: 5 },
              { id: "D", text: "D", score: 7 },
              { id: "E", text: "E", score: 4 }
            ]
          },
          {
            id: "q3",
            title: "确认完成第一阶段前不主动联系？",
            options: [
              { id: "A", text: "是", score: 6 },
              { id: "B", text: "否", score: 0 },
              { id: "C", text: "C", score: 6 },
              { id: "D", text: "D", score: 10 },
              { id: "E", text: "E", score: 10 }
            ]
          },
          { id: "q4", title: "问题四（不计分）", options: [{ id: "A", text: "选项A", score: 0 }, { id: "B", text: "选项B", score: 0 }] },
          { id: "q5", title: "问题五（不计分）", options: [{ id: "A", text: "选项A", score: 0 }, { id: "B", text: "选项B", score: 0 }] },
        ],
      },
    };
    set("fm:libs", libs);
    // Inject API-mock questionnaire with backend-identical shape
    try {
      const apiMock = [
        {
          stageId: 65,
          stageName: "熟悉零阶段-问卷",
          moduleCode: "familiar_module",
          questionVoList: [
            {
              questionId: 45,
              questionTitle: "夏天夏天悄悄来临留下小秘密",
              questionType: 1,
              questionNum: 1,
              optionContentList: [
                { id: 66, optionContent: "春天", optionIntegral: 0 },
                { id: 78, optionContent: "夏天", optionIntegral: 0 },
                { id: 79, optionContent: "秋天", optionIntegral: 0 },
                { id: 80, optionContent: "冬天", optionIntegral: 0 },
                { id: 81, optionContent: "不确定", optionIntegral: 0 }
              ]
            },
            {
              questionId: 53,
              questionTitle: "你们目前的关系如何？",
              questionType: 1,
              questionNum: 2,
              optionContentList: [
                { id: 1, optionContent: "完全陌生，没有联系方式", optionIntegral: 0 },
                { id: 2, optionContent: "有联系方式，但很少联系", optionIntegral: 4 },
                { id: 3, optionContent: "偶尔会聊天，关系一般", optionIntegral: 5 },
                { id: 4, optionContent: "经常聊天，关系较好", optionIntegral: 7 },
                { id: 5, optionContent: "关系很好，但不够亲密", optionIntegral: 4 }
              ]
            },
            {
              questionId: 54,
              questionTitle: "你们是否有过深入的交流或共同经历？",
              questionType: 1,
              questionNum: 3,
              optionContentList: [
                { id: 1, optionContent: "从未有过深入交流", optionIntegral: 0 },
                { id: 2, optionContent: "只有简单的寒暄", optionIntegral: 0 },
                { id: 3, optionContent: "有过一些深入的话题", optionIntegral: 6 },
                { id: 4, optionContent: "有过多次深入交流", optionIntegral: 10 },
                { id: 5, optionContent: "有很多共同经历和回忆", optionIntegral: 10 }
              ]
            },
            {
              questionId: 55,
              questionTitle: "你希望和对方发展到什么程度？",
              questionType: 1,
              questionNum: 4,
              optionContentList: [
                { id: 1, optionContent: "普通朋友", optionIntegral: 0 },
                { id: 2, optionContent: "好朋友", optionIntegral: 0 },
                { id: 3, optionContent: "亲密朋友", optionIntegral: 0 },
                { id: 4, optionContent: "恋人关系", optionIntegral: 0 },
                { id: 5, optionContent: "长期伴侣", optionIntegral: 0 }
              ]
            },
            {
              questionId: 56,
              questionTitle: "你认为对方对你的态度如何？",
              questionType: 1,
              questionNum: 5,
              optionContentList: [
                { id: 1, optionContent: "不太关注", optionIntegral: 0 },
                { id: 2, optionContent: "普通朋友态度", optionIntegral: 0 },
                { id: 3, optionContent: "比较友好", optionIntegral: 0 },
                { id: 4, optionContent: "很友好，可能有好感", optionIntegral: 0 },
                { id: 5, optionContent: "明显有好感", optionIntegral: 0 }
              ]
            }
          ]
        }
      ];
      const libs2: any = get("fm:libs") || {};
      if (libs2 && libs2.questionnaire) {
        libs2.questionnaire.apiMock = apiMock;
        set("fm:libs", libs2);
      }
    } catch {}
  }

  if (!get("fm:tasks")) set("fm:tasks", []);
}

// Public APIs

export function initFamiliarLocal() {
  initDefaults();
}

function genId() {
  return "fm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}

export function listTasks(): { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] {
  initDefaults();
  const ids: string[] = get("fm:tasks") || [];
  const res: { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] = [];
  ids.forEach((id) => {
    const t: Task = get(`fm:task:${id}`);
    if (t && t.status !== "deleted") {
      const badge = computeListBadge(t);
      res.push({ id: t.id, name: t.name, status: t.status, badge: badge.badgeText, countdownEndAt: badge.countdownEndAt || null });
    }
  });
  return res;
}

export function createTask(payload: { name: string; durationDays: DurationDays }): { ok: boolean; reason?: string; task?: Task } {
  initDefaults();
  const { name, durationDays } = payload;
  if (!name || name.trim().length === 0 || name.trim().length > 6) {
    return { ok: false, reason: "名称需1-6字" };
  }
  const id = genId();
  const now = Date.now();
  const expireAt = now + durationDays * 24 * 60 * 60 * 1000;
  const settings: Settings = get("fm:settings");
  const vipMax = settings.vip.levels[0].qaMaxItems;

  const task: Task = {
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

  const ids: string[] = get("fm:tasks") || [];
  ids.push(id);
  set("fm:tasks", ids);
  set(`fm:task:${id}`, task);
  return { ok: true, task };
}

export function getTask(taskId: string): Task | null {
  initDefaults();
  const t: Task = get(`fm:task:${taskId}`);
  return t || null;
}

export function deleteTask(taskId: string) {
  initDefaults();
  const t: Task = get(`fm:task:${taskId}`);
  if (!t) return;
  t.status = "deleted";
  t.listBadge = "聊天任务进行中";
  t.listCountdownEndAt = null;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
  // 可选：从 fm:tasks 移除
  const ids: string[] = get("fm:tasks") || [];
  set("fm:tasks", ids.filter((i) => i !== taskId));
}

export function renewTask(taskId: string, days: DurationDays, cost: number): { success: boolean; reason?: string } {
  initDefaults();
  const t: Task = get(`fm:task:${taskId}`);
  if (!t) return { success: false, reason: "任务不存在" };
  const now = Date.now();
  // mock余额充足，直接续费
  t.expireAt = Math.max(t.expireAt, now) + days * 24 * 60 * 60 * 1000;
  t.renewHistory.push({ days, cost, at: now, success: true });
  set(`fm:task:${taskId}`, t);
  return { success: true };
}

// Stage / Round control (simplified mapping per doc)
export function startStage(taskId: string, stageIndex: StageIndex) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  t.stageIndex = stageIndex;
  t.roundIndex = stageIndex === 0 || stageIndex === 4 ? null : 0;
  t.stageScore = 0;
  t.stageThresholdX = (get("fm:settings") as Settings).stageThresholdX[stageIndex];
  t.zUnlockAt = null;
  t.dMode = false;
  t.opponentFindUnlockAt = null;
  t.opponentFindCopyUnlockAt = null;
  t.stageCdUnlockAt = null;
  t.roundCdUnlockAt = null;
  t.opponentFindUsedInRound = false;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

export function startRound(taskId: string, roundIndex: number, libPlan?: { openingId?: string; contentId?: string; leavingId?: string }) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  t.roundIndex = roundIndex;
  t.opponentFindUsedInRound = false;
  t.zUnlockAt = null;
  t.dMode = false;
  t.roundCdUnlockAt = null;

  // Choose libraries per stage rules (simplified; real mapping should follow detailed doc flow)
  const libs: Libs = get("fm:libs");
  const stage = t.stageIndex;

  // Build a starting chain: opening -> content
  if (stage === 2 || stage === 3) {
    if (!t.opponentFindUsedInRound) {
      const openingId = libPlan?.openingId || "S1"; // 默认使用S1开库
      const oc = pickChain(libs.opening, openingId);
      if (oc) {
        setCurrentChain(t, "opening", openingId, oc);
        console.log(`[startRound] 阶段${stage}第${roundIndex}回合，初始化开库${openingId}`);
      }
    }
  } else if (stage === 1) {
    // Stage 1 uses only content then leaving per round
    const cId = libPlan?.contentId || (["S1", "S2", "S3", "S4", "S5", "S4.5"][Math.min(roundIndex - 1, 5)]);
    const cc = pickChain(libs.content, cId);
    if (cc) setCurrentChain(t, "content", cId, cc);
  } else if (stage === 4) {
    // Stage 4 - use S20 branching externally; here no round
    t.roundIndex = null;
  }

  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

function pickChain(group: Record<string, Chain[]>, libId: string): Chain | null {
  const arr = group[libId];
  if (!arr || arr.length === 0) return null;
  // pick first unused chain (mock simple)
  return arr[0];
}

function setCurrentChain(t: Task, type: CurrentLibChain["type"], libId: string, chain: Chain) {
  t.currentLibChain = { type, libId, nodeIndex: 0, segmentsCopied: 0 };
  markChainUsedInternal(t, libId, type);
}

// Points
export function addPoint(taskId: string, amount: number, source: "leaving" | "opponentFind" | "qa" | "other" = "other") {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  t.stageScore += amount;
  t.totalScore += amount;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

// Z/D states
export function onZEnter(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const settings: Settings = get("fm:settings");
  const range = settings.cd.zDurationByStage[t.stageIndex];
  const dur = randInt(range.minMs, range.maxMs);
  t.zUnlockAt = Date.now() + dur;
  t.listBadge = "Z倒计时";
  t.listCountdownEndAt = t.zUnlockAt;
  set(`fm:task:${taskId}`, t);
}

export function onDEnter(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  t.dMode = true;
  t.listBadge = "D";
  t.listCountdownEndAt = null;
  set(`fm:task:${taskId}`, t);
}

// Opponent find
export function onOpponentFindSchedule(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const settings: Settings = get("fm:settings");
  t.opponentFindUnlockAt = Date.now() + settings.cd.opponentFindWaitMs;
  t.listBadge = "对方找倒计时";
  t.listCountdownEndAt = t.opponentFindUnlockAt;
  set(`fm:task:${taskId}`, t);
}

export function onOpponentFindClick(taskId: string, libId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const libs: Libs = get("fm:libs");
  const opChain = pickChain(libs.opponent, libId);
  if (opChain) setCurrentChain(t, "opponent", libId, opChain);
  const settings: Settings = get("fm:settings");
  t.opponentFindUsedInRound = true;
  t.opponentFindCopyUnlockAt = Date.now() + settings.cd.opponentFindCopyEnableMs;
  t.listBadge = "聊天任务进行中";
  t.listCountdownEndAt = null;
  t.nextOpponentFindLibId = undefined;
  set(`fm:task:${taskId}`, t);
}

// Copy segment
export function copySegment(taskId: string): { ok: boolean; reason?: string } {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.currentLibChain) return { ok: false, reason: "无当前内容可复制" };
  const settings: Settings = get("fm:settings");

  // Small copy CD
  const until = Date.now() + settings.cd.smallCopyCdMs;
  const clip: ClipboardState = {
    chainId: t.currentLibChain.libId,
    segmentIndex: t.currentLibChain.segmentsCopied,
    until,
  };
  set(`fm:clipboard:${taskId}`, clip);

  t.currentLibChain.segmentsCopied += 1;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
  return { ok: true };
}

// Finish chain node -> if more segments remain or nodes remain, front-end应在计时结束后推进
export function finishCurrentLibNode(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.currentLibChain) return;
  t.currentLibChain.nodeIndex += 1;
  t.currentLibChain.segmentsCopied = 0;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

// Enter CDs
export function enterRoundBigCd(taskId: string, multiplier = 1, options?: { startOpponentFind?: boolean; opponentFindLibId?: string }) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const base = (get("fm:settings") as Settings).cd.bigRoundMinMs;
  const multi = multiplier ?? (t.stage1?.roundCdMultiplier || 1);
  t.roundCdUnlockAt = Date.now() + base * multi;
  t.listBadge = "下次聊天开启倒计时";
  t.listCountdownEndAt = t.roundCdUnlockAt;
  t.currentLibChain = null;

  if (options?.startOpponentFind) {
    const settings: Settings = get("fm:settings");
    const wait = settings.cd.opponentFindWaitMs;
    const copyEnable = settings.cd.opponentFindCopyEnableMs;
    t.opponentFindUnlockAt = Date.now() + wait;
    t.opponentFindCopyUnlockAt = (t.opponentFindUnlockAt as number) + copyEnable;
    t.opponentFindUsedInRound = false;
    t.listBadge = "对方找倒计时";
    t.listCountdownEndAt = t.opponentFindUnlockAt;
    // 使用 existing 字段记录将要使用的对方找库
    t.nextOpponentFindLibId = options.opponentFindLibId || "S2";
  } else {
    t.opponentFindUnlockAt = null;
    t.opponentFindCopyUnlockAt = null;
    t.opponentFindUsedInRound = false;
    t.nextOpponentFindLibId = undefined;
  }

  set(`fm:task:${taskId}`, t);
}

export function setRoundCdUnlock(taskId: string, multiplier = 1) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const base = (get("fm:settings") as Settings).cd.bigRoundMinMs;
  const multi = multiplier || (t.stage1?.roundCdMultiplier || 1);
  t.roundCdUnlockAt = Date.now() + base * multi;
  t.listBadge = "下次聊天开启倒计时";
  t.listCountdownEndAt = t.roundCdUnlockAt;
  set(`fm:task:${taskId}`, t);
}

export function enterStageCd(taskId: string, daysRange: { minDays: number; maxDays: number }) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const days = randInt(daysRange.minDays, daysRange.maxDays);
  t.stageCdUnlockAt = Date.now() + getCountdownTimeMs(days * 24 * 60 * 60 * 1000);
  t.listBadge = "下次聊天开启倒计时";
  t.listCountdownEndAt = t.stageCdUnlockAt;
  t.currentLibChain = null;
  // 清除回合CD，避免与阶段CD冲突
  t.roundCdUnlockAt = null;
  set(`fm:task:${taskId}`, t);
}

// Mark chain/lib used
export function markChainUsed(taskId: string, libId: string, type: CurrentLibChain["type"]) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  markChainUsedInternal(t, libId, type);
  set(`fm:task:${taskId}`, t);
}
function markChainUsedInternal(t: Task, libId: string, type: CurrentLibChain["type"]) {
  const s = t.stageIndex;
  if (!t.usedLibIdsByStage[s]) t.usedLibIdsByStage[s] = { content: [] };
  const bucket = t.usedLibIdsByStage[s];
  const pushIf = (arr?: string[]) => {
    if (!arr) return;
    if (!arr.includes(libId)) arr.push(libId);
  };
  if (type === "content") pushIf(bucket.content);
  if (type === "opening") {
    if (!bucket.opening) bucket.opening = [];
    pushIf(bucket.opening);
  }
  if (type === "leaving") {
    if (!bucket.leaving) bucket.leaving = [];
    pushIf(bucket.leaving);
  }
  if (type === "qa") {
    if (!bucket.qa) bucket.qa = [];
    pushIf(bucket.qa);
  }
  if (type === "opponent") {
    if (!bucket.opponent) bucket.opponent = [];
    pushIf(bucket.opponent);
  }
}

// Questionnaire
export function saveQuestionnaireAnswer(taskId: string, questionId: string, optionId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const libs: Libs = get("fm:libs");
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

export function submitQuestionnaire(taskId: string): { routed: RoutedModule; next: string } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { routed: "familiar", next: "问1" };
  const libs: Libs = get("fm:libs");
  const X = libs.questionnaire.thresholdX;
  const score = t.questionnaire.totalScore;

  // 更新任务状态：无论得分多少，都保持在第0阶段
  t.stageIndex = 0;
  t.stepIndex = 0;
  t.lastActionAt = Date.now();

  // 保存问卷路由信息供前端判断使用：
  // - 得分≥X(10分)：问1 → 问2 → S2提示板 → 9-10天倒计时 → 问3 → S4提示板 → XX-XX天倒计时 → 第一阶段
  // - 得分<X(10分)：问1 → (是→不熟模块 / 否→陌生模块)
  if (score >= X) {
    t.questionnaire.routedModule = "familiar"; // 得分达标，后续走熟悉模块的问1/问2/问3流程
  } else {
    t.questionnaire.routedModule = "familiar"; // 得分不足，问1后路由到不熟/陌生模块
  }

  set(`fm:task:${taskId}`, t);

  // 无论得分多少，都先进入"问1"流程
  return { routed: "familiar", next: "问1" };
}

/**
 * 处理"问1"的用户选择
 * 问题："有对方微信或其他线上可交流方式吗？"
 * 选项："是"和"否"
 */
export function handleAsk1(taskId: string, answer: "是" | "否"): { ok: boolean; action: string; reason?: string } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, action: "error", reason: "任务不存在" };

  const libs: Libs = get("fm:libs");
  const X = libs.questionnaire.thresholdX;
  const score = t.questionnaire.totalScore;

  // 记录问1的答案
  t.askFlow.ask1 = answer;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);

  if (score >= X) {
    // 得分达标的情况
    if (answer === "是") {
      // 进入"问2"
      return { ok: true, action: "showAsk2", reason: "进入问2流程" };
    } else {
      // 显示提示板S1，然后回到"问1"
      return { ok: true, action: "showPromptS1", reason: "显示提示板S1，用户点击确定后回到问1" };
    }
  } else {
    // 得分不足的情况
    if (answer === "是") {
      // 进入不熟模块
      t.questionnaire.routedModule = "unfamiliar";
      set(`fm:task:${taskId}`, t);
      return { ok: true, action: "routeToUnfamiliar", reason: "得分不足，路由到不熟模块" };
    } else {
      // 进入陌生模块
      t.questionnaire.routedModule = "stranger";
      set(`fm:task:${taskId}`, t);
      return { ok: true, action: "routeToStranger", reason: "得分不足，路由到陌生模块" };
    }
  }
}

/**
 * 处理"问2"的用户选择
 * 问题："需要让对方见不到您20天左右。其中前10天左右什么也不用做，后10天左右请根据之后指引操作，确定可以开始并准备好之后请选"是"（即是否准备好）"
 * 选项："是"和"否"
 */
export function handleAsk2(taskId: string, answer: "是" | "否"): { ok: boolean; action: string; reason?: string } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, action: "error", reason: "任务不存在" };

  // 记录问2的答案
  t.askFlow.ask2 = answer;
  t.lastActionAt = Date.now();

  if (answer === "是") {
    // 显示提示板S2，然后进入9-10天的倒计时
    const daysRange = { minDays: 9, maxDays: 10 };
    const days = randInt(daysRange.minDays, daysRange.maxDays);
    const countdownMs = getCountdownTimeMs(days * 24 * 60 * 60 * 1000);

    t.stageCdUnlockAt = Date.now() + countdownMs;
    t.listBadge = "下次聊天开启倒计时";
    t.listCountdownEndAt = t.stageCdUnlockAt;

    // 标记当前在等待问3
    t.stepIndex = 2; // 0=问卷, 1=问1, 2=等待问3

    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS2AndStartCountdown", reason: `显示提示板S2，进入${days}天倒计时，倒计时结束后弹出问3` };
  } else {
    // 显示提示板S3，然后回到"问2"
    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS3", reason: "显示提示板S3，用户点击确定后回到问2" };
  }
}

/**
 * 处理"问3"的用户选择
 * 问题："请确定完成第一阶段，即倒计时结束前未与对方见面或主动联系，是或否？"
 * 选项："是"和"否"
 */
export function handleAsk3(taskId: string, answer: "是" | "否"): { ok: boolean; action: string; reason?: string; countdownDays?: number } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, action: "error", reason: "任务不存在" };

  // 记录问3的答案
  t.askFlow.ask3 = answer;
  t.lastActionAt = Date.now();

  if (answer === "是") {
    // 显示提示板S4，然后进入XX-XX天的倒计时，倒计时结束后进入第一阶段
    // TODO: 需要确认具体天数范围，这里暂时使用3-5天
    const daysRange = { minDays: 3, maxDays: 5 };
    const days = randInt(daysRange.minDays, daysRange.maxDays);
    const countdownMs = getCountdownTimeMs(days * 24 * 60 * 60 * 1000);

    t.stageCdUnlockAt = Date.now() + countdownMs;
    t.listBadge = "下次聊天开启倒计时";
    t.listCountdownEndAt = t.stageCdUnlockAt;

    // 标记准备进入第一阶段
    t.stepIndex = 3; // 0=问卷, 1=问1, 2=等待问3, 3=等待进入第一阶段

    // TODO: 激活图文模块的图文特殊库权限
    // 在6-9天的时间范围内随机一个时间，达到随机时间后，刷新该用户图文特殊库的返回内容

    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS4AndStartCountdown", reason: `显示提示板S4，进入${days}天倒计时，倒计时结束后进入第一阶段`, countdownDays: days };
  } else {
    // 显示提示板S3，然后回到"问2"
    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS3", reason: "显示提示板S3，用户点击确定后回到问2" };
  }
}

/**
 * 检查第0阶段的倒计时是否结束，并执行相应动作
 */
export function checkStage0Countdown(taskId: string): { ok: boolean; action: string; reason?: string } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, action: "error", reason: "任务不存在" };

  const now = Date.now();

  // 如果有stageCdUnlockAt且已到期
  if (t.stageCdUnlockAt && now >= t.stageCdUnlockAt) {
    if (t.stepIndex === 2) {
      // 问2后的倒计时结束，弹出问3
      t.stageCdUnlockAt = null;
      t.listCountdownEndAt = null;
      t.listBadge = "聊天任务进行中";
      set(`fm:task:${taskId}`, t);
      return { ok: true, action: "showAsk3", reason: "问2后的倒计时结束，弹出问3" };
    } else if (t.stepIndex === 3) {
      // 问3后的倒计时结束，进入第一阶段
      t.stageCdUnlockAt = null;
      t.listCountdownEndAt = null;
      t.listBadge = "聊天任务进行中";
      set(`fm:task:${taskId}`, t);
      return { ok: true, action: "enterStage1", reason: "问3后的倒计时结束，进入第一阶段" };
    }
  }

  return { ok: true, action: "waiting", reason: "倒计时尚未结束" };
}


// Idle handling
export function updateLastAction(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const now = Date.now();
  const settings: Settings = get("fm:settings");
  t.lastActionAt = now;
  t.idleWarningAt = now + settings.cd.idleWarnMs;
  t.hardIdleToCdAt = now + settings.cd.idleForceCdMs;
  set(`fm:task:${taskId}`, t);
}

export function checkIdleAndHandle(taskId: string): { warn: boolean; forcedCd: boolean } {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { warn: false, forcedCd: false };
  const now = Date.now();
  const warn = t.idleWarningAt !== null && now >= (t.idleWarningAt as number);
  let forcedCd = false;
  if (t.hardIdleToCdAt !== null && now >= (t.hardIdleToCdAt as number)) {
    enterRoundBigCd(taskId, 1);
    forcedCd = true;
  }
  return { warn, forcedCd };
}

// List badge computing
export function computeListBadge(task: Task): { badgeText: string; countdownEndAt?: number } {
  const now = Date.now();
  if (task.dMode) return { badgeText: "D" };
  if (task.zUnlockAt && now < task.zUnlockAt) return { badgeText: "Z倒计时", countdownEndAt: task.zUnlockAt };
  if (task.opponentFindUnlockAt && now < task.opponentFindUnlockAt) return { badgeText: "对方找倒计时", countdownEndAt: task.opponentFindUnlockAt };
  const end = task.roundCdUnlockAt || task.stageCdUnlockAt;
  if (end && now < end) return { badgeText: "下次聊天开启倒计时", countdownEndAt: end };
  return { badgeText: "聊天任务进行中" };
}

// Helpers
function randInt(min: number, max: number) {
  if (min >= max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 第一阶段核心函数
export function enterStage1(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };
  
  // 初始化第一阶段数据
  t.stageIndex = 1;
  t.roundIndex = 0; // 回合数从0开始，第一次进入会+1
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 2; // 第一阶段阈值X=2
  t.status = "active";
  
  // 初始化第一阶段特定数据
  t.stage1 = {
    roundScores: [],
    firstThreeRoundsTotal: 0,
    currentRoundStartTime: null,
    roundAllowedTimeMs: getCountdownTimeMs(30 * 60 * 1000), // 30分钟回合时间
    zTimerMs: getCountdownTimeMs(randInt(2 * 60 * 1000, 4 * 60 * 1000)), // 2-4分钟Z倒计时
    hasUsedOpponentFind: false,
    roundCdMultiplier: 1,
  };
  
  // 清除阶段0的倒计时
  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";
  
  set(`fm:task:${taskId}`, t);
  updateLastAction(taskId);
  
  console.log('[enterStage1] 任务进入第一阶段:', taskId);
  return { ok: true, task: t };
}

export function startStage1Round(taskId: string, roundNumber: number) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage1) return { ok: false, reason: "任务不在第一阶段" };
  
  // 更新回合数
  t.roundIndex = roundNumber;
  t.stage1.currentRoundStartTime = Date.now();
  t.stage1.hasUsedOpponentFind = false;
  t.stage1.roundCdMultiplier = roundNumber === 3 ? 2 : 1;
  
  // 根据回合数确定内容库
  let contentLibId: string;
  let leavingLibId: string;
  
  switch (roundNumber) {
    case 1:
      contentLibId = "S1";
      leavingLibId = "S1";
      break;
    case 2:
      contentLibId = "S2";
      leavingLibId = "S2";
      break;
    case 3:
      contentLibId = "S3";
      leavingLibId = "S2";
      break;
    case 4:
      contentLibId = "S4";
      leavingLibId = "S3";
      break;
    case 5:
      contentLibId = "S5";
      leavingLibId = "S2";
      break;
    case 6:
      contentLibId = "S4.5";
      leavingLibId = "S3.5";
      break;
    default:
      return { ok: false, reason: "无效的回合数" };
  }
  
  // 开始内容库
  startRound(taskId, roundNumber, { contentId: contentLibId });
  
  console.log(`[startStage1Round] 开始第${roundNumber}回合:`, { contentLibId, leavingLibId });
  return { ok: true, contentLibId, leavingLibId };
}

export function finishStage1Round(taskId: string, roundScore: number) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage1) return { ok: false, reason: "任务不在第一阶段" };
  
  const roundNumber = t.roundIndex || 0;
  
  // 记录回合得分
  t.stage1.roundScores[roundNumber - 1] = roundScore;
  t.stageScore += roundScore;
  t.totalScore += roundScore;
  
  // 更新前三回合总得分
  if (roundNumber <= 3) {
    t.stage1.firstThreeRoundsTotal = t.stage1.roundScores.slice(0, 3).reduce((sum, score) => sum + score, 0);
  }
  
  console.log(`[finishStage1Round] 第${roundNumber}回合结束:`, {
    roundScore,
    stageScore: t.stageScore,
    firstThreeRoundsTotal: t.stage1.firstThreeRoundsTotal
  });
  
  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

export function checkStage1RoundTransition(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage1) return { ok: false, reason: "任务不在第一阶段" };
  
  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const firstThreeRoundsTotal = t.stage1.firstThreeRoundsTotal;
  
  console.log(`[checkStage1RoundTransition] 检查第${roundNumber}回合后的转换:`, {
    stageScore,
    firstThreeRoundsTotal,
    thresholdX: t.stageThresholdX
  });
  
  if (roundNumber === 3) {
    // 第三回合后判分
    if (stageScore >= t.stageThresholdX) {
      // 进入第四回合
      return { ok: true, action: "enterRound4", reason: "前三回合得分足够" };
    }
    // 前三回合得分不足：进入大CD×2，然后继续第五回合
    return { ok: true, action: "enterRound5", reason: "前三回合得分不足，进入延时回合" };
  } else if (roundNumber === 4) {
    // 第四回合后直接进入阶段CD（固定进入第2阶段前的3-5天倒计时）
    return {
      ok: true,
      action: "enterStageCd",
      reason: "第四回合完成，进入阶段CD",
      stageCdRange: { minDays: 3, maxDays: 5 }
    };
  } else if (roundNumber === 5) {
    // 第五回合后判分
    if (stageScore === firstThreeRoundsTotal) {
      // 得分相等，进入第六回合（延时2*大CD）
      return { ok: true, action: "enterRound6", reason: "得分相等，进入第六回合" };
    }
    // 得分不等，进入阶段CD
    return { ok: true, action: "enterStageCd", reason: "得分不等，进入阶段CD" };
  } else if (roundNumber === 6) {
    // 第六回合后判分
    if (stageScore === firstThreeRoundsTotal) {
      // 得分相等，需要用户选择是否坚持
      return { ok: true, action: "showPromptS7", reason: "得分相等，询问是否坚持" };
    }
    // 得分不等，进入阶段CD
    return { ok: true, action: "enterStageCd", reason: "得分不等，进入阶段CD" };
  }
  
  return { ok: true, action: "continue", reason: "继续当前回合" };
}

// Quick wiring helpers for stage 1 specific logic (optional)
// Round flow examples:
export function stage1EnterRound1(taskId: string) {
  startStage(taskId, 1);
  startRound(taskId, 1, { contentId: "S1" });
}
export function stage1EnterRound2(taskId: string) {
  startRound(taskId, 2, { contentId: "S2" });
}
export function stage1EnterRound3(taskId: string) {
  startRound(taskId, 3, { contentId: "S3" });
}
export function stage1EnterRound4(taskId: string) {
  startRound(taskId, 4, { contentId: "S4" });
}
export function stage1EnterRound5(taskId: string) {
  startRound(taskId, 5, { contentId: "S5" });
}
export function stage1EnterRound6(taskId: string) {
  startRound(taskId, 6, { contentId: "S4.5" });
}

// Enter leaving to add point then round CD
export function enterLeavingAndCd(taskId: string, leavingId: string, cdMultiplier = 1) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  const libs: Libs = get("fm:libs");
  const chain = pickChain(libs.leaving, leavingId);
  if (chain) setCurrentChain(t, "leaving", leavingId, chain);
  addPoint(taskId, 1, "leaving");
  enterRoundBigCd(taskId, cdMultiplier);
  set(`fm:task:${taskId}`, getTask(taskId));
}

// 新增函数 - 用于round.vue页面
export async function savePoint(taskId: string, stepNum = 0): Promise<void> {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return;
  
  // 保存当前进度点
  t.stepIndex = stepNum;
  t.lastActionAt = Date.now();
  set(`fm:task:${taskId}`, t);
}

export async function getMockContentByLibrary(taskId: string, libraryName: string): Promise<any> {
  initDefaults();
  const libs: Libs = get("fm:libs");
  let contentList: ChainNode[] = [];
  
  // 根据库名获取内容
  switch (libraryName) {
    case 'content':
      contentList = libs.content?.S1?.[0] || [];
      break;
    case 'opening':
      contentList = libs.opening?.S1?.[0] || [];
      break;
    case 'leaving':
      contentList = libs.leaving?.S1?.[0] || [];
      break;
    case 'opponent':
      contentList = libs.opponent?.S2?.[0] || [];
      break;
    case 'qa':
      contentList = libs.qa?.S1?.[0]?.answerChain || [];
      break;
    default:
      contentList = [];
  }
  
  return {
    contentList: contentList,
    statusVo: { sign: '' }
  };
}

export async function getNextChainContent(taskId: string): Promise<any> {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { contentList: [], statusVo: { sign: '' } };
  
  // 简单实现：获取下一条内容
  if (!t.currentLibChain) {
    // 如果没有当前内容链，初始化一个
    const libs: Libs = get("fm:libs");
    const chain = pickChain(libs.content, "S1");
    if (chain) setCurrentChain(t, "content", "S1", chain);
  }
  
  if (t.currentLibChain) {
    const libs: Libs = get("fm:libs");
    const chainGroup = getChainGroupByType(libs, t.currentLibChain.type);
    const chain = chainGroup?.[t.currentLibChain.libId]?.[0];
    
    if (chain && t.currentLibChain.nodeIndex < chain.length) {
      const currentNode = chain[t.currentLibChain.nodeIndex];
      return {
        contentList: [currentNode],
        statusVo: { sign: '' }
      };
    }
  }
  
  return { contentList: [], statusVo: { sign: '' } };
}

export async function getCurrentChainContent(taskId: string): Promise<any> {
  initDefaults();
  const t = getTask(taskId);
  console.log('[getCurrentChainContent] taskId:', taskId, 'currentLibChain:', t?.currentLibChain);
  
  if (!t || !t.currentLibChain) {
    console.log('[getCurrentChainContent] 任务不存在或没有currentLibChain，返回空');
    return { contentList: [], statusVo: { sign: '' } };
  }
  
  const libs: Libs = get("fm:libs");
  const chainGroup = getChainGroupByType(libs, t.currentLibChain.type);
  const chain = chainGroup?.[t.currentLibChain.libId]?.[0];
  
  console.log('[getCurrentChainContent] chainGroup:', t.currentLibChain.type, 'libId:', t.currentLibChain.libId, 'chain length:', chain?.length);
  
  if (chain && t.currentLibChain.nodeIndex < chain.length) {
    const currentNode = chain[t.currentLibChain.nodeIndex];
    console.log('[getCurrentChainContent] 返回节点:', currentNode);
    return {
      contentList: [currentNode],
      statusVo: { sign: currentNode.type === 'Z' || currentNode.type === 'AZ' ? 'Z' : (currentNode.type === 'D' || currentNode.type === 'AD' ? 'D' : '') }
    };
  }
  
  console.log('[getCurrentChainContent] 链已结束或索引越界，返回空');
  return { contentList: [], statusVo: { sign: '' } };
}

export async function getTaskDetail(taskId: string): Promise<Task> {
  initDefaults();
  const task = getTask(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  return task;
}

// 辅助函数：根据类型获取对应的链组
function getChainGroupByType(libs: Libs, type: CurrentLibChain["type"]): Record<string, Chain[]> {
  switch (type) {
    case 'opening': return libs.opening;
    case 'content': return libs.content;
    case 'leaving': return libs.leaving;
    case 'opponent': return libs.opponent;
    case 'qa': return libs.qa as any;
    default: return {};
  }
}

// 根据指定库名获取内容列表
export async function getContentListOfAppoint(params: {
  taskId: string;
  warehouseName: string;
  moduleCode: string;
}): Promise<any> {
  initDefaults();
  const libs: Libs = get("fm:libs");
  let contentList: ChainNode[] = [];
  
  // 根据库名获取内容
  switch (params.warehouseName) {
    case 'content':
      contentList = libs.content?.S1?.[0] || [];
      break;
    case 'opening':
      contentList = libs.opening?.S1?.[0] || [];
      break;
    case 'leaving':
      contentList = libs.leaving?.S1?.[0] || [];
      break;
    case 'opponent':
      contentList = libs.opponent?.S2?.[0] || [];
      break;
    case 'qa':
      contentList = libs.qa?.S1?.[0]?.answerChain || [];
      break;
    default:
      contentList = [];
  }
  
  return {
    contentList: contentList,
    statusVo: { sign: '' }
  };
}

// 获取内容列表（通过步骤ID）
export async function getContentList(params: {
  preStepDetailId?: string;
  taskId: string;
  stepId?: number;
  moduleCode: string;
}): Promise<any> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return { contentList: [], statusVo: { sign: '' } };
  
  return getCurrentChainContent(params.taskId);
}

// 通过模块获取内容列表
export async function getContentListOfStep(params: {
  taskId: string;
  moduleCode: string;
}): Promise<any> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return { contentList: [], statusVo: { sign: '' } };
  
  return getCurrentChainContent(params.taskId);
}

// 获取列表信息
export async function getListInfo(params: { taskId: string }): Promise<any> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return null;
  
  return {
    id: t.id,
    name: t.name,
    status: t.status,
    stageIndex: t.stageIndex,
    roundIndex: t.roundIndex,
    stepIndex: t.stepIndex,
    stageScore: t.stageScore,
    totalScore: t.totalScore
  };
}

// 关闭超时详情步骤
export async function closeOverTimeDetailStep(params: { taskId: string }): Promise<void> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return;
  
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
}

// 更新任务状态
export async function updateTaskStatus(params: { 
  taskId: string; 
  status: string; 
  stepNum?: number 
}): Promise<void> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return;
  
  if (params.status === 'active' || params.status === 'finished' || params.status === 'deleted') {
    t.status = params.status as TaskStatus;
  }
  
  if (params.stepNum !== undefined) {
    t.stepIndex = params.stepNum;
  }
  
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
}

// 增加积分
export async function addScore(params: { taskId: string; score: number }): Promise<void> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return;
  
  t.stageScore += params.score;
  t.totalScore += params.score;
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
}

// 增加回合
export async function addRound(params: { taskId: string }): Promise<void> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return;
  
  if (t.roundIndex !== null) {
    t.roundIndex += 1;
  }
  
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
}

// 获取Mock数据
export function getMockData(): any {
  initDefaults();
  const libs: Libs = get("fm:libs");
  return libs;
}


// 复制内容详情
export async function copyContentDetail(params: { moduleCode: string; stepDetailId: number; sign: string; taskId: string; source: string }): Promise<boolean> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return false;
  
  // 模拟复制操作
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
  return true;
}

// 增加回合积分
export async function addRoundIntegral(params: { taskId: string; integralNum: number }): Promise<{ success: boolean }> {
  initDefaults();
  const t = getTask(params.taskId);
  if (!t) return { success: false };
  
  // 增加积分
  t.stageScore += params.integralNum;
  t.totalScore += params.integralNum;
  t.lastActionAt = Date.now();
  set(`fm:task:${params.taskId}`, t);
  
  return { success: true };
}

// 获取回合积分
export async function getRoundIntegral(taskId: string): Promise<{ integral: number; roundNum: number }> {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { integral: 0, roundNum: 0 };
  
  return {
    integral: t.stageScore,
    roundNum: t.roundIndex || 0
  };
}

// 获取提示
export async function getHint(params: { hintCode: string; moduleCode: string; stageNum: number }, callback?: () => void, options?: any): Promise<{ success: boolean }> {
  initDefaults();
  
  // 模拟获取提示
  if (callback) {
    callback();
  }
  
  return { success: true };
}

// 增加阶段
export async function addStage(taskId: string, callback?: () => void): Promise<{ success: boolean }> {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { success: false };
  
  // 增加阶段
  if (t.stageIndex < 4) {
    t.stageIndex += 1;
    t.roundIndex = t.stageIndex === 0 || t.stageIndex === 4 ? null : 0;
    t.stageScore = 0;
    t.lastActionAt = Date.now();
    set(`fm:task:${taskId}`, t);
  }
  
  if (callback) {
    callback();
  }
  
  return { success: true };
}

// ==================== 第二阶段核心函数 ====================

/**
 * 进入第二阶段
 */
export function enterStage2(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  // 初始化第二阶段数据
  t.stageIndex = 2;
  t.roundIndex = 0;
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 2; // 第二阶段阈值X=2（可配置）
  t.status = "active";

  // 初始化第二阶段特定数据
  t.stage2 = {
    roundScores: [],
    firstTwoRoundsTotal: 0,
    specialRound: null,
    skipOpening: false,
    usedContentLibs: []
  };

  // 清除阶段CD
  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  updateLastAction(taskId);

  console.log('[enterStage2] 任务进入第二阶段:', taskId);
  return { ok: true, task: t };
}

/**
 * 开始第二阶段回合
 */
export function startStage2Round(taskId: string, roundNumber: number) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage2) return { ok: false, reason: "任务不在第二阶段" };

  // 设置当前回合并清理上一回合的临时状态
  t.roundIndex = roundNumber;
  t.opponentFindUsedInRound = false;
  t.zUnlockAt = null;
  t.dMode = false;
  t.roundCdUnlockAt = null;
  t.currentLibChain = null;

  // 第二阶段内容库：S6-S11，前两回合随机抽取
  const availableContentLibs = ["S6", "S7", "S8", "S9", "S10", "S11"];
  const unusedLibs = availableContentLibs.filter(lib => !t.stage2!.usedContentLibs.includes(lib));

  let contentLibId: string;
  let openingLibId = "S1";
  let leavingLibId = "S4";

  if (roundNumber <= 2) {
    // 前两回合随机抽取
    if (unusedLibs.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedLibs.length);
      contentLibId = unusedLibs[randomIndex];
      t.stage2.usedContentLibs.push(contentLibId);
    } else {
      contentLibId = "S6"; // 默认
    }
  } else {
    // 特殊回合使用S2.5
    contentLibId = "S2.5";
    leavingLibId = "S3";
  }

  // 检查是否跳过开场库
  // 特殊回合a/b需要跳过开库，直接进入内容库
  if (t.stage2.skipOpening || t.stage2.specialRound === 'a' || t.stage2.specialRound === 'b') {
    openingLibId = "";
  }

  // 初始化当前链：优先开场库，其次内容库
  const libs: Libs = get("fm:libs");
  console.log(`[startStage2Round] 特殊回合:${t.stage2.specialRound}, skipOpening:${t.stage2.skipOpening}, openingLibId:${openingLibId}`);
  if (openingLibId) {
    const oc = pickChain(libs.opening, openingLibId);
    console.log(`[startStage2Round] pickChain(opening, ${openingLibId}):`, oc);
    if (oc) {
      setCurrentChain(t, "opening", openingLibId, oc);
      console.log(`[startStage2Round] setCurrentChain(opening)成功，currentLibChain:`, t.currentLibChain);
    } else {
      console.log(`[startStage2Round] pickChain(opening)返回null，尝试使用内容库`);
      const cc = pickChain(libs.content, contentLibId);
      console.log(`[startStage2Round] pickChain(content, ${contentLibId}):`, cc);
      if (cc) {
        setCurrentChain(t, "content", contentLibId, cc);
        console.log(`[startStage2Round] setCurrentChain(content)成功，currentLibChain:`, t.currentLibChain);
      }
    }
  } else {
    // 跳过开库，直接进入内容库
    const cc = pickChain(libs.content, contentLibId);
    console.log(`[startStage2Round] 跳过开库，直接进入内容库 pickChain(content, ${contentLibId}):`, cc);
    if (cc) {
      setCurrentChain(t, "content", contentLibId, cc);
      console.log(`[startStage2Round] setCurrentChain(content)成功，currentLibChain:`, t.currentLibChain);
    }
  }

  console.log(`[startStage2Round] 开始第${roundNumber}回合:`, { openingLibId, contentLibId, leavingLibId }, 'currentLibChain:', t.currentLibChain);

  set(`fm:task:${taskId}`, t);
  return { ok: true, openingLibId, contentLibId, leavingLibId };
}

/**
 * 完成第二阶段回合
 * @param taskId 任务ID
 * @param roundScore 本回合得分
 * @returns 操作结果
 */
export function finishStage2Round(taskId: string, roundScore: number) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage2) return { ok: false, reason: "任务不在第二阶段" };

  const roundNumber = t.roundIndex || 0;

  // 记录当前回合得分
  t.stage2.roundScores[roundNumber - 1] = roundScore;
  t.stageScore += roundScore;
  t.totalScore += roundScore;

  // 如果是第二回合，计算前两回合总分
  if (roundNumber === 2) {
    t.stage2.firstTwoRoundsTotal =
      t.stage2.roundScores.slice(0, 2).reduce((sum, score) => sum + score, 0);

    console.log(`[finishStage2Round] 第${roundNumber}回合结束:`, {
      roundScore,
      stageScore: t.stageScore,
      firstTwoRoundsTotal: t.stage2.firstTwoRoundsTotal
    });
  }

  set(`fm:task:${taskId}`, t);
  return { ok: true, task: t };
}

/**
 * 检查第二阶段回合转换
 */
export function checkStage2RoundTransition(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage2) return { ok: false, reason: "任务不在第二阶段" };

  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const firstTwoRoundsTotal = t.stage2.firstTwoRoundsTotal;

  console.log(`[checkStage2RoundTransition] 检查第${roundNumber}回合后的转换:`, {
    stageScore,
    firstTwoRoundsTotal,
    thresholdX: t.stageThresholdX
  });

  if (roundNumber === 2) {
    // 第二回合后判分
    if (stageScore > t.stageThresholdX) {
      // 进入阶段CD，然后进入第三阶段
      const range = { minDays: 3, maxDays: 5 };
      enterStageCd(taskId, range);
      return { ok: true, action: "enterStageCd", reason: "得分足够，进入第三阶段" };
    }
    // 得分不足，进入特殊回合a：先显示提示板S10，然后进入2倍大CD倒计时
    t.stage2!.specialRound = 'a';
    t.roundIndex = 3; // 特殊回合a的回合数为3
    enterRoundBigCd(taskId, 2); // 2倍大CD
    set(`fm:task:${taskId}`, t);
    return { ok: true, action: "showPromptS10", reason: "得分不足，进入特殊回合a，显示提示板S10" };
  } else if (roundNumber === 1) {
    // 第一回合后，进入第二回合
    return { ok: true, action: "enterRound2", reason: "第一回合结束，进入第二回合" };
  } else if (t.stage2.specialRound === 'a') {
    // 特殊回合a后判分
    if (stageScore === firstTwoRoundsTotal) {
      if (roundNumber < 4) {
        // 显示提示板S11（坚持/放弃）
        return { ok: true, action: "showPromptS11", reason: "得分相等且回合<4，显示提示板S11" };
      } else {
        // 15天倒计时，显示提示板S13
        const range = { minDays: 15, maxDays: 15 };
        enterStageCd(taskId, range);
        return { ok: true, action: "showPromptS13", reason: "得分相等且回合≥4，15天倒计时" };
      }
    } else if (stageScore < firstTwoRoundsTotal) {
      // 得分不足，显示提示板S14（15天倒计时）
      const range = { minDays: 15, maxDays: 15 };
      enterStageCd(taskId, range);
      return { ok: true, action: "showPromptS14", reason: "得分不足，15天倒计时" };
    } else {
      // 得分 > 前两回合总分，进入阶段CD
      const range = { minDays: 3, maxDays: 5 };
      enterStageCd(taskId, range);
      return { ok: true, action: "enterStageCd", reason: "得分超过前两回合总分，进入第三阶段" };
    }
  } else if (t.stage2.specialRound === 'b') {
    // 特殊回合b后判分
    if (stageScore === firstTwoRoundsTotal) {
      // 15天倒计时，显示提示板S13
      const range = { minDays: 15, maxDays: 15 };
      enterStageCd(taskId, range);
      return { ok: true, action: "showPromptS13", reason: "特殊回合b得分相等，15天倒计时" };
    } else if (stageScore < firstTwoRoundsTotal) {
      // 得分不足，显示提示板S14（15天倒计时）
      const range = { minDays: 15, maxDays: 15 };
      enterStageCd(taskId, range);
      return { ok: true, action: "showPromptS14", reason: "特殊回合b得分不足，15天倒计时" };
    } else {
      // 得分 > 前两回合总分，进入阶段CD
      const range = { minDays: 3, maxDays: 5 };
      enterStageCd(taskId, range);
      return { ok: true, action: "enterStageCd", reason: "特殊回合b得分超过，进入第三阶段" };
    }
  }

  return { ok: true, action: "continue", reason: "继续当前回合" };
}

// ==================== 第三阶段核心函数 ====================

/**
 * 进入第三阶段
 */
export function enterStage3(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  // 初始化第三阶段数据
  t.stageIndex = 3;
  t.roundIndex = 0;
  t.stepIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = 2; // 第三阶段阈值X=2（可配置）
  t.status = "active";

  // 初始化第三阶段特定数据
  t.stage3 = {
    roundScores: [],
    secondRoundScore: 0,
    specialRound: null,
    skipOpening: false,
    usedContentLibs: []
  };

  // 清除阶段CD
  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  updateLastAction(taskId);

  console.log('[enterStage3] 任务进入第三阶段:', taskId);
  return { ok: true, task: t };
}

/**
 * 开始第三阶段回合
 */
export function startStage3Round(taskId: string, roundNumber: number) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage3) return { ok: false, reason: "任务不在第三阶段" };

  // 设置当前回合并清理上一回合的临时状态
  t.roundIndex = roundNumber;
  t.opponentFindUsedInRound = false;
  t.zUnlockAt = null;
  t.dMode = false;
  t.roundCdUnlockAt = null;
  t.currentLibChain = null;

  // 第三阶段内容库：S12-S16，前两回合随机抽取
  const availableContentLibs = ["S12", "S13", "S14", "S15", "S16"];
  const unusedLibs = availableContentLibs.filter(lib => !t.stage3!.usedContentLibs.includes(lib));

  let contentLibId: string;
  let openingLibId = "S2";
  let leavingLibId = "S5";

  if (roundNumber <= 2) {
    // 前两回合随机抽取
    if (unusedLibs.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedLibs.length);
      contentLibId = unusedLibs[randomIndex];
      t.stage3.usedContentLibs.push(contentLibId);
    } else {
      contentLibId = "S12"; // 默认
    }
  } else {
    // 特殊回合使用S3.5
    contentLibId = "S3.5";
    openingLibId = "S3.5";
    leavingLibId = "S3.5";
  }

  // 检查是否跳过开场库
  if (t.stage3.skipOpening) {
    openingLibId = "";
  }

  // 初始化当前链：优先开场库，其次内容库
  const libs: Libs = get("fm:libs");
  if (openingLibId) {
    const oc = pickChain(libs.opening, openingLibId);
    if (oc) setCurrentChain(t, "opening", openingLibId, oc);
  } else {
    const cc = pickChain(libs.content, contentLibId);
    if (cc) setCurrentChain(t, "content", contentLibId, cc);
  }

  console.log(`[startStage3Round] 开始第${roundNumber}回合:`, { openingLibId, contentLibId, leavingLibId });

  set(`fm:task:${taskId}`, t);
  return { ok: true, openingLibId, contentLibId, leavingLibId };
}

/**
 * 检查第三阶段回合转换
 */
export function checkStage3RoundTransition(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage3) return { ok: false, reason: "任务不在第三阶段" };

  const roundNumber = t.roundIndex || 0;
  const stageScore = t.stageScore;
  const secondRoundScore = t.stage3.secondRoundScore;

  console.log(`[checkStage3RoundTransition] 检查第${roundNumber}回合后的转换:`, {
    stageScore,
    secondRoundScore,
    thresholdX: t.stageThresholdX
  });

  if (roundNumber === 2) {
    // 第二回合后判分
    t.stage3.secondRoundScore = stageScore; // 记录第二回合得分
    set(`fm:task:${taskId}`, t);

    if (stageScore > t.stageThresholdX) {
      // 直接进入第四阶段（无阶段CD）
      enterStage4(taskId);
      return { ok: true, action: "enterStage4", reason: "得分足够，直接进入第四阶段" };
    }
    // 得分不足，提示板S15，然后进入特殊回合a
    return { ok: true, action: "showPromptS15", reason: "得分不足，询问是否坚持" };
  } else if (roundNumber === 1) {
    // 第一回合后，进入第二回合
    return { ok: true, action: "enterRound2", reason: "第一回合结束，进入第二回合" };
  } else if (t.stage3.specialRound === 'a') {
    // 特殊回合a后判分
    if (stageScore === secondRoundScore) {
      if (roundNumber < 4) {
        // 显示提示板S16（坚持/放弃）
        return { ok: true, action: "showPromptS16", reason: "得分相等且回合<4，显示提示板S16" };
      } else {
        // 提示板S17（半价重开/结束任务）
        return { ok: true, action: "showPromptS17", reason: "得分相等且回合≥4，显示提示板S17" };
      }
    } else if (stageScore < secondRoundScore) {
      // 得分不足，提示板S18（半价重开/结束任务）
      return { ok: true, action: "showPromptS18", reason: "得分不足，显示提示板S18" };
    } else {
      // 得分 > 第2回合得分，直接进入第四阶段
      enterStage4(taskId);
      return { ok: true, action: "enterStage4", reason: "得分超过第2回合，进入第四阶段" };
    }
  } else if (t.stage3.specialRound === 'b') {
    // 特殊回合b后判分
    if (stageScore === secondRoundScore) {
      // 提示板S17（半价重开/结束任务）
      return { ok: true, action: "showPromptS17", reason: "特殊回合b得分相等，显示提示板S17" };
    } else if (stageScore < secondRoundScore) {
      // 得分不足，提示板S18（半价重开/结束任务）
      return { ok: true, action: "showPromptS18", reason: "特殊回合b得分不足，显示提示板S18" };
    } else {
      // 得分 > 第2回合得分，直接进入第四阶段
      enterStage4(taskId);
      return { ok: true, action: "enterStage4", reason: "特殊回合b得分超过，进入第四阶段" };
    }
  }

  return { ok: true, action: "continue", reason: "继续当前回合" };
}

/**
 * 半价重开任务
 */
export function halfPriceRestart(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  // 计算半价费用（5天任务的50%）
  const halfPrice = 138 * 0.5; // 5天任务价格的50%

  // TODO: 检查余额是否足够
  // TODO: 扣除余额

  // 创建新任务
  const newTaskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newTask: Task = {
    ...t,
    id: newTaskId,
    createdAt: Date.now(),
    durationDays: 5,
    expireAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
    isRestartHalfPrice: true,
    stageIndex: 0,
    roundIndex: null,
    stepIndex: 0,
    stageScore: 0,
    totalScore: 0,
    status: "active"
  };

  // 保存新任务
  set(`fm:task:${newTaskId}`, newTask);

  // 更新任务列表
  const tasks: string[] = get("fm:tasks") || [];
  tasks.push(newTaskId);
  set("fm:tasks", tasks);

  // 删除旧任务
  t.status = "deleted";
  set(`fm:task:${taskId}`, t);

  console.log('[halfPriceRestart] 半价重开任务:', { oldTaskId: taskId, newTaskId, halfPrice });
  return { ok: true, newTaskId, halfPrice };
}

// ==================== 第四阶段核心函数 ====================

/**
 * 进入第四阶段
 */
export function enterStage4(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  // 初始化第四阶段数据
  t.stageIndex = 4;
  t.roundIndex = null; // 第四阶段没有回合
  t.stepIndex = 0;
  t.status = "active";

  // 初始化第四阶段特定数据
  t.stage4 = {
    invitationAttempts: 0,
    invitationSuccess: false,
    multiChatUsed: false,
    goClicked: false,
    returnedFromStage3: false
  };

  // 清除阶段CD
  t.stageCdUnlockAt = null;
  t.listCountdownEndAt = null;
  t.listBadge = "聊天任务进行中";

  set(`fm:task:${taskId}`, t);
  updateLastAction(taskId);

  console.log('[enterStage4] 任务进入第四阶段:', taskId);
  return { ok: true, task: t };
}

/**
 * 处理邀约
 */
export function handleInvitation(taskId: string, success: boolean) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage4) return { ok: false, reason: "任务不在第四阶段" };

  t.stage4.invitationAttempts += 1;
  t.stage4.invitationSuccess = success;

  console.log(`[handleInvitation] 邀约${success ? '成功' : '失败'}:`, {
    attempts: t.stage4.invitationAttempts,
    success
  });

  set(`fm:task:${taskId}`, t);

  if (success) {
    // 邀约成功，返回内容库S18
    return { ok: true, action: "showContentS18", contentLibId: "S18" };
  } else {
    // 邀约失败
    if (t.stage4.invitationAttempts <= 2) {
      // 失败次数≤2，进入CD
      const cdMultiplier = t.stage4.invitationAttempts === 1 ? 3 : 5;
      return { ok: true, action: "enterBigCd", cdMultiplier };
    } else {
      // 失败次数>2，显示提示板S25
      return { ok: true, action: "showPromptS25", reason: "邀约失败超过2次" };
    }
  }
}

/**
 * 多聊一次（返回第三阶段）
 */
export function handleMultiChat(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage4) return { ok: false, reason: "任务不在第四阶段" };

  if (t.stage4.multiChatUsed) {
    return { ok: false, reason: "多聊一次已使用过" };
  }

  t.stage4.multiChatUsed = true;
  t.stage4.returnedFromStage3 = true;

  // 临时返回第三阶段
  t.stageIndex = 3;
  t.roundIndex = (t.roundIndex || 0) + 1;

  console.log('[handleMultiChat] 多聊一次，返回第三阶段');

  set(`fm:task:${taskId}`, t);
  return { ok: true, action: "returnToStage3" };
}

/**
 * 完成多聊一次，返回第四阶段
 */
export function finishMultiChat(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t || !t.stage4) return { ok: false, reason: "任务不在第四阶段" };

  // 返回第四阶段
  t.stageIndex = 4;
  t.roundIndex = null;

  console.log('[finishMultiChat] 多聊一次结束，返回第四阶段');

  set(`fm:task:${taskId}`, t);
  return { ok: true, action: "showPromptS20" };
}

/**
 * 结束任务
 */
export function finishTask(taskId: string) {
  initDefaults();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };

  // 业务约定：用户关闭任务后，列表中应不再显示
  // 因此这里将任务标记为 deleted，并从 fm:tasks 中移除
  t.status = "deleted";
  t.listBadge = "聊天任务进行中";
  t.listCountdownEndAt = null;
  set(`fm:task:${taskId}`, t);
  // 同步移除任务ID，确保 listTasks 不再返回
  const ids: string[] = (get("fm:tasks") as string[]) || [];
  set("fm:tasks", ids.filter((i) => i !== taskId));

  console.log('[finishTask] 任务关闭并从列表移除:', taskId);
  return { ok: true };
}