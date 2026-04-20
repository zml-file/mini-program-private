<template>
  <md-page :title="taskName || '陌生模块对话'">
    <view class="container">
      <!-- 状态栏 -->
      <view class="status-bar m-bottom-20" v-show="false">
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
            :placeholder="searchPlaceholder"
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
          <view class="action-orb action-orb--z" @click="handleZClick">
            <image class="action-orb__image" src="/static/images/z.png" mode="aspectFit" />
          </view>
          <view class="z-tip">点击Z按钮开始倒计时</view>
        </template>
        <template v-else>
          <view class="action-orb action-orb--z disabled">
            <image class="action-orb__image" src="/static/images/z.png" mode="aspectFit" />
          </view>
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
        <view class="action-orb action-orb--d" @click="handleDClick">
          <image class="action-orb__image" src="/static/images/d.png" mode="aspectFit" />
        </view>
        <view class="d-tip">点击D按钮，程序将给出一条新的内容</view>
      </view>

      <!-- 正常内容 -->
      <view v-else-if="currentView === 'content'" class="content-view">
        <block v-if="contentList.length > 0">
          <bc-copy-list :info="pageInfoLike" :disabled="copyDisabled" :userVipLevel="userVipLevel" @copy="handleCopyFromBc" />
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
      :width="550"
      hideOk
      hideCancel
    >
      <view class="prompt-content">
        <view class="prompt-text">{{ promptText }}</view>
        <view class="prompt-buttons">
          <button
            v-for="btn in promptButtons"
            :key="btn.key"
            class="prompt-btn"
            @tap="handlePromptClick(btn.key)"
          >
            {{ btn.label }}
          </button>
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
          <view class="result-head">
            <view class="result-title">{{ item.title }}</view>
            <view class="result-source">{{ item.sourceLabel }}</view>
          </view>
          <view class="result-content">
            <text>{{ item.contentParts?.before || '' }}</text>
            <text class="result-highlight">{{ item.contentParts?.match || '' }}</text>
            <text>{{ item.contentParts?.after || '' }}</text>
          </view>
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
        <text>{{ searchEmptyText }}</text>
      </view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import api from '@/api';
import * as sm from '@/utils/stranger-local';
import { getPlaceholder } from '@/utils/placeholder-manager';
import { getAllContentLibraryData } from '@/utils/content-library-sync';

const taskId = ref('');
const taskName = ref('');
const task = ref<any>(null);
const userVipLevel = ref(0); // 用户VIP等级，默认游客
const remainingVirtual = ref(0);
const currentSearchCost = ref(100);
const pendingHalfRestartRetry = ref(false); // 标记是否需要重试半价重启

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
const searchEmptyText = ref('未找到相关内容');
const searchPlaceholder = ref('请输入对方的问题'); // 动态placeholder

// 加载动态placeholder
onMounted(async () => {
  try {
    searchPlaceholder.value = await getPlaceholder('strange_module');
  } catch (error) {
    console.error('[round-stranger] 加载placeholder失败:', error);
  }
});
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
  persist_stage1_m4: {
    title: '第一阶段结果确认',
    text: '当前阶段分数未达预期，是否仍然坚持继续推进到下一阶段？',
    buttons: [
      { label: '坚持', key: 'yes' },
      { label: '放弃', key: 'no' },
    ],
  },
  persist_stage2_m5: {
    title: '第二阶段结果确认',
    text: '当前阶段分数未达预期，是否仍然坚持继续推进到下一阶段？',
    buttons: [
      { label: '坚持', key: 'yes' },
      { label: '放弃', key: 'no' },
    ],
  },
  persist_stage3_m6: {
    title: '第三阶段结果确认',
    text: '当前阶段分数未达预期，是否仍然坚持继续推进到邀约阶段？',
    buttons: [
      { label: '坚持', key: 'yes' },
      { label: '放弃', key: 'no' },
    ],
  },
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

  if (uni.getStorageSync('halfRestartRetrySuccess')) {
    uni.removeStorageSync('halfRestartRetrySuccess');
    uni.showToast({ title: '已完成充值，任务已半价重启', icon: 'success' });
  }

  // 获取用户VIP等级
  getUserVipLevel();

  if (taskId.value) {
    loadTaskData();
  } else {
    uni.showToast({ title: '任务ID缺失', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
  }
});

// 页面显示时刷新VIP等级（从充值页返回时）
onShow(async () => {
  await getUserVipLevel();
  if (pendingHalfRestartRetry.value && uni.getStorageSync('isRefresh')) {
    pendingHalfRestartRetry.value = false;
    uni.removeStorageSync('isRefresh');
    if (!task.value) {
      loadTaskData();
    }
    if (!task.value) {
      uni.showToast({ title: '任务加载失败', icon: 'none' });
      return;
    }
    const promptType = task.value.promptType || '';
    const result = sm.handlePromptAction(taskId.value, promptType, 'half_restart');
    const newTaskId = (result as any)?.newTaskId;
    if (newTaskId) {
      uni.setStorageSync('halfRestartRetrySuccess', 1);
      uni.redirectTo({
        url: `/pages/sub-page/stepTask/round-stranger?taskId=${newTaskId}&taskName=${encodeURIComponent(task.value?.name || taskName.value || '对话页面')}`,
      });
      return;
    }
    if (result && (result as any).ok === false) {
      uni.showToast({ title: (result as any).reason || '半价重启失败', icon: 'none' });
    }
  }
});

// 获取用户VIP等级
const getUserVipLevel = async () => {
  try {
    const res = await api.common.info();
    userVipLevel.value = res.data?.userLevel ?? 0;
    remainingVirtual.value = Number(res.data?.remainingVirtual || 0);
    console.log('[round-stranger] 用户VIP等级:', userVipLevel.value, '心币余额:', remainingVirtual.value, '原始余额值:', res.data?.remainingVirtual);
  } catch (error) {
    console.error('[round-stranger] 获取VIP等级失败:', error);
    userVipLevel.value = 0; // 失败时默认游客
    remainingVirtual.value = 0;
  }
};

const loadTaskData = () => {
  console.log('[stranger] loadTaskData start');
  sm.initSmLocal();
  task.value = sm.getTask(taskId.value);

  if (!task.value) {
    uni.showToast({ title: '任务不存在', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
    return;
  }

  currentSearchCost.value = task.value.searchQaCost || 100;

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
    console.log('[stranger] enter D mode');
    const tNow = sm.getTask(taskId.value);
    if (!tNow?.dMode) {
      sm.onDEnter(taskId.value);
    }
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
    } else if (lastSign.value === 'D') {
      sm.onDEnter(taskId.value);
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
  sm.onDClick(taskId.value);
  loadTaskData();
  uni.showToast({ title: '已进入下一条内容', icon: 'none' });
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
  console.log('[round-stranger] handlePromptClick:', { key, promptType: task.value?.promptType, taskId: taskId.value });
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
    const result = sm.handlePromptAction(taskId.value, type, key);
    if (result && (result as any).ok === false) {
      const reason = (result as any).reason || '操作失败';
      if (reason.includes('余额不足')) {
        const isGuest = userVipLevel.value < 1;
        pendingHalfRestartRetry.value = true;
        uni.showModal({
          title: '心币不足',
          content: isGuest ? '充值即可升级为会员，是否立即充值？' : `您的心币余额不足，当前余额${remainingVirtual.value}心币，是否前往充值？`,
          confirmText: isGuest ? '立即充值' : '去充值',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/recharge/index' });
            } else {
              pendingHalfRestartRetry.value = false;
            }
          }
        });
      } else {
        uni.showToast({ title: reason, icon: 'none' });
      }
    }
    const newTaskId = (result as any)?.newTaskId;
    if (newTaskId) {
      uni.redirectTo({
        url: `/pages/sub-page/stepTask/round-stranger?taskId=${newTaskId}&taskName=${encodeURIComponent(task.value?.name || taskName.value || '对话页面')}`,
      });
      promptDialog.value?.close();
      return;
    }
  }
  promptDialog.value?.close();
  loadTaskData();
};
// 搜索相关方法
const handleWenhao = () => {
  uni.navigateTo({ url: '/pages/sub-page/describe/wenhao' });
};

const handleSearch = () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' });
    return;
  }

  console.log('[搜索] 当前心币余额:', remainingVirtual.value);
  console.log('[搜索] 本次搜索费用:', currentSearchCost.value);
  console.log('[搜索] 余额是否足够:', remainingVirtual.value >= currentSearchCost.value);

  if (remainingVirtual.value < currentSearchCost.value) {
    uni.showModal({
      title: '心币不足',
      content: `本次搜索需要 ${currentSearchCost.value} 心币，当前余额 ${remainingVirtual.value} 心币不足，请先充值。`,
      confirmText: '去充值',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/recharge/index' });
        }
      }
    });
    return;
  }

  uni.showModal({
    title: '搜索问答',
    content: `本次搜索需要消耗 ${currentSearchCost.value} 心币，当前余额 ${remainingVirtual.value} 心币，是否继续？`,
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        executeSearch(keyword);
      }
    }
  });
};

const executeSearch = (keyword: string) => {
  const searchState = sm.performSearchQa(taskId.value);
  if (!searchState.ok) {
    uni.showToast({ title: searchState.reason || '搜索失败', icon: 'none' });
    return;
  }

  // 从本地库搜索
  const local = getAllContentLibraryData();
  const data = local?.data as any;
  const results: Array<{
    title: string;
    content: string;
    key: string;
    sourceLabel: string;
    contentParts: { before: string; match: string; after: string };
    matchScore: number;
    matchIndex: number;
  }> = [];
  const seen = new Set<string>();
  const copiedSearchKeys = new Set(task.value?.copiedSearchKeys || []);
  const qaMaxItems = Math.max(1, Number(task.value?.qaVipMaxItems || 0));
  const normalizedKeyword = String(keyword).trim();
  const normalizedKeywordLower = normalizedKeyword.toLowerCase();
  const compactKeyword = normalizedKeywordLower.replace(/\s+/g, '');

  const findMatchMeta = (text: string) => {
    const lowerText = text.toLowerCase();
    const directIndex = lowerText.indexOf(normalizedKeywordLower);
    if (directIndex >= 0) {
      return {
        matched: true,
        matchIndex: directIndex,
        highlightStart: directIndex,
        highlightLength: normalizedKeyword.length,
      };
    }

    const compactText = lowerText.replace(/\s+/g, '');
    const compactIndex = compactText.indexOf(compactKeyword);
    if (compactKeyword && compactIndex >= 0) {
      let compactCursor = 0;
      let start = -1;
      let end = -1;
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text[i])) continue;
        if (compactCursor === compactIndex && start === -1) start = i;
        if (compactCursor === compactIndex + compactKeyword.length - 1) {
          end = i;
          break;
        }
        compactCursor += 1;
      }
      if (start >= 0 && end >= start) {
        return {
          matched: true,
          matchIndex: start,
          highlightStart: start,
          highlightLength: end - start + 1,
        };
      }
    }

    return {
      matched: false,
      matchIndex: -1,
      highlightStart: -1,
      highlightLength: 0,
    };
  };

  const buildHighlightParts = (text: string, highlightStart: number, highlightLength: number) => {
    if (highlightStart < 0 || highlightLength <= 0) {
      return { before: text, match: '', after: '' };
    }
    return {
      before: text.slice(0, highlightStart),
      match: text.slice(highlightStart, highlightStart + highlightLength),
      after: text.slice(highlightStart + highlightLength),
    };
  };

  const pushMatch = (title: string, text: string, sourceLabel: string, matchScore = 1) => {
    if (!text) return;
    const normalized = String(text).trim();
    const key = `${title}::${normalized}`;
    const matchMeta = findMatchMeta(normalized);
    if (copiedSearchKeys.has(key)) return;
    if (matchMeta.matched && !seen.has(key)) {
      seen.add(key);
      results.push({
        title,
        content: normalized,
        key,
        sourceLabel,
        contentParts: buildHighlightParts(normalized, matchMeta.highlightStart, matchMeta.highlightLength),
        matchScore,
        matchIndex: matchMeta.matchIndex,
      });
    }
  };

  if (data) {
    const walkLibraries = (libs: Record<string, any>, sourceLabel: string) => {
      Object.values(libs || {}).forEach((lib: any) => {
        const title = lib?.libraryName || lib?.libraryId || '内容库';
        const contents = lib?.contents || [];
        contents.forEach((node: any) => {
          const titleMatch = findMatchMeta(title).matched;
          const score = titleMatch ? 3 : 1;
          pushMatch(title, node?.text || '', sourceLabel, score);
        });
      });
    };

    const walkQaLibraries = (libs: Record<string, any>) => {
      const currentStage = Number(task.value?.stageIndex || 1);
      Object.values(libs || {})
        .filter((lib: any) => Number(lib?.stage || 0) === currentStage)
        .forEach((lib: any) => {
          const title = lib?.libraryName || lib?.libraryId || '问答库';
          const items = lib?.items || [];
          items.forEach((item: any) => {
            const keywords = Array.isArray(item?.keywords) ? item.keywords : [];
            const answers = Array.isArray(item?.answers) ? item.answers : [];
            const keywordMatched = keywords.some((it: string) => findMatchMeta(String(it || '')).matched);

            if (keywordMatched) {
              answers.forEach((answer: any) => {
                pushMatch(title, answer?.text || '', '问答库', 4);
              });
              return;
            }

            answers.forEach((answer: any) => {
              const titleMatch = findMatchMeta(title).matched;
              const score = titleMatch ? 3 : 1;
              pushMatch(title, answer?.text || '', '问答库', score);
            });
          });
        });
    };

    walkLibraries(data.contentLibraries, '内容库');
    walkLibraries(data.leaveLibraries, '离库');
    walkLibraries(data.proactiveLibraries, '对方找');
    walkQaLibraries(data.qaLibraries);
  }

  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex;
    return a.content.length - b.content.length;
  });

  searchResults.value = results.slice(0, qaMaxItems);
  searchDialog.value?.open();

  const hasCopiedHistory = copiedSearchKeys.size > 0;
  if (searchResults.value.length === 0) {
    searchEmptyText.value = hasCopiedHistory
      ? '当前阶段暂无新的匹配内容，可能已被你复制过，建议更换关键词再试。'
      : '当前阶段暂无匹配内容，建议更换关键词再试。';
  } else {
    searchEmptyText.value = '未找到相关内容';
  }

  remainingVirtual.value = Math.max(0, remainingVirtual.value - searchState.cost);
  currentSearchCost.value = searchState.nextCost;
  searchKeyword.value = '';

  const limitTip = results.length >= qaMaxItems ? `，本次最多展示 ${qaMaxItems} 条` : '';
  const emptyTip = searchResults.value.length === 0 ? '，当前阶段暂无可展示结果' : '';
  uni.showToast({
    title: `搜索完成，消耗 ${searchState.cost} 心币${limitTip}${emptyTip}`,
    icon: 'success'
  });
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
      if (item?.key) {
        sm.markSearchResultCopied(taskId.value, item.key);
      }
      uni.showToast({ title: '已复制', icon: 'success' });
      searchCopyDisabled.value = true;
      searchResults.value = searchResults.value.filter((it: any) => it?.key !== item?.key);
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


  .z-tip,
  .d-tip {
    font-size: 28rpx;
    color: #666;
    margin-top: 20rpx;
    text-align: center;
  }
}

.z-view,
.d-view {
  .action-orb {
    width: 248rpx;
    height: 248rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, opacity 0.2s ease;

    &:active {
      transform: scale(0.97);
    }

    &.disabled {
      opacity: 0.5;
      filter: grayscale(1);
    }
  }
}

.action-orb__image {
  width: 100%;
  height: 100%;
  display: block;
}

.opponent-find-pill {
  width: 420rpx;
  max-width: 100%;
  min-height: 88rpx;
  padding: 0 28rpx;
  border-radius: 26rpx;
  background: linear-gradient(90deg, #6c65ff 0%, #8c60ff 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(107, 101, 255, 0.18);

  &.disabled {
    background: #c8c8d4;
    color: #ffffff;
    box-shadow: none;
  }
}

.opponent-find-orb {
  width: 190rpx;
  height: 190rpx;
  margin-top: 40rpx;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7c9da;
  color: #111;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  box-shadow: 0 10rpx 22rpx rgba(0, 0, 0, 0.08);

  &::before {
    content: '';
    position: absolute;
    inset: -4rpx;
    border-radius: 50%;
    border: 5rpx solid #111;
    border-right-color: transparent;
    border-bottom-color: transparent;
    transform: rotate(-8deg);
    pointer-events: none;
  }

  &.disabled {
    background: #d9d9df;
    color: #ffffff;
    box-shadow: none;

    &::before {
      border-color: #7a7a7a;
      border-right-color: transparent;
      border-bottom-color: transparent;
    }
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
      line-height: 1.4;
      margin: 0;
      border: none;
    }

    .prompt-btn::after {
      border: none;
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

  .result-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 10rpx;
  }

  .result-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }

  .result-source {
    flex-shrink: 0;
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
    background: #f1ebff;
    color: #7A59ED;
    font-size: 22rpx;
    line-height: 1.4;
  }

  .result-content {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
    margin-bottom: 20rpx;
    word-break: break-all;
  }

  .result-highlight {
    color: #7A59ED;
    font-weight: 700;
    background: rgba(122, 89, 237, 0.12);
    padding: 0 4rpx;
    border-radius: 6rpx;
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
