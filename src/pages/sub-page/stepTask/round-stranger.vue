<template>
  <md-page :title="taskName || '陌生模块对话'">
    <view class="container">
      <!-- 状态栏 -->
      <view class="status-bar m-bottom-20">
        <text>阶段：{{ stageIndex }}</text>
        <text class="m-left-12">｜</text>
        <text>回合：{{ roundIndex || '-' }}</text>
        <text class="m-left-12">｜</text>
        <text>步骤：{{ stepLabel }}</text>
        <text class="m-left-12">｜</text>
        <text style="color: #ff6b6b; font-weight: bold;">积分：{{ stageScore }}</text>
      </view>

      <!-- 搜索框 -->
      <view v-if="showSearch" class="search-wrap m-bottom-30">
        <md-icon class="wenhao" name="wenhao" width="48" height="48" @click="handleWenhao"></md-icon>
        <view class="search flex-c m-right-12">
          <input
            v-model="searchKeyword"
            placeholder="请输入对方的问题"
            class="m-left-20 input"
            placeholder-style="color: #7A59ED;"
          />
        </view>
        <md-icon name="search_btn" width="76" height="76" @click="handleSearch"></md-icon>
      </view>

      <!-- 大CD倒计时 -->
      <view v-if="currentView === 'big_cd'" class="big-cd-view">
        <view class="cd-title">{{ cdTitle }}</view>
        <bc-countdown
          :key="cdEndTime"
          size="large"
          :time="cdEndTime"
          desc="倒计时结束后将继续对话"
          @timeup="onCdTimeup"
        />
      </view>

      <!-- Z倒计时 -->
      <view v-else-if="currentView === 'z'" class="z-view">
        <template v-if="!zEndTime">
          <view v-if="contentList.length > 0" class="content-before-z">
            <view v-for="(item, index) in contentList" :key="index" class="content-item">
              {{ item.text }}
            </view>
          </view>
          <view class="z-circle" @click="handleZClick">Z</view>
          <view class="z-tip">点击Z按钮开始倒计时</view>
        </template>
        <template v-else>
          <view class="z-circle disabled">Z</view>
          <bc-countdown
            :key="zEndTime"
            size="medium"
            :time="zEndTime"
            desc="倒计时结束后，将回复新内容"
            @timeup="onZTimeup"
          />
          <view class="z-tip">倒计时期间，您可以自由在微信上发送内容</view>
        </template>
      </view>

      <!-- D 模式（占位） -->
      <view v-else-if="currentView === 'd'" class="d-view">
        <view class="d-circle" @click="handleDClick">D</view>
        <view class="d-tip">点击D按钮，程序将给出一条新的内容</view>
      </view>

      <!-- 正常内容 -->
      <view v-else-if="currentView === 'content'" class="content-view">
        <block v-if="contentList.length > 0">
          <bc-copy-list :info="pageInfoLike" :disabled="copyDisabled" @copy="handleCopyFromBc" />
        </block>
        <view v-else class="empty-state">
          <text>暂无内容</text>
        </view>
      </view>

      <!-- 阶段 CD 倒计时 -->
      <view v-else-if="currentView === 'stage_cd'" class="stage-cd-view">
        <view class="cd-title">阶段间倒计时</view>
        <bc-countdown
          :key="stageCdEndTime"
          size="large"
          :time="stageCdEndTime"
          desc="倒计时结束后将进入下一阶段"
          @timeup="onStageCdTimeup"
        />
      </view>
    </view>

    <!-- 提示板弹窗（仅陌生模块使用） -->
    <md-dialog
      ref="promptDialog"
      :title="promptTitle"
      :width="730"
      hideOk
      hideCancel
    >
      <view class="prompt-content">
        <view class="prompt-text">{{ promptText }}</view>
        <view class="prompt-buttons">
          <view
            v-for="btn in promptButtons"
            :key="btn.key"
            class="prompt-btn"
            @click="handlePromptClick(btn.key)"
          >
            {{ btn.label }}
          </view>
        </view>
      </view>
    </md-dialog>

    <!-- 搜索结果弹窗 -->
    <md-dialog
      ref="searchDialog"
      title="搜索结果"
      :width="730"
      hideOk
      cancelText="关闭"
      @cancel="handleCloseSearchDialog"
    >
      <view v-if="searchResults.length > 0" class="search-results">
        <view
          v-for="(item, index) in searchResults"
          :key="index"
          class="search-result-item"
        >
          <view class="result-title">{{ item.title }}</view>
          <view class="result-content">{{ item.content }}</view>
          <view
            class="copy-btn"
            :class="{ disabled: searchCopyDisabled }"
            @click="handleCopySearch(item, index)"
          >
            复制
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text>未找到相关内容</text>
      </view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as sm from '@/utils/stranger-local';

const taskId = ref('');
const taskName = ref('');
const task = ref<any>(null);

const currentView = ref<'content' | 'z' | 'd' | 'big_cd' | 'stage_cd'>('content');
const contentList = ref<any[]>([]);
const selectedContentIndex = ref<number | null>(null);
const copyDisabled = ref(false);
const isInLeaving = ref(false);
const noContentRefreshLock = ref(false);
const advancingRound = ref(false);
const lastSign = ref<'' | 'Z' | 'D'>('');

// 复制成功提示计数（总显示20次）
const copyTipCount = ref(0);
const currentNodeTotalSegments = ref(1);
const heartbeat = ref<number | null>(null);
const zEndTimeMs = ref<number | null>(null);

// 获取复制CD时间（从配置中读取）
const getCopyCdMs = () => {
  const settings = uni.getStorageSync('sm:settings');
  return settings?.cd?.smallCopyCdMs || 3000; // 默认3秒
};

const cdEndTime = ref<string>('');
const cdTitle = ref('');
const zEndTime = ref<string>('');
const stageCdEndTime = ref<string>('');

const stageIndex = computed(() => task.value?.stageIndex || 0);
const roundIndex = computed(() => task.value?.roundIndex || 0);
const stageScore = computed(() => task.value?.stageScore || 0);
const stepLabel = computed(() => {
  if (currentView.value === 'big_cd') return '回合CD';
  if (currentView.value === 'stage_cd') return '阶段CD';
  if (currentView.value === 'z') return 'Z倒计时';
  if (currentView.value === 'd') return 'D模式';
  return '对话中';
});

// 搜索相关
const showSearch = ref(true);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const searchDialog = ref<any>(null);
const searchCopyDisabled = ref(false);

const pageInfoLike = computed(() => ({
  contentList: (contentList.value || []).map((it: any, i: number) => ({
    stepDetailId: `c_${i}`,
    originIndex: i,
    content: it?.text || '',
  })),
  statusVo: {
    segmentIndex: task.value?.currentLibChain?.segmentsCopied || 0,
  },
}));

// 提示板（包括 friend_added 和后续陌生专用提示）
type PromptButton = { label: string; key: string };
type PromptConfig = { title: string; text: string; buttons: PromptButton[] };

const promptDialog = ref<any>(null);
const promptTitle = ref('提示');
const promptText = ref('');
const promptButtons = ref<PromptButton[]>([
  { label: '是', key: 'yes' },
  { label: '否', key: 'no' },
]);

const promptConfigMap: Record<string, PromptConfig> = {
  stage4_invitation_m8: {
    title: '阶段四 · 邀约选择',
    text: '请根据对方反馈选择操作：马上邀约、多聊一次或暂不选择。',
    buttons: [
      { label: '马上邀约', key: 'invite_now' },
      { label: '多聊一次', key: 'more_chat' },
      { label: '暂时不做选择', key: 'no_choice' },
    ],
  },
  stage4_invitation_result: {
    title: '阶段四 · 邀约结果',
    text: '邀约是否成功？请选择结果，便于系统继续流程。',
    buttons: [
      { label: '邀约成功', key: 'success' },
      { label: '邀约失败', key: 'fail' },
      { label: '暂未得知', key: 'no_choice' },
    ],
  },
  stage4_success_finish: {
    title: '邀约成功收尾',
    text: '是否立即关闭本次任务？',
    buttons: [
      { label: '关闭任务', key: 'close_task' },
      { label: '暂不关闭', key: 'keep_task' },
    ],
  },
  stage4_fail_over_limit_m11: {
    title: '邀约多次未成功',
    text: '已多次邀约仍未成功，可选择寻求指导或结束任务。',
    buttons: [
      { label: '我需要指导', key: 'guide' },
      { label: '结束任务', key: 'close_task' },
      { label: '再考虑一下', key: 'keep' },
    ],
  },
  stage4_guidance_m12: {
    title: '指导提示',
    text: '请根据指导建议操作，是否仍要结束任务？',
    buttons: [
      { label: '结束任务', key: 'close_task' },
      { label: '继续努力', key: 'keep_task' },
    ],
  },
  stage4_halfprice_m13: {
    title: '是否半价重启任务',
    text: '可以选择半价重启一个新任务，或直接结束当前任务。',
    buttons: [
      { label: '半价重启', key: 'half_restart' },
      { label: '结束任务', key: 'close_task' },
      { label: '返回邀约选择', key: 'back' },
    ],
  },
};

onLoad((options: any) => {
  taskId.value = options.taskId;
  const rawName = options.taskName || '对话页面';
  try { taskName.value = decodeURIComponent(rawName); } catch { taskName.value = rawName; }

  if (taskId.value) {
    loadTaskData();
  } else {
    uni.showToast({ title: '任务ID缺失', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
  }
});

const loadTaskData = () => {
  console.log('[stranger] loadTaskData start');
  sm.initSmLocal();
  task.value = sm.getTask(taskId.value);

  if (!task.value) {
    uni.showToast({ title: '任务不存在', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
    return;
  }

  if (task.value.status === 'deleted') {
    uni.showToast({ title: '任务已结束', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 1500);
    return;
  }

  console.log('[stranger] task:', task.value);
  console.log('[stranger] waitingForPrompt:', task.value.waitingForPrompt, 'promptType:', task.value.promptType, 'roundCd:', task.value.roundCdUnlockAt, 'currentLibChain:', task.value.currentLibChain);

  const now = Date.now();
  const inRoundCd = task.value.roundCdUnlockAt && now < task.value.roundCdUnlockAt;
  const inStageCd = task.value.stageCdUnlockAt && now < task.value.stageCdUnlockAt;

  // 若链丢失但已开局，且不在CD中，尝试重建
  if (!task.value.currentLibChain && task.value.roundIndex && task.value.roundIndex > 0 && !inRoundCd && !inStageCd) {
    sm.reinitializeCurrentChain(taskId.value);
    task.value = sm.getTask(taskId.value);
    console.log('[stranger] reinitializeCurrentChain done:', task.value?.currentLibChain);
  }

  const waitingForFriendPrompt = task.value.waitingForPrompt !== false;
  const friendPromptType = task.value.promptType || 'friend_added';
  const shouldAskFriendAdded =
    task.value.stageIndex === 1 &&
    (!task.value.roundIndex || task.value.roundIndex === 0) &&
    !task.value.friendAdded &&
    waitingForFriendPrompt &&
    friendPromptType === 'friend_added';

  if (task.value.waitingForPrompt && task.value.promptType && task.value.promptType !== 'friend_added') {
    showGenericPrompt();
    return;
  }

  if (shouldAskFriendAdded) {
    showFriendAddedPrompt();
    return;
  }

  checkTaskStatus();
};

const ensureHeartbeat = () => {
  if (heartbeat.value) return;
  heartbeat.value = setInterval(() => {
    if (currentView.value === 'big_cd' || currentView.value === 'stage_cd' || currentView.value === 'z') {
      checkTaskStatus();
    }
  }, 1000) as any;
};

const stopHeartbeat = () => {
  if (heartbeat.value) {
    clearInterval(heartbeat.value as any);
    heartbeat.value = null;
  }
};

const checkTaskStatus = () => {
  const now = Date.now();
  console.log('[stranger] checkTaskStatus now:', now);

  // Z倒计时到期：直接推进节点
  if (task.value.zUnlockAt && now >= task.value.zUnlockAt) {
    console.log('[stranger] z countdown finished, advance node');
    sm.advancePastCurrentNode(taskId.value);
    stopHeartbeat();
    loadTaskData();
    return;
  }

  if (task.value.stageCdUnlockAt && now < task.value.stageCdUnlockAt) {
    console.log('[stranger] stage cd');
    currentView.value = 'stage_cd';
    stageCdEndTime.value = formatTime(task.value.stageCdUnlockAt);
    ensureHeartbeat();
    return;
  }

  // 回合CD结束，推进下一回合
  if (task.value.roundCdUnlockAt && now >= task.value.roundCdUnlockAt) {
    if (advancingRound.value) return;
    advancingRound.value = true;
    console.log('[stranger] round cd ended, advance');
    sm.advanceToNextRound(taskId.value);
    advancingRound.value = false;
    loadTaskData();
    return;
  }

  if (task.value.roundCdUnlockAt && now < task.value.roundCdUnlockAt) {
    console.log('[stranger] in round cd');
    currentView.value = 'big_cd';
    cdEndTime.value = formatTime(task.value.roundCdUnlockAt);
    cdTitle.value = '下次聊天开启倒计时';
    ensureHeartbeat();
    return;
  }

  if (task.value.zUnlockAt && now < task.value.zUnlockAt) {
    console.log('[stranger] in z countdown');
    currentView.value = 'z';
    zEndTimeMs.value = task.value.zUnlockAt;
    zEndTime.value = formatTime(task.value.zUnlockAt);
    ensureHeartbeat();
    return;
  }

  if (task.value.dMode) {
    console.log('[stranger] in d mode');
    currentView.value = 'd';
    return;
  }

  console.log('[stranger] enter content view');
  currentView.value = 'content';
  stopHeartbeat();
  loadCurrentContent();
};

const loadCurrentContent = async () => {
  const res = await sm.getCurrentChainContent(taskId.value);
  const latestTask = sm.getTask(taskId.value);
  if (latestTask) {
    task.value = latestTask;
  }
  const sign = res.statusVo?.sign || '';
  lastSign.value = sign;
  currentNodeTotalSegments.value = 1;
  console.log('[stranger] loadCurrentContent sign:', sign, 'contentList:', res.contentList);

  if (sign === 'D') {
    // 当前版本先直接跳过 D 节点，后续再补充 D 模式交互
    sm.finishCurrentLibNode(taskId.value);
    loadTaskData();
    return;
  }

  if (!res.contentList || res.contentList.length === 0) {
    const now = Date.now();
    const t = sm.getTask(taskId.value);
    if (t?.roundCdUnlockAt && now < t.roundCdUnlockAt) {
      console.log('[stranger] no content, round cd view');
      currentView.value = 'big_cd';
      cdEndTime.value = formatTime(t.roundCdUnlockAt);
      cdTitle.value = '下次聊天开启倒计时';
      ensureHeartbeat();
      return;
    }
    if (t?.stageCdUnlockAt && now < t.stageCdUnlockAt) {
      console.log('[stranger] no content, stage cd view');
      currentView.value = 'stage_cd';
      stageCdEndTime.value = formatTime(t.stageCdUnlockAt);
      ensureHeartbeat();
      return;
    }
    if (t?.zUnlockAt && now < t.zUnlockAt) {
      console.log('[stranger] no content, z view');
      currentView.value = 'z';
      zEndTimeMs.value = t.zUnlockAt;
      zEndTime.value = formatTime(t.zUnlockAt);
      ensureHeartbeat();
      return;
    }
    if (noContentRefreshLock.value) return;
    noContentRefreshLock.value = true;
    setTimeout(() => { noContentRefreshLock.value = false; loadTaskData(); }, 0);
    return;
  }

  const rawContentList = res.contentList || [];
  const firstNode = rawContentList[0];
  let text = firstNode.text || '';
  const t = sm.getTask(taskId.value);
  const currentChain = t?.currentLibChain || null;
  const isLeavingLib = currentChain?.type === 'leaving';
  const segmentsCopied = Number(currentChain?.segmentsCopied || 0);

  isInLeaving.value = isLeavingLib;
  console.log('[stranger] render content, isLeaving:', isLeavingLib, 'segmentsCopied:', segmentsCopied, 'text:', text);

  // 离库且全是 LL：整段拆分
  if (text.includes('LL') && !text.includes('///') && !text.includes('@')) {
    const cleanText = text.replace(/FF/g, '');
    const parallelSegments = cleanText
      .split('LL')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    currentNodeTotalSegments.value = parallelSegments.length || 1;
    contentList.value = parallelSegments.map((segment: string, index: number) => ({
      type: firstNode.type || 'content',
      text: segment,
      stepDetailId: `leaving_ll_${index}`,
    }));
  } else {
    // 通用：先 @ 分段，再处理 ///、LL
    const cleanText = text.replace(/FF/g, '');
    const segments = cleanText
      .split('@')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    const totalSegments = segments.length;
    currentNodeTotalSegments.value = totalSegments || 1;
    const segIndex = totalSegments > 0 ? Math.min(Math.max(segmentsCopied, 0), totalSegments - 1) : 0;
    const currentSegment = segments[segIndex] || '';

    if (currentSegment.includes('///')) {
      const parallelSegments = currentSegment
        .split('///')
        .map((s: string) => s.replace(/^[（(]/, '').replace(/[）)]$/, '').trim())
        .filter((s: string) => s.length > 0);
      contentList.value = parallelSegments.map((segment: string, index: number) => ({
        type: firstNode.type || 'content',
        text: segment,
        stepDetailId: `parallel_${segIndex}_${index}`,
      }));
    } else if (currentSegment.includes('LL')) {
      const parallelSegments = currentSegment
        .replace(/FF/g, '')
        .split('LL')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      currentNodeTotalSegments.value = totalSegments || 1;
      contentList.value = parallelSegments.map((segment: string, index: number) => ({
        type: firstNode.type || 'content',
        text: segment,
        stepDetailId: `parallel_ll_${segIndex}_${index}`,
      }));
    } else {
      contentList.value = [{
        ...firstNode,
        text: currentSegment,
        stepDetailId: `seg_${segIndex}`,
      }];
    }
  }
  selectedContentIndex.value = null;

  // 若遇到 Z，且所有分段已复制，切到 Z 视图
  if (sign === 'Z') {
    const currentChain2 = sm.getTask(taskId.value)?.currentLibChain || null;
    const copied = Number(currentChain2?.segmentsCopied || 0);
    const clean = (firstNode.text || '').replace(/FF/g, '');
    const total = clean.split('@').map((s: string) => s.trim()).filter((s: string) => s.length > 0).length;
    if (copied >= total) {
      const tNow = sm.getTask(taskId.value);
      const now = Date.now();
      if (tNow?.zUnlockAt && now < tNow.zUnlockAt) {
        currentView.value = 'z';
        zEndTime.value = formatTime(tNow.zUnlockAt);
      } else {
        console.log('[stranger] auto start Z countdown');
        sm.onZEnter(taskId.value);
        loadTaskData();
        return;
      }
    } else {
      currentView.value = 'content';
    }
  }
};

const handleCopyFromBc = (payload: any) => {
  const idx = typeof payload?.originIndex === 'number' ? payload.originIndex : 0;
  handleCopy({ type: 'content', text: payload?.content || '' }, idx);
};

const handleCopy = (item: any, index?: number) => {
  console.log('[stranger] handleCopy start:', { item, index, copyDisabled: copyDisabled.value, selectedContentIndex: selectedContentIndex.value, lastSign: lastSign.value });
  if (copyDisabled.value || (selectedContentIndex.value !== null && selectedContentIndex.value !== index)) return;

  // 特殊符号
  const rawText = item?.text || item?.content || '';
  const hasEndSymbol = rawText.includes('&');
  const hasScoreSymbol = rawText.includes('++');

  if (hasScoreSymbol) sm.addPoint(taskId.value, 1);

  const copyText = rawText.replace('&', '').replace('++', '').trim();
  uni.setClipboardData({
    data: copyText,
    success: () => {
      // 检查复制成功提示是否已显示20次
      if (copyTipCount.value < 20) {
        // 显示"复制成功，请尽快粘贴。后期不再提示"（使用duration实现短暂显示）
        uni.showToast({
          title: '复制成功，请尽快粘贴。后期不再提示',
          icon: 'success',
          duration: 1000  // 1秒后自动消失，模拟闪现效果
        });
        copyTipCount.value++;
      } else {
        // 已显示20次，只显示普通"复制成功"
        uni.showToast({ title: hasScoreSymbol ? '复制成功，积分+1' : '复制成功', icon: 'success' });
      }
    },
  });

  // & 或离库：直接推进节点
  if (hasEndSymbol || isInLeaving.value) {
    if (isInLeaving.value) isInLeaving.value = false;
    console.log('[stranger] handleCopy finish node because end symbol or leaving');
    sm.finishCurrentLibNode(taskId.value);
    copyDisabled.value = true;
    setTimeout(() => (copyDisabled.value = false), getCopyCdMs());
    loadTaskData();
    return;
  }

  const res = sm.copySegment(taskId.value);
  console.log('[stranger] copySegment result:', res);
  if (!res.ok) {
    uni.showToast({ title: res.reason || '无可复制内容', icon: 'none' });
    return;
  }

  const t = sm.getTask(taskId.value);
  console.log('[stranger] task after copy:', t?.currentLibChain);
  if (!t || !t.currentLibChain) {
    loadTaskData();
    return;
  }

  const isFriendGreeting =
    t.stageIndex === 1 &&
    (!t.roundIndex || t.roundIndex === 0) &&
    !t.friendAdded &&
    !!t.friendGreetingPending;

  const currentContent = contentList.value[0];
  if (!currentContent || !currentContent.text) {
    loadTaskData();
    return;
  }

  const totalSegments = currentNodeTotalSegments.value || 1;
  const segmentsCopied = t.currentLibChain.segmentsCopied || 0;
  const isZNode = lastSign.value === 'Z';
  console.log('[stranger] segments status:', { segmentsCopied, totalSegments, isFriendGreeting, isZNode });
  if (segmentsCopied >= totalSegments) {
    if (isZNode) {
      const now = Date.now();
      const tZ = sm.getTask(taskId.value);
      if (!tZ?.zUnlockAt || now >= tZ.zUnlockAt) sm.onZEnter(taskId.value);
    } else if (isFriendGreeting) {
      sm.completeFriendGreetingCopy(taskId.value);
    } else {
      sm.finishCurrentLibNode(taskId.value);
    }
  }

  copyDisabled.value = true;
  setTimeout(() => (copyDisabled.value = false), getCopyCdMs());
  loadTaskData();
};

const handleZClick = () => {
  sm.onZEnter(taskId.value);
  loadTaskData();
  uni.showToast({ title: '倒计时开始，结束后将回复新内容', icon: 'none' });
};

const handleDClick = () => {
  uni.showToast({ title: 'D 模式开发中', icon: 'none' });
};

const onCdTimeup = () => {
  loadTaskData();
};

const onZTimeup = () => {
  sm.advancePastCurrentNode(taskId.value);
  loadTaskData();
};

const onStageCdTimeup = () => {
  loadTaskData();
};

const formatTime = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const showFriendAddedPrompt = () => {
  promptTitle.value = '好友状态确认';
  promptText.value = '对方是否已经添加你为好友？';
  promptButtons.value = [
    { label: '是，已经加好友', key: 'yes' },
    { label: '否，还没加好友', key: 'no' },
  ];
  nextTick(() => {
    promptDialog.value?.open?.();
  });
};

const buildPromptConfig = (type: string): PromptConfig => {
  if (promptConfigMap[type]) return promptConfigMap[type];
  return {
    title: '提示',
    text: `请根据提示选择操作（${type}）`,
    buttons: [
      { label: '是', key: 'yes' },
      { label: '否', key: 'no' },
    ],
  };
};

const showGenericPrompt = () => {
  const type = task.value?.promptType || 'default';
  const cfg = buildPromptConfig(type);
  promptTitle.value = cfg.title;
  promptText.value = cfg.text;
  promptButtons.value = cfg.buttons;
  nextTick(() => promptDialog.value?.open?.());
};

const handlePromptClick = (key: string) => {
  const type = task.value?.promptType || 'friend_added';
  if (type === 'stage4_invitation_m8' && key === 'no_choice') {
    uni.showToast({ title: '请了解对方需求后尽快选择', icon: 'none' });
  }
  if (type === 'stage4_invitation_result' && key === 'no_choice') {
    uni.showToast({ title: '记录结果后才可继续', icon: 'none' });
  }
  if (type === 'friend_added') {
    const added = key === 'yes';
    sm.confirmFriendAdded(taskId.value, added);
  } else {
    sm.handlePromptAction(taskId.value, type, key);
  }
  promptDialog.value?.close();
  loadTaskData();
};
// 搜索相关方法
const handleWenhao = () => {
  uni.navigateTo({ url: '/pages/sub-page/describe/wenhao' });
};

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' });
    return;
  }

  // 模拟搜索结果，实际应该调用搜索API
  searchResults.value = [
    {
      title: '搜索结果示例',
      content: '这是搜索结果的示例内容，实际应该调用搜索API获取真实数据。'
    }
  ];

  searchDialog.value?.open();
};

const handleCloseSearchDialog = () => {
  searchDialog.value?.close();
};

const handleCopySearch = (item: any, index: number) => {
  if (searchCopyDisabled.value) return;

  // 复制到剪贴板
  uni.setClipboardData({
    data: item.content,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' });
      searchCopyDisabled.value = true;
      setTimeout(() => {
        searchCopyDisabled.value = false;
      }, 3000);
    }
  });
};

</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  min-height: 100vh;
}

.status-bar {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.big-cd-view,
.stage-cd-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;

  .cd-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 40rpx;
  }
}

.z-view,
.d-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;

  .z-circle,
  .d-circle {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 80rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
  }

  .z-tip,
  .d-tip {
    font-size: 28rpx;
    color: #666;
    margin-top: 20rpx;
    text-align: center;
  }
}

.content-view {
  .empty-state {
    text-align: center;
    padding: 100rpx 0;
    color: #999;
    font-size: 28rpx;
  }
}

.prompt-content {
  padding: 20rpx 0;

  .prompt-text {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 30rpx;
    text-align: center;
  }

  .prompt-buttons {
    display: flex;
    justify-content: center;
    gap: 20rpx;

    .prompt-btn {
      padding: 16rpx 40rpx;
      background: #667eea;
      color: #fff;
      border-radius: 8rpx;
      font-size: 28rpx;
      text-align: center;
    }
  }
}

// 搜索框样式
.search-wrap {
  width: 100%;
  display: flex;
  align-items: center;

  .wenhao {
    margin-right: 12rpx;
  }

  .search {
    border-radius: 100rpx;
    border: solid 1px #7A59ED;
    box-shadow: 0 8rpx 8rpx 0 #00000040;
    background: white;
    height: 72rpx;
    line-height: 72rpx;
    width: 100%;
    padding: 0 30rpx;
    box-sizing: border-box;
    flex: 1;

    .input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
    }
  }
}

// 搜索结果弹窗样式
.search-results {
  max-height: 500rpx;
  overflow-y: auto;
}

.search-result-item {
  padding: 20rpx 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  .result-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .result-content {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
    margin-bottom: 20rpx;
  }

  .copy-btn {
    display: inline-block;
    padding: 8rpx 20rpx;
    background: #667eea;
    color: #fff;
    border-radius: 8rpx;
    font-size: 24rpx;
    text-align: center;

    &.disabled {
      background: #ccc;
    }
  }
}

.empty-state {
  padding: 40rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

</style>
