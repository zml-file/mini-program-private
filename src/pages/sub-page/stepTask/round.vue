<template>
  <md-page :title="data.taskName || '您咨询'">
    <view class="container">
      <view v-if="data.stepSign" class="search-wrap m-bottom-30">
        <md-icon class="wenhao" name="wenhao" width="48" height="48" @click="handleWenhao"></md-icon>
        <view class="search flex-c m-right-12">
          <input placeholder="请输入对方的问题" class="m-left-20 input" placeholder-style="color: #7A59ED;" />
        </view>
        <md-icon name="search_btn" width="76" height="76"></md-icon>
      </view>
      <!-- 状态条：模块/阶段/回合/步骤/积分 -->
      <view class="m-bottom-20" style="font-size: 24rpx; color: #666; line-height: 1.6;">
        <text>模块：{{ data.moduleCodeName || data.moduleCode || '熟悉模块' }}</text>
        <text class="m-left-12">｜</text>
        <text>阶段：{{ data.detail?.stageNum || (data.stage1 ? '1' : '-') }}</text>
        <text class="m-left-12">｜</text>
        <text>回合：{{ data.currentRound || '-' }}</text>
        <text class="m-left-12">｜</text>
        <text>步骤：{{ stepLabel }}</text>
        <text class="m-left-12">｜</text>
        <text style="color: #ff6b6b; font-weight: bold;">积分：{{ data.score }}</text>
      </view>



      <!-- 大CD倒计时（下方） -->
      <!-- 特殊回合a/b的大CD使用大倒计时，其他使用小倒计时 -->
      <view class="m-bottom-30" v-if="data.currentStep === 'stage_cd'">
        <bc-countdown
          :size="isSpecialRoundBigCd ? 'default' : 'small'"
          :time="data.detail?.endTime"
          :desc="data.cdMsg"
          @timeup="cdTimeup"
          alignStyle="center" />
      </view>
      
      <!-- 回合允许时间倒计时 -->
      <view class="m-bottom-30" v-if="data.roundAllowedTime > 0">
        <view class="countdown-info">
          <text class="countdown-text">回合允许时间：{{ Math.floor(data.roundAllowedTime / 1000) }}秒</text>
        </view>
      </view>

      <!-- Z倒计时（只在有倒计时结束时间时显示） -->
      <view class="m-bottom-30" v-if="data.currentStep === 'z' && data.zEndTimeStr">
        <bc-countdown
          :key="data.zEndTimeStr"
          size="small"
          :time="data.zEndTimeStr"
          desc="倒计时结束后，将回复新内容"
          @timeup="zTimeup" />
      </view>
      
      <!-- 问题列表 -->
      <block v-if="data.currentStep === 'normal'">
        <bc-copy-list :info="data.pageInfo || {}" @copy="handleCopy" />
      </block>
      <!-- 三个状态圆圈 -->
      <view class="status flex-c m-bottom-30">
        <view class="circle_status status_z flex-c" v-if="data.currentStep === 'z'" @click="handleZClick">Z</view>
        <view class="circle_status status_d flex-c" v-if="data.currentStep === 'd'" @click="handleDClick">D</view>
        <view :class="[
          'circle_status',
          'status_lookfor',
          'flex-c',
          { disabeld: !data.canLookfor },
        ]" v-if="data.currentStep === 'lookfor' || data.currentStep === 'stage_cd'" @click="handleLookforClick">
          对方找
        </view>
      </view>

      <!-- Z出现时的细长条"对方找"按钮 -->
      <view
        class="lookfor-bar flex-c m-bottom-30"
        v-if="data.currentStep === 'z' || data.stepSign === 'z'"
        :class="{ disabeld: !data.canLookfor }"
        @click="handleLookforClick"
      >
        对方找
      </view>
      <!-- 第二个Z倒计时组件（只在有倒计时结束时间时显示） -->
      <bc-countdown
          :key="data.zEndTimeStr"
          :time="''"
          :day="zInit.days"
          :hour="zInit.hours"
          :minute="zInit.minutes"
          :second="zInit.seconds"
          desc="倒计时结束后，将回复新内容"
          @timeup="zTimeup"
          v-if="data.currentStep === 'z' && data.zEndTimeStr"
          :size="small"
          />
      <!-- D出现 -->
      <!-- 空状态/错误提示 -->
      <view v-if="!data.detail" class="m-bottom-20" style="font-size: 26rpx; color: #999;">
        当前任务没有有效步骤，请稍后重试或联系管理员。
      </view>
      <bc-tip-row v-if="['d', 'z'].includes(data.stepSign)">
        这里是关于{{ data.stepSign?.toLocaleUpperCase() }}这个操作的提示，只有前三次显示。
      </bc-tip-row>
      <!-- 大CD倒计时 -->
      <bc-countdown v-if="['z'].includes(data.stepSign)" size="small" :time="data.detail?.endTime" :desc="zCountdownMsg"
        @timeup="zTimeup" />
      <!-- 对方找倒计时 -->
      <bc-countdown v-if="data.stepSign === 'lookfor'" size="small" :time="data.detail?.otherFindEndTime"
        desc="倒计时结束后，对方找按钮将变为可点击" @timeup="lookforTimeup" />
    </view>
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @cancel="handleClose" title="请选择对方找的回复内容" :width="730" hideOk cancelText="关闭">
      <!--  倒计时提示 -->
      <view v-if="data.lookforCountdown > 0" class="countdown-tip">
        <view class="countdown-text">倒计时结束后，复制按钮将变为可点击</view>
        <view class="countdown-number">{{ data.lookforCountdown }}秒</view>
      </view>

      <!--  内容列表，根据倒计时状态禁用复制按钮 -->
      <bc-copy-list :info="data.pageInfo || {}" :disabled="!data.canCopyLookfor" @copy="handleCopyInPopup" />
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted, computed, watch, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 工具
import { hasItTimeOut } from '@/utils/util';
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import {
  initFamiliarLocal,
  getTask,
  addPoint,
  copySegment,
  finishCurrentLibNode,
  onZEnter,
  onDEnter,
  onOpponentFindSchedule,
  onOpponentFindClick,
  enterRoundBigCd,
  enterStageCd,
  startRound,
  markChainUsed,
  // 第1阶段函数
  enterStage1,
  startStage1Round,
  checkStage1RoundTransition,
  setRoundCdUnlock,
  startStage,
  getCurrentChainContent,
  getNextChainContent,
  getMockContentByLibrary,
  // 第2阶段函数
  enterStage2,
  startStage2Round,
  checkStage2RoundTransition,
  // 第3阶段函数
  enterStage3,
  startStage3Round,
  checkStage3RoundTransition,
  halfPriceRestart,
  // 第4阶段函数
  enterStage4,
  handleInvitation,
  handleMultiChat,
  finishMultiChat,
  finishTask
} from '@/utils/familiar-local';
import { getCountdownTimeMs, TEST_CONFIG } from '@/config';
import { getCountdown } from '@/utils/util';


const data = reactive<any>({
  taskId: null,
  taskName: '',  // 任务名称
  moduleCodeName: '',
  moduleCode: '',
  detail: {},
  // Z倒计时展示字符串（YYYY-MM-DD HH:mm:ss）
  zEndTimeStr: '',
  score: 0,  //  新增：当前回合积分
  cdMsg: '倒计时结束后，将根据您的会员等级显示下一回合内容',
  list: [
    {
      id: 1,
      content: '好！你放心大胆地去 我会在你身后支持你的@别的不说 我一定会在精神和眼神上支持你的哈！',
    },
    {
      id: 1,
      content: '吃不了有什么关系？你喜欢吃什么？你告诉我 @下次我开个直播吃给你看！',
    },
    { id: 1, content: '嗯...好吧 你的对话框你做主@你说没有就没有 我支持你！' },
    {
      id: 1,
      content: '没有就没有吧 这不重要@ 重要的是 不论有没有都不会影响咱俩的友谊对不对？',
    },
  ],
  pageInfo: {},
  status: 0,
  // 对方找按钮是否可点击（小倒计时结束置为 true）
  canLookfor: false,
  // 防止重复点击
  loading: false,
  // 防止重复添加阶段
  // 第一阶段新增字段
  stage1: null,  // 第一阶段数据
  currentRound: 0,  // 当前回合
  currentContent: '',  // 当前内容
  currentStep: 'normal',  // 当前步骤：normal, z, d, lookfor, stage_cd
  roundAllowedTime: 0,  // 回合允许时间（毫秒）
  zTimer: 0,  // Z倒计时（毫秒）
  zEndTime: 0,  // Z倒计时结束时间
  currentChain: null,  // 当前内容链
  currentChainIndex: 0,  // 当前内容链索引
  currentSegmentIndex: 0,  // 当前分段索引
  currentSegments: [],  // 当前分段数组
  isAddingStage: false,

  //  对方找弹窗倒计时相关
  lookforCountdown: 0,        // 倒计时秒数
  lookforCountdownTimer: null as any,  // 倒计时定时器
  canCopyLookfor: false,      // 是否可以复制（倒计时结束后为true）
  opponentFindUnlockAt: null as any,  // 对方找可用倒计时结束时间

  //  计分控制（前端主导）
  lookforScored: false,                   // 当前"对方找"弹窗是否已计分
  _leaveScoredForStep: null as null|number, // 离库计分已发生的 stepId

  // 离库并行映射（并行@：选择前半段后，进入后半段的并行展示）
  leavingAtNextById: {},

  // 弹窗关闭防抖（防止cancel事件导致重复进入）
  isClosingPopup: false,
  
});
const popup = ref<any>(null);

// 问号说明
const handleWenhao = () => {
  uni.navigateTo({ url: '/pages/sub-page/describe/wenhao' });
};

// 页面加载
onLoad((options: any) => {
  console.log('[round] onLoad:', options);
  data.taskId = options.taskId;
  data.taskName = options.taskName || '您咨询';
  
  if (data.taskId) {
    loadTaskData();
  } else {
    uni.showToast({
      title: '任务ID缺失',
      icon: 'error'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
  }
});

// 加载任务数据
const loadTaskData = () => {
  initFamiliarLocal();
  const task = getTask(data.taskId);
  
  if (!task) {
    uni.showToast({
      title: '任务不存在',
      icon: 'error'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
    return;
  }
  
  // 更新页面数据
  data.taskName = task.name;
  data.score = task.stageScore;
  data.stage1 = task.stage1;
  data.currentRound = task.roundIndex || 0;
  
  console.log('[loadTaskData] 任务数据:', task);
  console.log('[loadTaskData] 当前阶段:', task.stageIndex, '当前回合:', task.roundIndex);
  
  // 检查任务状态
  if (task.stageIndex === 1) {
    // 第一阶段
    console.log('[loadTaskData] 第一阶段');

    // 【修复】检查stage1数据是否初始化，如果没有则自动初始化
    if (!task.stage1) {
      console.log('[loadTaskData] stage1数据未初始化，自动调用enterStage1');
      const result = enterStage1(data.taskId);
      if (result.ok) {
        // 重新读取任务数据
        const updatedTask = getTask(data.taskId);
        if (updatedTask) {
          task = updatedTask;
          data.stage1 = task.stage1;
          console.log('[loadTaskData] stage1初始化成功');
        }
      } else {
        uni.showToast({
          title: result.reason || '初始化失败',
          icon: 'error'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
        return;
      }
    }

    // 检查是否在回合CD中，如果是则清除离库恢复数据并显示CD倒计时
    const now = Date.now();
    if (task.roundCdUnlockAt && now < (task.roundCdUnlockAt as number)) {
      console.log('[loadTaskData] 正在回合CD中，清除离库恢复数据');
      try {
        uni.removeStorageSync(`fm:leaving:${data.taskId}`);
      } catch (e) {}

      // 设置倒计时显示
      data.currentStep = 'stage_cd';
      data.cdMsg = '下次聊天开启倒计时';

      // 【修复】设置endTime用于倒计时组件显示
      const roundCdTime = task.roundCdUnlockAt as number;
      const d = new Date(roundCdTime);
      const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
      const y = d.getFullYear();
      const m = pad(d.getMonth()+1);
      const dd = pad(d.getDate());
      const h = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      data.detail = {
        endTime: `${y}-${m}-${dd} ${h}:${mi}:${s}`,
        stageNum: task.stageIndex,
        roundNum: task.roundIndex || 0
      };

      return;
    }
    
    // 离库恢复：若存在离库UI恢复数据，则优先还原离库并行展示
    try {
      const restore = uni.getStorageSync(`fm:leaving:${data.taskId}`);
      if (restore && restore.raw && restore.roundIndex) {
        console.log('[loadTaskData] 恢复离库数据，回合:', restore.roundIndex);
        buildLeavingUIFromRaw(String(restore.raw), Number(restore.roundIndex));
        return;
      }
    } catch (e) {}

    if (task.roundIndex === 0) {
      // 还没开始回合，自动开始第一回合
      startFirstRound();
    } else {
      // 已有回合，加载当前回合内容
      loadCurrentRoundContent();
    }
  } else if (task.stageIndex === 2 || task.stageIndex === 3 || task.stageIndex === 4) {
    // 第二、三、四阶段：调用_round加载内容
    console.log('[loadTaskData] 第', task.stageIndex, '阶段，调用_round加载内容');

    // 【修复】检查阶段数据是否初始化，如果没有则自动初始化
    if (task.stageIndex === 2 && !task.stage2) {
      console.log('[loadTaskData] stage2数据未初始化，自动调用enterStage2');
      // 【修复】保存原来的回合数和得分，避免被重置
      const savedRoundIndex = task.roundIndex; // 保存当前回合数
      const savedStageScore = task.stageScore; // 保存当前得分
      const result = enterStage2(data.taskId);
      if (result.ok) {
        // 重新获取任务并恢复回合数和得分
        const updatedTask = getTask(data.taskId);
        if (updatedTask) {
          updatedTask.roundIndex = savedRoundIndex;
          updatedTask.stageScore = savedStageScore;
          uni.setStorageSync(`fm:task:${data.taskId}`, updatedTask);
          task = updatedTask;
          console.log('[loadTaskData] stage2初始化成功，已恢复回合数:', savedRoundIndex, '和得分:', savedStageScore);
        }
      } else {
        uni.showToast({
          title: result.reason || '初始化失败',
          icon: 'error'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
        return;
      }
    } else if (task.stageIndex === 3 && !task.stage3) {
      console.log('[loadTaskData] stage3数据未初始化，自动调用enterStage3');
      // 【修复】保存原来的回合数和得分，避免被重置
      const savedRoundIndex = task.roundIndex; // 保存当前回合数
      const savedStageScore = task.stageScore; // 保存当前得分
      const result = enterStage3(data.taskId);
      if (result.ok) {
        // 重新获取任务并恢复回合数和得分
        const updatedTask = getTask(data.taskId);
        if (updatedTask) {
          updatedTask.roundIndex = savedRoundIndex;
          updatedTask.stageScore = savedStageScore;
          uni.setStorageSync(`fm:task:${data.taskId}`, updatedTask);
          task = updatedTask;
          console.log('[loadTaskData] stage3初始化成功，已恢复回合数:', savedRoundIndex, '和得分:', savedStageScore);
        }
      } else {
        uni.showToast({
          title: result.reason || '初始化失败',
          icon: 'error'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
        return;
      }
    } else if (task.stageIndex === 4 && !task.stage4) {
      console.log('[loadTaskData] stage4数据未初始化，自动调用enterStage4');
      // 【修复】保存原来的回合数和得分，避免被重置
      const savedRoundIndex = task.roundIndex; // 保存当前回合数
      const savedStageScore = task.stageScore; // 保存当前得分
      const result = enterStage4(data.taskId);
      if (result.ok) {
        // 重新获取任务并恢复回合数和得分
        const updatedTask = getTask(data.taskId);
        if (updatedTask) {
          updatedTask.roundIndex = savedRoundIndex;
          updatedTask.stageScore = savedStageScore;
          uni.setStorageSync(`fm:task:${data.taskId}`, updatedTask);
          task = updatedTask;
          console.log('[loadTaskData] stage4初始化成功，已恢复回合数:', savedRoundIndex, '和得分:', savedStageScore);
        }
      } else {
        uni.showToast({
          title: result.reason || '初始化失败',
          icon: 'error'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
        return;
      }
    }

    data.detail = {
      stageNum: task.stageIndex,
      roundNum: task.roundIndex || 0,
      stepType: 'stage_round_content',
      taskName: task.name
    };

    // 检查是否有currentLibChain，如果没有则说明刚进入该阶段，需要初始化
    if (!task.currentLibChain && task.roundIndex && task.roundIndex > 0) {
      console.log('[loadTaskData] 没有currentLibChain，调用对应阶段的startRound初始化');

      if (task.stageIndex === 2) {
        const result = startStage2Round(data.taskId, task.roundIndex);
        console.log('[loadTaskData] startStage2Round结果:', result);
      } else if (task.stageIndex === 3) {
        const result = startStage3Round(data.taskId, task.roundIndex);
        console.log('[loadTaskData] startStage3Round结果:', result);
      } else {
        // 第4阶段使用通用的startRound
        startRound(data.taskId, task.roundIndex);
      }

      // 重新读取任务数据，获取初始化后的currentLibChain
      const taskAfterInit = getTask(data.taskId);
      console.log('[loadTaskData] startRound后重新读取任务，currentLibChain:', taskAfterInit?.currentLibChain);
    }

    _round();
  } else {
    console.log('[loadTaskData] 未知阶段:', task.stageIndex);
    uni.showToast({
      title: `当前阶段(${task.stageIndex})暂不支持`,
      icon: 'error'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
  }
};

// 从存储还原离库UI（首层并行）
const buildLeavingUIFromRaw = (raw: string, roundIndex: number) => {
  const segments = [raw];
  const parallel1 = raw.split('///').map((s: string) => s.trim()).filter(Boolean);
  const list = parallel1.map((p: string, idx: number) => {
    const hasAt = p.includes('@');
    const [beforeAt] = hasAt ? p.split('@') : [p];
    const stepId = `leaving_${roundIndex}_0_${idx}`;
    return {
      stepDetailId: stepId,
      content: beforeAt.trim(),
      segmentIndex: 0,
      type: 'text',
      totalSegments: parallel1.length,
      currentSegment: idx,
      isLeaving: true,
      hasAtSplit: hasAt,
      originalContent: p,
    };
  });

  data.pageInfo = { contentList: list };
  data.currentStep = 'normal';
  data.currentChain = null;
  data.currentChainIndex = 0;
  data.currentSegmentIndex = 0;
  data.currentSegments = segments;
  data.isInLeaving = true;
  console.log(`[round] 离库恢复(首层):`, list);
};

// 开始第一回合
const startFirstRound = () => {
  const result = startStage1Round(data.taskId, 1);
  
  if (result.ok) {
    data.currentRound = 1;
    loadCurrentRoundContent();
    uni.showToast({
      title: '开始第一回合',
      icon: 'success'
    });
  } else {
    uni.showToast({
      title: result.reason || '开始回合失败',
      icon: 'error'
    });
  }
};

// 加载当前回合内容
const loadCurrentRoundContent = () => {
  const task = getTask(data.taskId);
  if (!task || !task.stage1) return;
  
  // 优先：若本地记录了当前内容链进度（段落复制进度），按进度恢复
  const t = getTask(data.taskId) as any;
  const clc = t?.currentLibChain;
  if (clc && clc.type === 'content' && clc.libId) {
    const libs = uni.getStorageSync('fm:libs');
    const chainGroup = libs?.content || {};
    const chain = chainGroup?.[clc.libId]?.[0] || [];
    const node = chain?.[clc.nodeIndex] || null;
    if (node) {
      const segments = node.text ? node.text.split('@') : [''];
      const segIdx = Math.min(Math.max(Number(clc.segmentsCopied || 0), 0), Math.max(segments.length - 1, 0));
      data.pageInfo = {
        contentList: [{
          stepDetailId: `${task.roundIndex}_${clc.nodeIndex}_${segIdx}`,
          content: segments[segIdx] || '',
          segmentIndex: segIdx,
          type: node.type || 'text',
          totalSegments: segments.length,
          currentSegment: segIdx
        }]
      };
      data.currentStep = 'normal';
      data.currentChain = chain;
      data.currentChainIndex = clc.nodeIndex;
      data.currentSegmentIndex = segIdx;
      data.currentSegments = segments;
      console.log('[round] 恢复当前内容链进度:', { libId: clc.libId, nodeIndex: clc.nodeIndex, segIdx });
      return;
    }
  }
  
  // 根据回合数确定内容库
  let contentLibId = '';
  switch (task.roundIndex) {
    case 1: contentLibId = 'S1'; break;
    case 2: contentLibId = 'S2'; break;
    case 3: contentLibId = 'S3'; break;
    case 4: contentLibId = 'S4'; break;
  }
  
  // 获取内容库内容
  const libs = uni.getStorageSync('fm:libs');
  const contentChains = libs?.content?.[contentLibId] || [];
  
  if (contentChains.length > 0) {
    // 随机选择一个内容链
    const randomChain = contentChains[Math.floor(Math.random() * contentChains.length)];
    
    // 检查第一个节点是否是Z或D
    const firstNode = randomChain[0];
    if (firstNode.type === 'Z' || firstNode.type === 'AZ') {
      // 第一个节点是Z，显示Z按钮
      data.currentStep = 'z';
      data.zEndTime = Date.now() + task.stage1.zTimerMs;
      data.currentChain = randomChain;
      data.currentChainIndex = 0;
    } else if (firstNode.type === 'D' || firstNode.type === 'AD') {
      // 第一个节点是D，显示D按钮
      data.currentStep = 'd';
      data.currentChain = randomChain;
      data.currentChainIndex = 0;
    } else {
      // 第一个节点是普通内容，显示内容列表
      data.currentStep = 'normal';
      
      // 处理第一个节点的分段内容
      const firstNode = randomChain[0];
      const segments = firstNode.text ? firstNode.text.split('@') : [''];
      
      data.pageInfo = {
        contentList: [{
          stepDetailId: `${task.roundIndex}_0`,
          content: segments[0] || '',
          segmentIndex: 0,
          type: firstNode.type || 'text',
          totalSegments: segments.length,
          currentSegment: 0
        }]
      };
      data.currentChain = randomChain;
      data.currentChainIndex = 0;
      data.currentSegmentIndex = 0;
      data.currentSegments = segments;
    }
    
    // 检查是否有Z节点，决定是否启动回合允许时间倒计时
    const hasZ = randomChain.some((node: any) => node.type === 'Z' || node.type === 'AZ');
    if (hasZ && TEST_CONFIG.ENABLE_ROUND_TIME_LIMIT) {
      data.roundAllowedTime = task.stage1.roundAllowedTimeMs;
      startRoundAllowedTimer();
    }
    
    console.log(`[round] 第${task.roundIndex}回合内容:`, randomChain);
  } else {
    data.currentStep = 'normal';
    data.pageInfo = {
      contentList: [{
        stepDetailId: `${task.roundIndex}_0`,
        content: `第${task.roundIndex}回合内容加载中...`,
        segmentIndex: 0,
        type: 'text'
      }]
    };
  }
};

// 启动回合允许时间倒计时
const startRoundAllowedTimer = () => {
  const timer = setInterval(() => {
    data.roundAllowedTime -= 1000;
    
    if (data.roundAllowedTime <= 0) {
      clearInterval(timer);
      // 回合允许时间结束，给完当前库内容
      finishCurrentContent();
    }
  }, 1000);
};


// 进入回合CD
const enterRoundCd = () => {
  data.currentStep = 'stage_cd';
  data.cdMsg = '回合CD中，请等待...';
  
  // 模拟回合CD时间（实际应该是根据配置）
  const cdTime = 5 * 1000; // 5秒测试用
  
  setTimeout(() => {
    // CD结束，检查转换条件
    checkRoundTransition();
  }, cdTime);
};

// 检查回合转换
const checkRoundTransition = () => {
  const result = checkStage1RoundTransition(data.taskId);
  
  if (result.ok) {
    console.log('[round] 转换检查结果:', result);
    handleTransitionResult(result);
  }
};

// 统一处理第一阶段回合转换结果
const handleTransitionResult = (result: ReturnType<typeof checkStage1RoundTransition>) => {
  switch (result.action) {
    case 'enterRound4':
      data.currentRound = 4;
      startStage1Round(data.taskId, 4);
      loadCurrentRoundContent();
      break;
    case 'enterRound5':
      data.currentRound = 5;
      startStage1Round(data.taskId, 5);
      loadCurrentRoundContent();
      break;
    case 'enterRound6':
      data.currentRound = 6;
      startStage1Round(data.taskId, 6);
      loadCurrentRoundContent();
      break;
    case 'enterStageCd': {
      const range = result.stageCdRange || { minDays: 3, maxDays: 5 };
      console.log('[round] 判定进入阶段CD，开始阶段间倒计时', range);
      enterStageCd(data.taskId, range);
      data.currentStep = 'stage_cd';
      data.cdMsg = '阶段间倒计时，结束后进入下一阶段';
      break;
    }
    case 'showPromptS7':
      uni.showModal({
        title: '提示',
        content: '得分相等，是否坚持？',
        confirmText: '坚持',
        cancelText: '放弃',
        success: (res) => {
          if (res.confirm) {
            data.currentStep = 'stage_cd';
            data.cdMsg = '坚持选择，进入阶段CD...';
          } else {
            uni.showModal({
              title: '确认',
              content: '确定要结束任务吗？',
              success: (res2) => {
                if (res2.confirm) {
                  uni.navigateBack();
                }
              }
            });
          }
        }
      });
      break;
    case 'continue':
      loadCurrentRoundContent();
      break;
  }
};



// 处理对方找按钮点击
const handleLookforClick = async () => {
  console.log('[round] 对方找按钮点击，当前步骤:', data.currentStep);

  if (!data.canLookfor) {
    uni.showToast({
      title: '对方找按钮暂不可用',
      icon: 'none'
    });
    return;
  }

  // 获取对方找内容库
  const libs = uni.getStorageSync('fm:libs');
  const task = getTask(data.taskId);

  // 根据不同阶段/回合获取对应的对方找库
  // 优先使用 nextOpponentFindLibId（在大CD中设置），否则根据阶段判断
  let opponentLibId = task?.nextOpponentFindLibId || 'S2'; // 默认为S2
  if (!task?.nextOpponentFindLibId) {
    if (task?.stageIndex === 2) {
      opponentLibId = 'S3';
    } else if (task?.stageIndex === 3) {
      opponentLibId = 'S4';
    }
  }

  const opponentChains = libs?.opponent?.[opponentLibId] || [];
  console.log('[round] 获取对方找库:', { stageIndex: task?.stageIndex, opponentLibId, chainsCount: opponentChains.length });

  if (opponentChains.length === 0) {
    uni.showToast({
      title: '对方找内容不可用',
      icon: 'none'
    });
    return;
  }

  // 随机选择一条对方找内容
  const randomChain = opponentChains[Math.floor(Math.random() * opponentChains.length)];
  console.log('[round] 选中的对方找链:', randomChain);

  // 将对方找内容转换为 pageInfo 格式
  data.pageInfo = {
    contentList: randomChain.map((node: any, index: number) => ({
      stepDetailId: `lookfor_${index}`,
      content: node.text || '',
      segmentIndex: index,
      type: 'text',
      totalSegments: randomChain.length,
      currentSegment: index
    })),
    statusVo: {},
    closeContent: false
  };

  // 重置对方找弹窗状态
  data.lookforScored = false;
  data.canCopyLookfor = false;
  data.lookforCountdown = 0;

  // 打开对话框
  popup.value?.open();

  // 启动对方找复制按钮倒计时（管理后台配置，这里暂时用3秒）
  startLookforCountdown();
};

// 处理Z按钮点击
const handleZClick = () => {
  console.log('[round] Z按钮点击');
  const task = getTask(data.taskId);
  const ms = task?.stage1?.zTimerMs || 2 * 60 * 1000;
  setZByDuration(ms);
};

// 处理D按钮点击
const handleDClick = () => {
  console.log('[round] D按钮点击');
  
  // 确保后续@分段与AZ映射容器存在
  // 使用对象映射 stepDetailId -> nextContent / azFlag
  // 注意：这些字段为运行期状态，不做持久化
  // @ts-ignore
  if (!data.atNextById) data.atNextById = {};
  // @ts-ignore
  if (!data.azAfterById) data.azAfterById = {};
  
  // D按钮点击后，显示当前段中D符号后面的内容
  if (data.currentSegments && data.currentSegmentIndex < data.currentSegments.length) {
    // 将当前段与其后的所有段拼接为完整段，防止@已被前置拆分导致丢失D后链
    const fullSegment = [
      ...data.currentSegments.slice(data.currentSegmentIndex)
    ].join('@');
    console.log('[round] D解析用fullSegment:', fullSegment);
    
    // 找到D符号的位置
    const dIndex = fullSegment.indexOf('D');
    if (dIndex !== -1) {
      // 获取D符号后面的内容
      const afterDContent = fullSegment.substring(dIndex + 1);
      console.log('[round] D后内容 afterDContent:', afterDContent);
      
      // 检查是否包含并行拆分符号 ///
      if (afterDContent.includes('///')) {
        console.log('[round] D按钮点击后，检测到///并行拆分');
        // 处理并行拆分
        const parallelSegments = afterDContent.split('///');
        console.log('[round] 并行分段结果:', parallelSegments);
        
        data.pageInfo = {
          contentList: parallelSegments.map((segment: string, index: number) => {
            const raw = segment.trim();
            const atPos = raw.indexOf('@');
            const beforeAt = atPos >= 0 ? raw.slice(0, atPos).trim() : raw;
            const afterAtRaw = atPos >= 0 ? raw.slice(atPos + 1).trim() : '';
            // 清理@后串尾部的）AZ 或 AZ
            const hasAZTail = /AZ\s*$/i.test(afterAtRaw) || /）AZ\s*$/i.test(afterAtRaw);
            const cleanedAfter = afterAtRaw.replace(/）?AZ\s*$/i, '').trim();
            const stepId = `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}_d_${index}`;

            // 记录@后续映射与AZ标记，用于复制后展示与进入Z
            // @ts-ignore
            data.atNextById[stepId] = cleanedAfter;
            // @ts-ignore
            data.azAfterById[`${stepId}__next`] = hasAZTail; // 标记到next条目上

            const hasAtSplit = atPos >= 0;
            console.log(`[round] 分段${index}:`, {
              content: raw,
              beforeAt,
              cleanedAfter,
              hasAtSplit,
              hasAZTail
            });
            
            return {
              stepDetailId: stepId,
              content: beforeAt, // 首先展示@前内容
              segmentIndex: data.currentSegmentIndex,
              type: 'text',
              totalSegments: parallelSegments.length,
              currentSegment: index,
              hasAtSplit: hasAtSplit,
              originalContent: raw // 保存原始内容（含@）
            };
          })
        };
      } else {
        // 普通内容，按@分段
        const segments = afterDContent.split('@');
        data.currentSegments = segments;
        data.currentSegmentIndex = 0;
        console.log('[round] D后@分段:', segments);
        
        data.pageInfo = {
          contentList: [{
            stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}_d_0`,
            content: segments[0] || '',
            segmentIndex: 0,
            type: 'text',
            totalSegments: segments.length,
            currentSegment: 0,
            hasAtSplit: segments.length > 1,
            originalContent: segments.join('@')
          }]
        };
      }
      data.currentStep = 'normal';
    } else {
      // 当前段没有D符号，移动到下一个节点
      moveToNextNode();
    }
  } else {
    // 没有分段内容，移动到下一个节点
    moveToNextNode();
  }
};

// Z倒计时结束处理
const zTimeup = () => {
  console.log('[round] Z倒计时结束');
  // Z倒计时结束，移动到下一个节点
  moveToNextNode();
};


// 完成当前内容，进入离库（停留至用户复制后再进入回合CD）
const finishCurrentContent = () => {
  console.log('[round] 完成当前内容，进入离库');
  const task = getTask(data.taskId);
  if (!task) return;
  
  // 第二、三阶段也需要支持离库
  if (!task.stage1 && task.stageIndex !== 2 && task.stageIndex !== 3) {
    console.log('[finishCurrentContent] 当前阶段不支持离库:', task.stageIndex);
    return;
  }

  let leavingLibId = '';
  
  // 根据阶段和回合确定离库
  if (task.stageIndex === 1) {
    // 第一阶段
    switch (task.roundIndex) {
      case 1: leavingLibId = 'S1'; break;
      case 2: leavingLibId = 'S2'; break;
      case 3: leavingLibId = 'S2'; break;
      case 4: leavingLibId = 'S3'; break;
      case 5: leavingLibId = 'S2'; break;
      case 6: leavingLibId = 'S3.5'; break;
    }
  } else if (task.stageIndex === 2) {
    // 第二阶段
    if (task.specialRound === 'a' || task.specialRound === 'b') {
      // 特殊回合a或b
      leavingLibId = 'S3';
    } else {
      // 第1、2回合
      leavingLibId = 'S4';
    }
  } else if (task.stageIndex === 3) {
    // 第三阶段
    leavingLibId = 'S5';
  }
  
  console.log('[finishCurrentContent] 阶段:', task.stageIndex, '回合:', task.roundIndex, 'specialRound:', task.specialRound, '离库:', leavingLibId);

  const libs = uni.getStorageSync('fm:libs');
  const leavingChains = libs?.leaving?.[leavingLibId] || [];

  if (leavingChains.length > 0) {
    const randomLeavingChain = leavingChains[Math.floor(Math.random() * leavingChains.length)];
    const firstNode = randomLeavingChain[0];
    const raw = firstNode.text || '';

    // 第一级：按 '///' 并行拆分
    const parallel1 = raw.split('///').map((s: string) => s.trim()).filter(Boolean);

    // 映射：为每个并行项计算其 @ 后半句（可能也是并行）
    const map: Record<string, string> = {};
    const list = parallel1.map((p: string, idx: number) => {
      const hasAt = p.includes('@');
      const [beforeAt, afterAtRaw] = hasAt ? p.split('@') : [p, ''];
      const stepId = task.specialRound
        ? `leaving_${task.specialRound}_${idx}`
        : `leaving_${task.roundIndex}_0_${idx}`;

      // 记录 @ 后半句并行项到映射（用于点击后展示第二级并行）
      map[stepId] = (afterAtRaw || '').trim();

      return {
        stepDetailId: stepId,
        content: beforeAt.trim(),
        segmentIndex: 0,
        type: firstNode.type || 'text',
        totalSegments: parallel1.length,
        currentSegment: idx,
        isLeaving: true,
        hasAtSplit: !!afterAtRaw,
        originalContent: p,
      };
    });

    // 保存映射到 data & 本地，用于刷新恢复
    // @ts-ignore
    data.leavingAtNextById = map;
    uni.setStorageSync(`fm:leaving:${data.taskId}`, {
      raw,
      roundIndex: task.roundIndex,
      specialRound: task.specialRound || null,
    });

    data.pageInfo = { contentList: list };
    data.currentStep = 'normal';
    data.currentChain = randomLeavingChain;
    data.currentChainIndex = 0;
    data.currentSegmentIndex = 0;
    data.currentSegments = [raw];

    // 标记进入离库，等待复制后进入回合CD
    data.isInLeaving = true;
    console.log(`[round] 第${task.roundIndex}回合离库内容(并行首层):`, list);
  }
};

// 处理复制按钮点击
const handleCopy = (item: any) => {
  console.log('[round] 复制内容:', item);
  
  if (!item || !item.content) {
    uni.showToast({
      title: '没有内容可复制',
      icon: 'none'
    });
    return;
  }
  
  // 优先处理：若为D后的并行分段，且我们在handleDClick中已记录@后半句映射，则直接展示@后半句
  // @ts-ignore
  const atMap = (data as any).atNextById || {};
  // @ts-ignore
  const azMap = (data as any).azAfterById || {};
  // 离库并行的 @ 后半句映射
  // @ts-ignore
  const leavingAtMap = (data as any).leavingAtNextById || {};
  const stepIdFromItem = item.stepDetailId;
  if (stepIdFromItem && atMap[stepIdFromItem]) {
    const nextText = atMap[stepIdFromItem] as string;
    const nextId = `${stepIdFromItem}__next`;
    const hasAZ = !!azMap[nextId];
    console.log('[round] 命中D并行@映射，展示@后半句:', { stepIdFromItem, nextText, hasAZ });

    data.pageInfo = {
      contentList: [{
        stepDetailId: nextId,
        content: nextText,
        segmentIndex: 1,
        type: 'text',
        totalSegments: 2,
        currentSegment: 1
      }]
    };
    data.currentStep = 'normal';

    // 注意：不在此处立即进入Z，等待用户复制@后半句后再进入
    return;
  }

  // 离库：如果点的是首层并行项，展示其 @ 后半句的并行
  if (stepIdFromItem && leavingAtMap[stepIdFromItem]) {
    const afterAtRaw = leavingAtMap[stepIdFromItem] as string;
    // 第二级并行：按 '///' 再并行展示
    const parallel2 = afterAtRaw.split('///').map(s => s.replace(/^\(|\)$/g, '').trim()).filter(Boolean);
    data.pageInfo = {
      contentList: parallel2.map((content, idx) => ({
        stepDetailId: `${stepIdFromItem}__next_${idx}`,
        content,
        segmentIndex: 1,
        type: 'text',
        totalSegments: parallel2.length,
        currentSegment: idx,
        isLeaving: true,
      }))
    };
    data.currentStep = 'normal';
    return;
  }

  // 检查是否包含加分符号 ++
  const hasScoreSymbol = item.content.includes('++');
  if (hasScoreSymbol) {
    console.log('[round] 检测到++加分符号，处理前 data.score:', data.score);
    const beforeTask = getTask(data.taskId);
    console.log('[round] 加分前任务积分 stageScore:', beforeTask?.stageScore, 'totalScore:', beforeTask?.totalScore);
    // 加分符号，积分+1
    addPoint(data.taskId, 1, 'other');
    const afterTask = getTask(data.taskId);
    console.log('[round] 加分后任务积分 stageScore:', afterTask?.stageScore, 'totalScore:', afterTask?.totalScore);
    console.log('[round] 加分后更新显示，旧 data.score:', data.score, '新 stageScore:', afterTask?.stageScore);
    if (afterTask) {
      data.score = afterTask.stageScore || 0;
    } else {
      data.score = (data.score || 0) + 1;
    }
    console.log('[round] 加分后 data.score:', data.score);
    // 同步 currentLibChain 段落进度（用于刷新恢复）
    try {
      const tSync1 = getTask(data.taskId) as any;
      if (tSync1 && tSync1.currentLibChain) {
        tSync1.currentLibChain.segmentsCopied = Number(tSync1.currentLibChain?.segmentsCopied || 0) + 1;
        uni.setStorageSync(`fm:task:${data.taskId}`, tSync1);
      }
    } catch (e) {}
    uni.showToast({
      title: '复制成功，积分+1',
      icon: 'success'
    });
  } else {
    uni.showToast({
      title: '复制成功',
      icon: 'success'
    });
  }
  console.log('[round] 复制操作结束，当前 data.score:', data.score);
  
  // 检查是否包含结束符号 &
  if (item.content.includes('&')) {
    // 包含结束符号，直接进入离库
    finishCurrentContent();
    return;
  }
  
  // 处理复制内容，如果当前分段包含D符号，只复制D前面的部分
  let copyContent = item.content;
  let hasDInCurrentSegment = false;
  
  // 检查当前分段是否包含D符号
  if (data.currentSegments && data.currentSegmentIndex < data.currentSegments.length) {
    const currentSegment = data.currentSegments[data.currentSegmentIndex];
    if (currentSegment.includes('D')) {
      const dIndex = currentSegment.indexOf('D');
      copyContent = currentSegment.substring(0, dIndex);
      hasDInCurrentSegment = true;
    }
  }
  
  uni.setClipboardData({
    data: copyContent,
    success: () => {
      // 非"++"路径也同步段落进度
      try {
        const tSync2 = getTask(data.taskId) as any;
        if (tSync2 && tSync2.currentLibChain) {
          tSync2.currentLibChain.segmentsCopied = Number(tSync2.currentLibChain?.segmentsCopied || 0) + 1;
          uni.setStorageSync(`fm:task:${data.taskId}`, tSync2);
        }
      } catch (e) {}

      // 【对方找复制后的处理】
      // 检查是否来自对方找弹窗（stepDetailId 以 'lookfor_' 开头）
      if (item.stepDetailId?.toString().startsWith('lookfor_')) {
        console.log('[round] 对方找内容复制完成，处理对方找CD逻辑');

        // 对方找积分+1（如果还没计分）
        if (!data.lookforScored) {
          addPoint(data.taskId, 1, 'opponentFind');
          data.lookforScored = true;
          data.score = (data.score || 0) + 1;
          uni.showToast({ title: '积分 +1', icon: 'success', duration: 1200 });
        }

        // 关闭对话框
        popup.value?.close();

        // 进入对方找CD时间
        const task = getTask(data.taskId);
        const opponentFindCdMs = 3000; // 暂时用3秒，后续可从后端配置
        const opponentFindCdUnlockAt = Date.now() + opponentFindCdMs;

        // 更新任务状态
        if (task) {
          task.opponentFindCdUnlockAt = opponentFindCdUnlockAt;
          uni.setStorageSync(`fm:task:${data.taskId}`, task);
        }

        // 显示对方找CD倒计时
        data.currentStep = 'stage_cd';
        data.cdMsg = '对方找CD中...';
        const d = new Date(opponentFindCdUnlockAt);
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        const endTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        data.detail = { ...(data.detail || {}), endTime: endTimeStr };

        // 对方找CD结束后，根据文档逻辑：
        // - 第1回合：进入下一回合
        // - 第2回合：进入下一回合
        // - 第3回合：进入下一回合
        // - 特殊回合a/b：跳过开库，进入内容库
        console.log('[round] 对方找CD已启动，倒计时结束后将进入下一步');
        return;
      }

      // 若当前处于离库阶段，复制后进入回合CD并开启下一回合
      if (data.isInLeaving) {
        data.isInLeaving = false;
        // 离库积分+1
        addPoint(data.taskId, 1, 'leaving');
        // 进入回合CD（第一回合后固定 *1），并展示倒计时
        // 启用对方找功能
        const task = getTask(data.taskId);
        const opponentLibId = task?.stageIndex === 2 ? 'S3' : (task?.stageIndex === 3 ? 'S4' : 'S2');
        enterRoundBigCd(data.taskId, 1, { startOpponentFind: true, opponentFindLibId: opponentLibId });
        const tAfter = getTask(data.taskId);
        const unlockAt = tAfter?.roundCdUnlockAt || null;
        const otherFindAt = tAfter?.opponentFindUnlockAt || null;
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        const toStr = (ts: number | null) => {
          if (!ts) return '';
          const d = new Date(ts as number);
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };
        const unlockAtStr = toStr(unlockAt as number | null);
        const otherFindAtStr = toStr(otherFindAt as number | null);
        console.log('[round] 回合CD设置:', { unlockAtMs: unlockAt, endTime: unlockAtStr, otherFindEndTime: otherFindAtStr });
        data.currentStep = 'stage_cd';
        data.cdMsg = '下次聊天开启倒计时';
        data.detail = { ...(data.detail || {}), endTime: unlockAtStr, otherFindEndTime: otherFindAtStr };
        // 同步按钮可用状态：在大CD期间对方找可立即点击（复制按钮另有倒计时）
        data.canLookfor = true;

        // 清除离库恢复数据，避免下次进入页面重复恢复
        try {
          uni.removeStorageSync(`fm:leaving:${data.taskId}`);
          console.log('[round] 已清除离库恢复数据');
        } catch (e) {
          console.log('[round] 清除离库恢复数据失败:', e);
        }
        
        return;
      }
      // 若当前复制的条目标记为复制后进入Z（来自并行@后半句），则在复制后立刻进入Z
      const currentId = item.stepDetailId;
      const shouldEnterZAfterCopy = !!azMap[currentId];
      if (shouldEnterZAfterCopy) {
        const task = getTask(data.taskId);
        const ms = task?.stage1?.zTimerMs || 2 * 60 * 1000;
        setZByDuration(ms);
        console.log('[round] 复制@后半句完成，进入Z倒计时，结束时间:', data.zEndTimeStr);
        return;
      }

      // 如果当前段包含D符号，复制后显示D按钮
      if (hasDInCurrentSegment) {
        data.currentStep = 'd';
        return;
      }
      
      // 复制成功后，处理分段内容
      console.log('[round] 复制成功后的处理逻辑:', {
        itemHasAtSplit: item.hasAtSplit,
        itemContent: item.content,
        itemOriginalContent: item.originalContent,
        itemKeys: Object.keys(item)
      });
      
      // 检查当前复制的内容是否来自包含@分段的并行内容
      if (item.hasAtSplit) {
        console.log('[round] 检测到hasAtSplit=true，开始处理@分段');
        // 当前内容来自包含@分段的并行内容，需要显示@后面的内容
        // 优先读取保存的originalContent（含@），若不存在则回退到item.content
        const originalContent = item.originalContent || item.content || '';
        console.log('[round] 原始内容(含@?):', originalContent);
        
        const atPos = originalContent.indexOf('@');
        if (atPos >= 0) {
          const afterAt = originalContent.slice(atPos + 1).trim();
          const hasAZTail = /AZ\s*$/i.test(afterAt) || /）AZ\s*$/i.test(afterAt);
          const cleaned = afterAt.replace(/）?AZ\s*$/i, '').trim();
          console.log('[round] @后半句:', cleaned, ' hasAZTail=', hasAZTail);

          // 展示@后半句（注意：不要在这里立即进入Z，应该等用户复制后再进入）
          const stepId = `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}_at_show`;
          data.pageInfo = {
            contentList: [{
              stepDetailId: stepId,
              content: cleaned,
              segmentIndex: 1,
              type: 'text',
              totalSegments: 2,
              currentSegment: 1
            }]
          };
          data.currentStep = 'normal';

          // 若尾部带AZ，标记该条目，在复制后进入Z倒计时（而不是现在立即进入）
          if (hasAZTail) {
            // @ts-ignore
            if (!data.azAfterById) data.azAfterById = {};
            // @ts-ignore
            data.azAfterById[stepId] = true;
            console.log('[round] 检测到AZ尾部，标记该条目，复制后将进入Z倒计时');
          }
          return;
        } else {
          console.log('[round] 原始内容不包含@，跳过@后展示');
        }
      }

      if (data.currentSegments && data.currentSegmentIndex < data.currentSegments.length - 1) {
        // 还有更多分段，显示下一个分段
        data.currentSegmentIndex++;
        const nextSegment = data.currentSegments[data.currentSegmentIndex];
        
        // 检查是否包含D符号
        if (nextSegment.includes('D')) {
          // 包含D符号，先显示D前面的内容
          const dIndex = nextSegment.indexOf('D');
          const beforeDContent = nextSegment.substring(0, dIndex);
          
          data.pageInfo = {
            contentList: [{
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}`,
              content: beforeDContent || '',
              segmentIndex: data.currentSegmentIndex,
              type: 'text',
              totalSegments: data.currentSegments.length,
              currentSegment: data.currentSegmentIndex
            }]
          };
          return;
        }
        
        // 检查是否以Z/AZ符号结尾（注意：不是包含，而是结尾）
        const trimmedSegment = nextSegment.trim();
        const hasZTail = /Z\s*$/i.test(trimmedSegment) || /）Z\s*$/i.test(trimmedSegment);
        const hasAZTail = /AZ\s*$/i.test(trimmedSegment) || /）AZ\s*$/i.test(trimmedSegment);

        if (hasZTail || hasAZTail) {
          // 以Z/AZ符号结尾，清理尾部符号后展示内容，并显示Z按钮
          const cleanedContent = trimmedSegment.replace(/）?(A)?Z\s*$/i, '').trim();

          data.pageInfo = {
            contentList: [{
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}`,
              content: cleanedContent,
              segmentIndex: data.currentSegmentIndex,
              type: 'text',
              totalSegments: data.currentSegments.length,
              currentSegment: data.currentSegmentIndex
            }]
          };

          // 显示Z按钮（用户点击后才进入倒计时）
          // 注意：这里只设置 currentStep = 'z'，清空 zEndTimeStr，所以不会显示倒计时
          data.currentStep = 'z';
          data.zEndTimeStr = ''; // 清空倒计时，只显示Z按钮
          console.log('[round] 检测到Z/AZ结尾，展示内容并显示Z按钮（等待用户点击）');
          return;
        }
        
        // 检查是否包含结束符号 &
        if (nextSegment.includes('&')) {
          // 包含结束符号，直接进入离库
          finishCurrentContent();
          return;
        }
        
        // 检查是否包含并行拆分符号 ///
        if (nextSegment.includes('///')) {
          // 处理并行拆分
          const parallelSegments = nextSegment.split('///');
          data.pageInfo = {
            contentList: parallelSegments.map((segment: string, index: number) => ({
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}_${index}`,
              content: segment.trim(),
              segmentIndex: data.currentSegmentIndex,
              type: 'text',
              totalSegments: parallelSegments.length,
              currentSegment: index
            }))
          };
        } else {
          // 普通分段
          data.pageInfo = {
            contentList: [{
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${data.currentSegmentIndex}`,
              content: nextSegment || '',
              segmentIndex: data.currentSegmentIndex,
              type: 'text',
              totalSegments: data.currentSegments.length,
              currentSegment: data.currentSegmentIndex
            }]
          };
        }
      } else {
        // 当前节点的所有分段都显示完了，进入下一个节点
        moveToNextNode();
      }
    }
  });
};

// 处理对方找弹窗中的复制（包装函数）
const handleCopyInPopup = (item: any) => {
  console.log('[round] 对方找弹窗中点击复制');

  // 调用原来的 handleCopy 函数
  handleCopy(item);

  // 无论复制后的逻辑如何，都关闭弹窗
  // 使用 setTimeout 确保复制逻辑执行完毕后再关闭
  setTimeout(() => {
    if (popup.value) {
      popup.value.close();
      console.log('[round] 对方找弹窗已关闭');
    }
  }, 100);
};

// 进入内容库（第二、三阶段：开库结束后）
const enterContentLib = () => {
  console.log('[enterContentLib] 开库结束，进入内容库');
  const task = getTask(data.taskId);
  if (!task) return;
  
  // 根据第二阶段文档，内容库有S6~S11，随机选一个
  const contentLibIds = ['S6', 'S7', 'S8', 'S9', 'S10', 'S11'];
  const randomContentLibId = contentLibIds[Math.floor(Math.random() * contentLibIds.length)];
  
  console.log('[enterContentLib] 随机选择内容库:', randomContentLibId);
  
  // 获取内容库
  const libs = uni.getStorageSync('fm:libs');
  const contentChains = libs?.content?.[randomContentLibId] || [];
  
  if (contentChains.length > 0) {
    const randomChain = contentChains[Math.floor(Math.random() * contentChains.length)];
    const firstNode = randomChain[0];
    const text = firstNode.text || '';
    const segments = text.split('@');
    
    data.currentSegments = segments;
    data.currentSegmentIndex = 0;
    data.currentChainIndex = 0;
    data.currentChain = randomChain;
    
    data.pageInfo = {
      contentList: [{
        stepDetailId: `${data.currentRound}_0_0`,
        content: segments[0] || '',
        segmentIndex: 0,
        type: firstNode.type || 'text',
        totalSegments: segments.length,
        currentSegment: 0
      }]
    };
    data.currentStep = 'normal';
    
    // 更新currentLibChain
    const t = getTask(data.taskId);
    if (t) {
      t.currentLibChain = {
        type: 'content',
        libId: randomContentLibId,
        nodeIndex: 0,
        segmentsCopied: 0
      };
      uni.setStorageSync(`fm:task:${data.taskId}`, t);
    }
    
    console.log('[enterContentLib] 内容库加载完成:', randomContentLibId, '第一段:', segments[0]);
  } else {
    console.log('[enterContentLib] 内容库为空，直接进入离库');
    finishCurrentContent();
  }
};

// 移动到下一个节点
const moveToNextNode = () => {
  if (data.currentChain && data.currentChainIndex < data.currentChain.length - 1) {
    data.currentChainIndex++;
    data.currentSegmentIndex = 0;
    const nextNode = data.currentChain[data.currentChainIndex];
    
    if (nextNode.type === 'Z' || nextNode.type === 'AZ') {
      // 下一个节点是Z，进入Z模式
      const task = getTask(data.taskId);
      if (task && task.stage1) {
        data.zEndTime = Date.now() + task.stage1.zTimerMs;
      }
      data.currentStep = 'z';
    } else if (nextNode.type === 'D' || nextNode.type === 'AD') {
      // 下一个节点是D，进入D模式
      data.currentStep = 'd';
    } else if (nextNode.type === '&') {
      // 遇到结束符号，进入离库
      finishCurrentContent();
    } else {
      // 下一个节点是普通内容，处理分段
      data.currentStep = 'normal';
      
      if (nextNode.text) {
        // 检查是否包含并行拆分符号 ///
        if (nextNode.text.includes('///')) {
          // 处理并行拆分
          const parallelSegments = nextNode.text.split('///');
          data.pageInfo = {
            contentList: parallelSegments.map((segment: string, index: number) => ({
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_${index}`,
              content: segment.trim(),
              segmentIndex: 0,
              type: nextNode.type || 'text',
              totalSegments: parallelSegments.length,
              currentSegment: index
            }))
          };
        } else {
          // 普通内容，按@分段
          const segments = nextNode.text.split('@');
          data.currentSegments = segments;
          
          data.pageInfo = {
            contentList: [{
              stepDetailId: `${data.currentRound}_${data.currentChainIndex}_0`,
              content: segments[0] || '',
              segmentIndex: 0,
              type: nextNode.type || 'text',
              totalSegments: segments.length,
              currentSegment: 0
            }]
          };
        }
      }
    }
  } else {
    // 内容链结束，根据当前库类型决定下一步
    console.log('[moveToNextNode] 内容链结束');
    const task = getTask(data.taskId);
    const currentLibType = task?.currentLibChain?.type;
    console.log('[moveToNextNode] 当前库类型:', currentLibType, '阶段:', task?.stageIndex);
    
    // 第二、三阶段：开库→内容库→离库
    if (task && (task.stageIndex === 2 || task.stageIndex === 3)) {
      if (currentLibType === 'opening') {
        // 开库结束，进入内容库
        console.log('[moveToNextNode] 开库结束，准备进入内容库');
        enterContentLib();
        return;
      } else if (currentLibType === 'content') {
        // 内容库结束，进入离库
        console.log('[moveToNextNode] 内容库结束，进入离库');
        finishCurrentContent();
        return;
      }
    }
    
    // 第一阶段或其他情况：直接进入离库
    console.log('[moveToNextNode] 链结束，进入离库');
    finishCurrentContent();
  }
};

// 状态显示：步骤中文名
const stepLabel = computed(() => {
  // 第一阶段步骤显示
  if (data.stage1) {
    switch (data.currentStep) {
      case 'normal': return '回合内容';
      case 'z': return 'Z倒计时';
      case 'd': return 'D模式';
      case 'lookfor': return '对方找';
      case 'stage_cd': return '回合CD';
      default: return '进行中';
    }
  }
  
  // 旧逻辑兼容
  const t = data.detail?.stepType as string;
  const map: Record<string, string> = {
    stage_round_content: '回合内容',
    stage_round_end_content: '回合结束内容',
    familiar_1_cd: '回合CD',
    familiar_1_cd2: '回合延时CD',
    familiar_1_stage_cd: '阶段间大CD',
    familiar_s2: 'S2（阶段0提示板）',
    familiar_s3: 'S3（阶段0提示板）',
    familiar_s4: 'S4（阶段0对方找）',
  };
  return map[t] || t || '-';
});

//  Z倒计时文案（响应式变量）
const zCountdownMsg = computed(() => {
  // 直接返回 data.cdMsg，由 zTimeup 回调更新
  return data.cdMsg;
});

// 判断是否为特殊回合a/b的大CD倒计时
const isSpecialRoundBigCd = computed(() => {
  return data.cdMsg && (data.cdMsg.includes('特殊回合a') || data.cdMsg.includes('特殊回合b'));
});

//  启动对方找弹窗倒计时
const startLookforCountdown = () => {
  // 清除之前的定时器
  if (data.lookforCountdownTimer) {
    clearInterval(data.lookforCountdownTimer);
  }

  // 优先使用后端下发的 cutDownTime（秒）；若无则使用3-50秒随机
  const serverSeconds = Number(data.pageInfo?.statusVo?.cutDownTime || 0);
  const fallback = Math.floor(Math.random() * (50 - 3 + 1)) + 3;
  data.lookforCountdown = serverSeconds > 0 ? serverSeconds : fallback;
  data.canCopyLookfor = false;

  console.log('启动对方找弹窗倒计时:', data.lookforCountdown, '秒');

  // 启动倒计时
  data.lookforCountdownTimer = setInterval(() => {
    data.lookforCountdown--;

    if (data.lookforCountdown <= 0) {
      // 倒计时结束
      clearInterval(data.lookforCountdownTimer);
      data.lookforCountdownTimer = null;
      data.canCopyLookfor = true;
      console.log('对方找弹窗倒计时结束，复制按钮可点击');
    }
  }, 1000);
};

//  停止对方找弹窗倒计时
const stopLookforCountdown = () => {
  if (data.lookforCountdownTimer) {
    clearInterval(data.lookforCountdownTimer);
    data.lookforCountdownTimer = null;
  }
  data.lookforCountdown = 0;
  data.canCopyLookfor = false;
};

// 增加一个阶段
const _addStage = async (taskId: number, nextStageNum: number) => {
  console.log('_addStage 调用，准备进入第', nextStageNum, '阶段');

  // 防止重复调用（双重检查）
  if (data.isAddingStage) {
    console.warn('正在添加阶段中，跳过重复调用');
    return;
  }
  data.isAddingStage = true;

  try {
    // 关闭上一个步骤
    await new Promise<void>((resolve) => {
      closeOverTimeDetailStep({ specialStepId: data.detail?.specialStepId ?? 0 }, () => {
        console.log('closeOverTimeDetailStep 完成');
        resolve();
      });
    });

    //  修复：不调用 addStage，直接调用 savePoint
    // savePoint 会根据 stepType 自动创建阶段
    // 根据文档要求：每个阶段进入下一阶段时需要经过一个阶段间的大CD
    // 保存阶段间大CD节点
    await new Promise<void>((resolve) => {
      savePoint(
        {
          stepNum: 0,
          stepType: (`familiar_${nextStageNum}_stage_cd` as unknown as StageEnumType),
          taskId,
          stageNum: nextStageNum,  //  新增：进入下一阶段
          roundNum: 1              //  新增：下一阶段的第1回合
        },
        () => {
          console.log('savePoint 完成，已保存阶段间大CD节点');
          resolve();
        }
      );
    });

    // 跳转到列表页，显示"下次聊天开启倒计时"
    uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });

  } catch (error) {
    console.error('_addStage 执行失败:', error);
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  } finally {
    data.isAddingStage = false;
    data.loading = false;
  }
};




// 回合/阶段CD倒计时回调（纯前端）
const cdTimeup = async () => {
  console.log('CD倒计时结束，检查当前状态');
  const t = getTask(data.taskId);
  if (!t) {
    console.log('[cdTimeup] 任务不存在，返回');
    return;
  }

  console.log('[cdTimeup] 任务状态:', {
    roundCdUnlockAt: t.roundCdUnlockAt,
    stageCdUnlockAt: t.stageCdUnlockAt,
    roundIndex: t.roundIndex,
    stageIndex: t.stageIndex,
    now: Date.now()
  });

  // 增加2秒容错，避免倒计时组件提前触发导致判断失败
  const now = Date.now();

  // 【对方找CD优先处理】
  if (t.opponentFindCdUnlockAt && now >= ((t.opponentFindCdUnlockAt as number) - 2000)) {
    console.log('[cdTimeup] 对方找CD结束（容错2秒），准备进入下一步');

    // 清除对方找CD标记
    t.opponentFindCdUnlockAt = null;
    uni.setStorageSync(`fm:task:${data.taskId}`, t);

    // 根据当前阶段和回合，决定下一步
    const currentStage = t.stageIndex || 1;
    const currentRound = t.roundIndex || 0;

    console.log('[cdTimeup] 对方找CD结束后，当前阶段:', currentStage, '回合:', currentRound);

    // 根据文档：
    // - 第1阶段：对方找后进入下一回合
    // - 第2阶段：对方找后跳过开库，进入内容库（或进入下一回合）
    // - 第3阶段：对方找后跳过开库，进入内容库（或进入下一回合）

    if (currentStage === 1) {
      // 第1阶段：进入下一回合
      const nextRound = currentRound + 1;
      console.log('[cdTimeup] 第1阶段对方找CD结束，进入第', nextRound, '回合');
      const startResult = startStage1Round(data.taskId, nextRound);
      if (startResult.ok) {
        data.currentRound = nextRound;
        data.currentStep = 'normal';
        await _round();
        return;
      }
    } else if (currentStage === 2 || currentStage === 3) {
      // 第2/3阶段：对方找后跳过开库，进入内容库
      console.log('[cdTimeup] 第', currentStage, '阶段对方找CD结束，跳过开库进入内容库');

      // 标记跳过开库
      if (currentStage === 2) {
        const stage2 = t.stage2;
        if (stage2) {
          stage2.skipOpening = true;
          uni.setStorageSync(`fm:task:${data.taskId}`, t);
        }
      } else if (currentStage === 3) {
        const stage3 = t.stage3;
        if (stage3) {
          stage3.skipOpening = true;
          uni.setStorageSync(`fm:task:${data.taskId}`, t);
        }
      }

      // 进入下一回合
      const nextRound = currentRound + 1;
      if (currentStage === 2) {
        const startResult = startStage2Round(data.taskId, nextRound);
        if (startResult.ok) {
          data.currentRound = nextRound;
          data.currentStep = 'normal';
          await _round();
          return;
        }
      } else if (currentStage === 3) {
        const startResult = startStage3Round(data.taskId, nextRound);
        if (startResult.ok) {
          data.currentRound = nextRound;
          data.currentStep = 'normal';
          await _round();
          return;
        }
      }
    }

    return;
  }

  // 阶段CD优先处理（避免与回合CD冲突）
  if (t.stageCdUnlockAt && now >= ((t.stageCdUnlockAt as number) - 2000)) {
    console.log('[cdTimeup] 阶段CD结束（容错2秒）');
    const nextStage = (t.stageIndex || 1) + 1;
    console.log('[cdTimeup] 准备进入第', nextStage, '阶段');

    try {
      // 根据下一阶段调用对应的 enterStage 函数
      if (nextStage === 2) {
        console.log('[cdTimeup] 调用 enterStage2');
        enterStage2(data.taskId);
        console.log('[cdTimeup] 调用 startStage2Round(1)');
        startStage2Round(data.taskId, 1);
      } else if (nextStage === 3) {
        console.log('[cdTimeup] 调用 enterStage3');
        enterStage3(data.taskId);
        console.log('[cdTimeup] 调用 startStage3Round(1)');
        startStage3Round(data.taskId, 1);
      } else if (nextStage === 4) {
        console.log('[cdTimeup] 调用 enterStage4');
        enterStage4(data.taskId);
      } else {
        // 其他阶段使用通用逻辑
        console.log('[cdTimeup] 调用 startStage');
        startStage(data.taskId, nextStage);
        console.log('[cdTimeup] 调用 startRound');
        startRound(data.taskId, 1);
      }

      // 更新页面状态
      data.currentRound = nextStage === 4 ? 0 : 1;
      data.currentStep = 'normal';
      data.stage1 = null; // 清除第一阶段数据

      // 重新加载任务数据
      const tUpdated = getTask(data.taskId);
      console.log('[cdTimeup] 重新加载任务数据:', tUpdated);

      if (tUpdated) {
        data.score = tUpdated.stageScore || 0;
        data.detail = {
          stageNum: tUpdated.stageIndex,
          roundNum: tUpdated.roundIndex || 0,
          stepType: 'stage_round_content',
          taskName: tUpdated.name
        };
      }

      console.log('[cdTimeup] 已进入第', nextStage, '阶段，更新后detail:', data.detail);

      // 提示用户
      uni.showToast({
        title: `已进入第${nextStage}阶段`,
        icon: 'success',
        duration: 1500
      });

      // 立即调用_round加载新阶段内容
      console.log('[cdTimeup] 立即调用_round加载新阶段内容');
      await _round();
    } catch (error) {
      console.error('[cdTimeup] 进入第', nextStage, '阶段失败:', error);
      uni.showToast({
        title: `进入第${nextStage}阶段失败`,
        icon: 'error'
      });
    }
    return;
  }

  // 回合间CD：根据第一阶段逻辑决定下一步
  if (t.roundCdUnlockAt && now >= ((t.roundCdUnlockAt as number) - 2000)) {
    const currentRound = t.roundIndex || 0;
    console.log('[cdTimeup] 回合CD结束（容错2秒），当前回合:', currentRound, '阶段:', t.stageIndex);

    if (t.stageIndex === 1) {
      console.log('[cdTimeup] 进入第一阶段处理分支');
      // 第1、2回合：直接进入下一回合
      if (currentRound === 1 || currentRound === 2) {
        console.log('[cdTimeup] 第1/2回合，准备进入下一回合');
        const nextRound = currentRound + 1;
        const startResult = startStage1Round(data.taskId, nextRound);
        console.log('[cdTimeup] startStage1Round结果:', startResult);
        if (startResult.ok) {
          data.currentRound = nextRound;
          data.currentStep = 'normal';
          console.log('[cdTimeup] 准备加载第', nextRound, '回合内容');
          await loadCurrentRoundContent();
          console.log('[cdTimeup] 第', nextRound, '回合内容加载完成');
          return;
        } else {
          console.log('[cdTimeup] startStage1Round失败:', startResult.reason);
        }
      }
      // 第3回合结束：根据判分结果决定进入第4还是第5回合
      else if (currentRound === 3) {
        const result = checkStage1RoundTransition(data.taskId);
        if (result.ok) {
          console.log('[cdTimeup] 第3回合后判分结果:', result.action);
          handleTransitionResult(result);
          return;
        }
      }
      // 第4回合结束：进入阶段CD
      else if (currentRound === 4) {
        const range = { minDays: 3, maxDays: 5 };
        console.log('[cdTimeup] 第4回合后进入阶段CD', range);
        enterStageCd(data.taskId, range);
        
        // 重新获取任务以获取最新的stageCdUnlockAt
        const tAfter = getTask(data.taskId);
        const stageCdUnlockAt = tAfter?.stageCdUnlockAt || null;
        let stageCdEndTimeStr = '';
        if (stageCdUnlockAt) {
          const d = new Date(stageCdUnlockAt as number);
          const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
          stageCdEndTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        console.log('[cdTimeup] 阶段CD设置:', { stageCdUnlockAt, endTime: stageCdEndTimeStr });
        
        data.currentStep = 'stage_cd';
        data.cdMsg = '阶段间倒计时，结束后进入第二阶段';
        data.detail = { ...(data.detail || {}), endTime: stageCdEndTimeStr };
        return;
      }
      // 第5回合结束：根据判分结果决定进入第6回合还是阶段CD
      else if (currentRound === 5) {
        const result = checkStage1RoundTransition(data.taskId);
        if (result.ok && result.action !== 'continue') {
          console.log('[cdTimeup] 第5回合后，由判分结果处理动作:', result.action);
          handleTransitionResult(result);
          return;
        }
      }
      // 第6回合结束：根据判分结果
      else if (currentRound === 6) {
        const result = checkStage1RoundTransition(data.taskId);
        if (result.ok && result.action !== 'continue') {
          console.log('[cdTimeup] 第6回合后判分结果:', result.action);
          handleTransitionResult(result);
          return;
        }
      }
    } else if (t.stageIndex === 2) {
      // 第二阶段：使用 checkStage2RoundTransition 进行判分
      console.log('[cdTimeup] 第二阶段，回合', currentRound, '结束');

      // 检查 stage2 数据是否存在，不存在则初始化
      if (!t.stage2) {
        console.log('[cdTimeup] stage2数据不存在，调用enterStage2初始化');
        const savedRoundIndex = t.roundIndex; // 保存当前回合数
        const savedStageScore = t.stageScore; // 保存当前得分
        enterStage2(data.taskId);
        // 重新获取任务并恢复回合数和得分
        const tUpdated = getTask(data.taskId);
        if (tUpdated) {
          tUpdated.roundIndex = savedRoundIndex;
          tUpdated.stageScore = savedStageScore;
          uni.setStorageSync(`fm:task:${data.taskId}`, tUpdated);
          Object.assign(t, tUpdated);
        }
      }

      const result = checkStage2RoundTransition(data.taskId);
      console.log('[cdTimeup] 第二阶段判分结果:', result);

      if (!result.ok) {
        console.error('[cdTimeup] 第二阶段判分失败:', result.reason);
        await _round();
        return;
      }

      // 特殊处理：如果是特殊回合a或b的2倍/3倍大CD结束，需要进入内容库交互
      if ((t.stage2?.specialRound === 'a' || t.stage2?.specialRound === 'b') && currentRound >= 3) {
        console.log('[cdTimeup] 特殊回合', t.stage2?.specialRound, '的大CD结束，进入内容库交互');
        // 初始化特殊回合的内容库（跳过开库，直接进入内容库）
        const specialRoundResult = startStage2Round(data.taskId, currentRound);
        if (specialRoundResult.ok) {
          data.currentRound = currentRound;
          data.currentStep = 'normal';
          await _round();
          return;
        }
      }

      // 处理判分结果
      const handleStage2Action = async () => {
        switch (result.action) {
          case 'enterRound2':
            console.log('[cdTimeup] 进入第2回合');
            // 调用 startStage2Round 初始化第2回合
            const round2Result = startStage2Round(data.taskId, 2);
            console.log('[cdTimeup] startStage2Round(2)结果:', round2Result);
            if (round2Result.ok) {
              data.currentRound = 2;
              data.currentStep = 'normal';
              await _round();
            } else {
              console.error('[cdTimeup] startStage2Round失败:', round2Result.reason);
            }
            break;

          case 'enterStageCd':
            console.log('[cdTimeup] 积分>X，进入阶段CD');
            data.currentStep = 'stage_cd';
            data.cdMsg = '阶段间倒计时，结束后进入第三阶段';
            const tAfterStage2 = getTask(data.taskId);
            if (tAfterStage2?.stageCdUnlockAt) {
              const d = new Date(tAfterStage2.stageCdUnlockAt as number);
              const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
              const endTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
              data.detail = { ...(data.detail || {}), endTime: endTimeStr };
            }
            break;

          case 'showPromptS10':
            console.log('[cdTimeup] 积分≤X，显示提示板S10，已进入2倍大CD');
            // 注意：checkStage2RoundTransition 已经设置了 specialRound='a'、roundIndex=3、enterRoundBigCd(2)
            // 这里只需要显示提示板，让用户选择是否坚持
            uni.showModal({
              title: '温馨提示',
              content: '得分不足，是否继续坚持？',
              confirmText: '坚持',
              cancelText: '放弃',
              success: async (res) => {
                if (res.confirm) {
                  console.log('[cdTimeup] 用户选择坚持，等待2倍大CD结束后进入特殊回合a');
                  // 更新UI显示倒计时
                  data.currentStep = 'stage_cd';
                  data.cdMsg = '特殊回合a的2×大CD';
                  const tAfterCd = getTask(data.taskId);
                  if (tAfterCd?.roundCdUnlockAt) {
                    const d = new Date(tAfterCd.roundCdUnlockAt as number);
                    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                    const endTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    data.detail = { ...(data.detail || {}), endTime: endTimeStr };
                  }
                } else {
                  uni.showModal({
                    title: '温馨提示',
                    content: '确定要结束任务吗？',
                    confirmText: '确定',
                    cancelText: '取消',
                    success: (res2) => {
                      if (res2.confirm) {
                        console.log('[cdTimeup] 用户选择放弃，结束任务');
                        uni.navigateBack();
                      }
                    }
                  });
                }
              }
            });
            break;

          case 'enterSpecialRoundA':
            console.log('[cdTimeup] 进入特殊回合a');
            data.currentRound = 'a';
            data.currentStep = 'normal';
            await _round();
            break;

          case 'showPromptS11':
            console.log('[cdTimeup] 特殊回合a得分=前两回合总分，显示提示板S11');
            uni.showModal({
              title: '温馨提示',
              content: '得分相等，是否坚持？',
              confirmText: '坚持',
              cancelText: '放弃',
              success: async (res) => {
                if (res.confirm) {
                  console.log('[cdTimeup] 用户选择坚持，进入特殊回合b');
                  // 设置特殊回合b
                  const tForSpecialB = getTask(data.taskId);
                  if (tForSpecialB && tForSpecialB.stage2) {
                    tForSpecialB.stage2.specialRound = 'b';
                    tForSpecialB.roundIndex = 4; // 特殊回合b是第4回合
                    uni.setStorageSync(`fm:task:${data.taskId}`, tForSpecialB);
                  }
                  // 进入3×大CD
                  const range = { minDays: 0, maxDays: 0, multiplier: 3 };
                  enterRoundBigCd(data.taskId, range);
                  data.currentStep = 'stage_cd';
                  data.cdMsg = '特殊回合b的3×大CD';
                  // 更新倒计时
                  const tAfterCd = getTask(data.taskId);
                  if (tAfterCd?.roundCdUnlockAt) {
                    const d = new Date(tAfterCd.roundCdUnlockAt as number);
                    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                    const endTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    data.detail = { ...(data.detail || {}), endTime: endTimeStr };
                  }
                } else {
                  uni.showModal({
                    title: '温馨提示',
                    content: '确定要结束任务吗？',
                    confirmText: '确定',
                    cancelText: '取消',
                    success: (res2) => {
                      if (res2.confirm) {
                        console.log('[cdTimeup] 用户选择放弃，结束任务');
                        uni.navigateBack();
                      }
                    }
                  });
                }
              }
            });
            break;

          case 'enterSpecialRoundB':
            console.log('[cdTimeup] 进入特殊回合b');
            data.currentRound = 'b';
            data.currentStep = 'normal';
            await _round();
            break;

          case 'showPromptS13':
          case 'showPromptS14':
            const isS13 = result.action === 'showPromptS13';
            console.log(`[cdTimeup] 显示提示板${isS13 ? 'S13' : 'S14'}（15天倒计时）`);
            uni.showModal({
              title: '温馨提示',
              content: isS13 ? '得分仍然相等，将进入15天倒计时' : '得分不足，将进入15天倒计时',
              showCancel: false,
              success: () => {
                data.currentStep = 'stage_cd';
                data.cdMsg = '15天倒计时，结束后进入第三阶段';
                const tAfter15Days = getTask(data.taskId);
                if (tAfter15Days?.stageCdUnlockAt) {
                  const d = new Date(tAfter15Days.stageCdUnlockAt as number);
                  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                  const endTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                  data.detail = { ...(data.detail || {}), endTime: endTimeStr };
                }
              }
            });
            break;

          default:
            console.log('[cdTimeup] 第二阶段未知动作:', result.action);
            await _round();
        }
      };

      await handleStage2Action();
      return;
    } else if (t.stageIndex === 3) {
      // 第三阶段：使用 checkStage3RoundTransition 进行判分
      console.log('[cdTimeup] 第三阶段，回合', currentRound, '结束');

      // 检查 stage3 数据是否存在，不存在则初始化
      if (!t.stage3) {
        console.log('[cdTimeup] stage3数据不存在，调用enterStage3初始化');
        const savedRoundIndex = t.roundIndex; // 保存当前回合数
        const savedStageScore = t.stageScore; // 保存当前得分
        enterStage3(data.taskId);
        // 重新获取任务并恢复回合数和得分
        const tUpdated = getTask(data.taskId);
        if (tUpdated) {
          tUpdated.roundIndex = savedRoundIndex;
          tUpdated.stageScore = savedStageScore;
          uni.setStorageSync(`fm:task:${data.taskId}`, tUpdated);
          Object.assign(t, tUpdated);
        }
      }

      const result = checkStage3RoundTransition(data.taskId);
      console.log('[cdTimeup] 第三阶段判分结果:', result);

      if (!result.ok) {
        console.error('[cdTimeup] 第三阶段判分失败:', result.reason);
        await _round();
        return;
      }

      // 处理判分结果
      const handleStage3Action = async () => {
        switch (result.action) {
          case 'enterRound2':
            console.log('[cdTimeup] 进入第2回合');
            // 调用 startStage3Round 初始化第2回合
            const round2Result = startStage3Round(data.taskId, 2);
            console.log('[cdTimeup] startStage3Round(2)结果:', round2Result);
            if (round2Result.ok) {
              data.currentRound = 2;
              data.currentStep = 'normal';
              await _round();
            } else {
              console.error('[cdTimeup] startStage3Round失败:', round2Result.reason);
            }
            break;

          case 'enterStage4':
            console.log('[cdTimeup] 积分>X，直接进入第四阶段（无阶段CD）');
            // 第三阶段特殊：积分>X时直接进入第四阶段，无阶段CD
            uni.showToast({
              title: '恭喜进入第四阶段！',
              icon: 'success',
              duration: 2000
            });
            setTimeout(async () => {
              data.currentStep = 'normal';
              await _round();
            }, 2000);
            break;

          case 'showPromptS15':
            console.log('[cdTimeup] 积分≤X，显示提示板S15');
            uni.showModal({
              title: '温馨提示',
              content: '得分不足，是否继续坚持？',
              confirmText: '坚持',
              cancelText: '放弃',
              success: async (res) => {
                if (res.confirm) {
                  console.log('[cdTimeup] 用户选择坚持，进入特殊回合a');
                  data.currentStep = 'stage_cd';
                  data.cdMsg = '特殊回合a的3×大CD';
                  await _round();
                } else {
                  // 显示半价重开选项
                  uni.showModal({
                    title: '温馨提示',
                    content: '是否半价重开（69元）？',
                    confirmText: '重开',
                    cancelText: '结束任务',
                    success: (res2) => {
                      if (res2.confirm) {
                        console.log('[cdTimeup] 用户选择半价重开');
                        const restartResult = halfPriceRestart(data.taskId);
                        if (restartResult.ok) {
                          uni.showToast({
                            title: '重开成功！',
                            icon: 'success',
                            duration: 2000
                          });
                          setTimeout(() => {
                            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                          }, 2000);
                        } else {
                          uni.showToast({
                            title: restartResult.reason || '重开失败',
                            icon: 'error'
                          });
                        }
                      } else {
                        console.log('[cdTimeup] 用户选择结束任务');
                        uni.navigateBack();
                      }
                    }
                  });
                }
              }
            });
            break;

          case 'enterSpecialRoundA':
            console.log('[cdTimeup] 进入特殊回合a');
            data.currentRound = 'a';
            data.currentStep = 'normal';
            await _round();
            break;

          case 'showPromptS16':
            console.log('[cdTimeup] 特殊回合a得分=第2回合得分，显示提示板S16');
            uni.showModal({
              title: '温馨提示',
              content: '得分相等，是否坚持？',
              confirmText: '坚持',
              cancelText: '放弃',
              success: async (res) => {
                if (res.confirm) {
                  console.log('[cdTimeup] 用户选择坚持，进入特殊回合b');
                  data.currentStep = 'stage_cd';
                  data.cdMsg = '特殊回合b的3×大CD';
                  await _round();
                } else {
                  // 显示半价重开选项
                  uni.showModal({
                    title: '温馨提示',
                    content: '是否半价重开（69元）？',
                    confirmText: '重开',
                    cancelText: '结束任务',
                    success: (res2) => {
                      if (res2.confirm) {
                        console.log('[cdTimeup] 用户选择半价重开');
                        const restartResult = halfPriceRestart(data.taskId);
                        if (restartResult.ok) {
                          uni.showToast({
                            title: '重开成功！',
                            icon: 'success',
                            duration: 2000
                          });
                          setTimeout(() => {
                            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                          }, 2000);
                        } else {
                          uni.showToast({
                            title: restartResult.reason || '重开失败',
                            icon: 'error'
                          });
                        }
                      } else {
                        console.log('[cdTimeup] 用户选择结束任务');
                        uni.navigateBack();
                      }
                    }
                  });
                }
              }
            });
            break;

          case 'enterSpecialRoundB':
            console.log('[cdTimeup] 进入特殊回合b');
            data.currentRound = 'b';
            data.currentStep = 'normal';
            await _round();
            break;

          case 'showPromptS17':
          case 'showPromptS18':
            const isS17 = result.action === 'showPromptS17';
            console.log(`[cdTimeup] 显示提示板${isS17 ? 'S17' : 'S18'}（半价重开或结束）`);
            uni.showModal({
              title: '温馨提示',
              content: isS17 ? '得分仍然相等，是否半价重开？' : '得分不足，是否半价重开？',
              confirmText: '重开',
              cancelText: '结束任务',
              success: (res) => {
                if (res.confirm) {
                  console.log('[cdTimeup] 用户选择半价重开');
                  const restartResult = halfPriceRestart(data.taskId);
                  if (restartResult.ok) {
                    uni.showToast({
                      title: '重开成功！',
                      icon: 'success',
                      duration: 2000
                    });
                    setTimeout(() => {
                      uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                    }, 2000);
                  } else {
                    uni.showToast({
                      title: restartResult.reason || '重开失败',
                      icon: 'error'
                    });
                  }
                } else {
                  console.log('[cdTimeup] 用户选择结束任务');
                  uni.navigateBack();
                }
              }
            });
            break;

          default:
            console.log('[cdTimeup] 第三阶段未知动作:', result.action);
            await _round();
        }
      };

      await handleStage3Action();
      return;
    } else {
      console.log('[cdTimeup] 不在已处理的阶段，当前阶段:', t.stageIndex);
    }
  } else {
    console.log('[cdTimeup] 没有回合CD或CD未到时间');
  }

  // 默认刷新
  console.log('[cdTimeup] 走到默认刷新分支，调用_round()');
  await _round();
};



// 对方找可用倒计时回调（大CD页面上方的倒计时）
const opponentFindTimeup = () => {
  console.log('[round] 对方找可用倒计时结束，对方找按钮变为可点击');
  data.canLookfor = true;
};

// 对方找CD倒计时回调
const lookforTimeup = () => {
  // 小倒计时结束，置为可点，触发视图刷新
  data.canLookfor = true;
};





const _round = async (r?: { taskId?: number }) => {
  const _taskId = r?.taskId || data.taskId;

  console.log('[_round] 开始，taskId:', _taskId, '当前detail:', data.detail);

  // 强制初始化并重新读取，确保获取最新数据
  initFamiliarLocal();
  
  // 优先使用本地任务数据（如果存在）
  const localTask = getTask(_taskId);
  console.log('[_round] 本地任务数据（重新读取）:', localTask);
  console.log('[_round] currentLibChain存在?', !!localTask?.currentLibChain, 'type:', localTask?.currentLibChain?.type, 'libId:', localTask?.currentLibChain?.libId);

  if (localTask) {
    // 使用本地数据更新detail
    const now = Date.now();

    // 格式化倒计时时间为字符串
    const formatTime = (timestamp: number | null) => {
      if (!timestamp) return null;
      const d = new Date(timestamp);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const endTimeTimestamp = localTask.roundCdUnlockAt || localTask.stageCdUnlockAt || null;
    const endTimeStr = formatTime(endTimeTimestamp as number | null);
    const otherFindEndTimeStr = formatTime(localTask.opponentFindUnlockAt as number | null);

    data.detail = {
      ...data.detail,
      stageNum: localTask.stageIndex,
      roundNum: localTask.roundIndex || 0,
      stepType: data.detail?.stepType || 'stage_round_content',
      taskName: localTask.name,
      endTime: endTimeStr,
      otherFindEndTime: otherFindEndTimeStr
    };
    data.score = localTask.stageScore || 0;
    // 大CD期间，对方找按钮可立即点击；复制按钮倒计时在弹窗内部控制
    data.canLookfor = true;
    console.log('[_round] 使用本地任务数据更新detail完成');
  } else {
    // 降级：尝试后端接口
    console.log('[_round] 本地任务不存在，尝试后端接口');
    const detail = await getTaskDetail(_taskId);
    if (detail) {
      data.detail = detail;
      data.taskName = detail?.taskName || data.taskName || '';
      // 大CD页面统一允许点击对方找按钮
      data.canLookfor = true;
    }
  }

  console.log('[_round] detail更新完成，准备提取变量');

  // 优先使用本地积分数据
  const stageNum = data.detail?.stageNum; // 当前阶段
  const roundNum = data.detail?.roundNum ?? 0; // 当前阶段的回合数
  const stepType = data.detail?.stepType;
  const score = localTask ? (localTask.stageScore || 0) : data.score;

  console.log('[_round] 提取变量完成:', 'stageNum=', stageNum, 'roundNum=', roundNum, 'stepType=', stepType, 'score=', score);

  //  保存积分到 data 中，用于页面显示
  data.score = score;

  console.log('[_round] 调试信息:', { stageNum, score, roundNum, stepType });

  // 第零阶段
  if (stageNum == 0) {
    console.log('第0阶段，stepType:', stepType);
    // S2/S3 提示板：直接显示（由 md-page 或其他组件处理）
    if (['familiar_s2', 'familiar_s3'].includes(stepType)) {
      console.log('第0阶段提示板 S2/S3，等待用户关闭');
      // 前端不需要额外处理，提示板组件会自动显示
      data.stepSign = 'tip'; // 标记为提示板状态
    }
    // S4：对方找（对主动库s1）
    else if (stepType === 'familiar_s4') {
      console.log('第0阶段 S4，显示对方找按钮');
      data.stepSign = 'lookfor';
    }
    // 其他情况：尝试拉取内容
    else {
      console.log('第0阶段其他情况，尝试拉取内容');
      await getListInfo();
    }
  }

  // 第一阶段
  if (stageNum == 1) {
    // 初始阶段
    // 后端托管回合推进与CD节点生成：前端被动消费
    if (stepType === 'stage_round_content') {
      await getListInfo();
    } else if (stepType === 'stage_round_end_content') {
      //  回合结束内容阶段（离库结束后的状态）
      console.log('回合结束内容阶段，调用stage1RoundEnd进行回合判分');
      await stage1RoundEnd(data.taskId);
      // 刷新状态
      await _round();
    } else if (['familiar_1_cd', 'familiar_1_cd2'].includes(stepType)) {
      // 回合间CD
      const detail = data.detail;

      //  情况1：endTime为null，说明CD已被后端关闭
      if (!detail?.endTime) {
        console.log('CD的endTime为null，检查needManualHandle');

        if (detail?.needManualHandle === 1) {
          console.log('needManualHandle=1，CD已过期，先创建新的普通步骤，再获取内容');

          //  防护：避免重复调用savePoint
          if (data._isSwitchingToNextRound) {
            console.log('正在切换到下一回合，避免重复调用');
            return;
          }
          data._isSwitchingToNextRound = true;

          try {
            //  先创建新的普通步骤（stage_round_content）
            await savePoint({
              stepNum: 0,
              stepType: 'stage_round_content',
              taskId: data.taskId,
              stageNum: detail?.stageNum || 1,  //  保持当前阶段
              roundNum: detail?.roundNum || 1   //  保持当前回合（CD创建时已经+1了）
            });

            //  再获取下一回合内容
            await getListInfo();
          } finally {
            data._isSwitchingToNextRound = false;
          }
        } else {
          console.log('needManualHandle不为1，显示对方找按钮');
          // CD未结束，展示"对方找"按钮
          data.stepSign = 'lookfor';
          data.cdMsg = '回合CD倒计时中，结束后将自动进入下一回合';
        }
      }
      //  情况2：endTime存在且已过期
      else if (hasItTimeOut(detail.endTime)) {
        console.log('回合CD已结束，前端主动切换到 stage_round_content');

        //  防护：避免重复调用savePoint
        if (data._isSwitchingToNextRound) {
          console.log('正在切换到下一回合，避免重复调用');
          return;
        }
        data._isSwitchingToNextRound = true;

        try {
          // CD已结束，前端主动切换到回合内容阶段
          await savePoint({
            stepNum: 0,
            stepType: 'stage_round_content',
            taskId: data.taskId,
            stageNum: detail?.stageNum || 1,  //  新增：保持当前阶段
            roundNum: detail?.roundNum || 1   //  新增：保持当前回合（后端已经+1了）
          });
          // 刷新状态
          await _round();
        } finally {
          data._isSwitchingToNextRound = false;
        }
      }
      //  情况3：endTime存在且未过期
      else {
        console.log('回合CD未结束，显示对方找按钮与倒计时');
        // CD未结束，展示"对方找"按钮与倒计时
        data.stepSign = 'lookfor';
        data.cdMsg = '回合CD倒计时中，结束后将自动进入下一回合';
      }
    } else if (stepType === 'familiar_1_stage_cd') {
      // 阶段间大CD（进入阶段1后到第1回合前），不提供"对方找"
      data.stepSign = 'stage_cd';
      data.cdMsg = '阶段间倒计时，结束后进入第1回合';
    } else {
      // 其余情况尝试拉取内容
      await getListInfo();
    }
  }

  // 第二阶段
  if (stageNum == 2) {
    console.log('第2阶段，roundNum:', roundNum, 'stepType:', stepType, 'score:', score);

    // 检查是否需要初始化回合内容库
    const needInitRound = !localTask?.currentLibChain;
    if (needInitRound && roundNum > 0) {
      console.log(`第2阶段第${roundNum}回合，currentLibChain不存在，调用startStage2Round初始化`);
      const initResult = startStage2Round(data.taskId, roundNum);
      console.log(`startStage2Round(${roundNum})结果:`, initResult);
    }

    // 第一回合：roundNum == 0 或 roundNum == 1
    if (roundNum <= 1) {
      // 如果是 stage_round_content，说明需要获取内容（开库→内容库→离库）
      if (stepType === 'stage_round_content') {
        console.log('第2阶段第一回合，stepType=stage_round_content，获取内容');
        data.stepSign = ''; // 清除之前的状态标记
        data.currentStep = 'normal';
        await getListInfo();
      }
      // 如果是 CD 状态，先尝试获取内容，如果没有内容再显示"对方找"按钮
      else if (['familiar_1_cd', 'familiar_1_cd2', 'familiar_2_cd'].includes(stepType)) {
        console.log('第2阶段第一回合，stepType=CD，先尝试获取内容');
        // 尝试获取内容（开库→内容库→离库）
        const hasContent = await getListInfo();
        // 如果没有内容，显示"对方找"按钮
        if (!hasContent) {
          console.log('第2阶段第一回合，没有内容，显示对方找按钮');
          data.stepSign = 'lookfor';
        } else {
          console.log('第2阶段第一回合，有内容，显示内容列表');
          data.stepSign = '';
          data.currentStep = 'normal';
        }
      }
      // 其他情况，尝试获取内容
      else {
        console.log('第2阶段第一回合，未知stepType，尝试获取内容');
        data.stepSign = '';
        data.currentStep = 'normal';
        await getListInfo();
      }
    }
    // 第二回合及后续回合
    else {
      // 根据积分判断是否进入下一阶段或特殊回合
      if (['familiar_1_cd', 'familiar_1_cd2', 'familiar_2_cd'].includes(stepType)) {
        // 先尝试获取内容
        const hasContent = await getListInfo();
        if (!hasContent) {
          data.stepSign = 'lookfor';
        } else {
          data.stepSign = '';
          data.currentStep = 'normal';
        }
      } else if (stepType === 'stage_round_content') {
        data.stepSign = '';
        data.currentStep = 'normal';
        await getListInfo();
      } else {
        console.log('第2阶段第', roundNum, '回合，未知stepType，尝试获取内容');
        data.stepSign = '';
        data.currentStep = 'normal';
        await getListInfo();
      }
    }
  }

  // 第三阶段
  if (stageNum == 3) {
    console.log('第3阶段，roundNum:', roundNum, 'stepType:', stepType);

    // 检查是否需要初始化回合内容库
    const needInitRound = !localTask?.currentLibChain;
    if (needInitRound && roundNum > 0) {
      console.log(`第3阶段第${roundNum}回合，currentLibChain不存在，调用startStage3Round初始化`);
      const initResult = startStage3Round(data.taskId, roundNum);
      console.log(`startStage3Round(${roundNum})结果:`, initResult);
    }

    // 根据 stepType 判断当前状态
    if (['familiar_3_cd'].includes(stepType)) {
      // CD 阶段，显示"对方找"按钮
      data.stepSign = 'lookfor';
      data.currentStep = 'stage_cd';
    } else if (stepType === 'stage_round_content') {
      // 回合内容阶段，获取列表信息
      data.stepSign = ''; // 清除之前的状态标记
      data.currentStep = 'normal';
      await getListInfo();
    } else {
      // 默认处理：尝试获取列表信息
      console.log('第3阶段未知的 stepType，尝试获取列表信息:', stepType);
      data.stepSign = '';
      data.currentStep = 'normal';
      await getListInfo();
    }
  }

  // 第四阶段
  if (stageNum >= 4) {
    console.log('第4阶段及以上，stepType:', stepType);

    const task = getTask(data.taskId);
    if (!task || !task.stage4) {
      console.log('[_round] 第4阶段数据不存在，初始化');
      enterStage4(data.taskId);
    }

    // 检查是否需要显示提示板S20
    const stage4Data = task?.stage4;
    if (stage4Data && !stage4Data.goClicked) {
      console.log('[_round] 第4阶段，显示提示板S20');
      // 显示提示板S20：马上邀约/多聊一次/暂时不做选择
      uni.showModal({
        title: '温馨提示',
        content: '请选择下一步操作',
        showCancel: false,
        success: () => {
          // 显示三个选项按钮
          uni.showActionSheet({
            itemList: ['马上邀约', '多聊一次', '暂时不做选择'],
            success: (res) => {
              const tapIndex = res.tapIndex;
              if (tapIndex === 0) {
                // 马上邀约
                console.log('[_round] 用户选择：马上邀约');
                handleInvitationFlow();
              } else if (tapIndex === 1) {
                // 多聊一次
                console.log('[_round] 用户选择：多聊一次');
                handleMultiChatFlow();
              } else {
                // 暂时不做选择
                console.log('[_round] 用户选择：暂时不做选择');
                uni.showToast({
                  title: '您可以稍后再做选择',
                  icon: 'none'
                });
              }
            }
          });
        }
      });
      return;
    }

    // 根据 stepType 判断当前状态
    if (['familiar_1_cd', 'familiar_1_cd2', 'familiar_4_cd'].includes(stepType)) {
      // CD 阶段，显示"对方找"按钮
      data.stepSign = 'lookfor';
    } else if (stepType === 'stage_round_content') {
      // 回合内容阶段，获取列表信息
      await getListInfo();
    } else {
      // 默认处理：尝试获取列表信息
      console.log('第4阶段未知的 stepType，尝试获取列表信息:', stepType);
      await getListInfo();
    }
  }
};

/**
 * 弹窗相关
 */
const handleClose = async () => {
  console.log('用户点击关闭按钮');

  // 防抖：避免重复进入
  if (data.isClosingPopup) {
    console.warn('handleClose 已触发，忽略重复调用');
    return;
  }
  data.isClosingPopup = true;

  //  停止倒计时
  stopLookforCountdown();

  // 注意：此处不要再调用 popup.close()，否则会触发 @cancel 再次进入此方法形成递归

  //  关闭弹窗时重置"对方找"计分标记
  data.lookforScored = false;

  //  特殊处理：第0阶段的"对主动库s1"，关闭弹窗后进入第1阶段
  if (data.detail.stepType === 'familiar_s4' && data.detail.stageNum === 0) {
    console.log('第0阶段对主动库s1，关闭弹窗后进入第1阶段');
    await _addStage(data.taskId, 1);
    return; // 阶段切换会 redirect，不再本页刷新
  }

  //  阶段1等其它情况：关闭弹窗后立即刷新一次，UI 立刻切换到CD/内容
  await _round();

  // 允许再次触发关闭
  data.isClosingPopup = false;
};

// 点击复制按钮（旧版本，保留兼容性）
const handleCopyOld = async (
  r: any
) => {
  console.log('handleCopyOld 参数:', r);

  //  检查倒计时是否结束（对方找弹窗）
  if (data.stepSign === 'lookfor' && !data.canCopyLookfor) {
    console.log('倒计时未结束，复制按钮不可点击');
    uni.showToast({
      title: `倒计时结束后才能复制（还剩${data.lookforCountdown}秒）`,
      icon: 'none',
      duration: 2000
    });
    return;
  }

  //  计分（前端主导）：在复制动作入口处即刻结算，做到"即时可见"
  if (data.stepSign === 'lookfor' && !data.lookforScored) {
    // 对方找：首次复制即 +1（本地）
    addPoint(data.taskId, 1, 'opponentFind');
    data.lookforScored = true;
    data.score = (data.score || 0) + 1;
    uni.showToast({ title: '积分 +1', icon: 'success', duration: 1200 });
  }

  // 积分、链路操作后，强制同步视图（避免需刷新才更新）
  try {
    // 读取最新任务积分同步到头部统计
    const tSync = getTask(data.taskId);
    if (tSync) {
      data.score = tSync.stageScore || data.score;
    }
  } catch (e) {}
  if (data.pageInfo?.closeContent && data._leaveScoredForStep !== data.pageInfo?.stepId) {
    // 离库：该 stepId 首次复制 +1（本地）
    addPoint(data.taskId, 1, 'leaving');
    data._leaveScoredForStep = data.pageInfo?.stepId || null;
    data.score = (data.score || 0) + 1;
    uni.showToast({ title: '积分 +1', icon: 'success', duration: 1200 });
  }

  // 本地推进：若存在 @ 分段，则仅更新当前项内容为下一段，避免每段都请求接口
  if (r.content?.split('@')?.length > 1) {
    data.pageInfo.contentList?.forEach(
      (s: { stepDetailId: number; content: string }) => {
        if (s.stepDetailId === r.stepDetailId) {
          s.content = r.content?.split('@').slice(1).join('@');
        }
      }
    );
  }
  // 离开库处理 | 对方主动找处理
  //  计分前端主导：对方找（首次复制）+1、离库（该stepId首次复制）+1；普通库分段复制不加分

  //  修复：检查是否是D标记
  // D标记的content为"D"，不应该被复制
  if (r.content === 'D' || r.content === 'AD') {
    console.log('检测到D/AD标记，不复制，直接处理');

    //  特殊处理：第0阶段的"对主动库s1"，D标记表示内容已全部复制完毕
    if (data.detail.stepType === 'familiar_s4' && data.detail.stageNum === 0) {
      console.log('第0阶段对主动库s1，D标记表示内容已全部复制完毕，准备进入第1阶段');
      // 防抖：标记关闭，避免触发 @cancel 再次进入 handleClose
      data.isClosingPopup = true;
      // 关闭弹窗
      popup.value?.close();
      // 进入第1阶段
      await _addStage(data.taskId, 1);
    } else {
      // 其他情况，调用_round()重新判断状态
      _round();
    }

    // 计分逻辑已提前执行，此处不再重复

    return;
  }

  // 复制内容详情
  // r.stepDetailId 是当前要复制的内容详情ID（来自 contentList）
  // 规范 sign：仅在内容本身为 D/AD 时才传递 D/AD；否则传空串
  const pureSign = (r.content === 'D' || r.content === 'AD') ? r.content : '';

  // r.preStepDetailId 是上一个步骤的ID（来自 statusVo.stepDetailId）
  const isStop = await copyContentDetail({
    taskId: data.taskId,
    stepDetailId: r.stepDetailId,  // 修复：使用当前内容的 stepDetailId
    sign: pureSign,
    moduleCode: data.moduleCode,
    stepId: data.pageInfo?.stepId,
    source: data.stepSign === 'lookfor' ? 'lookfor' : (data.pageInfo?.closeContent ? 'leave' : 'content'),
  });

  if (!isStop) {
    // 若还有'@/LL'分段：本地推进，不请求
    const hasMoreSeg = r.content?.includes('@') || r.content?.includes('LL');
    if (hasMoreSeg) {
      // 后端状态已通过 copyContentDetail 记录，等待下一次复制
      return;
    }
    // 否则：这是"最后一段"，应立刻请求获取下一条/下一库
    // 优先尝试获取下一条内容/库
    const gotNext = await getListInfo();
    if (!gotNext) {
      // 若无下一条，则在阶段1触发回合判分
      if (data.detail?.stageNum === 1) await stage1RoundEnd(data.taskId);
      await _round();
    }
    return;
  } else {
    //  isStop=true，说明当前库已结束
    console.log('当前库已结束，isStop=true');

    //  特殊处理：第0阶段的"对主动库s1"复制后，进入第1阶段
    if (data.detail.stepType === 'familiar_s4' && data.detail.stageNum === 0) {
      console.log('第0阶段对主动库s1复制完成，准备进入第1阶段');
      // 关闭弹窗
      popup.value?.close();
      // 进入第1阶段
      await _addStage(data.taskId, 1);
    }
    //  阶段1：当前库结束，尝试获取下一个库的内容
    else if (data.detail.stageNum === 1) {
      console.log('阶段1当前库结束，尝试获取下一个库的内容');

      //  调用 getListInfo() 获取下一个库的内容
      // 后端会根据当前状态返回下一个库（例如：内容库→离库）
      const hasNextContent = await getListInfo();

      //  如果没有下一个库的内容，说明整个回合已结束
      if (!hasNextContent) {
        console.log('阶段1没有更多内容，回合结束，调用stage1RoundEnd进行回合判分');
        // 关闭弹窗（如果是对方找弹窗）
        if (popup.value) {
          popup.value?.close();
        }
        // 调用阶段1回合判分逻辑
        await stage1RoundEnd(data.taskId);
        // 刷新页面状态
        await _round();
      } else {
        console.log('阶段1获取到下一个库的内容，继续显示');
      }
    }
    //  其他阶段：调用_round()重新判断状态
    else {
      console.log('其他阶段，调用_round()重新判断状态');
      _round();
    }
  }
};

const getListInfo = async (
  props?: Partial<{
    warehouseName: string;
    preStepDetailId: number;
    stepId: number;
  }>
) => {
  console.log('[getListInfo] 调用，参数:', props);
  let content: (Four.GetContentDetail.Data & { stepId?: number }) | null;
  // 提取内容库
  // 有库名，通过库名获取
  if (props?.warehouseName) {
    console.log('[getListInfo] 通过库名获取内容:', props.warehouseName);
    content = await getMockContentByLibrary(data.taskId, props.warehouseName);
  } else if (props?.preStepDetailId || props?.stepId) {
    console.log('[getListInfo] 通过preStepDetailId/stepId获取内容');
    content = await getNextChainContent(data.taskId);
  } else {
    // 没有库名，通过模块获取
    console.log('[getListInfo] 通过getCurrentChainContent获取当前步骤内容');
    content = await getCurrentChainContent(data.taskId);
  }
  // 兼容类型：确保 contentList 至少是空数组，避免 TS 可选类型不匹配
  if (content) {
    (content as any).contentList = (content as any).contentList || [];
  }

  console.log('[getListInfo] getCurrentChainContent返回:', content);
  console.log('[getListInfo] contentList长度:', content?.contentList?.length);
  if (Object.keys(content || {})?.length) {
    const _sign = content?.statusVo?.sign || '';
    const hasContent = content?.contentList?.length > 0;
    console.log('内容sign:', _sign, 'statusVo:', content?.statusVo, 'hasContent:', hasContent);

    //  优先判断是否有特殊符号（AZ/Z/AD/D）
    if (content?.statusVo && _sign) {
      console.log('有特殊符号:', _sign);

      if (['Z', 'AZ'].includes(_sign)) {
        // 对话进行中倒计时（Z/AZ）
        data.stepSign = 'z';
        data.cdMsg = '对话进行中倒计时，结束后将补全当前链条并进入下一节点';
        data.detail = {
          ...data.detail,
          endTime: content?.statusVo?.cutDownTime || data?.detail?.endTime,
        };
      } else if (['D', 'AD'].includes(_sign)) {
        // D标记：点击继续
        data.stepSign = 'd';
        data.cdMsg = '点击 D 可以获取下一条内容';
      } else {
        // 其他特殊符号
        console.warn('未知的特殊符号:', _sign);
        data.stepSign = 'normal';
      }

      data.pageInfo = content;
      console.log('getListInfo 成功（特殊符号），stepSign:', data.stepSign, '返回true');
      return true;
    }

    //  其次判断是否有普通内容
    if (hasContent) {
      console.log('[getListInfo] 有普通内容，显示内容列表');
      data.stepSign = 'normal';
      data.cdMsg = '请点击复制按钮复制内容';
      
      // 转换数据结构：处理@分段并添加必要字段
      const transformedContent = {
        ...content,
        contentList: content.contentList.map((node: any, idx: number) => {
          const text = node.text || '';
          const segments = text.split('@');
          const firstSegment = segments[0] || '';
          
          console.log('[getListInfo] 转换节点:', { nodeId: node.id, text, firstSegment, totalSegments: segments.length });
          
          return {
            stepDetailId: `${data.currentRound || 0}_${idx}_0`,
            content: firstSegment,
            segmentIndex: 0,
            type: node.type || 'text',
            totalSegments: segments.length,
            currentSegment: 0,
            _allSegments: segments, // 保存所有分段，供后续使用
            _originalNode: node // 保存原始节点
          };
        })
      };
      
      // 如果只有一个节点，设置currentSegments用于后续@分段处理
      if (content.contentList.length === 1) {
        const firstNode = content.contentList[0];
        const text = firstNode.text || '';
        data.currentSegments = text.split('@');
        data.currentSegmentIndex = 0;
        data.currentChainIndex = 0;
        console.log('[getListInfo] 设置currentSegments用于@分段:', data.currentSegments);
      }
      
      data.pageInfo = transformedContent;
      console.log('[getListInfo] 成功（普通内容），stepSign:', data.stepSign, '返回true');
      return true;
    }

    //  最后：没有内容也没有特殊符号，显示"对方找"按钮
    console.log('没有内容也没有特殊符号，显示对方找按钮');
    data.stepSign = 'lookfor';
    data.cdMsg = '倒计时结束后，对方找按钮将变为可点击';
    data.pageInfo = content;
    console.log('getListInfo 失败，没有内容，返回false');
    return false;
  }
  console.log('getListInfo 失败，content 为空，返回false');
  return false;
};

// 对方主动找处理逻辑
const lookfor = async (props: { isStage?: boolean; warehouseName?: string; notRound?: boolean }) => {
  const bool = await getListInfo({ warehouseName: props?.warehouseName });

  if (bool) {
    //  打开对方找弹窗，并启动倒计时
    popup.value!.open();

    //  启动倒计时（3-50秒）
    startLookforCountdown();
  }
};

// 主动点击按钮
const handleNext = async (type: string) => {
  // 对方找
  if (type === 'lookfor') {
    // 若未到可点击状态，直接返回
    if (!data.canLookfor) {
      return;
    }

    // 防止重复点击
    if (data.loading) {
      console.log('正在处理中，请勿重复点击');
      return;
    }
    data.loading = true;

    // 第0阶段，主动库S1
    if (data.detail.stepType === 'familiar_s4') {
      console.log('第0阶段，点击对方找按钮');

      //  修复：S4阶段不需要检查 endTime
      // endTime 是问3的倒计时，与"对方找"按钮无关
      // "对方找"按钮的倒计时是 otherFindEndTime（对主动等待时间）
      // 只有在用户点击"对方找"按钮后，后台才会设置 otherFindEndTime

      try {
        // 获取对主动库s1的内容并打开弹窗
        await lookfor({ warehouseName: '对主动库s1' });

        //  修改：不在这里调用_addStage
        // 用户需要在弹窗中点击"复制"按钮
        // 复制按钮会调用 handleCopy，handleCopy 中会调用 copyContentDetail
        // copyContentDetail 完成后，会调用 _addStage

        // 所以这里只需要打开弹窗，不需要做其他操作
        console.log('已打开对主动库s1弹窗，等待用户复制');
        data.loading = false;
      } catch (error) {
        console.error('获取对主动库s1失败:', error);
        data.loading = false;
      }
    }
    else if (['familiar_1_cd', 'familiar_1_cd2'].includes(data.detail.stepType)) {
      // 阶段1回合间CD：点击"对方找"后，打开 对主动库S2 弹窗
      try {
        await lookfor({ warehouseName: '对主动库S2' });
      } finally {
        data.loading = false;
      }
    }
    else {
      data.loading = false;
    }
  } else if (type === 'd') {
    // D按钮：用户点击D，程序再给出一条新的内容
    //
    // 根据测试结果，复制普通内容（196）后，stepId没有变化
    // 尝试复制D标记（215）看是否能进入下一步

    console.log('点击D按钮，尝试复制D标记');
    console.log('当前pageInfo:', data.pageInfo);

    const dStepDetailId = data.pageInfo?.statusVo?.stepDetailId;  // 215
    const stepId = data.pageInfo?.stepId;  // 24
    const sign = data.pageInfo?.statusVo?.sign;  // "D"

    if (!dStepDetailId || !stepId) {
      console.error('缺少必要参数:', { dStepDetailId, stepId });
      uni.showToast({ title: '参数错误，无法跳过', icon: 'none' });
      return;
    }

    console.log('复制D标记，stepDetailId:', dStepDetailId);

    // 尝试复制D标记
    const isStop = await copySegment(data.taskId);

    console.log('copyContentDetail返回:', isStop);

    if (!isStop) {
      // 如果返回false，尝试获取下一批内容
      console.log('尝试获取下一批内容，preStepDetailId:', dStepDetailId);
      const hasContent = await getListInfo({
        preStepDetailId: dStepDetailId,  // 215
        stepId: stepId  // 24
      });

      if (!hasContent) {
        console.log('没有更多内容，调用_round()');
        _round();
      } else {
        console.log('成功获取下一批内容');
      }
    } else {
      console.log('copyContentDetail返回true，尝试获取下一个库/内容');
      // 链路结束：优先尝试获取下一个库内容，若无则（阶段1）进行回合判分
          const hasNext = await getListInfo();
          if (!hasNext) {
            await _round();
          }
    }
  } else {
    // Z按钮：进入倒计时
    console.log('点击Z按钮，进入倒计时');
    uni.showModal({ content: '倒计时结束后，将回复新内容', showCancel: false });
  }
};

/**
 * 接口相关
 */

onLoad(async options => {
  const { taskId, module } = options as Record<string, any>;
  data.taskId = taskId;
  data.moduleCodeName = module;
  data.moduleCode = taskModule[module as taskModuleKey];

  // 本地优先：使用 familiar-local 直接读取任务并映射页面所需字段，避免后端请求
  initFamiliarLocal();
  const t = getTask(taskId);
  if (t) {
    const now = Date.now();
    data.taskName = t.name || '';

    // 【关键修复】检查倒计时是否已过期，如果过期则自动执行相应逻辑
    console.log('[onLoad] 检查倒计时是否过期:', {
      stageCdUnlockAt: t.stageCdUnlockAt,
      roundCdUnlockAt: t.roundCdUnlockAt,
      zUnlockAt: t.zUnlockAt,
      opponentFindCdUnlockAt: t.opponentFindCdUnlockAt,
      now
    });

    // 1. 检查对方找CD是否已过期
    if (t.opponentFindCdUnlockAt && now >= ((t.opponentFindCdUnlockAt as number) - 2000)) {
      console.log('[onLoad] 检测到对方找CD已过期，自动执行cdTimeup逻辑');
      await cdTimeup();
      return;
    }

    // 2. 检查阶段CD是否已过期
    if (t.stageCdUnlockAt && now >= ((t.stageCdUnlockAt as number) - 2000)) {
      console.log('[onLoad] 检测到阶段CD已过期，自动执行cdTimeup逻辑');
      await cdTimeup();
      return;
    }

    // 3. 检查回合CD是否已过期
    if (t.roundCdUnlockAt && now >= ((t.roundCdUnlockAt as number) - 2000)) {
      console.log('[onLoad] 检测到回合CD已过期，自动执行cdTimeup逻辑');
      await cdTimeup();
      return;
    }

    // 4. 检查Z倒计时是否已过期
    if (t.zUnlockAt && now >= ((t.zUnlockAt as number) - 2000)) {
      console.log('[onLoad] 检测到Z倒计时已过期，自动执行zTimeup逻辑');
      await zTimeup();
      return;
    }

    // 倒计时未过期，正常初始化页面（将时间戳格式化为字符串，避免 hasItTimeOut 调用出错）
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const toStr = (ts: number | null) => {
      if (!ts) return '';
      const d = new Date(ts as number);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const endTs = (t.zUnlockAt as number) || (t.roundCdUnlockAt as number) || (t.stageCdUnlockAt as number) || (t.opponentFindCdUnlockAt as number) || null;

    data.detail = {
      taskName: t.name,
      stageNum: t.stageIndex,
      roundNum: t.roundIndex || 0,
      stepType: t.dMode ? 'd' : (t.zUnlockAt && now < (t.zUnlockAt as number) ? 'z' : 'stage_round_content'),
      endTime: toStr(endTs as number | null),
      otherFindEndTime: toStr((t.opponentFindUnlockAt as number) || null),
    };
    data.score = t.stageScore || 0;
    // a5a5aaaa aa
    data.canLookfor = true;
    data.opponentFindUnlockAt = t.opponentFindUnlockAt || null;

    if (t.dMode) {
      data.stepSign = 'd';
      data.cdMsg = '点击 D 可以获取下一条内容';
    } else if (t.zUnlockAt && now < (t.zUnlockAt as number)) {
      data.stepSign = 'z';
      data.cdMsg = '对话进行中倒计时，结束后将补全当前链条并进入下一节点';
    } else if (t.opponentFindCdUnlockAt && now < (t.opponentFindCdUnlockAt as number)) {
      // 对方找CD中
      data.stepSign = 'stage_cd';
      data.cdMsg = '对方找CD中...';
      data.currentStep = 'stage_cd';
    } else if (t.roundCdUnlockAt && now < (t.roundCdUnlockAt as number)) {
      data.stepSign = 'lookfor';
      data.cdMsg = '回合CD倒计时中，结束后将自动进入下一回合';
      data.currentStep = 'stage_cd';
    } else if (t.stageCdUnlockAt && now < (t.stageCdUnlockAt as number)) {
      data.stepSign = 'stage_cd';
      data.cdMsg = '阶段间倒计时，结束后进入第1回合';
      data.currentStep = 'stage_cd';
    } else {
      data.stepSign = 'normal';
      data.cdMsg = '请点击复制按钮复制内容';
    }
    // 最小内容列表占位（当前链路可选）
    data.pageInfo = data.pageInfo || { contentList: [], statusVo: {}, closeContent: false };

    // 【修复】重新进入页面时也需要调用 loadTaskData() 来加载内容
    // 确保 stage 对象初始化、currentLibChain 设置、内容加载等逻辑正常执行
    loadTaskData();
    return;
  }

  if (taskId) {
    // 获取任务详情
    const detail = await getTask(taskId);
    console.log('onLoad - 任务详情:', detail);

    // 若后端返回 null，说明任务不存在或步骤未初始化
    if (!detail) {
      console.error('任务详情为空，taskId:', taskId);
      data.detail = null;
      uni.showToast({ title: '任务不存在或未初始化', icon: 'none' });
      return;
    }

    data.detail = detail;

    //  保存任务名称
    data.taskName = detail?.taskName || '';

    // 小倒计时初始可点击态：统一允许点击，复制按钮在弹窗内倒计时控制
    data.canLookfor = true;

    // 
    // 
    //      
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    //  
    // otherFindEndTime 
    data.canLookfor = !detail?.otherFindEndTime || hasItTimeOut(detail.otherFindEndTime);
    // const detail = await stage1(taskId);
    // 熟悉0阶段问卷的提示板s4
    if (['familiar_s4'].includes(detail.stepType)) {
      //  修复：S4阶段需要检查两个倒计时
      // 1. 如果有 otherFindEndTime，说明用户已经点击了"对方找"按钮，检查对方找倒计时
      // 2. 如果没有 otherFindEndTime，说明用户还没点击，检查S4的大CD倒计时

      //  修复：S4阶段直接显示"对方找"按钮，不需要检查 endTime
      // endTime 是问3的倒计时，与"对方找"按钮无关
      console.log('S4阶段，显示对方找按钮');
      console.log('otherFindEndTime:', detail.otherFindEndTime);
      console.log('canLookfor:', data.canLookfor);

      data.stepSign = 'lookfor';

      // 如果有 otherFindEndTime 且未结束，显示倒计时提示
      if (detail.otherFindEndTime && !hasItTimeOut(detail.otherFindEndTime)) {
        data.cdMsg = '倒计时结束后，对方找按钮将变为可点击';
      }
    }

    _round({
      taskId,
    });
  }
});

// 第4阶段：邀约流程
const handleInvitationFlow = async () => {
  console.log('[handleInvitationFlow] 开始邀约流程');

  // 显示内容库S17
  const libs = uni.getStorageSync('fm:libs');
  const s17Chains = libs?.content?.S17 || [];

  if (s17Chains.length > 0) {
    const randomChain = s17Chains[Math.floor(Math.random() * s17Chains.length)];
    const firstNode = randomChain[0];
    const text = firstNode.text || '';

    // 显示S17内容
    uni.showModal({
      title: '邀约内容',
      content: text,
      showCancel: false,
      success: () => {
        // 用户选择邀约结果
        uni.showModal({
          title: '邀约结果',
          content: '请选择邀约结果',
          confirmText: '成功',
          cancelText: '失败',
          success: (res) => {
            const success = res.confirm;
            console.log('[handleInvitationFlow] 邀约结果:', success ? '成功' : '失败');

            const result = handleInvitation(data.taskId, success);

            if (success) {
              // 邀约成功：显示内容库S18
              const s18Chains = libs?.content?.S18 || [];
              if (s18Chains.length > 0) {
                const s18Chain = s18Chains[Math.floor(Math.random() * s18Chains.length)];
                const s18Node = s18Chain[0];
                const s18Text = s18Node.text || '';

                uni.showModal({
                  title: '恭喜',
                  content: s18Text,
                  showCancel: false,
                  success: () => {
                    // 显示Go按钮
                    uni.showModal({
                      title: '温馨提示',
                      content: '请点击Go按钮继续',
                      confirmText: 'Go',
                      showCancel: false,
                      success: () => {
                        // 延时后显示提示板S23
                        setTimeout(() => {
                          uni.showModal({
                            title: '温馨提示',
                            content: '是否继续？',
                            confirmText: '继续',
                            cancelText: '结束任务',
                            success: (res2) => {
                              if (res2.confirm) {
                                // 显示提示板S24
                                uni.showModal({
                                  title: '温馨提示',
                                  content: '请选择下一步操作',
                                  showCancel: false,
                                  success: () => {
                                    uni.showActionSheet({
                                      itemList: ['继续', '结束任务'],
                                      success: (res3) => {
                                        if (res3.tapIndex === 0) {
                                          // 继续：返回提示板S20
                                          _round();
                                        } else {
                                          // 结束任务
                                          finishTask(data.taskId);
                                          uni.showToast({
                                            title: '任务已结束',
                                            icon: 'success',
                                            duration: 2000
                                          });
                                          setTimeout(() => {
                                            uni.navigateBack();
                                          }, 2000);
                                        }
                                      }
                                    });
                                  }
                                });
                              } else {
                                // 结束任务
                                finishTask(data.taskId);
                                uni.showToast({
                                  title: '任务已结束',
                                  icon: 'success',
                                  duration: 2000
                                });
                                setTimeout(() => {
                                  uni.navigateBack();
                                }, 2000);
                              }
                            }
                          });
                        }, 2000);
                      }
                    });
                  }
                });
              }
            } else {
              // 邀约失败：根据失败次数处理
              const task = getTask(data.taskId);
              const attempts = task?.stage4?.invitationAttempts || 0;

              if (attempts <= 2) {
                // 失败1-2次：进入大CD
                const cdMultiplier = attempts === 1 ? 3 : 5;
                uni.showModal({
                  title: '温馨提示',
                  content: `邀约失败，进入${cdMultiplier}×大CD`,
                  showCancel: false,
                  success: () => {
                    data.currentStep = 'stage_cd';
                    data.cdMsg = `邀约失败${attempts}次，${cdMultiplier}×大CD`;
                    _round();
                  }
                });
              } else {
                // 失败>2次：显示提示板S25
                uni.showModal({
                  title: '温馨提示',
                  content: '邀约失败次数过多，请选择',
                  confirmText: '指导',
                  cancelText: '关闭任务',
                  success: (res2) => {
                    if (res2.confirm) {
                      // 指导逻辑（待实现）
                      uni.showToast({
                        title: '指导功能待实现',
                        icon: 'none'
                      });
                    } else {
                      // 关闭任务
                      finishTask(data.taskId);
                      uni.showToast({
                        title: '任务已结束',
                        icon: 'success',
                        duration: 2000
                      });
                      setTimeout(() => {
                        uni.navigateBack();
                      }, 2000);
                    }
                  }
                });
              }
            }
          }
        });
      }
    });
  }
};

// 第4阶段：多聊一次流程
const handleMultiChatFlow = async () => {
  console.log('[handleMultiChatFlow] 开始多聊一次流程');

  const task = getTask(data.taskId);
  if (task?.stage4?.multiChatUsed) {
    uni.showToast({
      title: '多聊一次已使用过',
      icon: 'none'
    });
    return;
  }

  const result = handleMultiChat(data.taskId);

  if (result.ok) {
    uni.showToast({
      title: '返回第三阶段进行一个回合',
      icon: 'success',
      duration: 2000
    });

    setTimeout(async () => {
      // 刷新页面，进入第三阶段
      await _round();
    }, 2000);
  } else {
    uni.showToast({
      title: result.reason || '多聊一次失败',
      icon: 'error'
    });
  }
};

//  页面卸载时清理定时器
onUnmounted(() => {
  stopLookforCountdown();
});

// 统一设置Z倒计时（按持续时长毫秒）
const setZByDuration = (durationMs: number) => {
  const endMs = Date.now() + durationMs;
  // 存绝对时间戳与展示字符串
  // @ts-ignore
  data.zEndTimeMs = endMs;
  // 本地时区格式化 YYYY-MM-DD HH:mm:ss（去毫秒）
  const d = new Date(endMs);
  const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
  // @ts-ignore
  data.zEndTimeStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  data.currentStep = 'z';
  console.log('[round] 设置Z倒计时:', { endMs, endTime: data.zEndTimeStr });
  console.log('[round] Z显示条件(进入Z):', { currentStep: data.currentStep, zEndTimeStr: data.zEndTimeStr });
  // 强制刷新倒计时组件
  nextTick(() => {
    console.log('[round] nextTick刷新Z倒计时组件，time=', data.zEndTimeStr);
  });
};

// 可视条件：Z倒计时显示
const showZCountdown = computed(() => data.currentStep === 'z');
watch(showZCountdown, (val) => {
  console.log('[round] showZCountdown变更:', val, ' currentStep=', data.currentStep, ' time=', data.zEndTimeStr);
});
watch(() => data.currentStep, (val) => {
  console.log('[round] currentStep变更:', val);
});
watch(() => data.zEndTimeStr, (val) => {
  console.log('[round] zEndTimeStr变更:', val);
});

// bc-countdown手动传入初始天/时/分/秒，避免time适配异常导致宽高为0
const zInit = computed(() => {
  const t = data.zEndTimeStr;
  if (!t) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  // 本地原生计算，避免三方解析在微信端异常
  const toLocalMs = (str: string) => {
    const s = str.replace(/-/g, '/');
    return new Date(s).getTime();
  };
  const remain = Math.max(0, toLocalMs(t) - Date.now());
  const totalSec = Math.floor(remain / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  return { days, hours, minutes, seconds };
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);

  .search-wrap {
    width: 100%;
    display: flex;
    align-items: center;

    .wenhao { margin-right: 12rpx; }

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

      &>.input {
        width: 100%;
      }
    }
  }

  .status {
    .circle_status {
      width: 300rpx;
      height: 300rpx;
      border-radius: 50%;
      position: relative;
      font-size: 160rpx;
      font-weight: 600;

      &.status_z {
        position: relative;
        background: #f7df71; /* 黄色主体 */
        color: #111;
        &::before { /* 外圈黑边 + 右下缺口 */
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(#000 0 120deg, transparent 120deg 160deg, #000 160deg 360deg);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
          mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
        }
        &::after { /* 左上高光 */
          content: '';
          position: absolute;
          width: 56%;
          height: 56%;
          top: 16%;
          left: 14%;
          border-radius: 50%;
          background: radial-gradient(circle at 25% 25%, rgba(255,255,255,.95) 0 18%, rgba(255,255,255,.35) 28%, rgba(255,255,255,0) 36%);
          pointer-events: none;
        }
      }

      &.status_d {
        position: relative;
        background: #9BE6C0; /* 绿色主体 */
        color: #111;
        font-size: 160rpx;
        &::before { /* 完整黑色外圈 */
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(#000 0 120deg, transparent 120deg 160deg, #000 160deg 360deg);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
          mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
        }
        &::after { /* 左上高光 */
          content: '';
          position: absolute;
          width: 56%;
          height: 56%;
          top: 16%;
          left: 14%;
          border-radius: 50%;
          background: radial-gradient(circle at 25% 25%, rgba(255,255,255,.95) 0 18%, rgba(255,255,255,.35) 28%, rgba(255,255,255,0) 36%);
          pointer-events: none;
        }
      }

      &.status_lookfor {
        position: relative;
        background: #f7b299; // 
        font-size: 48rpx;
        color: #111;
        border-radius: 50%;
        // 

        // : 
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(#000 0 120deg, transparent 120deg 160deg, #000 160deg 360deg);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
          mask: radial-gradient(farthest-side, transparent calc(100% - 12rpx), #000 0);
          pointer-events: none;
        }

        // 
        &::after {
          content: '';
          position: absolute;
          width: 56%;
          height: 56%;
          top: 14%;
          left: 12%;
          border-radius: 50%;
          background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.95) 0 18%, rgba(255, 255, 255, 0.35) 28%, rgba(255, 255, 255, 0) 36%);
          transform: rotate(-20deg);
          pointer-events: none;
        }

        &.disabeld {
          background: #999999;
          color: #ffffff;
          filter: none;
          opacity: 1;
        }
      }
    }
  }

  .lookfor-bar {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 100rpx;
    text-align: center;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    background: linear-gradient(90deg, #f9753d 0%, #f7b261 100%);
    box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.12);

    &.disabeld {
      background: #cccccc;
      color: #ffffff;
    }
  }

  .btn {
    width: 460rpx;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 16rpx;
    background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9753d 0%, #f8a04f 48.44%, #f7b261 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */
      ,
      radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */
      ,
      radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */
    ;
    color: white;
    font-weight: 600;
    text-align: center;
  }

  //  对方找弹窗倒计时样式
  .countdown-tip {
    padding: 30rpx;
    margin-bottom: 20rpx;
    background: #fff3e0;
    border-radius: 16rpx;
    text-align: center;

    .countdown-text {
      font-size: 28rpx;
      color: #ff6b00;
      margin-bottom: 10rpx;
    }

  .countdown-number {
    font-size: 48rpx;
    font-weight: bold;
    color: #ff6b00;
  }
}

// 第一阶段新增样式
.countdown-info {
  background: #f0f8ff;
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  margin-bottom: 20rpx;
  
  .countdown-text {
    font-size: 28rpx;
    color: #007aff;
    font-weight: 500;
  }
}
}
</style>
