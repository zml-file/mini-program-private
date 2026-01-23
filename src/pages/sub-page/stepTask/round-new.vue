<template>
  <md-page :title="taskName || '对话页面'">
    <view class="container">
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

      <!-- 大CD倒计时页面 -->
      <view v-if="currentView === 'big_cd'" class="big-cd-view">
        <view class="cd-title">{{ cdTitle }}</view>
        <bc-countdown
          :key="cdEndTime"
          size="large"
          :time="cdEndTime"
          desc="倒计时结束后将继续对话"
          @timeup="onCdTimeup"
        />

        <!-- 对方找按钮（大CD期间显示） -->
        <view
          v-if="showOpponentFindButton"
          class="opponent-find-btn"
          :class="{ disabled: !opponentFindEnabled }"
          @click="handleOpponentFind"
        >
          <view class="btn-text">对方找</view>
          <view v-if="!opponentFindEnabled" class="btn-countdown">
            {{ opponentFindCountdown }}秒后可用
          </view>
        </view>
      </view>

      <!-- Z倒计时页面 -->
      <view v-else-if="currentView === 'z'" class="z-view">
        <!-- 如果没有倒计时，显示内容和Z按钮 -->
        <template v-if="!zEndTime">
          <!-- 显示内容 -->
          <view v-if="contentList.length > 0" class="content-before-z">
            <view v-for="(item, index) in contentList" :key="index" class="content-item">
              {{ item.text }}
            </view>
          </view>
          <!-- Z按钮 -->
          <view class="z-circle" @click="handleZClick">Z</view>
          <view class="z-tip">点击Z按钮开始倒计时</view>
        </template>

        <!-- 如果有倒计时，显示倒计时 -->
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

        <!-- Z期间也可以显示对方找按钮 -->
        <view
          v-if="showOpponentFindButton"
          class="opponent-find-bar"
          :class="{ disabled: !opponentFindEnabled }"
          @click="handleOpponentFind"
        >
          对方找
        </view>
      </view>

      <!-- 标签选择页面 -->
      <view v-else-if="currentView === 'tag_select'" class="tag-select-view">
        <view class="tag-select-title">请选择一个话题标签</view>
        <view class="tag-options">
          <view
            v-for="option in tagOptions"
            :key="option.id"
            class="tag-option"
            @click="handleTagSelect(option.id)"
          >
            <view class="tag-id">{{ option.id }}</view>
            <view class="tag-label">{{ option.label }}</view>
          </view>
        </view>
      </view>

      <!-- D模式页面 -->
      <view v-else-if="currentView === 'd'" class="d-view">
        <view class="d-circle" @click="handleDClick">D</view>
        <view class="d-tip">点击D按钮，程序将给出一条新的内容</view>
      </view>

      <!-- 正常内容显示 -->
      <view v-else-if="currentView === 'content'" class="content-view">
        <block v-if="contentList.length > 0">
          <bc-copy-list :info="pageInfoLike" :disabled="copyDisabled" @copy="handleCopyFromBc" />
        </block>
        <view v-else class="empty-state">
          <text>暂无内容</text>
        </view>
      </view>

      <!-- 阶段CD倒计时 -->
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

    <!-- 提示板弹窗 -->
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
          <view v-for="btn in promptButtons" :key="btn.key" class="prompt-btn" @click="handlePromptClick(btn.key)">{{ btn.label }}</view>
        </view>
      </view>
    </md-dialog>

    <!-- 对方找弹窗 -->
    <md-dialog
      ref="opponentDialog"
      title="对方找内容"
      :width="730"
      hideOk
      cancelText="关闭"
      @cancel="handleCloseOpponentDialog"
    >
      <!-- 倒计时提示 -->
      <view v-if="opponentCopyCountdown > 0" class="countdown-tip">
        <view class="countdown-text">倒计时结束后，复制按钮将变为可点击</view>
        <view class="countdown-number">{{ opponentCopyCountdown }}秒</view>
      </view>

      <!-- 对方找内容列表（与熟悉模块一致样式） -->
      <bc-copy-list :info="opponentPageInfoLike" :disabled="opponentCopyCountdown > 0" @copy="handleCopyOpponentFromBc" />
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
import { reactive, ref, computed, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as um from '@/utils/unfamiliar-local';
import * as sm from '@/utils/stranger-local';

// 数据
const taskId = ref('');
const taskName = ref('');
const moduleTitle = ref('');
const task = ref<any>(null);

// 视图状态
const currentView = ref<'content' | 'z' | 'd' | 'big_cd' | 'stage_cd' | 'tag_select'>('content');
const contentList = ref<any[]>([]);
const selectedContentIndex = ref<number | null>(null);
const copyDisabled = ref(false);
const isInLeaving = ref(false); // 是否处于离库阶段

// 标签选择相关
const tagOptions = ref<Array<{ id: string; label: string; type: 'opening' | 'content' | 'leaving' }>>([]);

// 复制成功提示计数（总显示20次）
const copyTipCount = ref(0);

// 获取复制CD时间（从配置中读取）
const getCopyCdMs = () => {
  const isUm = moduleTitle.value.includes('不熟');
  const settings = isUm ? uni.getStorageSync('um:settings') : uni.getStorageSync('sm:settings');
  return settings?.cd?.smallCopyCdMs || 3000; // 默认3秒
};

// 与熟悉模块一致的拷贝列表数据结构
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

// 倒计时
const cdEndTime = ref('');
const cdTitle = ref('');
const zEndTime = ref('');
const stageCdEndTime = ref('');
// 防止“无内容 -> 刷新 -> 仍无内容”的紧密递归
const noContentRefreshLock = ref(false);
// 防止回合CD结束时的无限递归
const advancingRound = ref(false);

// 提示板


const promptDialog = ref<any>(null);
const promptTitle = ref('提示');
const promptText = ref('');
const promptButtons = ref<Array<{ label: string; key: string }>>([
  { label: '是', key: 'yes' },
  { label: '否', key: 'no' },
]);

// 对方找
const showOpponentFindButton = ref(false);
const opponentFindEnabled = ref(false);
const opponentFindCountdown = ref(0);
const opponentContentList = ref<any[]>([]);
const opponentCopyCountdown = ref(0);
const opponentDialog = ref<any>(null);
const isClosingOpponentDialog = ref(false); // 防止无限递归

// 搜索
const showSearch = ref(true);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const searchDialog = ref<any>(null);
const isClosingSearchDialog = ref(false); // 防止无限递归
const searchCopyDisabled = ref(false);

// 对方找弹窗列表（与熟悉模块一致）所需的数据结构
const opponentPageInfoLike = computed(() => ({
  contentList: (opponentContentList.value || []).map((it: any, i: number) => ({
    stepDetailId: `o_${i}`,
    originIndex: i,
    content: it?.text || '',
  })),
  statusVo: {
    segmentIndex: task.value?.currentLibChain?.type === 'opponent' ? (task.value?.currentLibChain?.segmentsCopied || 0) : 0,
  },
}));


// 计算属性
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

// 页面加载
onLoad((options: any) => {
  console.log('[round-local] onLoad:', options);

  taskId.value = options.taskId;
  const rawName = options.taskName || '对话页面';
  try { taskName.value = decodeURIComponent(rawName); } catch (e) { taskName.value = rawName; }
  moduleTitle.value = options.module || '';

  if (taskId.value) {
    loadTaskData();
  } else {
    uni.showToast({ title: '任务ID缺失', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
  }
});

// 加载任务数据
const loadTaskData = () => {
  // 根据模块选择不同本地引擎
  if (moduleTitle.value.includes('不熟')) {
    um.initUmLocal();
    task.value = um.getTask(taskId.value);
  } else {
    sm.initSmLocal();
    task.value = sm.getTask(taskId.value);
  }

  // 任务不存在：直接返回上一页
  if (!task.value) {
    uni.showToast({ title: '任务不存在', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
    return;
  }

  // 任务已结束/关闭：不再尝试加载内容，避免死循环
  if (task.value.status === 'deleted') {
    uni.showToast({ title: '任务已结束', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 1500);
    return;
  }

  taskName.value = task.value.name;
  console.log('[loadTaskData] 任务数据:', task.value);
  console.log('[loadTaskData] waitingForPrompt:', task.value.waitingForPrompt);
  console.log('[loadTaskData] promptType:', task.value.promptType);
  console.log('[loadTaskData] roundCdUnlockAt:', task.value.roundCdUnlockAt);
  console.log('[loadTaskData] currentLibChain:', task.value.currentLibChain);
  console.log('[loadTaskData] stageIndex:', task.value.stageIndex, 'roundIndex:', task.value.roundIndex);

  // 检查是否需要显示提示板
  // 其他提示板
  if (task.value.waitingForPrompt && task.value.promptType && task.value.promptType !== 'friend_added') {
    console.log('[loadTaskData] 需要显示提示板，调用 showGenericPrompt, type:', task.value.promptType);
    showGenericPrompt();
    return;
  }

  if (task.value.waitingForPrompt && task.value.promptType === 'friend_added') {
    console.log('[loadTaskData] 需要显示提示板，调用 showFriendAddedPrompt');
    showFriendAddedPrompt();
    return;
  }

  const isUm = moduleTitle.value.includes('不熟');

  // 检查是否卡在对方找库（对方找库的内容应该在弹窗中显示，不应该在主页面显示）
  if (task.value.currentLibChain && task.value.currentLibChain.type === 'opponent') {
    console.log('[loadTaskData] 检测到对方找库，清除它');
    if (isUm) {
      um.clearOpponentChain(taskId.value);
      task.value = um.getTask(taskId.value);
    } else {
      sm.clearOpponentChain(taskId.value);
      task.value = sm.getTask(taskId.value);
    }
  }

  // 检查是否 currentLibChain 为 null 但任务已经开始（roundIndex > 0）
  if (!task.value.currentLibChain && task.value.roundIndex && task.value.roundIndex > 0) {
    console.log('[loadTaskData] currentLibChain 为 null 但任务已经开始，重新初始化');
    if (isUm) {
      um.reinitializeCurrentChain(taskId.value);
      task.value = um.getTask(taskId.value);
    } else {
      sm.reinitializeCurrentChain(taskId.value);
      task.value = sm.getTask(taskId.value);
    }
  }

  // 根据任务状态决定显示什么
  console.log('[loadTaskData] 调用 checkTaskStatus');
  checkTaskStatus();
};

// 检查任务状态
const checkTaskStatus = () => {
  const now = Date.now();
  console.log('[checkTaskStatus] 开始检查任务状态，now:', now);

  // 检查是否需要用户选择标签
  if (task.value.availableTagOptions && task.value.availableTagOptions.length > 0 && !task.value.selectedTagId) {
    console.log('[checkTaskStatus] 显示标签选择界面');
    currentView.value = 'tag_select';
    tagOptions.value = task.value.availableTagOptions;
    return;
  }

  // 检查阶段CD
  if (task.value.stageCdUnlockAt && now < task.value.stageCdUnlockAt) {
    console.log('[checkTaskStatus] 进入阶段CD');
    currentView.value = 'stage_cd';
    const d = new Date(task.value.stageCdUnlockAt);
    const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
    stageCdEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return;
  }

  // 检查回合CD是否已结束
  if (task.value.roundCdUnlockAt && now >= task.value.roundCdUnlockAt) {
    console.log('[checkTaskStatus] 回合CD已结束，roundCdUnlockAt:', task.value.roundCdUnlockAt, 'now:', now);
    if (advancingRound.value) {
      console.warn('[checkTaskStatus] 正在推进回合中，防止无限递归');
      return;
    }
    console.log('[checkTaskStatus] 回合CD已结束，推进到下一回合');
    advancingRound.value = true;
    const isUm = moduleTitle.value.includes('不熟');
    isUm ? um.advanceToNextRound(taskId.value) : sm.advanceToNextRound(taskId.value);
    advancingRound.value = false;
    console.log('[checkTaskStatus] advanceToNextRound 完成，重新加载任务数据');
    // 重新加载任务数据
    loadTaskData();
    return;
  }

  // 检查回合CD（未结束）
  if (task.value.roundCdUnlockAt && now < task.value.roundCdUnlockAt) {
    currentView.value = 'big_cd';
    const d = new Date(task.value.roundCdUnlockAt);
    const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
    cdEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    cdTitle.value = '下次聊天开启倒计时';
    checkOpponentFindStatus();
    return;
  }

  // 检查Z倒计时
  if (task.value.zUnlockAt && now < task.value.zUnlockAt) {
    currentView.value = 'z';
    // 使用本地时区格式：YYYY-MM-DD HH:mm:ss（避免某些端解析ISO异常导致倒计时为0）
    const d = new Date(task.value.zUnlockAt);
    const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
    zEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    console.log('[checkTaskStatus] Z倒计时:', {
      zUnlockAt: task.value.zUnlockAt,
      now,
      remaining: task.value.zUnlockAt - now,
      zEndTime: zEndTime.value
    });
    checkOpponentFindStatus();
    return;
  }

  // 检查D模式
  if (task.value.dMode) {
    currentView.value = 'd';
    return;
  }

  // 正常内容显示
  console.log('[checkTaskStatus] 进入内容显示');
  currentView.value = 'content';
  loadCurrentContent();
};

// 加载当前内容
const loadCurrentContent = async () => {
  const isUm = moduleTitle.value.includes('不熟');
  const res = isUm ? await um.getCurrentChainContent(taskId.value) : await sm.getCurrentChainContent(taskId.value);
  const sign = res.statusVo?.sign || '';
  console.log('[loadCurrentContent] sign:', sign, 'contentList:', res.contentList);

  // 注意：不要在这里立即处理 Z/D，而是先处理内容，然后再根据 sign 决定是否切换视图
  if (sign === 'D') {
    console.log('[loadCurrentContent] 遇到D，调用 onDEnter');
    isUm ? um.onDEnter(taskId.value) : sm.onDEnter(taskId.value);
    loadTaskData();
    return;
  }
  // 如果没有内容（可能是上一个库已走完且已进入下一状态），尝试直接切换到对应视图，避免递归死循环
  if (!res.contentList || res.contentList.length === 0) {
    console.log('[loadCurrentContent] 无内容，尝试切换视图');
    const now = Date.now();
    const t = moduleTitle.value.includes('不熟') ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
    if (t?.roundCdUnlockAt && now < t.roundCdUnlockAt) {
      currentView.value = 'big_cd';
      const d = new Date(t.roundCdUnlockAt);
      cdEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      cdTitle.value = '下次聊天开启倒计时';
      checkOpponentFindStatus();
      return;
    }
    if (t?.stageCdUnlockAt && now < t.stageCdUnlockAt) {
      currentView.value = 'stage_cd';
      const d = new Date(t.stageCdUnlockAt);
      stageCdEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      return;
    }
    if (t?.zUnlockAt && now < t.zUnlockAt) {
      currentView.value = 'z';
      const d = new Date(t.zUnlockAt);
      zEndTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      checkOpponentFindStatus();
      return;
    }
    // 防止“无内容-刷新-无内容”紧密递归
    if (noContentRefreshLock.value) {
      console.warn('[loadCurrentContent] 无内容且锁定，跳过本次刷新');
      return;
    }
    noContentRefreshLock.value = true;
    setTimeout(() => { noContentRefreshLock.value = false; loadTaskData(); }, 0);
    return;
  }
  // 处理并行拆分（/// 或 LL 符号）+ 段落控制（@）
  const rawContentList = res.contentList || [];
  if (rawContentList.length > 0) {
    const firstNode = rawContentList[0];
    let text = firstNode.text || '';

    // 检查是否是离库（leaving）
    const t = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    const currentChain = t?.currentLibChain || null;
    const isLeavingLib = currentChain?.type === 'leaving';
    const segmentsCopied = Number(currentChain?.segmentsCopied || 0);

    if (isLeavingLib) {
      console.log('[loadCurrentContent] 检测到离库，设置 isInLeaving = true');
      isInLeaving.value = true;
    } else {
      isInLeaving.value = false;
    }

    // 特殊：离库且仅包含 LL（如 B1/B3/B5 的 LL 离库），整段按 LL 并行拆分
    if (text.includes('LL') && !text.includes('///') && !text.includes('@')) {
      console.log('[loadCurrentContent] 离库 LL 并行拆分');
      const cleanText = text.replace(/FF/g, '');
      const parallelSegments = cleanText
        .split('LL')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      contentList.value = parallelSegments.map((segment: string, index: number) => ({
        type: firstNode.type || 'content',
        text: segment,
        stepDetailId: `leaving_ll_${index}`,
      }));
      console.log('[loadCurrentContent] 离库 LL 拆分结果:', contentList.value);
    } else {
      // 通用逻辑：先按 @ 分段，再处理当前段中的 /// 或 LL
      const cleanText = text.replace(/FF/g, '');
      const segments = cleanText
        .split('@')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      const totalSegments = segments.length;
      const segIndex = totalSegments > 0 ? Math.min(Math.max(segmentsCopied, 0), totalSegments - 1) : 0;
      const currentSegment = segments[segIndex] || '';
      console.log('[loadCurrentContent] 当前段落:', { segIndex, segmentsCopied, totalSegments, currentSegment });

      if (currentSegment.includes('///')) {
        console.log('[loadCurrentContent] 当前段落检测到 /// 并行，拆分当前段落');
        const parallelSegments = currentSegment
          .split('///')
          .map((s: string) => s.replace(/^[（(]/, '').replace(/[）)]$/, '').trim())
          .filter((s: string) => s.length > 0);
        contentList.value = parallelSegments.map((segment: string, index: number) => ({
          type: firstNode.type || 'content',
          text: segment,
          stepDetailId: `parallel_${segIndex}_${index}`,
        }));
        console.log('[loadCurrentContent] 当前段落并行拆分结果:', contentList.value);
      } else if (currentSegment.includes('LL')) {
        console.log('[loadCurrentContent] 当前段落检测到 LL 并行，拆分当前段落');
        const parallelSegments = currentSegment
          .replace(/FF/g, '')
          .split('LL')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        contentList.value = parallelSegments.map((segment: string, index: number) => ({
          type: firstNode.type || 'content',
          text: segment,
          stepDetailId: `parallel_ll_${segIndex}_${index}`,
        }));
        console.log('[loadCurrentContent] 当前段落 LL 拆分结果:', contentList.value);
      } else {
        // 普通内容：仅展示当前段落
        contentList.value = [{
          ...firstNode,
          text: currentSegment,
          stepDetailId: `seg_${segIndex}`,
        }];
        console.log('[loadCurrentContent] 当前段落为普通内容:', contentList.value);
      }
    }
  } else {
    contentList.value = [];
  }
  selectedContentIndex.value = null;

  // 处理完内容后，检查是否需要切换到 Z 视图
  // 注意：只有当所有分段都复制完后，才切换到 Z 视图
  if (sign === 'Z') {
    const t = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    const currentChain = t?.currentLibChain || null;
    const segmentsCopied = Number(currentChain?.segmentsCopied || 0);

    // 检查是否还有未复制的分段
    if (rawContentList.length > 0) {
      const firstNode = rawContentList[0];
      const text = firstNode.text || '';
      const cleanText = text.replace(/FF/g, '');
      const segments = cleanText.split('@').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      const totalSegments = segments.length;

      // 如果所有分段都已复制完，才切换到 Z 视图
      if (segmentsCopied >= totalSegments) {
        console.log('[loadCurrentContent] 所有分段已复制完，遇到Z，切换到Z视图（显示Z按钮，但不开始倒计时）');
        // 注意：不要在这里调用 onZEnter，应该等用户点击 Z 按钮后再调用
        currentView.value = 'z';
        // 清空倒计时，只显示 Z 按钮
        zEndTime.value = '';
      } else {
        console.log('[loadCurrentContent] 检测到Z标记，但还有未复制的分段，继续显示内容');
        // 还有未复制的分段，继续显示内容视图
        currentView.value = 'content';
      }
    }
  }
};

// 复制按钮文本
const getCopyButtonText = (item: any, index: number) => {
  if (copyDisabled.value) return '冷却中...';
  if (selectedContentIndex.value !== null && selectedContentIndex.value !== index) return '已选其他';
  return '复制';
};

// 供 bc-copy-list 使用的复制回调（包装原 handleCopy）
const handleCopyFromBc = (payload: any) => {
  const idx = typeof payload?.originIndex === 'number' ? payload.originIndex : 0;
  handleCopy({ type: 'content', text: payload?.content || '' }, idx);
};

// 处理复制
const handleCopy = async (item: any, index: number) => {
  console.log('[handleCopy] 开始复制:', { item, index, copyDisabled: copyDisabled.value });

  if (copyDisabled.value || (selectedContentIndex.value !== null && selectedContentIndex.value !== index)) {
    console.log('[handleCopy] 复制被禁用或已选择其他项');
    return;
  }
  const isUm = moduleTitle.value.includes('不熟');

  // 1. 获取复制前的任务状态
  const taskBefore = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
  console.log('[handleCopy] 复制前任务状态:', {
    segmentsCopied: taskBefore?.currentLibChain?.segmentsCopied,
    nodeIndex: taskBefore?.currentLibChain?.nodeIndex,
    libId: taskBefore?.currentLibChain?.libId,
    type: taskBefore?.currentLibChain?.type,
  });

  // 2. 检查特殊符号
  const rawText = item?.text || item?.content || '';
  const hasEndSymbol = rawText.includes('&');  // 结束符号
  const hasScoreSymbol = rawText.includes('++'); // 加分符号
  console.log('[handleCopy] 特殊符号检查:', { hasEndSymbol, hasScoreSymbol, rawText });

  // 3. 处理加分符号 ++
  if (hasScoreSymbol) {
    console.log('[handleCopy] 检测到++加分符号，积分+1');
    isUm ? um.addPoint(taskId.value, 1) : sm.addPoint(taskId.value, 1);
    const updatedTask = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    console.log('[handleCopy] 加分后积分:', updatedTask?.stageScore, updatedTask?.totalScore);
  }

  // 4. 复制到剪贴板（去除特殊符号）
  let copyText = rawText.replace('&', '').replace('++', '').trim();
  uni.setClipboardData({
    data: copyText,
    success: () => {
      if (hasScoreSymbol) {
        uni.showToast({ title: '复制成功，积分+1', icon: 'success' });
      } else {
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
          uni.showToast({ title: '复制成功', icon: 'success' });
        }
      }
    }
  });

  // 5. 检查结束符号 & 或 离库（优先处理）
  // 如果有 & 符号或处于离库，则直接推进到下一个节点
  if (hasEndSymbol || isInLeaving.value) {
    console.log('[handleCopy] 检测到&结束符号或离库，直接推进到下一个节点');
    if (isInLeaving.value) {
      isInLeaving.value = false;
      // 注意：离库的积分+1会在 getCurrentChainContent 中自动处理
      // 这里不需要再加分，避免重复
    }
    isUm ? um.finishCurrentLibNode(taskId.value) : sm.finishCurrentLibNode(taskId.value);
    copyDisabled.value = true;
    setTimeout(() => (copyDisabled.value = false), getCopyCdMs());
    loadTaskData();
    return;
  }

  // 7. 记录复制操作（推进段落索引）
  const res = isUm ? um.copySegment(taskId.value) : sm.copySegment(taskId.value);
  console.log('[handleCopy] copySegment 结果:', res);
  if (!res.ok) {
    uni.showToast({ title: res.reason || '无可复制内容', icon: 'none' });
    return;
  }

  // 7. 获取复制后的任务状态
  const taskAfter = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
  console.log('[handleCopy] 复制后任务状态:', {
    segmentsCopied: taskAfter?.currentLibChain?.segmentsCopied,
    nodeIndex: taskAfter?.currentLibChain?.nodeIndex,
  });

  // 8. 检查当前节点的所有段落是否都复制完了
  if (!taskAfter || !taskAfter.currentLibChain) {
    console.log('[handleCopy] 任务或链不存在，直接刷新');
    loadTaskData();
    return;
  }

  // 第四阶段的内容库（B20/B21 等）不在前端推进节点，仅记录复制，
  // 由 Z 倒计时结束后通过 advancePastCurrentNode 控制推进，避免与第四阶段逻辑冲突
  if (taskAfter.stageIndex === 4 && taskAfter.currentLibChain.type === 'content') {
    console.log('[handleCopy] 第四阶段内容库，仅记录复制，不在前端推进节点');
    copyDisabled.value = true;
    setTimeout(() => (copyDisabled.value = false), getCopyCdMs());
    loadTaskData();
    return;
  }

  // 获取当前内容的分段数量
  const currentContent = contentList.value[0];
  if (!currentContent || !currentContent.text) {
    console.log('[handleCopy] 当前内容不存在，直接刷新');
    loadTaskData();
    return;
  }

  // 计算分段数量（优先按 @ 分段，其次按 LL 分段）
  const text = currentContent.text.replace('FF', ''); // 去除 FF 前缀
  let totalSegments = 1;
  if (text.includes('@')) {
    totalSegments = text.split('@').length;
  } else if (text.includes('LL')) {
    totalSegments = text.split('LL').length;
  }

  const segmentsCopied = taskAfter.currentLibChain.segmentsCopied || 0;
  console.log('[handleCopy] 分段检查:', {
    segmentsCopied,
    totalSegments,
    text: text.substring(0, 50) + '...',
    shouldFinish: segmentsCopied >= totalSegments
  });

  // 9. 如果所有段落都复制完了，推进到下一个节点（仅适用于第1~3阶段）
  if (segmentsCopied >= totalSegments) {
    console.log('[handleCopy] ✅ 所有段落已复制完，推进到下一个节点');
    isUm ? um.finishCurrentLibNode(taskId.value) : sm.finishCurrentLibNode(taskId.value);

    const taskFinal = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    console.log('[handleCopy] 推进后任务状态:', {
      segmentsCopied: taskFinal?.currentLibChain?.segmentsCopied,
      nodeIndex: taskFinal?.currentLibChain?.nodeIndex,
    });
  } else {
    console.log('[handleCopy] ⏸️ 还有段落未复制，不推进节点');
  }

  copyDisabled.value = true;
  setTimeout(() => (copyDisabled.value = false), getCopyCdMs());
  console.log('[handleCopy] 准备刷新页面数据');
  loadTaskData();
};

// 处理Z点击
const handleZClick = () => {
  console.log('[handleZClick] 点击Z按钮，开始倒计时');
  const isUm = moduleTitle.value.includes('不熟');
  // 调用 onZEnter 开始倒计时
  isUm ? um.onZEnter(taskId.value) : sm.onZEnter(taskId.value);
  // 刷新任务数据，显示倒计时
  loadTaskData();
  uni.showToast({ title: '倒计时开始，结束后将回复新内容', icon: 'none' });
};

// 处理D点击
const handleDClick = () => {
  console.log('[handleDClick] 点击D按钮');
  // TODO: 实现D点击逻辑
};

// 处理标签选择
const handleTagSelect = (tagId: string) => {
  console.log('[handleTagSelect] 用户选择标签:', tagId);
  const isUm = moduleTitle.value.includes('不熟');
  const res = isUm ? um.selectTagOption(taskId.value, tagId) : sm.selectTagOption(taskId.value, tagId);

  if (!res.ok) {
    uni.showToast({ title: res.reason || '选择失败', icon: 'none' });
    return;
  }

  // 刷新任务数据
  loadTaskData();
  uni.showToast({ title: '已选择标签', icon: 'success' });
};

// 处理对方找
const handleOpponentFind = async () => {
  if (!opponentFindEnabled.value) {
    uni.showToast({ title: '对方找按钮暂不可用', icon: 'none' });
    return;
  }
  const isUm = moduleTitle.value.includes('\u4e0d\u719f');
  // 触发对方找链路
  isUm ? um.onOpponentFindClick(taskId.value, 'B20') : sm.onOpponentFindClick(taskId.value, 'M20');
  // 刷新任务状态（用于倒计时）
  loadTaskData();
  // 加载对方找内容
  const res = isUm ? await um.getCurrentChainContent(taskId.value) : await sm.getCurrentChainContent(taskId.value);
  opponentContentList.value = res.contentList || [];
  const now = Date.now();
  const unlock = task.value?.opponentFindCopyUnlockAt || 0;
  opponentCopyCountdown.value = unlock > now ? Math.ceil((unlock - now)/1000) : 0;
  opponentDialog.value?.open?.();
};

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' });
    return;
  }

  console.log('[handleSearch] 搜索:', searchKeyword.value);
  // TODO: 实现搜索逻辑
};

// 问号说明
const handleWenhao = () => {
  uni.navigateTo({ url: '/pages/sub-page/describe/wenhao' });
};

// 倒计时结束回调
const onCdTimeup = () => {
  console.log('[onCdTimeup] 回合CD结束');
  const isUm = moduleTitle.value.includes('不熟');
  const t = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);

  if (t?.roundCdUnlockAt) {
    console.log('[onCdTimeup] 检测到回合CD，推进到下一回合');
    // 推进到下一回合
    isUm ? um.advanceToNextRound(taskId.value) : sm.advanceToNextRound(taskId.value);
  }

  loadTaskData();
};

const onZTimeup = () => {
  console.log('[onZTimeup] Z倒计时结束');
  const isUm = moduleTitle.value.includes('不熟');
  try {
    isUm ? um.advancePastCurrentNode(taskId.value) : sm.advancePastCurrentNode(taskId.value);
  } catch (e) {
    console.error('[onZTimeup] 推进节点失败:', e);
  }
  // 倒计时结束后刷新任务与内容（getCurrentChainContent会在链路走完时自动切换到下一个库）
  loadTaskData();
};

const onStageCdTimeup = () => {
  console.log('[onStageCdTimeup] 阶段CD结束');
  const isUm = moduleTitle.value.includes('不熟');
  const t = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);

  if (t?.stageCdUnlockAt) {
    console.log('[onStageCdTimeup] 清除阶段CD标记，推进到下一阶段/回合');
    // 清除阶段CD标记
    if (isUm) {
      const task = um.getTask(taskId.value);
      if (task) {
        task.stageCdUnlockAt = null;
        task.listBadge = '聊天任务进行中';
        task.listCountdownEndAt = null;

        if (task.stageIndex === 4) {
          console.log('[onStageCdTimeup] 当前为不熟第四阶段，阶段CD结束后直接显示B12提示板');
          // 不熟第四阶段：阶段CD结束后，进入邀约选择提示板B12（写死）
          task.roundCdUnlockAt = null;
          task.currentLibChain = null;
          task.zUnlockAt = null;
          task.dMode = false;
          task.waitingForPrompt = true;
          task.promptType = 'stage4_invitation_b12';
          task.roundIndex = 0;
          uni.setStorageSync(`um:task:${taskId.value}`, task);
        } else {
          uni.setStorageSync(`um:task:${taskId.value}`, task);
          // 推进到第一回合
          um.advanceToNextRound(taskId.value);
        }
      }
    } else {
      const task = sm.getTask(taskId.value);
      if (task) {
        task.stageCdUnlockAt = null;
        task.listBadge = '聊天任务进行中';
        task.listCountdownEndAt = null;

        if (task.stageIndex === 4) {
          console.log('[onStageCdTimeup] 当前为陌生第四阶段，阶段CD结束后直接显示邀约选择提示板');
          // 陌生第四阶段：阶段CD结束后，进入邀约选择提示板（写死）
          task.roundCdUnlockAt = null;
          task.currentLibChain = null;
          task.zUnlockAt = null;
          task.dMode = false;
          task.waitingForPrompt = true;
          task.promptType = 'stage4_invitation_b12';
          task.roundIndex = 0;
          uni.setStorageSync(`sm:task:${taskId.value}`, task);
        } else {
          uni.setStorageSync(`sm:task:${taskId.value}`, task);
          // 推进到第一回合
          sm.advanceToNextRound(taskId.value);
        }
      }
    }
  }

  loadTaskData();
};

// 检查对方找状态
const checkOpponentFindStatus = () => {
  // 仅在大CD或Z期间展示按钮
  showOpponentFindButton.value = currentView.value === 'big_cd' || currentView.value === 'z';
  const now = Date.now();
  const unlockAt = task.value?.opponentFindUnlockAt || 0;
  if (!unlockAt) {
    opponentFindEnabled.value = false;
    opponentFindCountdown.value = 0;
    return;
  }
  if (now >= unlockAt) {

    opponentFindEnabled.value = true;
    opponentFindCountdown.value = 0;
  } else {
    opponentFindEnabled.value = false;
    opponentFindCountdown.value = Math.ceil((unlockAt - now) / 1000);
  }
};

// 关闭弹窗
const handleCloseOpponentDialog = () => {
  // 防止无限递归
  if (isClosingOpponentDialog.value) {
    return;
  }
  isClosingOpponentDialog.value = true;
  opponentDialog.value?.close();
  isClosingOpponentDialog.value = false;
};

const handleCloseSearchDialog = () => {
  // 防止无限递归
  if (isClosingSearchDialog.value) {
    return;
  }
  isClosingSearchDialog.value = true;
  searchDialog.value?.close();
  isClosingSearchDialog.value = false;
};

// 复制对方找内容
const handleCopyOpponent = (item: any, index: number) => {
  if (opponentCopyCountdown.value > 0) return;
  const isUm = moduleTitle.value.includes('\u4e0d\u719f');

  // 1. 复制到剪贴板
  uni.setClipboardData({
    data: item?.text || item?.content || '',
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' });
    }
  });

  // 2. 记录复制操作（推进段落索引）
  const res = isUm ? um.copySegment(taskId.value) : sm.copySegment(taskId.value);
  if (!res.ok) {
    uni.showToast({ title: res.reason || '\u65e0\u53ef\u590d\u5236\u5185\u5bb9', icon: 'none' });
    return;
  }

  // 3. 检查当前节点的所有段落是否都复制完了
  const currentTask = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
  if (!currentTask || !currentTask.currentLibChain) {
    loadTaskData();
    return;
  }

  // 获取当前内容的分段数量
  const currentContent = opponentContentList.value[0];
  if (!currentContent || !currentContent.text) {
    loadTaskData();
    return;
  }

  // 计算分段数量（优先按 @ 分段，其次按 LL 分段）
  const text = currentContent.text.replace('FF', ''); // 去除 FF 前缀
  let totalSegments = 1;
  if (text.includes('@')) {
    totalSegments = text.split('@').length;
  } else if (text.includes('LL')) {
    totalSegments = text.split('LL').length;
  }

  const segmentsCopied = currentTask.currentLibChain.segmentsCopied || 0;
  console.log('[handleCopyOpponent] 复制进度:', { segmentsCopied, totalSegments, text });

  // 4. 如果所有段落都复制完了，推进到下一个节点
  if (segmentsCopied >= totalSegments) {
    console.log('[handleCopyOpponent] 所有段落已复制完，推进到下一个节点');
    isUm ? um.finishCurrentLibNode(taskId.value) : sm.finishCurrentLibNode(taskId.value);
  }

  loadTaskData();
};

// 复制搜索结果

// 供 bc-copy-list 使用的复制回调（对方找弹窗）
const handleCopyOpponentFromBc = (payload: any) => {
  if (opponentCopyCountdown.value > 0) return;

  handleCopyOpponent({ type: 'content', text: payload?.content || '' }, typeof payload?.originIndex === 'number' ? payload.originIndex : 0);
};

const handleCopySearch = (item: any, index: number) => {
  if (searchCopyDisabled.value) return;
  console.log('[handleCopySearch] 复制搜索结果:', item);
  // TODO: 实现复制逻辑
};

// 显示"对方是否已添加好友"提示板
const showFriendAddedPrompt = () => {
  promptTitle.value = '提示';
  promptText.value = '对方是否已经添加你为好友？';
  promptButtons.value = [
    { label: '是', key: 'yes' },
    { label: '否', key: 'no' },
  ];

  // 使用 nextTick 确保 DOM 已渲染
  nextTick(() => {
    console.log('[showFriendAddedPrompt] 准备打开提示板', promptDialog.value);
    if (promptDialog.value && typeof promptDialog.value.open === 'function') {
      promptDialog.value.open();
    } else {
      console.error('[showFriendAddedPrompt] promptDialog.value.open 不是函数', promptDialog.value);


    }
  });
};


// 通用提示板
const showGenericPrompt = () => {
  const type = task.value?.promptType || '';
  // 默认
  promptTitle.value = '提示';
  promptText.value = '请选择';
  promptButtons.value = [
    { label: '是', key: 'yes' },
    { label: '否', key: 'no' },
  ];

  // 根据类型写死
  if (type === 'persist_stage1_b8' || type === 'persist_stage1_m4') {
    promptTitle.value = '是否坚持';
    promptText.value = '第一阶段：是否继续坚持？';
  } else if (type === 'persist_stage2_b9' || type === 'persist_stage2_m5') {
    promptTitle.value = '是否坚持';
    promptText.value = '第二阶段：是否继续坚持？';
  } else if (type === 'persist_stage3_b10' || type === 'persist_stage3_m6') {
    promptTitle.value = '是否坚持';
    promptText.value = '第三阶段：是否继续坚持？';
  } else if (type === 'stage4_invitation_b12') {
    // 第四阶段：邀约选择（不熟/陌生共用）
    promptTitle.value = '邀约选择';
    promptText.value = '请选择：马上邀约、多聊一次、暂时不做选择';
    promptButtons.value = [
      { label: '马上邀约', key: 'invite_now' },
      { label: '多聊一次', key: 'more_chat' },
      { label: '暂不选择', key: 'no_choice' },
    ];
  } else if (type === 'stage4_invitation_result') {
    // 第四阶段：邀约结果（对应文档中“邀约是否成功”）
    promptTitle.value = '邀约结果';
    promptText.value = '本次邀约是否成功？';
    promptButtons.value = [
      { label: '邀约成功', key: 'yes' },
      { label: '邀约失败', key: 'no' },
      { label: '暂不选择', key: 'no_choice' },
    ];
  } else if (type === 'stage4_success_finish') {
    // 第四阶段：邀约成功后的收尾（合并了文档中的 B14/B19/B20 流程）
    promptTitle.value = '邀约成功';
    promptText.value = '已邀约成功，是否结束当前任务？';
    promptButtons.value = [
      { label: '结束任务', key: 'close_task' },
      { label: '暂不关闭', key: 'keep_task' },
    ];
  }

  nextTick(() => {
    if (promptDialog.value && typeof promptDialog.value.open === 'function') {
      promptDialog.value.open();
    }
  });
};

// 点击提示板按钮
const handlePromptClick = (key: string) => {
  const isUm = moduleTitle.value.includes('不熟');
  const type = task.value?.promptType || '';

  if (type === 'friend_added') {
    // 兼容旧逻辑
    isUm ? um.confirmFriendAdded(taskId.value, key === 'yes') : sm.confirmFriendAdded(taskId.value, key === 'yes');
  } else {
    try {
      if (isUm) {
        // @ts-ignore 不熟模块的提示板处理
        um.handlePromptAction(taskId.value, type, key);
      } else {
        // @ts-ignore 陌生模块的提示板处理
        sm.handlePromptAction(taskId.value, type, key);
      }
    } catch (e) {
      console.error('[handlePromptClick] handlePromptAction 失败:', e);
    }
  }

  // 关闭并刷新
  promptDialog.value?.close();
  loadTaskData();
};

// 处理提示板确认
const handlePromptConfirm = (confirmed: boolean) => {
  const isUm = moduleTitle.value.includes('不熟');

  if (task.value?.promptType === 'friend_added') {
    // 调用对应模块的确认函数
    if (isUm) {
      um.confirmFriendAdded(taskId.value, confirmed);
    } else {
      sm.confirmFriendAdded(taskId.value, confirmed);
    }

    // 关闭提示板
    promptDialog.value?.close();

    // 重新加载任务数据
    loadTaskData();
  }
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

// 标签选择界面样式
.tag-select-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  min-height: 400rpx;

  .tag-select-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 60rpx;
    text-align: center;
  }

  .tag-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30rpx;
    width: 100%;
  }

  .tag-option {
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
    }
  }

  .tag-id {
    font-size: 36rpx;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 16rpx;
  }

  .tag-label {
    font-size: 26rpx;
    color: #666;
    text-align: center;
    line-height: 1.5;
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
    cursor: pointer;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.95);
    }
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
  .content-list {
    .content-item {
      background: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

      &.selected {
        border: 2rpx solid #667eea;
      }

      .content-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.6;
        margin-bottom: 20rpx;
      }

      .copy-btn {
        background: #667eea;
        color: #fff;
        padding: 16rpx 40rpx;
        border-radius: 8rpx;
        font-size: 26rpx;
        text-align: center;
        cursor: pointer;

        &.disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
    }
  }
}

// 提示板样式
.prompt-content {
  padding: 40rpx 20rpx;

  .prompt-text {
    font-size: 32rpx;
    color: #333;
    text-align: center;
    margin-bottom: 40rpx;
    line-height: 1.6;
  }

  .prompt-buttons {
    display: flex;
    justify-content: space-around;
    gap: 30rpx;

    .prompt-btn {
      flex: 1;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 32rpx;
      font-weight: 600;
      border-radius: 40rpx;
      cursor: pointer;
      transition: all 0.3s;

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }
}

.opponent-find-btn,
.opponent-find-bar {
  margin-top: 40rpx;
  background: #667eea;
  color: #fff;
  padding: 24rpx 60rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  text-align: center;
  cursor: pointer;

  &.disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}
</style>

