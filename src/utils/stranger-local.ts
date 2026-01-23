import { getCountdownTimeMs } from '@/config';

// Stranger (陌生) module local engine — isolated from familiar module
// Storage key prefix: sm:

type TaskStatus = 'active' | 'finished' | 'deleted';

type ChainNodeType = 'content' | 'Z' | 'D' | 'AZ' | 'AD';
export interface ChainNode { type: ChainNodeType; text?: string }
export type Chain = ChainNode[];

export interface CurrentLibChain { type: 'opening' | 'content' | 'leaving' | 'opponent' | 'qa'; libId: string; nodeIndex: number; segmentsCopied: number }

export interface Task {
  id: string; name: string; createdAt: number; durationDays: number; expireAt: number; status: TaskStatus;
  stageIndex: number; roundIndex: number | null; stepIndex: number; stageScore: number; totalScore: number; stageThresholdX: number;
  roundCdUnlockAt: number | null; stageCdUnlockAt: number | null; zUnlockAt: number | null; dMode: boolean; opponentFindUnlockAt: number | null; opponentFindCopyUnlockAt: number | null;
  idleWarningAt: number | null; hardIdleToCdAt: number | null; lastActionAt: number; usedLibIdsByStage: Record<number, { content: string[]; opening?: string[]; leaving?: string[]; opponent?: string[]; qa?: string[] }>;
  currentLibChain: CurrentLibChain | null; opponentFindUsedInRound: boolean; qaVipMaxItems?: number; questionnaire?: any; prompts?: Record<string, any>; askFlow?: Record<string, any>;
  renewHistory: Array<{ days: number; cost: number; at: number; success: boolean }>; listBadge: string; listCountdownEndAt: number | null; nextOpponentFindLibId?: string;
  waitingForPrompt: boolean; promptType: string | null; friendAdded: boolean; friendGreetingPending?: boolean;
    // 标签选择相关
    availableTagOptions: Array<{ id: string; label: string; type: 'opening' | 'content' | 'leaving' }>; // 当前可选的4个标签选项
    selectedTagId: string | null; // 用户选择的标签ID
}

export interface Libs { opening: Record<string, Chain[]>; content: Record<string, Chain[]>; leaving: Record<string, Chain[]>; opponent: Record<string, Chain[]>; qa?: Record<string, any[]> }

export interface Settings {
  version: number; // 配置版本号，用于配置迁移
  stageThresholdX: Record<number, number>;
  cd: {
    smallCopyCdMs: number; bigRoundMinMs: number; opponentFindWaitMs: number; opponentFindCopyEnableMs: number; idleWarnMs: number; idleForceCdMs: number;
    zDurationByStage: { minMs: number; maxMs: number }[];
  };
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function get<T = any>(k: string): T { return uni.getStorageSync(k) as T }
function set(k: string, v: any) { uni.setStorageSync(k, v) }

// 当前配置版本号
const SETTINGS_VERSION = 2;

export function initSmLocal() {
  const existingSettings: Settings | null = get('sm:settings');

  // 如果没有配置或配置版本过旧，则更新配置
  if (!existingSettings || !existingSettings.version || existingSettings.version < SETTINGS_VERSION) {
    const settings: Settings = {
      version: SETTINGS_VERSION,
      stageThresholdX: { 0: 10, 1: 2, 2: 2, 3: 2, 4: 0 },
      cd: {
        smallCopyCdMs: getCountdownTimeMs(3000),
        bigRoundMinMs: getCountdownTimeMs(15 * 60 * 1000),
        opponentFindWaitMs: getCountdownTimeMs(20 * 1000),
        opponentFindCopyEnableMs: getCountdownTimeMs(20 * 1000),
        idleWarnMs: getCountdownTimeMs(45 * 60 * 1000),  // 45分钟空闲警告
        idleForceCdMs: getCountdownTimeMs(50 * 60 * 1000),  // 50分钟强制进入CD（警告后5分钟）
        zDurationByStage: [
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
          { minMs: getCountdownTimeMs(6 * 60 * 1000), maxMs: getCountdownTimeMs(12 * 60 * 1000) },  // 6-12分钟Z倒计时
        ],
      },
    };
    set('sm:settings', settings);
    console.log('[initSmLocal] 配置已更新到版本', SETTINGS_VERSION);
  }
  if (!get('sm:libs')) {
    const libs: Libs = {
      opening: {
        // 打招呼库M1 - 第一次接触（不自动Z，按文本标记）
        M1: [[
          { type: 'content', text: '你好，我是{自己的名字}@看到你的{朋友圈/动态/资料}，觉得挺有意思的@（冒昧打扰一下&///想和你认识一下++）@方便聊几句吗？', splitBy: '@' }
        ]],
        // 打招呼库M2 - 第二次尝试
        M2: [[
          { type: 'content', text: '嗨，{对方可能的称呼}@我是{自己的简短介绍}@（看到你的{某个特点}，觉得很有意思&///对你的{某个方面}挺感兴趣++）@能聊聊吗？', splitBy: '@' }
        ]],
        // 打招呼库M3 - 第三次尝试
        M3: [[
          { type: 'content', text: 'Hi，{对方称呼}@我注意到你{某个特征/兴趣}@（我也对这方面挺感兴趣的&///我觉得我们可能有共同话题++）@有空聊聊吗？', splitBy: '@' }
        ]],
        // 打招呼库M1.5 - 第四次尝试
        'M1.5': [[
          { type: 'content', text: '{对方称呼}，我想和你坦诚地聊一次@这段时间我一直在想我们的关系@我觉得有些话必须说出来@希望你能听我好好解释', splitBy: '@' }
        ]],
      },
      content: {
        // 内容库M1 - 第一回合内容（包含并行选择）
        'M1': [[
          { type: 'content', text: '我看到你{具体的某个内容/动态}@觉得挺有意思的@（我也有类似的经历&///我对这方面也挺了解的++）@（你是做{相关领域}的吗？&///你平时也喜欢{相关话题}吗？++）', splitBy: '@' },
        ]],
        // 内容库M2 - 第二回合内容
        'M2': [[
          { type: 'content', text: '通过刚才的交流，我觉得你是个挺有意思的人@（你的{某个观点}让我印象深刻&///你对{某个话题}的看法很独特++）@（我想多了解一下你&///我觉得我们可以深入聊聊++）', splitBy: '@' },
        ]],
        // 内容库M3 - 第三回合内容
        'M3': [[
          { type: 'content', text: '和你聊天感觉挺愉快的@（你的{某个特质}让我觉得很舒服&///我发现我们有很多共同点++）@（不知道你有没有兴趣继续深入了解&///我想我们可以成为朋友++）', splitBy: '@' },
        ]],
        // 内容库M1.5 - 特殊回合内容
        'M1.5': [[
          { type: 'content', text: '我知道我们刚认识不久@但我真的觉得和你聊天很愉快@（希望你能给我一个机会，让我们继续交流&///我想我们之间还有很多可以聊的++）@你愿意吗？', splitBy: '@' },
        ]],
        // 内容库M4 - 第四回合内容
        'M4': [[
          { type: 'content', text: '经过这段时间的交流，我对你有了更多的了解@（我发现你真的是一个很特别的人&///我觉得我们之间有一种特殊的默契++）@（我想我们的关系可以更进一步&///我希望能和你建立更深的联系++）', splitBy: '@' },
        ]],
        // 内容库M5 - 第五回合内容（包含D模式）
        'M5': [[
          { type: 'content', text: '我一直在思考我们之间的关系@虽然我们认识的时间不长@但我觉得我们之间有一种特殊的感觉@（我想坦诚地告诉你我的想法&///我希望你能理解我的心意++）', splitBy: '@' },
          { type: 'D' }
        ]],
        // 第四阶段邀约内容库M20 - 马上邀约时发送
        'M20': [[
          { type: 'content', text: '和你聊了这么久@我觉得我们挺投缘的@（一直想找个机会和你当面聊聊&///如果你方便的话，我想约你一起喝杯咖啡++）@你看这周还是下周有空？AZ', splitBy: '@' },
        ]],
        // 第四阶段邀约成功后的内容库M21
        'M21': [[
          { type: 'content', text: '太好了，那就这么说定了@到时候我请你喝咖啡@（我会提前安排好时间和地点&///也可以提前跟你确认一下你比较方便的时间++）@很期待见到你AZ', splitBy: '@' },
        ]],
        // 第四阶段邀约失败后的安抚话术（临时写死）
        'M23': [[
          { type: 'content', text: 'FF理解你的顾虑LLFF没关系，我们可以保持联系LLFF等你准备好再聊也不迟AZ', splitBy: '@' },
        ]],
      },
      leaving: {
        // 离库M1 - 第一回合离开（包含FF和LL标记）
        'M1': [[
          { type: 'content', text: 'FF好的，那就不打扰你了LLFF如果你有空的话，可以随时找我LLFF那我先忙了，有缘再聊LL', splitBy: '@' }
        ]],
        // 离库M2 - 第二回合离开（包含并行选择）
        'M2': [[
          { type: 'content', text: '（理解，那你先忙你的&///没关系，我们可以慢慢来++）@（希望下次能有机会继续聊&///期待我们下次的交流++）@（那就先这样，拜拜&///好的，回见++）', splitBy: '@' }
        ]],
        // 离库M3 - 第三回合离开
        'M3': [[
          { type: 'content', text: 'FF明白，那就先这样吧LLFF没关系，我们可以保持联系LLFF好的，那就先不打扰了，有缘再聊LL', splitBy: '@' }
        ]],
        // 离库M4 - 第四回合离开
        'M4': [[
          { type: 'content', text: '（好的，我理解&///行，我知道了++）@（希望你能好好考虑一下&///期待你的回复++）@（那就先不打扰了&///好的，再见++）', splitBy: '@' }
        ]],
        // 离库M5 - 第五回合离开
        'M5': [[
          { type: 'content', text: 'FF我理解你的想法LLFF没关系，我们可以做朋友LLFF好的，那就保持现状，有缘再聊LL', splitBy: '@' }
        ]],
      },
      opponent: {
        // 对方找M20 - 对方主动回复时的应对（包含多段内容）
        'M20': [[
          { type: 'content', text: '太好了，你终于回复我了@我还以为你不会理我呢@（是有什么事情吗？&///还是单纯想聊聊天？++）@我很高兴你能回复', splitBy: '@' }
        ]],
        // 对方找M21 - 对方询问时的回复
        'M21': [[
          { type: 'content', text: '关于你问的这个@（我是这样想的&///我的看法是这样的++）@（从这个角度来看&///换个思路想想++）@你觉得呢？', splitBy: '@' }
        ]],
        // 对方找M22 - 对方表达兴趣时的回复
        'M22': [[
          { type: 'content', text: '真的吗？太好了@我就知道你会感兴趣@（那我们可以深入聊聊&///我有很多想法想和你分享++）@（你有什么想法吗？&///你对这方面了解多少？++）', splitBy: '@' }
        ]],
      },
      qa: {},
    };
    set('sm:libs', libs);
  }
  if (!get('sm:tasks')) set('sm:tasks', [] as string[]);
}

function genId() { return 'sm_' + Date.now() + '_' + Math.floor(Math.random() * 10000) }

/**
 * 随机抽取4个标签选项供用户选择
 * @param taskId 任务ID
 * @param tagType 标签类型（opening/content/leaving）
 * @returns 随机抽取的4个标签选项
 */
export function getTagOptions(taskId: string, tagType: 'opening' | 'content' | 'leaving'): Array<{ id: string; label: string; type: 'opening' | 'content' | 'leaving' }> {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return [];

  const libs: Libs = get('sm:libs');
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

  console.log('[sm.getTagOptions] 随机抽取的标签选项:', options);
  return options;
}

/**
 * 用户选择标签
 * @param taskId 任务ID
 * @param tagId 选择的标签ID
 */
export function selectTagOption(taskId: string, tagId: string): { ok: boolean; reason?: string } {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: '任务不存在' };

  const option = t.availableTagOptions.find(opt => opt.id === tagId);
  if (!option) return { ok: false, reason: '标签选项不存在' };

  // 设置当前选择的标签
  t.selectedTagId = tagId;

  // 根据选择的标签初始化当前链
  const libs: Libs = get('sm:libs');
  const chain = pickChain(getChainGroupByType(libs, option.type), tagId);
  if (chain) {
    setCurrentChain(t, option.type, tagId, chain);
    console.log('[sm.selectTagOption] 用户选择标签:', tagId, 'type:', option.type);
  } else {
    console.error('[sm.selectTagOption] 找不到标签链:', tagId);
    return { ok: false, reason: '标签内容不存在' };
  }

  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
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
  return tagId;
}

export function listTasks(): { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] {
  initSmLocal();
  const ids: string[] = get('sm:tasks') || [];
  const res: { id: string; name: string; status: TaskStatus; badge: string; countdownEndAt: number | null }[] = [];
  ids.forEach((id) => {
    const t: Task = get(`sm:task:${id}`);
    if (t && t.status !== 'deleted') {
      const badge = computeListBadge(t);
      res.push({ id: t.id, name: t.name, status: t.status, badge: badge.badgeText, countdownEndAt: badge.countdownEndAt || null });
    }
  });
  return res;
}

export function createTask(payload: { name: string; durationDays: number }): { ok: boolean; reason?: string; task?: Task } {
  initSmLocal();
  const { name, durationDays } = payload;
  if (!name || name.trim().length === 0 || name.trim().length > 6) return { ok: false, reason: '名称需1-6字' };
  const id = genId();
  const now = Date.now();
  const expireAt = now + durationDays * 24 * 60 * 60 * 1000;
  const settings: Settings = get('sm:settings');

  const task: Task = {
    id,
    name: name.trim(),
    createdAt: now,
    durationDays,
    expireAt,
    status: 'active',
    stageIndex: 1,
    roundIndex: 0,
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
    waitingForPrompt: true,
    promptType: 'friend_added',
    friendAdded: false,
    friendGreetingPending: false,
  };

  const ids: string[] = get('sm:tasks') || [];
  ids.push(id); set('sm:tasks', ids); set(`sm:task:${id}`, task);
  return { ok: true, task };
}

export function getTask(taskId: string): Task | null { initSmLocal(); const t: Task = get(`sm:task:${taskId}`); return t || null }

function pickChain(group: Record<string, Chain[]>, libId: string): Chain | null { const arr = group[libId]; if (!arr || arr.length === 0) return null; return arr[0] }
function setCurrentChain(t: Task, type: CurrentLibChain['type'], libId: string, chain: Chain) { t.currentLibChain = { type, libId, nodeIndex: 0, segmentsCopied: 0 }; markChainUsedInternal(t, libId, type) }

export function addPoint(taskId: string, amount: number) { initSmLocal(); const t = getTask(taskId); if (!t) return; t.stageScore += amount; t.totalScore += amount; t.lastActionAt = Date.now(); set(`sm:task:${taskId}`, t) }

export function copySegment(taskId: string): { ok: boolean; reason?: string } {
  initSmLocal(); const t = getTask(taskId); if (!t || !t.currentLibChain) return { ok: false, reason: '无当前内容可复制' };
  const settings: Settings = get('sm:settings'); const until = Date.now() + settings.cd.smallCopyCdMs; set(`sm:clipboard:${taskId}`, { chainId: t.currentLibChain.libId, segmentIndex: t.currentLibChain.segmentsCopied, until });
  t.currentLibChain.segmentsCopied += 1; t.lastActionAt = Date.now(); set(`sm:task:${taskId}`, t); return { ok: true };
}

export function finishCurrentLibNode(taskId: string) { initSmLocal(); const t = getTask(taskId); if (!t || !t.currentLibChain) return; t.currentLibChain.nodeIndex += 1; t.currentLibChain.segmentsCopied = 0; t.lastActionAt = Date.now(); set(`sm:task:${taskId}`, t) }

export function onZEnter(taskId: string) { initSmLocal(); const t = getTask(taskId); if (!t) return; const settings: Settings = get('sm:settings'); const range = settings.cd.zDurationByStage[t.stageIndex] || { minMs: 10000, maxMs: 20000 }; const dur = randInt(range.minMs, range.maxMs); t.zUnlockAt = Date.now() + dur; t.listBadge = 'Z倒计时'; t.listCountdownEndAt = t.zUnlockAt; set(`sm:task:${taskId}`, t) }
export function onDEnter(taskId: string) { initSmLocal(); const t = getTask(taskId); if (!t) return; t.dMode = true; t.listBadge = 'D'; t.listCountdownEndAt = null; set(`sm:task:${taskId}`, t) }

export function onOpponentFindClick(taskId: string, libId = 'M20') { initSmLocal(); const t = getTask(taskId); if (!t) return; const libs: Libs = get('sm:libs'); const op = pickChain(libs.opponent, libId); if (op) setCurrentChain(t, 'opponent', libId, op); const settings: Settings = get('sm:settings'); t.opponentFindUsedInRound = true; t.opponentFindUnlockAt = Date.now(); t.opponentFindCopyUnlockAt = Date.now() + settings.cd.opponentFindCopyEnableMs; t.listBadge = '聊天任务进行中'; t.listCountdownEndAt = null; set(`sm:task:${taskId}`, t) }

export function enterRoundBigCd(taskId: string, multiplier = 1) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;

  // 第四阶段「多聊一次」额外回合完成后，直接回到第四阶段提示板
  if ((t as any).stage4MoreChatStep === 'during_extra_round') {
    console.log('[enterRoundBigCd] 额外回合完成，返回第四阶段 M8');
    (t as any).stage4MoreChatStep = 'done';
    setStage4InvitationPrompt(t);
    set(`sm:task:${taskId}`, t);
    return;
  }

  const settings = get('sm:settings') as Settings;
  const base = settings.cd.bigRoundMinMs;
  t.roundCdUnlockAt = Date.now() + base * (multiplier || 1);
  t.listBadge = '下次聊天开启倒计时';
  t.listCountdownEndAt = t.roundCdUnlockAt;
  t.currentLibChain = null;
  t.opponentFindUnlockAt = Date.now() + settings.cd.opponentFindWaitMs;
  t.opponentFindCopyUnlockAt = t.opponentFindUnlockAt + settings.cd.opponentFindCopyEnableMs;
  t.opponentFindUsedInRound = false;
  set(`sm:task:${taskId}`, t);
}
export function enterStageCd(taskId: string, daysRange: { minDays: number; maxDays: number }) { initSmLocal(); const t = getTask(taskId); if (!t) return; const days = randInt(daysRange.minDays, daysRange.maxDays); t.stageCdUnlockAt = Date.now() + getCountdownTimeMs(days * 24 * 60 * 60 * 1000); t.listBadge = '下次聊天开启倒计时'; t.listCountdownEndAt = t.stageCdUnlockAt; t.currentLibChain = null; t.roundCdUnlockAt = null; set(`sm:task:${taskId}`, t) }

function getChainGroupByType(libs: Libs, type: CurrentLibChain['type']): Record<string, Chain[]> { switch (type) { case 'opening': return libs.opening; case 'content': return libs.content; case 'leaving': return libs.leaving; case 'opponent': return libs.opponent; default: return {} } }
export async function getCurrentChainContent(taskId: string): Promise<{ contentList: ChainNode[]; statusVo: { sign: '' | 'Z' | 'D' } }> {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return { contentList: [], statusVo: { sign: '' } };
  const libs: Libs = get('sm:libs');
  const needsFriendGate = t.stageIndex === 1 && (!t.roundIndex || t.roundIndex === 0) && !t.friendAdded;

  // 检查是否需要用户选择标签
  if (t.availableTagOptions && t.availableTagOptions.length > 0 && !t.selectedTagId) {
    console.log('[sm.getCurrentChainContent] 等待用户选择标签，返回空内容');
    return { contentList: [], statusVo: { sign: 'TAG_SELECT' as any } };
  }

  if (needsFriendGate && (!t.currentLibChain || t.currentLibChain.type !== 'opening' || t.currentLibChain.libId !== 'M1')) {
    const greeting = pickChain(libs.opening, 'M1');
    if (greeting) {
      setCurrentChain(t, 'opening', 'M1', greeting);
      t.friendGreetingPending = true;
      t.waitingForPrompt = false;
      set(`sm:task:${taskId}`, t);
    }
  } else if (needsFriendGate && t.currentLibChain && !t.friendGreetingPending) {
    t.friendGreetingPending = true;
    set(`sm:task:${taskId}`, t);
  }

  // 如果没有当前链，尝试根据阶段/回合初始化
  if (!t.currentLibChain) {
    console.log('[sm.getCurrentChainContent] currentLibChain 为 null，尝试重新初始化');

    // 第四阶段：只通过提示板控制，不自动进入库
    if (t.stageIndex === 4) {
      const stage4Status = (t as any).stage4Status;
      if (stage4Status === 'success_finished') {
        console.log('[sm.getCurrentChainContent] 第四阶段已完成，保持空内容');
        return { contentList: [], statusVo: { sign: '' } };
      }
      console.log('[sm.getCurrentChainContent] 当前为第四阶段，调用 reinitializeCurrentChain 回到邀约选择提示板');
      reinitializeCurrentChain(taskId);
      return { contentList: [], statusVo: { sign: '' } };
    }

    if (needsFriendGate) {
      return { contentList: [], statusVo: { sign: '' } };
    }

    if (t.roundIndex === 0 && t.stageIndex > 0) {
      console.log('[sm.getCurrentChainContent] 回合数为0，推进到第一回合');
      advanceToNextRound(taskId);
      const t2 = getTask(taskId);
      if (t2?.currentLibChain) {
        Object.assign(t, t2);
      } else {
        return { contentList: [], statusVo: { sign: '' } };
      }
    } else {
      // 已有回合数，但链丢失：尝试根据阶段/回合重建开库
      reinitializeCurrentChain(taskId);
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
    // 第四阶段的推进由 advancePastCurrentNode + 提示板逻辑单独控制
    if (t.stageIndex === 4) return false;

    const groupCur = getChainGroupByType(libs, t.currentLibChain!.type);
    const chainCur = groupCur?.[t.currentLibChain!.libId]?.[0];
    if (!chainCur) return false;
    if (t.currentLibChain!.nodeIndex >= chainCur.length) {
      const stage = t.stageIndex;
      const round = t.roundIndex || 0;

      if (t.currentLibChain!.type === 'opening') {
        let nextContentId = '';
        if (stage === 1) {
          // 第一阶段：文档 1.1.1.1
          if (round === 1) nextContentId = 'M1';
          else if (round === 2) nextContentId = 'M2';
          else if (round === 3) nextContentId = 'M3';
          else if (round === 4) nextContentId = 'M1.5';
        } else if (stage === 2) {
          // 第二阶段：按文档使用 M3 开头，内容 M4/M5 作为占位
          if (round === 1 || round === 2) nextContentId = 'M4';
          else if (round === 3) nextContentId = 'M5';
        } else if (stage === 3) {
          // 第三阶段：文档为 M11~M19，这里先用占位库 M4
          nextContentId = 'M4';
        }
        if (nextContentId) {
          const next = pickChain(libs.content, nextContentId);
          if (next) setCurrentChain(t, 'content', nextContentId, next);
        }
      } else if (t.currentLibChain!.type === 'content') {
        let nextLeavingId = '';
        if (stage === 1) {
          if (round === 1) nextLeavingId = 'M1';
          else if (round === 2) nextLeavingId = 'M2';
          else if (round === 3) nextLeavingId = 'M3';
          else if (round === 4) nextLeavingId = 'M2';
        } else if (stage === 2) {
          // 第二阶段离库固定 M3
          nextLeavingId = 'M3';
        } else if (stage === 3) {
          // 第三阶段离库固定 M4
          nextLeavingId = 'M4';
        }
        if (nextLeavingId) {
          const next = pickChain(libs.leaving, nextLeavingId);
          if (next) setCurrentChain(t, 'leaving', nextLeavingId, next);
        }
      } else if (t.currentLibChain!.type === 'leaving') {
        // 离库完成：积分+1并进入回合大CD
        t.stageScore += 1; t.totalScore += 1;
        set(`sm:task:${taskId}`, t);
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
      set(`sm:task:${taskId}`, t);
      return true;
    }
    return false;
  };

  let advanced = true;
  while (t.currentLibChain && advanced) {
    advanced = advanceIfCompleted();
    if (advanced && (!t.currentLibChain || (t.currentLibChain.type === 'leaving' && t.roundCdUnlockAt))) break;
  }

  if (!t.currentLibChain) return { contentList: [], statusVo: { sign: '' } };

  const group = getChainGroupByType(libs, t.currentLibChain.type);
  const chain = group?.[t.currentLibChain.libId]?.[0];
  if (chain && t.currentLibChain.nodeIndex < chain.length) {
    const rawNode: any = chain[t.currentLibChain.nodeIndex];
    let sign: '' | 'Z' | 'D' = '';
    let text: string = rawNode.text || '';

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
          text = text.replace(re, '').replace(/\\s+$/, '');
          break;
        }
      }
    } else {
      if (rawNode.type === 'Z' || rawNode.type === 'AZ') sign = 'Z';
      else if (rawNode.type === 'D' || rawNode.type === 'AD') sign = 'D';
    }

    const node = { ...rawNode, text };
    return { contentList: [node], statusVo: { sign } };
  }
  return { contentList: [], statusVo: { sign: '' } };
}

// Z倒计时结束后推进到下一个节点
export function advancePastCurrentNode(taskId: string) {
  initSmLocal();
  const t = getTask(taskId); if (!t || !t.currentLibChain) return;

  const libs: Libs = get('sm:libs');
  const group = getChainGroupByType(libs, t.currentLibChain.type);
  const chain = group?.[t.currentLibChain.libId]?.[0];

  // 清理Z标记并推进一个节点
  t.zUnlockAt = null;
  t.currentLibChain.nodeIndex += 1;
  t.currentLibChain.segmentsCopied = 0;
  t.lastActionAt = Date.now();

  // 第四阶段特殊处理：M20/M21 完成后的流程
  if (t.stageIndex === 4 && chain && t.currentLibChain.nodeIndex >= chain.length) {
    if (t.currentLibChain.type === 'content' && t.currentLibChain.libId === 'M20') {
      console.log('[advancePastCurrentNode] 第四阶段 M20 完成，进入邀约结果提示');
      t.currentLibChain = null;
      t.dMode = false;
      t.roundCdUnlockAt = null;
      t.stageCdUnlockAt = null;
      (t as any).stage4Status = 'waiting_result';
      t.waitingForPrompt = true;
      t.promptType = 'stage4_invitation_result';
      t.listBadge = '等待邀约结果';
      t.listCountdownEndAt = null;
    } else if (t.currentLibChain.type === 'content' && t.currentLibChain.libId === 'M21') {
      console.log('[advancePastCurrentNode] 第四阶段 M21 完成，第四阶段结束');
      t.currentLibChain = null;
      t.dMode = false;
      t.roundCdUnlockAt = null;
      t.stageCdUnlockAt = null;
      (t as any).stage4Status = 'success_finished';
      t.waitingForPrompt = true;
      t.promptType = 'stage4_success_finish';
      t.listBadge = '邀约成功';
      t.listCountdownEndAt = null;
    } else if (t.currentLibChain.type === 'content' && t.currentLibChain.libId === 'M23') {
      console.log('[advancePastCurrentNode] 第四阶段 M23 安抚话术完成，进入阶段CD');
      const failCount = (t as any).stage4InviteFailCount || 0;
      t.currentLibChain = null;
      t.dMode = false;
      t.roundCdUnlockAt = null;
      t.stageCdUnlockAt = null;
      set(`sm:task:${taskId}`, t);
      enterStage4FailCountdown(taskId, failCount);
      return;
    }
  }

  set(`sm:task:${taskId}`, t);
}

// 清除对方找库（当页面加载时发现卡在对方找库时调用）
export function clearOpponentChain(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  console.log('[clearOpponentChain] 清除对方找库，stageIndex:', t.stageIndex, 'roundIndex:', t.roundIndex);

  // 清除对方找相关状态
  t.currentLibChain = null;
  t.opponentFindUnlockAt = null;
  t.opponentFindCopyUnlockAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);

  // 调用 reinitializeCurrentChain 重新初始化
  reinitializeCurrentChain(taskId);
}

// 重新初始化 currentLibChain（当 currentLibChain 为 null 但任务已经开始时调用）
export function reinitializeCurrentChain(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  console.log('[reinitializeCurrentChain] stageIndex:', t.stageIndex, 'roundIndex:', t.roundIndex);

  // 第四阶段：currentLibChain 为空时回到邀约选择提示板
  if (t.stageIndex === 4) {
    // 如果第四阶段已经完整结束，则不再强制回到邀约提示
    if ((t as any).stage4Status === 'success_finished') {
      console.log('[reinitializeCurrentChain] 第四阶段已完成，不再重置为邀约选择');
      return;
    }
    console.log('[reinitializeCurrentChain] 第四阶段 currentLibChain 为空，回到邀约选择提示板');
    t.roundCdUnlockAt = null;
    t.stageCdUnlockAt = null;
    t.currentLibChain = null;
    t.zUnlockAt = null;
    t.dMode = false;
    setStage4InvitationPrompt(t);
    t.roundIndex = 0;
    t.lastActionAt = Date.now();
    set(`sm:task:${taskId}`, t);
    return;
  }

  // 根据当前阶段和回合，重新初始化 currentLibChain
  const libs: Libs = get('sm:libs');

  // 如果当前回合数为0或null，说明还没开始任何回合，需要推进到第一回合
  if (!t.roundIndex || t.roundIndex === 0) {
    console.log('[reinitializeCurrentChain] 回合数为0，推进到第一回合');
    advanceToNextRound(taskId);
  } else {
    // 否则，根据当前阶段和回合，重新初始化开库
    console.log('[reinitializeCurrentChain] 重新初始化开库');
    let openingLibId = '';

    if (t.stageIndex === 1) {
      if (t.roundIndex === 1) openingLibId = 'M1';
      else if (t.roundIndex === 2) openingLibId = 'M2';
      else if (t.roundIndex === 3) openingLibId = 'M2';
      else if (t.roundIndex === 4) openingLibId = 'M1.5';
    } else if (t.stageIndex === 2) {
      if (t.roundIndex === 1 || t.roundIndex === 2) openingLibId = 'M3';
      else if (t.roundIndex === 3) openingLibId = 'M2';
    } else if (t.stageIndex === 3) {
      openingLibId = 'M4';
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
    set(`sm:task:${taskId}`, t);
  }
}


export function computeListBadge(task: Task): { badgeText: string; countdownEndAt?: number } { const now = Date.now(); if (task.dMode) return { badgeText: 'D' }; if (task.zUnlockAt && now < task.zUnlockAt) return { badgeText: 'Z倒计时', countdownEndAt: task.zUnlockAt }; if (task.opponentFindUnlockAt && now < task.opponentFindUnlockAt) return { badgeText: '对方找倒计时', countdownEndAt: task.opponentFindUnlockAt }; const end = task.roundCdUnlockAt || task.stageCdUnlockAt; if (end && now < end) return { badgeText: '下次聊天开启倒计时', countdownEndAt: end }; return { badgeText: '聊天任务进行中' } }

function markChainUsedInternal(t: Task, libId: string, type: CurrentLibChain['type']) { const s = t.stageIndex; if (!t.usedLibIdsByStage[s]) t.usedLibIdsByStage[s] = { content: [] } as any; const bucket = t.usedLibIdsByStage[s]; const pushIf = (arr?: string[]) => { if (!arr) return; if (!arr.includes(libId)) arr.push(libId) }; if (type === 'content') pushIf(bucket.content); if (type === 'opening') { if (!bucket.opening) bucket.opening = []; pushIf(bucket.opening) } if (type === 'leaving') { if (!bucket.leaving) bucket.leaving = []; pushIf(bucket.leaving) } if (type === 'opponent') { if (!bucket.opponent) bucket.opponent = []; pushIf(bucket.opponent) } }

function randInt(min: number, max: number) { if (min >= max) return min; return Math.floor(Math.random() * (max - min + 1)) + min }

export function confirmFriendAdded(taskId: string, added: boolean) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: "任务不存在" };
  const libs: Libs = get("sm:libs");
  if (added) {
    t.roundIndex = 1;
    t.waitingForPrompt = false;
    t.promptType = null;
    t.friendAdded = true;
    t.friendGreetingPending = false;
    const opening = pickChain(libs.opening, "M1");
    if (opening) setCurrentChain(t, "opening", "M1", opening);
  } else {
    t.waitingForPrompt = false;
    t.promptType = "friend_added";
    t.friendAdded = false;
    t.friendGreetingPending = true;
    t.roundIndex = 0;
    t.roundCdUnlockAt = null;
    t.zUnlockAt = null;
    t.dMode = false;
    const greeting = pickChain(libs.opening, "M1");
    if (greeting) setCurrentChain(t, "opening", "M1", greeting);
  }
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  return { ok: true };
}


export function completeFriendGreetingCopy(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  t.friendGreetingPending = false;
  t.friendAdded = false;
  t.waitingForPrompt = true;
  t.promptType = "friend_added";
  t.currentLibChain = null;
  t.zUnlockAt = null;
  t.dMode = false;
  t.roundCdUnlockAt = null;
  t.stageCdUnlockAt = null;
  t.listBadge = "聊天任务进行中";
  t.listCountdownEndAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
}

// 回合CD结束后推进到下一回合（按照文档写死所有逻辑）
export function advanceToNextRound(taskId: string) {
  initSmLocal();
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

  const libs: Libs = get('sm:libs');
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

    // 根据文档 1.1.2.2-1.1.2.5 的库选择规则
    if (nextRound === 1) {
      // 第一回合第一轮：随机抽取4个开库标签供用户选择
      t.availableTagOptions = getTagOptions(taskId, 'opening');
      t.selectedTagId = null;
      t.currentLibChain = null; // 清空当前链，等待用户选择
      t.listBadge = '请选择标签';
      t.listCountdownEndAt = null;
      t.lastActionAt = Date.now();
      set(`sm:task:${taskId}`, t);
      console.log('[advanceToNextRound] 第一回合第一轮：设置标签选项供用户选择');
      return;
    } else if (nextRound === 2) {
      openingLibId = 'M2';
      contentLibId = 'M2';
      leavingLibId = 'M2';
    } else if (nextRound === 3) {
      openingLibId = 'M2';
      contentLibId = 'M3';
      leavingLibId = 'M3';
    } else if (nextRound === 4) {
      openingLibId = 'M1.5';
      contentLibId = 'M1.5';
      leavingLibId = 'M2';
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

    // 根据文档 1.2.2.2-1.2.2.4 的库选择规则
    if (nextRound === 1 || nextRound === 2) {
      // 第一、二回合相同
      openingLibId = 'M3';
      contentLibId = 'M4'; // 这里应该是 M4.5.6.7.10 中的一个
      leavingLibId = 'M3';
    } else if (nextRound === 3) {
      openingLibId = 'M2';
      contentLibId = 'M5'; // 这里应该是 M5.6.7.10 中没被抽取过的 + M8.9
      leavingLibId = 'M3';
    }
  }
  // ========== 第三阶段逻辑 ==========
  else if (t.stageIndex === 3) {
    const moreChatStep = (t as any).stage4MoreChatStep || '';
    if (moreChatStep === 'waiting_cd_to_extra_round' && nextRound === 1) {
      console.log('[advanceToNextRound] 来自第四阶段的多聊一次，开始额外回合');
      (t as any).stage4MoreChatStep = 'during_extra_round';
    }
    const isExtraRound = (t as any).stage4MoreChatStep === 'during_extra_round';

    // 第三阶段默认有3个回合，额外回合只执行一次
    if (!isExtraRound && nextRound > 3) {
      console.log('[advanceToNextRound] 第三阶段已完成所有3个回合');
      handleStage3Completion(taskId);
      return;
    }

    // 根据文档 1.3.2.2-1.3.2.4 的库选择规则
    // 所有回合都使用相同的库（文档为 M11~M19，这里先用占位库 M4）
    openingLibId = 'M4';
    contentLibId = 'M4';
    leavingLibId = 'M4';
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
      const fallbackId = openingLibId === 'M1' ? 'M1' : 'M1';
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
  set(`sm:task:${taskId}`, t);

  console.log('[advanceToNextRound] 已推进到第', nextRound, '回合，初始化库:', { openingLibId, contentLibId, leavingLibId });
}

// 第一阶段完成后的处理（根据文档 1.1.2.5）
function handleStage1Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage1Completion] 第一阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：进入阶段间CD，阶段CD时间结束，进入第二阶段
    console.log('[handleStage1Completion] 分数 > X，进入阶段间CD');
    enterStageBigCd(taskId, 2);
  } else {
    // 分数 ≤ X：弹出提示板M4询问用户是否坚持
    console.log('[handleStage1Completion] 分数 ≤ X，弹出提示板M4');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage1_m4';
    t.lastActionAt = Date.now();
    set(`sm:task:${taskId}`, t);
  }
}

// 第二阶段完成后的处理（根据文档 1.2.2.4）
function handleStage2Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage2Completion] 第二阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：回复特殊库M2.5，所有消息回复给客户之后，则进入阶段间CD，CD时间结束，进入第三阶段
    console.log('[handleStage2Completion] 分数 > X，回复特殊库M2.5，进入阶段间CD');
    // TODO: 实现特殊库M2.5的逻辑
    enterStageBigCd(taskId, 3);
  } else {
    // 分数 ≤ X：弹出提示板M5询问用户是否坚持
    console.log('[handleStage2Completion] 分数 ≤ X，弹出提示板M5');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage2_m5';
    t.lastActionAt = Date.now();
    set(`sm:task:${taskId}`, t);
  }
}

// 第三阶段完成后的处理（根据文档 1.3.2.4）
function handleStage3Completion(taskId: string) {
  const t = getTask(taskId);
  if (!t) return;

  const X = t.stageThresholdX; // 阶段积分阈值
  console.log('[handleStage3Completion] 第三阶段完成，分数:', t.stageScore, '阈值X:', X);

  if (t.stageScore > X) {
    // 分数 > X：直接进入第四阶段
    console.log('[handleStage3Completion] 分数 > X，直接进入第四阶段');
    enterStage4FromStage3(taskId);
  } else {
    // 分数 ≤ X：弹出提示板M6询问用户是否坚持
    console.log('[handleStage3Completion] 分数 ≤ X，弹出提示板M6');
    t.waitingForPrompt = true;
    t.promptType = 'persist_stage3_m6';
    t.lastActionAt = Date.now();
    set(`sm:task:${taskId}`, t);
  }
}

// 进入阶段间CD并推进到下一阶段（陌生模块用）
function enterStageBigCd(taskId: string, nextStageIndex: number) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;

  const settings: Settings = get('sm:settings');
  const cdMs = settings.cd.bigRoundMinMs; // 暂时沿用回合大CD作为阶段间CD

  t.stageCdUnlockAt = Date.now() + cdMs;
  t.listBadge = '下次聊天开启倒计时';
  t.listCountdownEndAt = t.stageCdUnlockAt;
  t.currentLibChain = null;
  t.roundCdUnlockAt = null;
  t.zUnlockAt = null;
  t.dMode = false;

  // 设置下一阶段
  t.stageIndex = nextStageIndex;
  t.roundIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = settings.stageThresholdX[nextStageIndex] || t.stageThresholdX;

  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);

  console.log('[enterStageBigCd] 进入阶段间CD，下一阶段:', nextStageIndex, 'CD时长:', cdMs);
}

function enterStageCdWithRange(taskId: string, nextStageIndex: number, minMs: number, maxMs: number) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  const settings: Settings = get('sm:settings');
  const duration = randInt(minMs, maxMs);
  t.stageCdUnlockAt = Date.now() + duration;
  t.listBadge = '下次聊天开启倒计时';
  t.listCountdownEndAt = t.stageCdUnlockAt;
  t.currentLibChain = null;
  t.roundCdUnlockAt = null;
  t.zUnlockAt = null;
  t.dMode = false;
  t.stageIndex = nextStageIndex;
  t.roundIndex = 0;
  t.stageScore = 0;
  t.stageThresholdX = settings.stageThresholdX[nextStageIndex] || t.stageThresholdX;
  t.waitingForPrompt = false;
  t.promptType = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  console.log('[enterStageCdWithRange] 进入阶段间CD，下一阶段:', nextStageIndex, '范围(ms):', minMs, maxMs);
}

function setStage4InvitationPrompt(t: Task) {
  t.stageIndex = 4;
  t.roundIndex = 0;
  t.stageScore = 0;
  t.currentLibChain = null;
  t.roundCdUnlockAt = null;
  t.stageCdUnlockAt = null;
  t.zUnlockAt = null;
  t.dMode = false;
  t.waitingForPrompt = true;
  t.promptType = 'stage4_invitation_m8';
  (t as any).stage4Status = 'm8';
  t.listBadge = '等待邀约选择';
  t.listCountdownEndAt = null;
}

function enterStage4FromStage3(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  setStage4InvitationPrompt(t);
  (t as any).stage4InviteFailCount = 0;
  (t as any).stage4MoreChatCount = 0;
  (t as any).stage4MoreChatStep = '';
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  console.log('[enterStage4FromStage3] 进入第四阶段，展示M8提示板');
}

function startStage4Invitation(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  const libs: Libs = get('sm:libs');
  const chain = pickChain(libs.content, 'M20');
  if (!chain) {
    console.warn('[startStage4Invitation] 找不到M20内容库');
    return;
  }
  t.stageIndex = 4;
  t.roundIndex = 1;
  setCurrentChain(t, 'content', 'M20', chain);
  (t as any).stage4Status = 'inviting_m20';
  t.waitingForPrompt = false;
  t.promptType = null;
  t.listBadge = '聊天任务进行中';
  t.listCountdownEndAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  console.log('[startStage4Invitation] 抽取M20邀约话术');
}

function startStage4ExtraRound(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  const count = (t as any).stage4MoreChatCount || 0;
  (t as any).stage4MoreChatCount = count + 1;
  (t as any).stage4MoreChatStep = 'waiting_cd_to_extra_round';
  t.stageIndex = 3;
  t.roundIndex = 0;
  t.stageScore = 0;
  t.currentLibChain = null;
  t.roundCdUnlockAt = null;
  t.stageCdUnlockAt = null;
  t.zUnlockAt = null;
  t.dMode = false;
  t.waitingForPrompt = false;
  t.promptType = null;
  t.listBadge = '下次聊天开启倒计时';
  t.listCountdownEndAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  enterRoundBigCd(taskId, 1);
  console.log('[startStage4ExtraRound] 触发第三阶段额外回合');
}

function startStage4FailComfort(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  const libs: Libs = get('sm:libs');
  const chain = pickChain(libs.content, 'M23');
  if (!chain) {
    console.warn('[startStage4FailComfort] 找不到M23内容库，直接进入阶段CD');
    const failCount = (t as any).stage4InviteFailCount || 0;
    enterStage4FailCountdown(taskId, failCount);
    return;
  }
  t.stageIndex = 4;
  t.roundIndex = 1;
  setCurrentChain(t, 'content', 'M23', chain);
  (t as any).stage4Status = 'comfort_fail';
  t.waitingForPrompt = false;
  t.promptType = null;
  t.zUnlockAt = null;
  t.dMode = false;
  t.listBadge = '聊天任务进行中';
  t.listCountdownEndAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
  console.log('[startStage4FailComfort] 输出失败安抚话术 M23');
}

function enterStage4FailCountdown(taskId: string, failCount: number) {
  const count = failCount || 0;
  if (count <= 1) {
    enterStageCdWithRange(taskId, 3, 30 * HOUR_MS, 70 * HOUR_MS);
  } else {
    enterStageCdWithRange(taskId, 3, 5 * DAY_MS, 7 * DAY_MS);
  }
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;
  (t as any).stage4Status = 'fail_cd';
  t.listBadge = '阶段间倒计时';
  set(`sm:task:${taskId}`, t);
  console.log('[enterStage4FailCountdown] 邀约失败进入阶段CD，failCount:', count);
}

// 处理提示板点击（陌生模块）
export function handlePromptAction(taskId: string, promptType: string, action: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return { ok: false, reason: '任务不存在' };

  console.log('[sm.handlePromptAction]', { taskId, promptType, action });

  const libs: Libs = get('sm:libs');

  const clearPrompt = () => { t.waitingForPrompt = false; t.promptType = null; };

  switch (promptType) {
    case 'persist_stage1_m4': {
      if (action === 'yes') {
        clearPrompt();
        set(`sm:task:${taskId}`, t);
        enterStageBigCd(taskId, 2);
      } else if (action === 'no') {
        // 不再坚持：直接结束当前任务（暂不实现半价重开，后续可接入支付逻辑）
        clearPrompt();
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      }
      break;
    }
    case 'persist_stage2_m5': {
      if (action === 'yes') {
        clearPrompt();
        set(`sm:task:${taskId}`, t);
        // TODO: 回复特殊库 M2.5
        enterStageBigCd(taskId, 3);
      } else if (action === 'no') {
        clearPrompt();
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      }
      break;
    }
    case 'persist_stage3_m6': {
      if (action === 'yes') {
        clearPrompt();
        set(`sm:task:${taskId}`, t);
        enterStageBigCd(taskId, 4);
      } else if (action === 'no') {
        // 放弃第三阶段：直接结束任务（M7/半价重开暂未实现）
        clearPrompt();
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_invitation_m8': {
      if (action === 'invite_now') {
        clearPrompt();
        startStage4Invitation(taskId);
      } else if (action === 'more_chat') {
        const count = (t as any).stage4MoreChatCount || 0;
        if (count === 0) {
          clearPrompt();
          set(`sm:task:${taskId}`, t);
          startStage4ExtraRound(taskId);
        } else {
          t.waitingForPrompt = true;
          t.promptType = 'stage4_invitation_m8';
          t.lastActionAt = Date.now();
          set(`sm:task:${taskId}`, t);
        }
      } else if (action === 'no_choice') {
        t.waitingForPrompt = true;
        t.promptType = 'stage4_invitation_m8';
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_invitation_result': {
      const isSuccess = action === 'success' || action === 'yes';
      const isFail = action === 'fail' || action === 'no';

      if (isSuccess) {
        // 邀约成功：抽取 M21 内容库
        clearPrompt();
        const chain = pickChain(libs.content, 'M21');
        if (chain) {
          t.stageIndex = 4;
          t.roundIndex = 1;
          (t as any).stage4Status = 'm21';
          setCurrentChain(t, 'content', 'M21', chain);
        }
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      } else if (isFail) {
        // 邀约失败：记录失败次数，分情况处理
        const failCount = ((t as any).stage4InviteFailCount || 0) + 1;
        (t as any).stage4InviteFailCount = failCount;
        clearPrompt();
        set(`sm:task:${taskId}`, t);
        if (failCount <= 2) {
          startStage4FailComfort(taskId);
        } else {
          const t2 = getTask(taskId);
          if (t2) {
            t2.waitingForPrompt = true;
            t2.promptType = 'stage4_fail_over_limit_m11';
            (t2 as any).stage4Status = 'm11';
            t2.listBadge = '邀约多次失败';
            t2.listCountdownEndAt = null;
            t2.lastActionAt = Date.now();
            set(`sm:task:${taskId}`, t2);
          }
        }
      } else if (action === 'no_choice') {
        // 暂不选择：保持在结果提示板
        t.waitingForPrompt = true;
        t.promptType = 'stage4_invitation_result';
        t.lastActionAt = Date.now();
        set(`sm:task:${taskId}`, t);
      }
      break;
    }
    case 'stage4_success_finish': {
      // 邀约成功后，点击提示板收尾：结束任务或保留任务
      const closeTask = action === 'close_task' || action === 'yes';
      const keepTask = action === 'keep_task' || action === 'no';

      clearPrompt();
      (t as any).stage4Status = 'success_finished';

      if (closeTask) {
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
      } else if (keepTask) {
        t.listBadge = '邀约成功';
        t.listCountdownEndAt = null;
      }

      t.lastActionAt = Date.now();
      set(`sm:task:${taskId}`, t);
      break;
    }
    case 'stage4_fail_over_limit_m11': {
      if (action === 'guide') {
        t.waitingForPrompt = true;
        t.promptType = 'stage4_guidance_m12';
      } else if (action === 'close_task') {
        t.waitingForPrompt = true;
        t.promptType = 'stage4_halfprice_m13';
      } else {
        t.waitingForPrompt = true;
        t.promptType = 'stage4_invitation_m8';
      }
      t.lastActionAt = Date.now();
      set(`sm:task:${taskId}`, t);
      break;
    }
    case 'stage4_guidance_m12': {
      if (action === 'close_task') {
        t.waitingForPrompt = true;
        t.promptType = 'stage4_halfprice_m13';
      } else {
        setStage4InvitationPrompt(t);
      }
      t.lastActionAt = Date.now();
      set(`sm:task:${taskId}`, t);
      break;
    }
    case 'stage4_halfprice_m13': {
      // 暂未实现半价重开，先提供结束/返回选项
      if (action === 'half_restart') {
        clearPrompt();
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
      } else if (action === 'close_task') {
        clearPrompt();
        t.status = 'deleted';
        t.listBadge = '任务已结束';
        t.listCountdownEndAt = null;
      } else {
        setStage4InvitationPrompt(t);
      }
      t.lastActionAt = Date.now();
      set(`sm:task:${taskId}`, t);
      break;
    }
    default: {
      console.warn('[sm.handlePromptAction] 未识别的 promptType:', promptType);
      return { ok: false, reason: '未识别的提示类型' };
    }
  }

  return { ok: true };
}

export function clearAllTasks() {
  const ids: string[] = get('sm:tasks') || [];
  ids.forEach(id => uni.removeStorageSync(`sm:task:${id}`));
  set('sm:tasks', []);
  console.log('[sm] 已清除所有任务');
}

/**
 * 检查任务是否空闲超时
 * @param taskId 任务ID
 * @returns { needWarn: boolean, needForceCD: boolean } 是否需要警告和是否需要强制CD
 */
export function checkIdleTimeout(taskId: string): { needWarn: boolean; needForceCD: boolean } {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return { needWarn: false, needForceCD: false };

  const settings: Settings = get('sm:settings');
  const now = Date.now();
  const idleTime = now - t.lastActionAt;

  // 检查是否需要警告（45分钟）
  const needWarn = idleTime >= settings.cd.idleWarnMs && !t.idleWarningAt;

  // 检查是否需要强制CD（50分钟）
  const needForceCD = idleTime >= settings.cd.idleForceCdMs && !t.hardIdleToCdAt;

  return { needWarn, needForceCD };
}

/**
 * 标记已显示空闲警告
 * @param taskId 任务ID
 */
export function markIdleWarningShown(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;

  t.idleWarningAt = Date.now();
  set(`sm:task:${taskId}`, t);
  console.log('[sm] 已标记空闲警告显示时间');
}

/**
 * 因空闲超时强制进入大CD
 * @param taskId 任务ID
 */
export function forceIdleToBigCd(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;

  console.log('[sm] 因空闲超时强制进入大CD');
  t.hardIdleToCdAt = Date.now();
  set(`sm:task:${taskId}`, t);

  // 进入回合大CD
  enterRoundBigCd(taskId, 1);
}

/**
 * 重置空闲计时器（用户有操作时调用）
 * @param taskId 任务ID
 */
export function resetIdleTimer(taskId: string) {
  initSmLocal();
  const t = getTask(taskId);
  if (!t) return;

  // 重置空闲相关标记
  t.idleWarningAt = null;
  t.hardIdleToCdAt = null;
  t.lastActionAt = Date.now();
  set(`sm:task:${taskId}`, t);
}
