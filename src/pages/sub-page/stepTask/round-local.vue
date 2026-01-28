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

      <!-- D模式页面 -->
      <view v-else-if="currentView === 'd'" class="d-view">
        <view class="d-circle" @click="handleDClick">D</view>
        <view class="d-tip">点击D按钮，程序将给出一条新的内容</view>
      </view>

      <!-- 正常内容显示 -->
      <view v-else-if="currentView === 'content'" class="content-view">
        <!-- 内容列表 -->
        <block v-if="contentList.length > 0">
          <bc-copy-list :info="pageInfoLike" :disabled="copyDisabled" :userVipLevel="userVipLevel" @copy="handleCopyFromBc" />
        </block>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text>暂无内容</text>
        </view>
      </view>

      <!-- 阶段CD倒计时 -->
      <view v-else-if="currentView === 'stage_cd'" class="stage-cd-view">
        <view class="cd-title">阶段间倒计时</view>
        <bc-countdown
          size="large"
          :time="stageCdEndTime"
          desc="倒计时结束后将进入下一阶段"
          @timeup="onStageCdTimeup"
        />
      </view>
    </view>

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
      <bc-copy-list :info="opponentPageInfoLike" :disabled="opponentCopyCountdown > 0" :userVipLevel="userVipLevel" @copy="handleCopyOpponentFromBc" />
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
import { reactive, ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as um from '@/utils/unfamiliar-local';
import * as sm from '@/utils/stranger-local';
import * as fm from '@/utils/familiar-local';
import api from '@/api';

// 数据
const taskId = ref('');
const taskName = ref('');
const moduleTitle = ref('');
const task = ref<any>(null);
const userVipLevel = ref(1); // 用户VIP等级，默认VIP1

// 视图状态
const currentView = ref<'content' | 'z' | 'd' | 'big_cd' | 'stage_cd'>('content');
const contentList = ref<any[]>([]);
const selectedContentIndex = ref<number | null>(null);
const copyDisabled = ref(false);

// 复制成功提示计数（总显示20次）
const copyTipCount = ref(0);

// 获取复制CD时间（从配置中读取）
const getCopyCdMs = () => {
  const settings = uni.getStorageSync('fm:settings');
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

// 对方找
const showOpponentFindButton = ref(false);
const opponentFindEnabled = ref(false);
const opponentFindCountdown = ref(0);
const opponentContentList = ref<any[]>([]);
const opponentCopyCountdown = ref(0);
const opponentDialog = ref<any>(null);


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

// 搜索
const showSearch = ref(true);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const searchCopyDisabled = ref(false);
const searchDialog = ref<any>(null);

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

  // 获取用户VIP等级
  getUserVipLevel();

  if (taskId.value) {
    loadTaskData();
  } else {
    uni.showToast({ title: '任务ID缺失', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
  }
});

// 获取用户VIP等级
const getUserVipLevel = async () => {
  try {
    const res = await api.common.info();
    userVipLevel.value = res.data?.userLevel || 1;
    console.log('[round-local] 用户VIP等级:', userVipLevel.value);
  } catch (error) {
    console.error('[round-local] 获取VIP等级失败:', error);
    userVipLevel.value = 1; // 失败时默认VIP1
  }
};

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

  if (!task.value) {
    uni.showToast({ title: '任务不存在', icon: 'error' });
    setTimeout(() => uni.navigateBack(), 2000);
    return;
  }

  taskName.value = task.value.name;
  console.log('[loadTaskData] 任务数据:', task.value);

  // 根据任务状态决定显示什么
  checkTaskStatus();
};

// 检查任务状态
const checkTaskStatus = () => {
  const now = Date.now();

  // 检查阶段CD
  if (task.value.stageCdUnlockAt && now < task.value.stageCdUnlockAt) {
    currentView.value = 'stage_cd';
    stageCdEndTime.value = new Date(task.value.stageCdUnlockAt).toISOString();
    return;
  }

  // 检查回合CD
  if (task.value.roundCdUnlockAt && now < task.value.roundCdUnlockAt) {
    currentView.value = 'big_cd';
    cdEndTime.value = new Date(task.value.roundCdUnlockAt).toISOString();
    cdTitle.value = '下次聊天开启倒计时';
    checkOpponentFindStatus();
    return;
  }

  // 检查Z倒计时
  if (task.value.zUnlockAt && now < task.value.zUnlockAt) {
    currentView.value = 'z';
    zEndTime.value = new Date(task.value.zUnlockAt).toISOString();
    checkOpponentFindStatus();
    return;
  }

  // 检查D模式
  if (task.value.dMode) {
    currentView.value = 'd';
    return;
  }

  // 正常内容显示
  currentView.value = 'content';
  loadCurrentContent();
};

// 加载当前内容
const loadCurrentContent = async () => {
  const isUm = moduleTitle.value.includes('不熟');
  const res = isUm ? await um.getCurrentChainContent(taskId.value) : await sm.getCurrentChainContent(taskId.value);
  const sign = res.statusVo?.sign || '';

  // 注意：不要在这里立即处理 Z/D，而是先处理内容，然后再根据 sign 决定是否切换视图
  if (sign === 'D') {
    isUm ? um.onDEnter(taskId.value) : sm.onDEnter(taskId.value);
    loadTaskData();
    return;
  }

  // 处理内容（getCurrentChainContent 已经清理了 Z/AZ/D/AD 符号）
  contentList.value = res.contentList || [];
  selectedContentIndex.value = null;
  console.log('[loadCurrentContent] 内容:', contentList.value);

  // 处理完内容后，检查是否需要切换到 Z 视图
  // 注意：只有当所有分段都复制完后，才切换到 Z 视图
  if (sign === 'Z') {
    const t = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
    const currentChain = t?.currentLibChain || null;
    const segmentsCopied = Number(currentChain?.segmentsCopied || 0);

    // 检查是否还有未复制的分段
    const rawContentList = res.contentList || [];
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

  // 2. 复制到剪贴板
  uni.setClipboardData({
    data: item?.text || item?.content || '',
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
        uni.showToast({ title: '复制成功', icon: 'success' });
      }
    }
  });

  // 3. 记录复制操作（推进段落索引）
  const res = isUm ? um.copySegment(taskId.value) : sm.copySegment(taskId.value);
  console.log('[handleCopy] copySegment 结果:', res);
  if (!res.ok) {
    uni.showToast({ title: res.reason || '无可复制内容', icon: 'none' });
    return;
  }

  // 4. 获取复制后的任务状态
  const taskAfter = isUm ? um.getTask(taskId.value) : sm.getTask(taskId.value);
  console.log('[handleCopy] 复制后任务状态:', {
    segmentsCopied: taskAfter?.currentLibChain?.segmentsCopied,
    nodeIndex: taskAfter?.currentLibChain?.nodeIndex,
  });

  // 5. 检查当前节点的所有段落是否都复制完了
  if (!taskAfter || !taskAfter.currentLibChain) {
    console.log('[handleCopy] 任务或链不存在，直接刷新');
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

  // 6. 如果所有段落都复制完了，推进到下一个节点
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

// 供 bc-copy-list 使用的复制回调（包装原 handleCopy）
const handleCopyFromBc = (payload: any) => {
  const idx = typeof payload?.originIndex === 'number' ? payload.originIndex : 0;
  handleCopy({ type: 'content', text: payload?.content || '' }, idx);
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
  loadTaskData();
};

const onZTimeup = () => {
  console.log('[onZTimeup] Z倒计时结束');
  loadTaskData();
};

const onStageCdTimeup = () => {
  console.log('[onStageCdTimeup] 阶段CD结束');
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
  opponentDialog.value?.close();
};

const handleCloseSearchDialog = () => {
  searchDialog.value?.close();
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

// 供 bc-copy-list 使用的复制回调（对方找弹窗）
const handleCopyOpponentFromBc = (payload: any) => {
  if (opponentCopyCountdown.value > 0) return;
  handleCopyOpponent({ type: 'content', text: payload?.content || '' }, typeof payload?.originIndex === 'number' ? payload.originIndex : 0);
};


// 复制搜索结果
const handleCopySearch = (item: any, index: number) => {
  if (searchCopyDisabled.value) return;
  console.log('[handleCopySearch] 复制搜索结果:', item);
  // TODO: 实现复制逻辑
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

