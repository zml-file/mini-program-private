import { getCountdownTimeMs } from '@/config';

// Unfamiliar (不熟) module local engine — isolated from familiar module
// Storage key prefix: um:

// Types (minimal subset used by round-local.vue and list.vue)
type TaskStatus = 'active' | 'finished' | 'deleted';

type ChainNodeType = 'content' | 'Z' | 'D' | 'AZ' | 'AD';
export interface ChainNode {
  type: ChainNodeType;
  text?: string;
}
export type Chain = ChainNode[];

export interface CurrentLibChain {
  type: 'opening' | 'content' | 'leaving' | 'opponent' | 'qa';
  libId: string;
  nodeIndex: number;
  segmentsCopied: number;
}

export interface Task {
  id: string;
  name: string;
  createdAt: number;
  durationDays: number;
  expireAt: number;
  status: TaskStatus;
  stageIndex: number; // 1..4 for 本模块，默认直接从1开始
  roundIndex: number | null; // 当前回合（0基，0表示未开始第一回合）
  stepIndex: number;
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
  usedLibIdsByStage: Record<number, { content: string[]; opening?: string[]; leaving?: string[]; opponent?: string[]; qa?: string[] }>;
  currentLibChain: CurrentLibChain | null;
  opponentFindUsedInRound: boolean;
  qaVipMaxItems?: number;
  questionnaire?: any;
  prompts?: Record<string, any>;
  askFlow?: Record<string, any>;
  renewHistory: Array<{ days: number; cost: number; at: number; success: boolean }>;
  listBadge: string;
  listCountdownEndAt: number | null;
  nextOpponentFindLibId?: string;
  // 新增：提示板状态
  waitingForPrompt: boolean; // 是否正在等待提示板确认
  promptType: string | null; // 当前提示板类型（如 'friend_added'）
  friendAdded: boolean; // 对方是否已添加好友（用于第一回合）
  // 标签选择相关
  availableTagOptions: Array<{ id: string; label: string; type: 'opening' | 'content' | 'leaving' }>; // 当前可选的4个标签选项
  selectedTagId: string | null; // 用户选择的标签ID
}

export interface Libs {
  opening: Record<string, Chain[]>;
  content: Record<string, Chain[]>;
  leaving: Record<string, Chain[]>;
  opponent: Record<string, Chain[]>;
  qa?: Record<string, any[]>;
}

export interface Settings {
  stageThresholdX: Record<number, number>;
  cd: {
    smallCopyCdMs: number;
    bigRoundMinMs: number;
    opponentFindWaitMs: number;
    opponentFindCopyEnableMs: number;
    idleWarnMs: number;
    idleForceCdMs: number;
    zDurationByStage: { minMs: number; maxMs: number }[]; // index by stage
  };
}

// Storage helpers
function get<T = any>(k: string): T { return uni.getStorageSync(k) as T; }
function set(k: string, v: any) { uni.setStorageSync(k, v); }

// Init defaults (idempotent)
export function initUmLocal() {
  if (!get('um:settings')) {
    const settings: Settings = {
      stageThresholdX: { 0: 10, 1: 2, 2: 2, 3: 2, 4: 0 },
      cd: {
        smallCopyCdMs: getCountdownTimeMs(3000),
        bigRoundMinMs: getCountdownTimeMs(15 * 60 * 1000),
        opponentFindWaitMs: getCountdownTimeMs(20 * 1000),
        opponentFindCopyEnableMs: getCountdownTimeMs(20 * 1000),
        idleWarnMs: getCountdownTimeMs(60 * 1000),
        idleForceCdMs: getCountdownTimeMs(5 * 60 * 1000),
        zDurationByStage: [
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
        ],
      },
    };
    set('um:settings', settings);
  }
  if (!get('um:libs')) {
    const libs: Libs = {
      opening: {
        // 开库B1 - 第一回合开场（初次联系，轻松自然）
        B1: [[
          { type: 'content', text: '{对方称呼}，你好呀@我是做美甲的@看到你朋友圈发的照片@感觉你挺有品味的@想认识一下Z', splitBy: '@' },
        ]],
        // 开库B2 - 第二回合开场（建立熟悉感，分享新鲜事）
        B2: [[
          { type: 'content', text: '嗨{对方称呼}@上次和你聊得挺开心的@今天店里发生了件有意思的事@想和你分享一下Z', splitBy: '@' },
        ]],
        // 开库B3 - 第三回合开场（深入交流，寻找共同话题）
        B3: [[
          { type: 'content', text: '{对方称呼}@这几天我一直在想@咱们聊天的时候提到的那个话题@我有了一些新的想法@想听听你的看法', splitBy: '@' },
        ]],
        // 开库B1.5 - 第四回合开场（坦诚表达，情感升温）
        'B1.5': [[
          { type: 'content', text: '{对方称呼}@我想和你坦诚地聊一次@这段时间和你的交流@让我觉得特别舒服@我很珍惜咱们的这种关系', splitBy: '@' },
        ]],
        // 开库B4 - 第三阶段开场（关系进阶，更深入的交流）
        B4: [[
          { type: 'content', text: '{对方称呼}@经过这段时间的了解@我觉得咱们可以聊得更深入一些@有些话我一直想和你说@不知道你愿不愿意听Z', splitBy: '@' },
        ]],
      },
      content: {
        // 内容库B1 - 第一回合内容（初次接触，分享工作日常，轻松话题）
        'B1': [[
          { type: 'content', text: '今天店里来了个客人@她说想做个适合约会的款式@我给她推荐了裸粉色加细闪@（简约但不失精致&///既优雅又不会太夸张++）@她特别满意@你平时会做美甲吗？AZ', splitBy: '@' },
        ]],
        // 内容库B2 - 第二回合内容（展示专业性，分享美甲知识）
        'B2': [[
          { type: 'content', text: '最近很多客人问我@指甲油胶和甲油有什么区别@其实区别挺大的@（甲油胶更持久，能保持2-3周&///普通甲油一般只能保持3-5天++）@而且甲油胶对指甲的伤害更小@你之前了解过这些吗？AZ', splitBy: '@' },
        ]],
        // 内容库B3 - 第三回合内容（分享审美理念，建立价值观共鸣）
        'B3': [[
          { type: 'content', text: '我一直觉得@美甲不只是装饰@更是一种自我表达@（有的人喜欢张扬的款式，展现个性&///有的人喜欢低调的设计，体现品味++）@每个人的选择都反映了她的生活态度@你是什么风格的人呢？AZ', splitBy: '@' },
        ]],
        // 内容库B1.5 - 第四回合特殊内容（坦诚沟通，表达好感）
        'B1.5': [[
          { type: 'content', text: '和你聊了这么久@我发现咱们挺聊得来的@（你的想法很独特，让我看到不同的视角&///和你交流让我觉得很舒服++）@其实我平时不太会主动和人聊这么多@但和你聊天我觉得特别自然@希望咱们能继续保持联系AZ', splitBy: '@' },
        ]],
        // 内容库B4 - 第二阶段内容（分享美甲趋势，展示专业性）
        'B4': [[
          { type: 'content', text: '最近美甲圈流行的款式变化挺大的@从简约风到复古风都有@（我觉得选择适合自己的最重要&///盲目跟风反而会失去个人特色++）@你平时会关注这些流行趋势吗？AZ', splitBy: '@' },
        ]],
        // 内容库B5 - 第二阶段内容（分享客户故事，建立共鸣）
        'B5': [[
          { type: 'content', text: '前几天有个客人@她说做完美甲后整个人都自信了@（我觉得美甲不只是装饰&///更是一种自我表达和心情调节++）@你有没有类似的体验？AZ', splitBy: '@' },
        ]],
        // 内容库B6 - 第二阶段内容（分享护理知识，提供价值）
        'B6': [[
          { type: 'content', text: '很多人做完美甲后不知道怎么保养@其实日常护理很重要@（避免长时间泡水&///定期涂护甲油++）@这些小细节能让美甲保持更久@你平时会注意这些吗？AZ', splitBy: '@' },
        ]],
        // 内容库B7 - 第二阶段内容（分享色彩搭配，展示审美）
        'B7': [[
          { type: 'content', text: '我发现色彩搭配真的很有讲究@不同的颜色能传递不同的情绪@（暖色系显得热情活泼&///冷色系显得优雅沉稳++）@你更喜欢哪种风格？AZ', splitBy: '@' },
        ]],
        // 内容库B8 - 第二阶段内容（分享季节款式，引发兴趣）
        'B8': [[
          { type: 'content', text: '每个季节适合的美甲款式都不一样@春天适合清新的花朵图案@（夏天可以尝试亮色系&///秋冬更适合深色调++）@你会根据季节换款式吗？AZ', splitBy: '@' },
        ]],
        // 内容库B9 - 第二阶段内容（分享手部护理，展示细心）
        'B9': [[
          { type: 'content', text: '其实手部护理和美甲一样重要@很多人只关注指甲@（却忽略了手部皮肤的保养&///定期做手膜效果会很明显++）@你平时会做手部护理吗？AZ', splitBy: '@' },
        ]],
        // 内容库B10 - 第二阶段内容（分享工作感悟，建立情感连接）
        'B10': [[
          { type: 'content', text: '做美甲师这些年@我最大的收获不只是技术的提升@（更多的是和客人之间的情感交流&///每个人都有自己的故事++）@你的工作中有类似的体验吗？AZ', splitBy: '@' },
        ]],
        // 内容库B11 - 第三阶段内容（分享创业故事，展示奋斗精神）
        'B11': [[
          { type: 'content', text: '其实我刚开始做美甲的时候@也经历过很多困难@（技术不够熟练，客源也不稳定&///但我一直坚持学习和改进++）@现在回想起来@那段经历让我成长了很多@你有过类似的经历吗？AZ', splitBy: '@' },
        ]],
        // 内容库B12 - 第三阶段内容（分享生活态度，建立价值观共鸣）
        'B12': [[
          { type: 'content', text: '我一直觉得@生活需要一些仪式感@（不管多忙都要留时间给自己&///做美甲、喝咖啡、看书++）@这些小事能让人保持好心情@你平时会怎么放松自己？AZ', splitBy: '@' },
        ]],
        // 内容库B13 - 第三阶段内容（分享审美理念，展示品味）
        'B13': [[
          { type: 'content', text: '我发现真正的美@不在于多么华丽复杂@（而在于是否适合自己&///简约也可以很高级++）@这种审美理念@不只适用于美甲@生活中很多事情都是这样@你认同吗？AZ', splitBy: '@' },
        ]],
        // 内容库B14 - 第三阶段内容（分享未来规划，展示上进心）
        'B14': [[
          { type: 'content', text: '我最近在考虑@要不要开一家自己的美甲店@（虽然会很辛苦&///但我想做点自己真正喜欢的事++）@你对未来有什么规划吗？@我们可以互相鼓励AZ', splitBy: '@' },
        ]],
        // 内容库B15 - 第三阶段内容（表达欣赏，建立情感连接）
        'B15': [[
          { type: 'content', text: '和你聊天我发现@你是个很有想法的人@（你的观点总是很独特&///让我看到了不同的视角++）@这种交流让我觉得很舒服@希望以后能经常聊AZ', splitBy: '@' },
        ]],
        // 内容库B16 - 第三阶段内容（分享有趣经历，增加亲密感）
        'B16': [[
          { type: 'content', text: '上周有个特别有意思的事@有个客人要求做超复杂的款式@（我花了三个小时才完成&///但看到她满意的笑容++）@我觉得所有的努力都值得了@你工作中有过这种成就感吗？AZ', splitBy: '@' },
        ]],
        // 内容库B17 - 第三阶段内容（探索共同兴趣，深化关系）
        'B17': [[
          { type: 'content', text: '我平时除了做美甲@还喜欢摄影和旅行@（喜欢记录生活中的美好瞬间&///也喜欢探索不同的地方++）@你有什么兴趣爱好吗？@说不定我们有共同的话题AZ', splitBy: '@' },
        ]],
        // 内容库B18 - 第三阶段内容（展示优点，但保持谦虚）
        'B18': [[
          { type: 'content', text: '朋友们都说我是个挺靠谱的人@（做事认真负责&///对朋友也很真诚++）@虽然有时候会有点完美主义@但我觉得这样才能把事情做好@你是什么性格的人？AZ', splitBy: '@' },
        ]],
        // 内容库B19 - 第三阶段内容（表达珍惜，为邀约铺垫）
        'B19': [[
          { type: 'content', text: '这段时间和你的交流@我觉得特别珍贵@（你的想法总能给我启发&///和你聊天让我很放松++）@我一直在想@如果有机会@我们可以线下见个面@一起喝杯咖啡聊聊天@你觉得怎么样？AZ', splitBy: '@' },
        ]],
        // 第四阶段邀约内容库B20 - 马上邀约时发送（美甲师邀约）
        'B20': [[
          { type: 'content', text: '和你聊了这么久@我觉得咱们挺投缘的@（其实我一直想请你来店里坐坐&///我想请你喝杯咖啡，顺便给你做个美甲++）@你看这周还是下周有空？AZ', splitBy: '@' },
        ]],
        // 第四阶段邀约成功后的内容库B21
        'B21': [[
          { type: 'content', text: '太好了，那就这么说定了@到时候我给你准备点小惊喜@（我会提前准备好你喜欢的款式&///到时候咱们可以边做美甲边聊天++）@很期待见到你AZ', splitBy: '@' },
        ]],
      },
      leaving: {
        // 离库B1 - 第一回合离开（礼貌结束，留下好印象）
        'B1': [[
          { type: 'content', text: 'FF那先不打扰你了，有空再聊LLFF如果你对美甲感兴趣，随时可以找我LLFF我先忙了，改天见LL', splitBy: '@' },
        ]],
        // 离库B2 - 第二回合离开（表达期待，保持联系）
        'B2': [[
          { type: 'content', text: '（好的，那你先忙，咱们下次再聊&///行，那就这样，有空联系++）@（下次给你看看我最近做的新款式&///期待下次和你聊天++）@（那就先这样啦，拜拜&///好的，回见++）', splitBy: '@' },
        ]],
        // 离库B3 - 第三回合离开（表达理解和珍惜）
        'B3': [[
          { type: 'content', text: 'FF理解，那你先忙你的，不着急LLFF没关系，咱们可以慢慢聊LLFF好的，那就先这样，记得保持联系哦LL', splitBy: '@' },
        ]],
        // 离库B4 - 第三阶段离开（期待回复，留有余地）
        'B4': [[
          { type: 'content', text: '（好的，我明白了，那就先这样&///行，我知道了，咱们保持联系++）@（你可以好好想想&///期待你的消息++）@（那就先不打扰了，拜拜&///好的，再见++）', splitBy: '@' },
        ]],
        // 离库B5 - 备用离库（尊重对方选择）
        'B5': [[
          { type: 'content', text: 'FF我理解你的想法，没关系的LLFF咱们可以继续做朋友LLFF好的，那就这样吧，有缘再聊LL', splitBy: '@' },
        ]],
      },
      opponent: {
        // 第二阶段对主动库B2（对方主动联系）
        'B2': [[
          { type: 'content', text: '哎呀，你主动找我聊天我挺开心的@最近店里挺忙的@（正好想找个人聊聊天&///你来得正好++）@你最近怎么样？AZ', splitBy: '@' },
        ]],
        // 第三阶段对主动库B3（对方主动联系，更亲密）
        'B3': [[
          { type: 'content', text: '看到你的消息我挺惊喜的@这段时间一直想和你聊聊@（你主动找我让我很开心&///说明咱们还是挺有缘的++）@有什么想聊的吗？AZ', splitBy: '@' },
        ]],
        // 对方找B20 - 对方主动联系时的回复（美甲师回应）
        'B20': [[
          { type: 'content', text: '哎呀，真巧，我正想找你呢@你怎么突然想起联系我了？@（是想了解美甲的事情吗？&///还是单纯想聊聊天？++）@不管怎样，我都很高兴你能主动找我AZ', splitBy: '@' },
        ]],
        // 对方找B21 - 对方询问美甲相关问题时的回复
        'B21': [[
          { type: 'content', text: '关于你问的这个问题@我可以给你详细讲讲@（从专业角度来说&///根据我的经验++）@你还有什么想了解的吗？AZ', splitBy: '@' },
        ]],
        // 对方找B22 - 对方表达兴趣时的回复
        'B22': [[
          { type: 'content', text: '太好了，我就知道你会感兴趣@那我们可以深入聊聊@（我可以给你看看我最近做的一些作品&///我觉得有几款特别适合你++）@你想先了解哪方面？AZ', splitBy: '@' },
        ]],
      },
      qa: {
        'B1': [
          { id: 'B1-1', question: '如果对方回复比较冷淡怎么办？', answer: '可以先顺着对方的话简单回应，然后分享一些有趣的美甲案例或小知识，避免一下子聊太私人的话题。' },
          { id: 'B1-2', question: '如果对方对美甲不感兴趣怎么办？', answer: '可以转移话题，聊聊生活、工作或兴趣爱好，不要一直围绕美甲话题。' },
          { id: 'B1-3', question: '如何自然地展示自己的专业性？', answer: '可以在聊天中自然地分享一些专业知识，比如护理技巧、色彩搭配等，但不要显得太刻意。' },
        ],
        'B2': [
          { id: 'B2-1', question: '如果对方很久才回消息？', answer: '可以用轻松的方式接着之前的话题，比如"刚才想到一个有趣的事想和你分享"，不用追问对方为什么晚回。' },
          { id: 'B2-2', question: '如何判断对方是否对我有好感？', answer: '观察对方的回复速度、内容长度和主动性。如果对方经常主动找你聊天，回复及时且内容丰富，说明有好感。' },
          { id: 'B2-3', question: '什么时候可以提出见面？', answer: '当你们已经聊了一段时间，对方对你的工作和生活都有一定了解，且聊天氛围轻松愉快时，可以自然地提出见面。' },
        ],
        'B3': [
          { id: 'B3-1', question: '如果对方突然不想聊了？', answer: '可以先尊重对方的状态，说"理解，那你先忙，有空再聊"，过几天再找个轻松的话题重新开始。' },
          { id: 'B3-2', question: '如何让对话更有深度？', answer: '可以分享一些自己的真实想法和经历，询问对方的观点和感受，避免只停留在表面的寒暄。' },
          { id: 'B3-3', question: '如果对方拒绝了邀约怎么办？', answer: '保持大方得体，说"没关系，以后有机会再约"，不要表现出失望或不满，继续保持友好的联系。' },
        ],
      },
    };
    set('um:libs', libs);
  }
  if (!get('um:tasks')) set('um:tasks', [] as string[]);
}

function genId() { return 'um_' + Date.now() + '_' + Math.floor(Math.random() * 10000); }

// Public list API
export function listTasks(): { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] {
  initUmLocal();
  const ids: string[] = get('um:tasks') || [];
  const res: { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] = [];
  ids.forEach((id) => {
    const t: Task = get(`um:task:${id}`);
    if (t && t.status !== 'deleted') {
      const badge = computeListBadge(t);
      res.push({ id: t.id, name: t.name, status: t.status, badge: badge.badgeText, countdownEndAt: badge.countdownEndAt || null });
    }
  });
  return res;
}

export function createTask(payload: { name: string; durationDays: number }): { ok: boolean; reason?: string; task?: Task } {
  initUmLocal();
  const { name, durationDays } = payload;
  if (!name || name.trim().length === 0 || name.trim().length > 6) return { ok: false, reason: '名称需1-6字' };
  const id = genId();
  const now = Date.now();
  const expireAt = now + durationDays * 24 * 60 * 60 * 1000;
  const settings: Settings = get('um:settings');

  const task: Task = {
    id,
    name: name.trim(),
    createdAt: now,
    durationDays,
    expireAt,
    status: 'active',
    stageIndex: 1,
    roundIndex: 0, // 初始回合为0，等待提示板确认
    stepIndex: 0,
    stageScore: 0,
    totalScore: 0,
    stageThresholdX: settings.stageThresholdX[1],
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
    qaVipMaxItems: 0,
    questionnaire: {},
    prompts: {},
    askFlow: {},
    renewHistory: [],
    listBadge: '聊天任务进行中',
    listCountdownEndAt: null,
    // 初始状态：等待提示板确认"对方是否已添加好友"
    waitingForPrompt: true,
    promptType: 'friend_added',
    friendAdded: false,
  };

  // 不再自动初始化内容链，等待提示板确认后再初始化

  const ids: string[] = get('um:tasks') || [];
  ids.push(id);
  set('um:tasks', ids);
  set(`um:task:${id}`, task);
  return { ok: true, task };
}

export function getTask(taskId: string): Task | null {
  initUmLocal();
  const t: Task = get(`um:task:${taskId}`);
  return t || null;
}

function pickChain(group: Record<string, Chain[]>, libId: string): Chain | null {
  const arr = group[libId];
  if (!arr || arr.length === 0) return null;
  return arr[0];
}

function setCurrentChain(t: Task, type: CurrentLibChain['type'], libId: string, chain: Chain) {
  t.currentLibChain = { type, libId, nodeIndex: 0, segmentsCopied: 0 };
  markChainUsedInternal(t, libId, type);
}

/**
 * 随机抽取4个标签选项供用户选择
 * @param taskId 任务ID
 * @param tagType 标签类型（opening/content/leaving）
 * @returns 随机抽取的4个标签选项
 */
export function getTagOptions(taskId: string, tagType: 'opening' | 'content' | 'leaving'): Array<{ id: string; label: string; type: 'opening' | 'content' | 'leaving' }> {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return [];

  const libs: Libs = get('um:libs');
  const group = getChainGroupByType(libs, tagType);
  const availableIds = Object.keys(group).filter(id => !isTagUsed(t, id, tagType));

  // 随机抽取4个标签（如果可用不足4个，则全部返回）
  const shuffled = availableIds.sort(() => Math.random() - 0.5);
  const selectedIds = shuffled.slice(0, 4);

  const options = selectedIds.map(id => ({
    id,
    label: getTagLabel(id),
    type: tagType
  }));

  console.log('[getTagOptions] 随机抽取的标签选项:', options);
  return options;
}

/**
 * 用户选择标签
 * @param taskId 任务ID
 * @param tagId 选择的标签ID
 */
export function selectTagOption(taskId: string, tagId: string): { ok: boolean; reason?: string } {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: '任务不存在' };

  const option = t.availableTagOptions.find(opt => opt.id === tagId);
  if (!option) return { ok: false, reason: '标签选项不存在' };

  // 设置当前选择的标签
  t.selectedTagId = tagId;

  // 根据选择的标签初始化当前链
  const libs: Libs = get('um:libs');
  const chain = pickChain(getChainGroupByType(libs, option.type), tagId);
  if (chain) {
    setCurrentChain(t, option.type, tagId, chain);
    console.log('[selectTagOption] 用户选择标签:', tagId, 'type:', option.type);
  } else {
    console.error('[selectTagOption] 找不到标签链:', tagId);
    return { ok: false, reason: '标签内容不存在' };
  }

  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);
  return { ok: true };
}

/**
 * 检查标签是否已使用过
 */
function isTagUsed(t: Task, tagId: string, tagType: 'opening' | 'content' | 'leaving'): boolean {
  const stage = t.stageIndex;
  if (!t.usedLibIdsByStage[stage]) return false;

  const usedLibs = t.usedLibIdsByStage[stage];
  if (tagType === 'opening') {
    return usedLibs.opening?.includes(tagId) || false;
  } else if (tagType === 'content') {
    return usedLibs.content?.includes(tagId) || false;
  } else if (tagType === 'leaving') {
    return usedLibs.leaving?.includes(tagId) || false;
  }
  return false;
}

/**
 * 获取标签的显示名称
 */
function getTagLabel(tagId: string): string {
  // 根据标签ID返回友好的显示名称
  // 可以根据实际需求定制
  return tagId;
}

// Points and progress
export function addPoint(taskId: string, amount: number) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return;
  t.stageScore += amount; t.totalScore += amount; t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);
}

export function copySegment(taskId: string): { ok: boolean; reason?: string } {
  initUmLocal();
  const t = getTask(taskId);
  if (!t || !t.currentLibChain) return { ok: false, reason: '无当前内容可复制' };
  const settings: Settings = get('um:settings');
  const until = Date.now() + settings.cd.smallCopyCdMs;
  set(`um:clipboard:${taskId}`, { chainId: t.currentLibChain.libId, segmentIndex: t.currentLibChain.segmentsCopied, until });
  t.currentLibChain.segmentsCopied += 1;
  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);
  return { ok: true };
}

export function finishCurrentLibNode(taskId: string) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t || !t.currentLibChain) return;
  t.currentLibChain.nodeIndex += 1;
  t.currentLibChain.segmentsCopied = 0;
  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);
}

// Z/D
export function onZEnter(taskId: string) {
  initUmLocal();
  const t = getTask(taskId); if (!t) return;
  const settings: Settings = get('um:settings');
  const range = settings.cd.zDurationByStage[t.stageIndex] || { minMs: 10000, maxMs: 20000 };
  const dur = randInt(range.minMs, range.maxMs);
  t.zUnlockAt = Date.now() + dur;
  t.listBadge = 'Z倒计时'; t.listCountdownEndAt = t.zUnlockAt;
  set(`um:task:${taskId}`, t);
}
export function onDEnter(taskId: string) {
  initUmLocal();
  const t = getTask(taskId); if (!t) return;
  t.dMode = true; t.listBadge = 'D'; t.listCountdownEndAt = null;
  set(`um:task:${taskId}`, t);
}

// Opponent find
export function onOpponentFindClick(taskId: string, libId = 'B20') {
  initUmLocal();
  const t = getTask(taskId); if (!t) return;
  const libs: Libs = get('um:libs');
  const op = pickChain(libs.opponent, libId);
  if (op) setCurrentChain(t, 'opponent', libId, op);
  const settings: Settings = get('um:settings');
  t.opponentFindUsedInRound = true;
  t.opponentFindUnlockAt = Date.now();
  t.opponentFindCopyUnlockAt = Date.now() + settings.cd.opponentFindCopyEnableMs;
  t.listBadge = '聊天任务进行中'; t.listCountdownEndAt = null;
  set(`um:task:${taskId}`, t);
}

// CDs
export function enterRoundBigCd(taskId: string, multiplier = 1) {
  initUmLocal();
  const t = getTask(taskId); if (!t) return;

  // 特殊处理：第四阶段「多聊一次」返回第三阶段执行的那一个回合完成后，直接回到B12（不再进入大CD）
  if ((t as any).stage4MoreChatStep === 'during_extra_round') {
    console.log('[enterRoundBigCd] 检测到 stage4MoreChatStep=during_extra_round，回到第四阶段B12');
    (t as any).stage4MoreChatStep = 'done';
    t.stageIndex = 4;
    t.roundIndex = 0;
    t.roundCdUnlockAt = null;
    t.stageCdUnlockAt = null;
    t.currentLibChain = null;
    t.zUnlockAt = null;
    t.dMode = false;
    t.waitingForPrompt = true;
    t.promptType = 'stage4_invitation_b12';
    t.listBadge = '等待邀约选择';
    t.listCountdownEndAt = null;
    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
    return;
  }

  const base = (get('um:settings') as Settings).cd.bigRoundMinMs;
  t.roundCdUnlockAt = Date.now() + base * (multiplier || 1);
  t.listBadge = '下次聊天开启倒计时'; t.listCountdownEndAt = t.roundCdUnlockAt; t.currentLibChain = null;
  t.opponentFindUnlockAt = Date.now() + (get('um:settings') as Settings).cd.opponentFindWaitMs;
  t.opponentFindCopyUnlockAt = t.opponentFindUnlockAt + (get('um:settings') as Settings).cd.opponentFindCopyEnableMs;
  t.opponentFindUsedInRound = false;
  set(`um:task:${taskId}`, t);
}

export function enterStageCd(taskId: string, daysRange: { minDays: number; maxDays: number }) {
  initUmLocal();
  const t = getTask(taskId); if (!t) return;
  const days = randInt(daysRange.minDays, daysRange.maxDays);
  t.stageCdUnlockAt = Date.now() + getCountdownTimeMs(days * 24 * 60 * 60 * 1000);
  t.listBadge = '下次聊天开启倒计时'; t.listCountdownEndAt = t.stageCdUnlockAt; t.currentLibChain = null; t.roundCdUnlockAt = null;
  set(`um:task:${taskId}`, t);
}

// Content access
function getChainGroupByType(libs: Libs, type: CurrentLibChain['type']): Record<string, Chain[]> {
  switch (type) {
    case 'opening': return libs.opening;
    case 'content': return libs.content;
    case 'leaving': return libs.leaving;
    case 'opponent': return libs.opponent;
    default: return {};
  }
}

export async function getCurrentChainContent(taskId: string): Promise<{ contentList: ChainNode[]; statusVo: { sign: '' | 'Z' | 'D' | 'TAG_SELECT' } }> {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return { contentList: [], statusVo: { sign: '' } };
  const libs: Libs = get('um:libs');

  // 检查是否需要用户选择标签
  if (t.availableTagOptions && t.availableTagOptions.length > 0 && !t.selectedTagId) {
    console.log('[getCurrentChainContent] 等待用户选择标签，返回空内容');
    return { contentList: [], statusVo: { sign: 'TAG_SELECT' as any } };
  }

  // 如果没有当前链，尝试根据阶段/回合初始化
  if (!t.currentLibChain) {
    console.log('[getCurrentChainContent] currentLibChain 为 null，尝试重新初始化');

    // 特殊处理：第四阶段
    if (t.stageIndex === 4) {
      const stage4Status = (t as any).stage4Status;
      // 如果第四阶段已经完整结束（例如邀约成功后的收尾），不再回到 B12，直接返回空内容
      if (stage4Status === 'success_finished') {
        console.log('[getCurrentChainContent] 第四阶段已完成，保持空内容');
        return { contentList: [], statusVo: { sign: '' } };
      }
      console.log('[getCurrentChainContent] 当前为第四阶段，调用 reinitializeCurrentChain 回到 B12 提示板');
      reinitializeCurrentChain(taskId);
      return { contentList: [], statusVo: { sign: '' } };
    }

    // 检查是否需要推进到下一回合（仅第1~3阶段）
    if (t.roundIndex === 0 && t.stageIndex > 0 && t.stageIndex !== 4) {
      console.log('[getCurrentChainContent] 回合数为0，推进到第一回合');
      advanceToNextRound(taskId);
      // 重新获取任务数据
      const t2 = getTask(taskId);
      if (t2?.currentLibChain) {
        Object.assign(t, t2);
      } else {
        return { contentList: [], statusVo: { sign: '' } };
      }
    } else {
      // 尝试重新初始化当前链
      reinitializeCurrentChain(taskId);
      // 重新获取任务数据
      const t2 = getTask(taskId);
      if (t2?.currentLibChain) {
        Object.assign(t, t2);
      } else {
        return { contentList: [], statusVo: { sign: '' } };
      }
    }
  }

  // 若当前链已走完，按顺序推进：opening -> 对应回合的 content -> 对应回合的 leaving -> 进入回合大CD
  const advanceIfCompleted = () => {
    // 第四阶段的推进由 advancePastCurrentNode + 提示板逻辑单独控制，
    // 这里不做自动推进，避免与第四阶段逻辑冲突或产生死循环
    if (t.stageIndex === 4) {
      return false;
    }

    const groupCur = getChainGroupByType(libs, t.currentLibChain!.type);
    const chainCur = groupCur?.[t.currentLibChain!.libId]?.[0];
    if (!chainCur) return false;
    if (t.currentLibChain!.nodeIndex >= chainCur.length) {
      // 根据当前阶段和回合，决定下一步应该进入哪个库
      const stage = t.stageIndex;
      const round = t.roundIndex || 0;

      if (t.currentLibChain!.type === 'opening') {
        let nextContentId = '';
        if (stage === 1) {
          // 第一阶段：文档 2.1.1.1
          if (round === 1) nextContentId = 'B1';
          else if (round === 2) nextContentId = 'B2';
          else if (round === 3) nextContentId = 'B3';
          else if (round === 4) nextContentId = 'B1.5';
        } else if (stage === 2) {
          // 第二阶段：简化实现，按文档固定 B4/B5
          if (round === 1 || round === 2) nextContentId = 'B4';
          else if (round === 3) nextContentId = 'B5';
        } else if (stage === 3) {
          // 第三阶段：统一使用 B11~B19 中的一个，这里先用 B11
          nextContentId = 'B11';
        }
        if (nextContentId) {
          const next = pickChain(libs.content, nextContentId);
          if (next) setCurrentChain(t, 'content', nextContentId, next);
        }
      } else if (t.currentLibChain!.type === 'content') {
        let nextLeavingId = '';
        if (stage === 1) {
          if (round === 1) nextLeavingId = 'B1';
          else if (round === 2) nextLeavingId = 'B2';
          else if (round === 3) nextLeavingId = 'B3';
          else if (round === 4) nextLeavingId = 'B2';
        } else if (stage === 2) {
          // 第二阶段离库固定 B3
          nextLeavingId = 'B3';
        } else if (stage === 3) {
          // 第三阶段离库固定 B4
          nextLeavingId = 'B4';
        }
        if (nextLeavingId) {
          const next = pickChain(libs.leaving, nextLeavingId);
          if (next) setCurrentChain(t, 'leaving', nextLeavingId, next);
        }
      } else if (t.currentLibChain!.type === 'leaving') {
        // 离库完成：积分+1并进入回合大CD
        t.stageScore += 1; t.totalScore += 1;
        set(`um:task:${taskId}`, t);
        // 进入回合大CD（内部会持久化并清空 currentLibChain）
        enterRoundBigCd(taskId, 1);
        // 同步本地对象，避免 while 循环因本地 t 未更新而重复推进
        const t2 = getTask(taskId);
        if (t2) {
          (t as any).currentLibChain = t2.currentLibChain;
          (t as any).roundCdUnlockAt = t2.roundCdUnlockAt;
        }
        return true;
      }
      set(`um:task:${taskId}`, t);
      return true;
    }
    return false;
  };

  // 可能多次推进（例如某链为空或瞬间完成）
  let advanced = true;
  while (t.currentLibChain && advanced) {
    advanced = advanceIfCompleted();
    if (advanced && (!t.currentLibChain || t.currentLibChain.type === 'leaving' && t.roundCdUnlockAt)) break;
  }

  if (!t.currentLibChain) return { contentList: [], statusVo: { sign: '' } };

  const group = getChainGroupByType(libs, t.currentLibChain.type);
  const chain = group?.[t.currentLibChain.libId]?.[0];

  // 修复：若在第四阶段内容库（如 B20/B21）中 nodeIndex 已越界（例如早期版本错误推进导致），
  // 则触发 advancePastCurrentNode 的兜底逻辑，避免前端反复“无内容-刷新”死循环
  if (t.stageIndex === 4 && chain && t.currentLibChain.type === 'content' && t.currentLibChain.nodeIndex >= chain.length) {
    console.warn('[getCurrentChainContent] 第四阶段内容链 nodeIndex 越界，触发兜底推进逻辑');
    // 这里相当于执行了一次 Z 倒计时结束后的推进：
    // - 若是 B20：进入邀约结果提示板
    // - 若是 B21：标记第四阶段完成
    advancePastCurrentNode(taskId);
    return { contentList: [], statusVo: { sign: '' } };
  }

  if (chain && t.currentLibChain.nodeIndex < chain.length) {
    const rawNode = chain[t.currentLibChain.nodeIndex];
    let sign: '' | 'Z' | 'D' = '';
    let text = (rawNode as any).text || '';
    if (text) {
      const trimmed = text.trim();
      const patterns: Array<{ suffix: string; sign: 'Z' | 'D' }> = [
        { suffix: 'AZ', sign: 'Z' },
        { suffix: 'AD', sign: 'D' },
        { suffix: 'Z', sign: 'Z' },
        { suffix: 'D', sign: 'D' },
      ];
      for (const p of patterns) {
        if (trimmed.endsWith(p.suffix)) {
          sign = p.sign;
          const re = new RegExp(p.suffix + '\\s*$');
          text = text.replace(re, '').replace(/\s+$/, '');
          break;
        }
      }
    } else {
      // 兼容旧版本：仍然支持结构型 Z/AZ/D/AD 节点
      if (rawNode.type === 'Z' || rawNode.type === 'AZ') sign = 'Z';
      else if (rawNode.type === 'D' || rawNode.type === 'AD') sign = 'D';
    }
    const node = { ...rawNode, text };
    return { contentList: [node], statusVo: { sign } };
  }
  return { contentList: [], statusVo: { sign: '' } };
}

// List badge compute
export function computeListBadge(task: Task): { badgeText: string; countdownEndAt?: number } {
  const now = Date.now();
  if (task.dMode) return { badgeText: 'D' };
  if (task.zUnlockAt && now < task.zUnlockAt) return { badgeText: 'Z倒计时', countdownEndAt: task.zUnlockAt };
  if (task.opponentFindUnlockAt && now < task.opponentFindUnlockAt) return { badgeText: '对方找倒计时', countdownEndAt: task.opponentFindUnlockAt };
  const end = task.roundCdUnlockAt || task.stageCdUnlockAt;
  if (end && now < end) return { badgeText: '下次聊天开启倒计时', countdownEndAt: end };
  return { badgeText: '聊天任务进行中' };
}

function markChainUsedInternal(t: Task, libId: string, type: CurrentLibChain['type']) {
  const s = t.stageIndex;
  if (!t.usedLibIdsByStage[s]) t.usedLibIdsByStage[s] = { content: [] } as any;
  const bucket = t.usedLibIdsByStage[s];
  const pushIf = (arr?: string[]) => { if (!arr) return; if (!arr.includes(libId)) arr.push(libId); };
  if (type === 'content') pushIf(bucket.content);
  if (type === 'opening') { if (!bucket.opening) bucket.opening = []; pushIf(bucket.opening); }
  if (type === 'leaving') { if (!bucket.leaving) bucket.leaving = []; pushIf(bucket.leaving); }
  if (type === 'opponent') { if (!bucket.opponent) bucket.opponent = []; pushIf(bucket.opponent); }
}

// Z倒计时结束后推进到下一个节点
export function advancePastCurrentNode(taskId: string) {
  initUmLocal();
  const t = getTask(taskId); if (!t || !t.currentLibChain) return;

  const libs: Libs = get('um:libs');
  const group = getChainGroupByType(libs, t.currentLibChain.type);
  const chain = group?.[t.currentLibChain.libId]?.[0];

  // 清理Z标记并推进一个节点
  t.zUnlockAt = null;
  t.currentLibChain.nodeIndex += 1;
  t.currentLibChain.segmentsCopied = 0;
  t.lastActionAt = Date.now();

  // 特殊处理：第四阶段 B20/B21 完成后的流程
  if (t.stageIndex === 4 && chain && t.currentLibChain.nodeIndex >= chain.length) {
    if (t.currentLibChain.type === 'content' && t.currentLibChain.libId === 'B20') {
      console.log('[advancePastCurrentNode] 第四阶段 B20 完成，进入邀约结果提示');
      t.currentLibChain = null;
      t.dMode = false;
      t.roundCdUnlockAt = null;
      t.stageCdUnlockAt = null;
      (t as any).stage4Status = 'waiting_result';
      t.waitingForPrompt = true;
      t.promptType = 'stage4_invitation_result';
      t.listBadge = '等待邀约结果';
      t.listCountdownEndAt = null;
    } else if (t.currentLibChain.type === 'content' && t.currentLibChain.libId === 'B21') {
      console.log('[advancePastCurrentNode] 第四阶段 B21 完成，第四阶段结束');
      t.currentLibChain = null;
      t.dMode = false;
      t.roundCdUnlockAt = null;
      t.stageCdUnlockAt = null;
      (t as any).stage4Status = 'success_finished';
      t.waitingForPrompt = true;
      t.promptType = 'stage4_success_finish';
      t.listBadge = '邀约成功';
      t.listCountdownEndAt = null;
    }
  }

  set(`um:task:${taskId}`, t);
}

// 清除对方找库（当页面加载时发现卡在对方找库时调用）
export function clearOpponentChain(taskId: string) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return;
  console.log('[clearOpponentChain] 清除对方找库，stageIndex:', t.stageIndex, 'roundIndex:', t.roundIndex);

  // 清除对方找相关状态
  t.currentLibChain = null;
  t.opponentFindUnlockAt = null;
  t.opponentFindCopyUnlockAt = null;
  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);

  // 调用 reinitializeCurrentChain 重新初始化
  reinitializeCurrentChain(taskId);
}

// 重新初始化 currentLibChain（当 currentLibChain 为 null 但任务已经开始时调用）
export function reinitializeCurrentChain(taskId: string) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return;
  console.log('[reinitializeCurrentChain] stageIndex:', t.stageIndex, 'roundIndex:', t.roundIndex);

  // 特殊处理：第四阶段不按开库规则重建链路，而是回到B12提示板，避免死循环
  if (t.stageIndex === 4) {
    // 如果第四阶段已经完整结束，则不再强制回到 B12
    if ((t as any).stage4Status === 'success_finished') {
      console.log('[reinitializeCurrentChain] 第四阶段已完成，不再重置为 B12');
      return;
    }
    console.log('[reinitializeCurrentChain] 第四阶段 currentLibChain 为空，回到 B12 提示板');
    t.roundCdUnlockAt = null;
    t.stageCdUnlockAt = null;
    t.currentLibChain = null;
    t.zUnlockAt = null;
    t.dMode = false;
    t.waitingForPrompt = true;
    t.promptType = 'stage4_invitation_b12';
    (t as any).stage4Status = 'b12';
    t.roundIndex = 0;
    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
    return;
  }

  // 根据当前阶段和回合，重新初始化 currentLibChain
  const libs: Libs = get('um:libs');

  // 如果当前回合数为0或null，说明还没开始任何回合，需要推进到第一回合
  if (!t.roundIndex || t.roundIndex === 0) {
    console.log('[reinitializeCurrentChain] 回合数为0，推进到第一回合');
    advanceToNextRound(taskId);
  } else {
    // 否则，根据当前阶段和回合，重新初始化开库
    console.log('[reinitializeCurrentChain] 重新初始化开库');
    let openingLibId = '';

    if (t.stageIndex === 1) {
      if (t.roundIndex === 1) openingLibId = 'B1';
      else if (t.roundIndex === 2) openingLibId = 'B2';
      else if (t.roundIndex === 3) openingLibId = 'B2';
      else if (t.roundIndex === 4) openingLibId = 'B1.5';
    } else if (t.stageIndex === 2) {
      if (t.roundIndex === 1 || t.roundIndex === 2) openingLibId = 'B3';
      else if (t.roundIndex === 3) openingLibId = 'B2';
    } else if (t.stageIndex === 3) {
      openingLibId = 'B4';
    }

    if (openingLibId) {
      const chain = pickChain(libs.opening, openingLibId);
      if (chain) {
        setCurrentChain(t, 'opening', openingLibId, chain);
        console.log('[reinitializeCurrentChain] 重新初始化开库:', openingLibId);
      } else {
        console.error('[reinitializeCurrentChain] 找不到开库:', openingLibId);
      }
    } else {
      console.error('[reinitializeCurrentChain] 无法确定开库ID，stageIndex:', t.stageIndex, 'roundIndex:', t.roundIndex);
    }

    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
  }
}

// 回合CD结束后推进到下一回合（按照文档写死所有逻辑）
export function advanceToNextRound(taskId: string) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return;

  console.log('[advanceToNextRound] 当前回合:', t.roundIndex, '阶段:', t.stageIndex, '分数:', t.stageScore);

  // 清除回合CD标记
  t.roundCdUnlockAt = null;

  // 增加回合数
  const currentRound = t.roundIndex || 0;
  const nextRound = currentRound + 1;
  t.roundIndex = nextRound;

  console.log('[advanceToNextRound] 推进到第', nextRound, '回合');

  const libs: Libs = get('um:libs');
  let openingLibId = '';
  let contentLibId = '';
  let leavingLibId = '';

  // ========== 第一阶段逻辑 ==========
  if (t.stageIndex === 1) {
    // 第一阶段只有4个回合
    if (nextRound > 4) {
      console.log('[advanceToNextRound] 第一阶段已完成所有4个回合');
      handleStage1Completion(taskId);
      return;
    }

    // 根据文档 2.1.2.2-2.1.2.5 的库选择规则
    if (nextRound === 1) {
      // 第一回合第一轮：随机抽取4个开库标签供用户选择
      t.availableTagOptions = getTagOptions(taskId, 'opening');
      t.selectedTagId = null;
      t.currentLibChain = null; // 清空当前链，等待用户选择
      t.listBadge = '请选择标签';
      t.listCountdownEndAt = null;
      t.lastActionAt = Date.now();
      set(`um:task:${taskId}`, t);
      console.log('[advanceToNextRound] 第一回合第一轮：设置标签选项供用户选择');
      return;
    } else if (nextRound === 2) {
      openingLibId = 'B2';
      contentLibId = 'B2';
      leavingLibId = 'B2';
    } else if (nextRound === 3) {
      openingLibId = 'B2';
      contentLibId = 'B3';
      leavingLibId = 'B3';
    } else if (nextRound === 4) {
      openingLibId = 'B1.5';
      contentLibId = 'B1.5';
      leavingLibId = 'B2';
    }
  }
  // ========== 第二阶段逻辑 ==========
  else if (t.stageIndex === 2) {
    // 第二阶段有3个回合
    if (nextRound > 3) {
      console.log('[advanceToNextRound] 第二阶段已完成所有3个回合');
      handleStage2Completion(taskId);
      return;
    }

    // 根据文档 2.2.2.2-2.2.2.4 的库选择规则
    if (nextRound === 1 || nextRound === 2) {
      // 第一、二回合相同
      openingLibId = 'B3';
      contentLibId = 'B4'; // 这里应该是 B4.5.6.7.10 中的一个，暂时用 B4
      leavingLibId = 'B3';
    } else if (nextRound === 3) {
      openingLibId = 'B2';
      contentLibId = 'B5'; // 这里应该是 B5.6.7.10 中没被抽取过的 + B8.9
      leavingLibId = 'B3';
    }
  }
  // ========== 第三阶段逻辑 ==========
  else if (t.stageIndex === 3) {
    // 第三阶段有3个回合（但可能从第四阶段返回，仅执行一个“多聊一次”回合）

    // 如果来自第四阶段的“多聊一次”，只执行一个回合
    if ((t as any).stage4MoreChatStep === 'waiting_cd_to_extra_round' && nextRound === 1) {
      console.log('[advanceToNextRound] 来自第四阶段的多聊一次，开始额外回合');
      (t as any).stage4MoreChatStep = 'during_extra_round';
    }

    // 正常第三阶段回合上限为3
    if (nextRound > 3 && !(t as any).stage4MoreChatStep) {
      console.log('[advanceToNextRound] 第三阶段已完成所有3个回合');
      handleStage3Completion(taskId);
      return;
    }

    // 根据文档 2.3.2.2-2.3.2.4 的库选择规则
    // 所有回合都使用相同的库
    openingLibId = 'B4';
    contentLibId = 'B11'; // 这里应该是 B11~B19 中的一个
    leavingLibId = 'B4';
  }

  // 初始化当前链：从开库开始
  if (openingLibId) {
    const oc = pickChain(libs.opening, openingLibId);
    if (oc) {
      setCurrentChain(t, 'opening', openingLibId, oc);
      console.log('[advanceToNextRound] 成功初始化开库:', openingLibId);
    } else {
      console.warn('[advanceToNextRound] 开库不存在:', openingLibId, '可用的开库:', Object.keys(libs.opening));
      // 如果指定的库不存在，尝试使用备选库
      const fallbackId = openingLibId === 'B1' ? 'B1' : 'B1';
      const fallback = pickChain(libs.opening, fallbackId);
      if (fallback) {
        setCurrentChain(t, 'opening', fallbackId, fallback);
        console.log('[advanceToNextRound] 使用备选开库:', fallbackId);
      }
    }
  } else {
    console.warn('[advanceToNextRound] 未设置开库ID，回合:', nextRound);
  }

  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);

  console.log('[advanceToNextRound] 已推进到第', nextRound, '回合，初始化库:', { openingLibId, contentLibId, leavingLibId });
}


// 第一阶段完成后的处理（根据文档 2.1.2.5）
function handleStage1Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage1Completion] 第一阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：进入阶段间CD，阶段CD时间结束，进入第二阶段
    console.log('[handleStage1Completion] 分数 > X，进入阶段间CD');
    enterStageCdToNextStage(taskId, 2);
  } else {
    // 分数 ≤ X：弹出提示板B8询问用户是否坚持
    console.log('[handleStage1Completion] 分数 ≤ X，弹出提示板B8');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage1_b8';
    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
  }
}

// 第二阶段完成后的处理（根据文档 2.2.2.4）
function handleStage2Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage2Completion] 第二阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：回复特殊库B2.5，所有消息回复给客户之后，则进入阶段间CD，CD时间结束，进入第三阶段
    console.log('[handleStage2Completion] 分数 > X，回复特殊库B2.5，进入阶段间CD');
    // TODO: 实现特殊库B2.5的逻辑
    enterStageCdToNextStage(taskId, 3);
  } else {
    // 分数 ≤ X：弹出提示板B9询问用户是否坚持
    console.log('[handleStage2Completion] 分数 ≤ X，弹出提示板B9');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage2_b9';
    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
  }
}

// 第三阶段完成后的处理（根据文档 2.3.2.4 和 2.4.2）
function handleStage3Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage3Completion] 第三阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：直接进入第四阶段
    // 根据文档 2.4.2：第四阶段先显示提示板B12
    console.log('[handleStage3Completion] 分数 > X，直接进入第四阶段，弹出提示板B12');
    t.stageIndex = 4;
    t.roundIndex = 0;
    t.stageScore = 0;

    // 清除所有CD和链状态
    t.roundCdUnlockAt = null;
    t.stageCdUnlockAt = null;
    t.currentLibChain = null;
    t.zUnlockAt = null;
    t.dMode = false;

    // 弹出提示板B12（邀约选择）
    t.waitingForPrompt = true;
    t.promptType = 'stage4_invitation_b12';
    (t as any).stage4Status = 'b12';
    (t as any).stage4InviteFailCount = 0;

    // 更新列表显示
    t.listBadge = '等待邀约选择';
    t.listCountdownEndAt = null;

    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
  } else {
    // 分数 ≤ X：弹出提示板B10询问用户是否坚持
    console.log('[handleStage3Completion] 分数 ≤ X，弹出提示板B10');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage3_b10';
    t.lastActionAt = Date.now();
    set(`um:task:${taskId}`, t);
  }
}

// 统一处理提示板操作（B8/B9/B10 以及 第四阶段 B12）
export function handlePromptAction(taskId: string, promptType: string, action: string) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: '任务不存在' };

  console.log('[handlePromptAction]', { taskId, promptType, action });

  const libs: Libs = get('um:libs');

  const clearPrompt = () => { t.waitingForPrompt = false; t.promptType = null; };

  switch (promptType) {
    case 'persist_stage1_b8': {
      if (action === 'yes') {
        clearPrompt();
        set(`um:task:${taskId}`, t);
        enterStageCdToNextStage(taskId, 2);
      } else {
        // 不再坚持 -> 半价重来（占位，后续可细化为具体B板流程）
        t.waitingForPrompt = true; t.promptType = 'halfprice_restart';
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      }
      break;
    }
    case 'persist_stage2_b9': {
      if (action === 'yes') {
        clearPrompt(); set(`um:task:${taskId}`, t);
        // TODO: 回复特殊库B2.5
        enterStageCdToNextStage(taskId, 3);
      } else {
        t.waitingForPrompt = true; t.promptType = 'halfprice_restart';
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      }
      break;
    }
    case 'persist_stage3_b10': {
      if (action === 'yes') {
        clearPrompt(); set(`um:task:${taskId}`, t);
        enterStageCdToNextStage(taskId, 4);
      } else {
        // B11 引导后进入半价重来链路（占位）
        t.waitingForPrompt = true; t.promptType = 'stage3_b11';
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_invitation_b12': {
      if (action === 'invite_now') {
        // 抽取内容库 B20：第四阶段邀约话术
        clearPrompt();
        const chain = pickChain(libs.content, 'B20');
        if (chain) {
          // 标记：第四阶段第1回合，进入 B20 邀约
          t.stageIndex = 4;
          t.roundIndex = 1;
          (t as any).stage4Status = 'inviting_b20';
          setCurrentChain(t, 'content', 'B20', chain);
        }
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      } else if (action === 'more_chat') {
        // 显示B13（省略实际B13弹窗，直接执行文档逻辑）
        const count = (t as any).stage4MoreChatCount || 0;
        if (count === 0) {
          (t as any).stage4MoreChatCount = 1;
          (t as any).stage4MoreChatStep = 'waiting_cd_to_extra_round';
          // 回到第三阶段，进行一个额外回合：先进入大CD，CD结束后 advanceToNextRound 开始该回合
          t.stageIndex = 3; t.roundIndex = 0; clearPrompt();
          t.currentLibChain = null; t.zUnlockAt = null; t.dMode = false;
          set(`um:task:${taskId}`, t);
          enterRoundBigCd(taskId, 1);
        } else {
          // 非第一次点击：关闭B13，回到B12（保持当前 B12 提示）
          t.waitingForPrompt = true; t.promptType = 'stage4_invitation_b12';
          t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
        }
      } else if (action === 'no_choice') {
        // 保持 B12 弹出，不做状态变更
        t.waitingForPrompt = true; t.promptType = 'stage4_invitation_b12';
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_invitation_result': {
      // 前端目前会传入 key = 'yes' / 'no' / 'no_choice'，
      // 这里兼容两套命名：success/yes 视为邀约成功，fail/no 视为邀约失败
      const isSuccess = action === 'success' || action === 'yes';
      const isFail = action === 'fail' || action === 'no';

      if (isSuccess) {
        // 邀约成功：抽取 B21 内容库
        clearPrompt();
        const chain = pickChain(libs.content, 'B21');
        if (chain) {
          t.stageIndex = 4;
          t.roundIndex = 1;
          (t as any).stage4Status = 'b21';
          setCurrentChain(t, 'content', 'B21', chain);
        }
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      } else if (isFail) {
        // 邀约失败：记录失败次数，进入阶段间CD，回到第三阶段（简化版）
        const failCount = (t as any).stage4InviteFailCount || 0;
        (t as any).stage4InviteFailCount = failCount + 1;
        clearPrompt(); set(`um:task:${taskId}`, t);
        // TODO：这里可以按文档配置 30~70 小时或 5~7 天的 CD；目前先沿用阶段间CD逻辑回到第三阶段
        enterStageCdToNextStage(taskId, 3);
      } else if (action === 'no_choice') {
        // 暂不选择：保持在结果提示板
        t.waitingForPrompt = true; t.promptType = 'stage4_invitation_result';
        t.lastActionAt = Date.now(); set(`um:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_success_finish': {
      // 邀约成功后，点击提示板关闭：标记整个第四阶段已完成
      // 这里合并文档中 B14/B19/B20 的决策：
      // - 结束任务：从列表中移除当前任务
      // - 暂不关闭：保留任务，列表显示“邀约成功”
      const closeTask = action === 'close_task' || action === 'yes';
      const keepTask = action === 'keep_task' || action === 'no';

      clearPrompt();
      (t as any).stage4Status = 'success_finished';

      if (closeTask) {
        // 结束当前订单（任务），列表不再显示
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
      } else if (keepTask) {
        // 保持任务进行中，仅更新列表显示
        t.listBadge = '邀约成功';
        t.listCountdownEndAt = null;
      }

      t.lastActionAt = Date.now();
      set(`um:task:${taskId}`, t);
      break;
    }
    default: {
      console.warn('[handlePromptAction] 未识别的 promptType:', promptType);
      return { ok: false, reason: '未识别的提示类型' };
    }
  }

  return { ok: true };
}


// 进入阶段间CD并推进到下一阶段
function enterStageCdToNextStage(taskId: string, nextStageIndex: number) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return;

  // 设置阶段CD时间（根据文档，阶段间CD时间由后端配置）
  // 这里暂时使用固定时间，实际应该从配置中读取
  const settings: Settings = get('um:settings');
  const cdMs = settings.cd.bigRoundMinMs; // 使用大CD时间作为阶段间CD

  t.stageCdUnlockAt = Date.now() + cdMs;
  t.listBadge = '阶段间CD倒计时';
  t.listCountdownEndAt = t.stageCdUnlockAt;
  t.currentLibChain = null;
  t.roundCdUnlockAt = null;

  // 设置下一阶段
  t.stageIndex = nextStageIndex;
  t.roundIndex = 0; // 重置回合数
  t.stageScore = 0; // 重置阶段分数
  t.stageThresholdX = settings.stageThresholdX[nextStageIndex] || 2;

  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);

  console.log('[enterStageCdToNextStage] 进入阶段间CD，下一阶段:', nextStageIndex, 'CD时长:', cdMs);
}

function randInt(min: number, max: number) { if (min >= max) return min; return Math.floor(Math.random() * (max - min + 1)) + min; }

// 提示板确认：对方是否已添加好友
export function confirmFriendAdded(taskId: string, added: boolean) {
  initUmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: '任务不存在' };

  const libs: Libs = get('um:libs');

  if (added) {
    // 用户选择"是"：回合数+1，进入第一回合，加载开库B1
    t.roundIndex = 1;
    t.waitingForPrompt = false;
    t.promptType = null;
    t.friendAdded = true;

    // 加载第一回合的开库B1
    const opening = pickChain(libs.opening, 'B1');
    if (opening) {
      setCurrentChain(t, 'opening', 'B1', opening);
    }
  } else {
    // 用户选择"否"：保持回合0，显示招呼库B1
    t.waitingForPrompt = false;
    t.promptType = null;
    t.friendAdded = false;

    // 加载招呼库B1（使用opening类型存储招呼库）
    const greeting = pickChain(libs.opening, 'B1');
    if (greeting) {
      setCurrentChain(t, 'opening', 'B1', greeting);
    }
  }

  t.lastActionAt = Date.now();
  set(`um:task:${taskId}`, t);
  return { ok: true };
}

// 清除所有任务（用于测试）
export function clearAllTasks() {
  const ids: string[] = get('um:tasks') || [];
  ids.forEach(id => uni.removeStorageSync(`um:task:${id}`));
  set('um:tasks', []);
  console.log('[um] 已清除所有任务');
}

