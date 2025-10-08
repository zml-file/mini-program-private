<template>
  <md-page :title="data.taskName || '您咨询'">
    <view class="container">
      <view v-if="data.stepSign" class="search-wrap m-bottom-30">
        <view class="search flex-c m-right-12">
          <input placeholder="请输入对方的问题" class="m-left-20 input" placeholder-style="color: #FC9382;" />
        </view>
        <md-icon name="search_btn" width="76" height="76"></md-icon>
      </view>
      <!-- 状态条：模块/阶段/回合/步骤/积分 -->
      <view class="m-bottom-20" style="font-size: 24rpx; color: #666; line-height: 1.6;">
        <text>模块：{{ data.moduleCodeName || data.moduleCode || '-' }}</text>
        <text class="m-left-12">｜</text>
        <text>阶段：{{ data.detail?.stageNum ?? '-' }}</text>
        <text class="m-left-12">｜</text>
        <text>回合：{{ data.detail?.roundNum ?? '-' }}</text>
        <text class="m-left-12">｜</text>
        <text>步骤：{{ stepLabel }}</text>
        <text class="m-left-12">｜</text>
        <text style="color: #ff6b6b; font-weight: bold;">积分：{{ data.score }}</text>
      </view>

      <!-- 大CD倒计时 -->
      <view class="m-bottom-30" v-if="['lookfor', 'stage_cd'].includes(data.stepSign)">
        <bc-countdown :time="data.detail?.endTime" :desc="data.cdMsg" @timeup="cdTimeup" />
      </view>
      <!-- 问题列表 -->
      <block v-if="['d', 'z', 'normal'].includes(data.stepSign)">
        <bc-copy-list :info="data.pageInfo || {}" @copy="handleCopy" />
      </block>
      <!-- 三个状态圆圈 -->
      <view class="status flex-c m-bottom-30">
        <view class="circle_status status_z flex-c" v-if="data.stepSign === 'z'" @click="() => handleNext('z')">Z</view>
        <view class="circle_status status_d flex-c" v-if="data.stepSign === 'd'" @click="() => handleNext('d')">D</view>
        <view :class="[
          'circle_status',
          'status_lookfor',
          'flex-c',
          { disabeld: !data.canLookfor },
        ]" v-if="data.stepSign === 'lookfor'" @click="() => data.canLookfor && handleNext('lookfor')">
          对方找
        </view>
      </view>
      <!-- D出现 -->
      <!-- 空状态/错误提示 -->
      <view v-if="!data.detail" class="m-bottom-20" style="font-size: 26rpx; color: #999;">
        当前任务没有有效步骤，请稍后重试或联系管理员。
      </view>
      <bc-tip-row v-if="['d', 'z'].includes(data.stepSign)">
        这里是关于{{ data.stepSign?.toLocaleUpperCase() }}这个操作的提示，只有前三次显示。
      </bc-tip-row>
      <!-- 大CD倒计时 -->
      <bc-countdown v-if="['z'].includes(data.stepSign)" :time="data.detail?.endTime" :desc="zCountdownMsg"
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
      <bc-copy-list :info="data.pageInfo || {}" :disabled="!data.canCopyLookfor" @copy="handleCopy" />
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 工具
import { hasItTimeOut } from '@/utils/util';
import {
  closeOverTimeDetailStep,
  copyContentDetail,
  getContentList,
  getContentListOfAppoint,
  getContentListOfStep,
  getRoundIntegral,
  getTaskDetail,
  savePoint,
  addRoundIntegral,
} from '@/utils/api';
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import type { Four, StageEnumType } from '@/api/data';
import stage1RoundEnd from './shuxi/stage1';


const data = reactive<any>({
  taskId: null,
  taskName: '',  // 任务名称
  moduleCodeName: '',
  moduleCode: '',
  detail: {},
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
  isAddingStage: false,

  //  对方找弹窗倒计时相关
  lookforCountdown: 0,        // 倒计时秒数
  lookforCountdownTimer: null as any,  // 倒计时定时器
  canCopyLookfor: false,      // 是否可以复制（倒计时结束后为true）

  //  计分控制（前端主导）
  lookforScored: false,                   // 当前“对方找”弹窗是否已计分
  _leaveScoredForStep: null as null|number, // 离库计分已发生的 stepId

  // 弹窗关闭防抖（防止cancel事件导致重复进入）
  isClosingPopup: false,
});
const popup = ref<any>(null);


// 状态显示：步骤中文名
const stepLabel = computed(() => {
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



/**
 * CD倒计时回调
 */
// Z/AZ 对话进行中倒计时回调：结束后刷新，后端将补全链路并推进
const zTimeup = async () => {
  console.log('Z倒计时结束，继续当前链路');
  // 优先沿用当前链路的 stepId 与上一次的 stepDetailId 拉取下一段
  const lastDetailId = data.pageInfo?.statusVo?.stepDetailId;
  const stepId = data.pageInfo?.stepId;
  if (lastDetailId && stepId) {
    const hasNext = await getListInfo({ preStepDetailId: lastDetailId, stepId });
    if (!hasNext) {
      // 本库链路已结束，先尝试拉取“下一库”内容（例如离库）
      let hasMoreLib = await getListInfo();

      // 兜底：若仍返回 Z/AZ 且无可复制内容，做一次短轮询重拉，避免卡在 AZ 循环
      const isZNoContent = () => {
        const sign = data.pageInfo?.statusVo?.sign;
        const hasContent = (data.pageInfo?.contentList?.length || 0) > 0;
        return (sign === 'Z' || sign === 'AZ') && !hasContent;
      };

      if (hasMoreLib && isZNoContent()) {
        await new Promise((r) => setTimeout(r, 800));
        hasMoreLib = await getListInfo();
        if (hasMoreLib && isZNoContent()) {
          // 再次仍为 Z/AZ 且无内容：主动刷新整体状态，通常此时后端已推进到离库
          await _round();
          return;
        }
      }

      if (!hasMoreLib) {
        // 确认没有下一库时，才进入阶段1回合判分/刷新
        if (data.detail?.stageNum === 1) await stage1RoundEnd(data.taskId);
        await _round();
      }
    }
  } else {
    // 兜底：无法定位链路时，回退到原刷新逻辑
    await _round();
  }
};

// 大CD倒计时回调：结束后刷新，前端主动切换到下一回合
const cdTimeup = async () => {
  console.log('CD倒计时结束，检查当前状态');
  const detail = data.detail;

  // 如果是回合间CD（familiar_1_cd/familiar_1_cd2），前端主动切换到回合内容阶段
  if (['familiar_1_cd', 'familiar_1_cd2'].includes(detail?.stepType)) {
    console.log('回合CD结束，前端主动切换到 stage_round_content');
    await savePoint({
      stepNum: 0,
      stepType: 'stage_round_content',
      taskId: data.taskId,
      stageNum: detail?.stageNum || 1,  //  新增：保持当前阶段
      roundNum: detail?.roundNum || 1   //  新增：保持当前回合（后端已经+1了）
    });
  }

  // 刷新状态
  await _round();

  // 若后端还未来得及切换（仍为阶段CD且时间已过），轻微重试一次
  if (data.detail?.stepType === 'familiar_1_stage_cd' && hasItTimeOut(data.detail?.endTime)) {
    setTimeout(() => _round(), 1500);
  }
};



// 对方找CD倒计时回调
const lookforTimeup = () => {
  // 小倒计时结束，置为可点，触发视图刷新
  data.canLookfor = true;
};





const _round = async (r?: { taskId?: number }) => {
  const _taskId = r?.taskId || data.taskId;

  // 先刷新任务详情，消费后端最新节点
  const detail = await getTaskDetail(_taskId);
  if (detail) {
    data.detail = detail;
    //  更新任务名称
    data.taskName = detail?.taskName || data.taskName || '';
    // 更新“对方找按钮是否可点击”
    data.canLookfor = !detail?.otherFindEndTime || hasItTimeOut(detail.otherFindEndTime);
  }

  const scoreInfo = await getRoundIntegral(_taskId);
  const stageNum = data.detail?.stageNum; // 当前阶段
  const score = scoreInfo?.integral ?? 0; // 当前阶段的分数
  const roundNum = data.detail?.roundNum ?? 0; // 当前阶段的回合数
  const stepType = data.detail?.stepType;

  //  保存积分到 data 中，用于页面显示
  data.score = score;

  console.log('_round 调试信息:', { stageNum, score, roundNum, stepType });

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
      // 阶段间大CD（进入阶段1后到第1回合前），不提供“对方找”
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

    // 第一回合：roundNum == 0 或 roundNum == 1
    if (roundNum <= 1) {
      // 如果是 stage_round_content，说明需要获取内容（开库→内容库→离库）
      if (stepType === 'stage_round_content') {
        console.log('第2阶段第一回合，stepType=stage_round_content，获取内容');
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
        }
      }
      // 其他情况，尝试获取内容
      else {
        console.log('第2阶段第一回合，未知stepType，尝试获取内容');
        await getListInfo();
      }
    }
    // 第二回合及后续回合
    else {
      // 根据积分判断是否进入下一阶段或特殊回合
      // TODO: 这里需要根据需求文档实现完整的第2阶段逻辑
      if (['familiar_1_cd', 'familiar_1_cd2', 'familiar_2_cd'].includes(stepType)) {
        // 先尝试获取内容
        const hasContent = await getListInfo();
        if (!hasContent) {
          data.stepSign = 'lookfor';
        }
      } else if (stepType === 'stage_round_content') {
        await getListInfo();
      } else {
        console.log('第2阶段第', roundNum, '回合，未知stepType，尝试获取内容');
        await getListInfo();
      }
    }
  }

  // 第三阶段
  if (stageNum == 3) {
    console.log('第3阶段，roundNum:', roundNum, 'stepType:', stepType);
    // 根据 stepType 判断当前状态
    if (['familiar_3_cd'].includes(stepType)) {
      // CD 阶段，显示"对方找"按钮
      data.stepSign = 'lookfor';
    } else if (stepType === 'stage_round_content') {
      // 回合内容阶段，获取列表信息
      await getListInfo();
    } else {
      // 默认处理：尝试获取列表信息
      console.log('第3阶段未知的 stepType，尝试获取列表信息:', stepType);
      await getListInfo();
    }
  }

  // 第四阶段
  if (stageNum >= 4) {
    console.log('第4阶段及以上，stepType:', stepType);
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

  //  关闭弹窗时重置“对方找”计分标记
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

// 点击复制按钮
const handleCopy = async (
  r: Four.GetContentDetail.ContentList &
    Omit<Four.GetContentDetail.StatusVo, 'stepDetailId'> & {
      preStepDetailId: number;
    }
) => {
  console.log('handleCopy 参数:', r);

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

  //  计分（前端主导）：在复制动作入口处即刻结算，做到“即时可见”
  if (data.stepSign === 'lookfor' && !data.lookforScored) {
    // 对方找：首次复制即 +1
    await addRoundIntegral({ taskId: data.taskId, integralNum: 1 });
    data.lookforScored = true;
    data.score = (data.score || 0) + 1;
    uni.showToast({ title: '积分 +1', icon: 'success', duration: 1200 });
  }
  if (data.pageInfo?.closeContent && data._leaveScoredForStep !== data.pageInfo?.stepId) {
    // 离库：该 stepId 首次复制 +1
    await addRoundIntegral({ taskId: data.taskId, integralNum: 1 });
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
    // 否则：这是“最后一段”，应立刻请求获取下一条/下一库
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
  console.log('getListInfo 调用，参数:', props);
  let content: (Four.GetContentDetail.Data & { stepId?: number }) | null;
  // 提取内容库
  // 有库名，通过库名获取
  if (props?.warehouseName) {
    console.log('通过库名获取内容:', props.warehouseName);
    content = (await getContentListOfAppoint({
      taskId: data.taskId,
      warehouseName: props.warehouseName,
      moduleCode: data.moduleCode,
    })) as any;
  } else if (props?.preStepDetailId || props?.stepId) {
    console.log('通过preStepDetailId/stepId获取内容');
    content = await getContentList({
      preStepDetailId: props.preStepDetailId,
      taskId: data.taskId,
      stepId: props.stepId,
      moduleCode: data.moduleCode,
    });
  } else {
    // 没有库名，通过模块获取
    console.log('通过getStep获取当前步骤，然后获取内容');
    content = (await getContentListOfStep({
      taskId: data.taskId,
      moduleCode: data.moduleCode,
    })) as any;
  }
  // 兼容类型：确保 contentList 至少是空数组，避免 TS 可选类型不匹配
  if (content) {
    (content as any).contentList = (content as any).contentList || [];
  }

  console.log('getListInfo 返回的内容:', content);
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
      console.log('有普通内容，显示内容列表');
      data.stepSign = 'normal';
      data.cdMsg = '请点击复制按钮复制内容';
      data.pageInfo = content;
      console.log('getListInfo 成功（普通内容），stepSign:', data.stepSign, '返回true');
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
      // 阶段1回合间CD：点击“对方找”后，打开 对主动库S2 弹窗
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
    const isStop = await copyContentDetail({
      taskId: data.taskId,
      stepDetailId: dStepDetailId,  // 215
      sign: sign || 'D',
      moduleCode: data.moduleCode,
      stepId: stepId,  // 24
      source: data.pageInfo?.closeContent ? 'leave' : 'content',
    });

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
        if (data.detail?.stageNum === 1) {
          console.log('阶段1当前库结束且无更多内容，进行回合判分');
          await stage1RoundEnd(data.taskId);
        }
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

  if (taskId) {
    // 获取任务详情
    const detail = await getTaskDetail(taskId);
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

    // 小倒计时初始可点击态：若无倒计时或已超时即可点击
    data.canLookfor = !detail?.otherFindEndTime || hasItTimeOut(detail.otherFindEndTime);

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

//  页面卸载时清理定时器
onUnmounted(() => {
  stopLookforCountdown();
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

    .search {
      border-radius: 100rpx;
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
      angle: -180 deg;
      backdrop-filter: blur(128rpx);
      font-size: 160rpx;
      font-weight: 600;

      &.status_z {
        background: #f7df71;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #ffd206 inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #ffd3070f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #fccf0324;
        box-shadow: 0 3.2rpx 6.4rpx 0 #fcd0080a inset;
      }

      &.status_d {
        background: #a0bf52;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #b0f20b inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #b4f1190f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #aced0a24;
        box-shadow: 0 3.2rpx 6.4rpx 0 #b6fc080a inset;
      }

      &.status_lookfor {
        background: #eecace;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #eb4c60 inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #ff11110f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #f42e1324;
        box-shadow: 0 3.2rpx 6.4rpx 0 #f087870a inset;
        font-size: 48rpx;

        &.disabeld {
          background: #888888;
          color: white;
        }
      }
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
    weight: 600;
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
}
</style>
