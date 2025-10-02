<template>
  <md-page title="您咨询">
    <view class="container">
      <view v-if="data.stepSign" class="search-wrap m-bottom-30">
        <view class="search flex-c m-right-12">
          <input placeholder="请输入对方的问题" class="m-left-20 input" placeholder-style="color: #FC9382;" />
        </view>
        <md-icon name="search_btn" width="76" height="76"></md-icon>
      </view>
      <!-- 大CD倒计时 -->
      <view class="m-bottom-30" v-if="data.stepSign === 'lookfor'">
        <bc-countdown :time="data.detail?.endTime" :desc="data.cdMsg" @timeup="cdTimeup" />
      </view>
      <!-- 问题列表 -->
      <block v-if="['d', 'z'].includes(data.stepSign)">
        <bc-copy-list :info="data.pageInfo || {}" @copy="handleCopy" />
      </block>
      <!-- 三个状态圆圈 -->
      <view class="status flex-c m-bottom-30">
        <view class="circle_status status_z flex-c" v-if="data.stepSign === 'z'" @click="() => handleNext('z')">Z</view>
        <view class="circle_status status_d flex-c" v-if="data.stepSign === 'd'" @click="() => handleNext('d')">D</view>
        <view
          :class="[
            'circle_status',
            'status_lookfor',
            'flex-c',
            { disabeld: !data.canLookfor },
          ]"
          v-if="data.stepSign === 'lookfor'"
          @click="() => data.canLookfor && handleNext('lookfor')">
          对方找
        </view>
      </view>
      <!-- D出现 -->
      <bc-tip-row v-if="['d', 'z'].includes(data.stepSign)">
        这里是关于{{ data.stepSign?.toLocaleUpperCase() }}这个操作的提示，只有前三次显示。
      </bc-tip-row>
      <!-- 大CD倒计时 -->
      <bc-countdown v-if="['z'].includes(data.stepSign)" :time="data.detail?.endTime" :desc="data.cdMsg" />
      <!-- 对方找倒计时 -->
      <bc-countdown
        v-if="data.stepSign === 'lookfor'"
        size="small"
        :time="data.detail?.otherFindEndTime"
        desc="倒计时结束后，对方找按钮将变为可点击"
        @timeup="lookforTimeup" />
    </view>
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @cancel="handleClose" title="请选择对方找的回复内容" :width="730" hideOk cancelText="关闭">
      <bc-copy-list :info="data.pageInfo || {}" @copy="handleCopy" />
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 工具
import { hasItTimeOut } from '@/utils/util';
import {
  addRound,
  addRoundIntegral,
  addStage,
  closeOverTimeDetailStep,
  copyContentDetail,
  getContentList,
  getContentListOfAppoint,
  getContentListOfStep,
  getRoundIntegral,
  getTaskDetail,
  savePoint,
} from '@/utils/api';
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import type { Four, StageEnumType } from '@/api/data';
import stage1 from './shuxi/stage1';

const data = reactive<any>({
  taskId: null,
  moduleCodeName: '',
  moduleCode: '',
  detail: {},
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
});
const popup = ref<any>(null);

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
    await new Promise<void>((resolve, reject) => {
      closeOverTimeDetailStep({ specialStepId: data.detail?.specialStepId ?? 0 }, () => {
        console.log('closeOverTimeDetailStep 完成');
        resolve();
      });
    });

    // 阶段+1
    await new Promise<void>((resolve, reject) => {
      addStage(taskId, () => {
        console.log('addStage 完成，阶段已+1');
        resolve();
      });
    });

    // 根据文档要求：每个阶段进入下一阶段时需要经过一个阶段间的大CD
    // 保存阶段间大CD节点
    await new Promise<void>((resolve, reject) => {
      savePoint(
        {
          stepNum: nextStageNum,
          stepType: `familiar_${nextStageNum}_stage_cd`,  // 阶段间大CD
          taskId,
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

const _addRound = () => {
  const taskId = data.taskId;
  closeOverTimeDetailStep({ specialStepId: data.detail?.specialStepId ?? 0 }, () => {
    // 回合数+1
    addRound(taskId, () => {
      savePoint(
        {
          stepNum: 0,
          stepType: 'stage_round_content',
          taskId,
        },
        () => {
          getListInfo();
        }
      );
    });
  });
};

/**
 * CD倒计时回调
 */
// 大CD倒计时回调
const cdTimeup = () => {
  _addRound();
};

// 回合CD
const roundTimeup = async () => {
  stage1(data.taskId, { finish: true });
};

// 对方找CD倒计时回调
const lookforTimeup = () => {
  // 小倒计时结束，置为可点，触发视图刷新
  data.canLookfor = true;
};

// 获取任务详情
const _getDetail = async () => {
  // 获取任务详情
  const detail = await getTaskDetail(data.taskId);
  data.detail = detail;
};

// 熟悉1阶段，大cd1 / cd2
const runCd = async (type: StageEnumType) => {
  if (data.detail.stepType === type) {
    data.stepSign = 'lookfor';
  } else {
    savePoint(
      {
        stepNum: 0,
        stepType: type,
        taskId: data.taskId,
      },
      () => {
        _getDetail();
        data.stepSign = 'lookfor';
      }
    );
  }
};

const _round = async (r?: { taskId?: number }) => {
  const _taskId = r?.taskId || data.taskId;
  const scoreInfo = await getRoundIntegral(_taskId);
  const stageNum = data.detail.stageNum; // 当前阶段
  const score = scoreInfo?.integral ?? 0; // 当前阶段的分数
  const roundNum = data.detail?.roundNum ?? 0; // 当前阶段的回合数
  const stepType = data.detail.stepType;

  console.log('_round 调试信息:', { stageNum, score, roundNum, stepType });

  // 第零阶段
  if (stageNum == 0) {
    // 第0阶段逻辑（问卷阶段）
    console.log('第0阶段，等待问卷完成');
  }

  // 第一阶段
  if (stageNum == 1) {
    // 初始阶段
    if (roundNum == 0 && stepType === 'stage_round_content') {
      await getListInfo();
    } else {
      // 分数 >= 2
      if (score >= 2) {
        if (roundNum >= 4) {
          // await getListInfo();
          savePoint(
            {
              stepNum: 0,
              stepType: 'familiar_1_stage_cd',
              taskId: _taskId,
            },
            async () => {
              // 获取任务详情
              const detail = await getTaskDetail(_taskId);
              data.detail = detail;
            }
          );
        } else {
          // await getListInfo({ preStepDetailId: r.stepDetailId });
          runCd('familiar_1_cd');
        }
      } else {
        if (roundNum < 3) {
          runCd('familiar_1_cd');
        } else {
          runCd('familiar_1_cd2');
        }
      }
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
const handleClose = () => {
  // popup.value!.close();
};

// 点击复制按钮
const handleCopy = async (
  r: Four.GetContentDetail.ContentList &
    Omit<Four.GetContentDetail.StatusVo, 'stepDetailId'> & {
      preStepDetailId: number;
    }
) => {
  console.log('handleCopy 参数:', r);
  // if (r.content?.split('@')?.length > 1) {
  //   data.pageInfo.contentList?.forEach(
  //     (s: { stepDetailId: number; content: string }) => {
  //       if (s.stepDetailId === r.stepDetailId) {
  //         s.content = r.content?.split('@')[1];
  //       }
  //     }
  //   );
  // }
  // 离开库处理 | 对方主动找处理
  if (!!data.pageInfo?.closeContent || data.stepSign == 'lookfor') {
    // 分数+1
    const bool = await addRoundIntegral({
      taskId: data.taskId,
      integralNum: 1,
    });

    if (!bool) {
      return;
    }
  }

  // ✅ 修复：检查是否是D标记
  // D标记的content为"D"，不应该被复制
  if (r.content === 'D' || r.content === 'AD') {
    console.log('检测到D/AD标记，不复制，直接处理');

    // ✅ 特殊处理：第0阶段的"对主动库s1"，D标记表示内容已全部复制完毕
    if (data.detail.stepType === 'familiar_s4' && data.detail.stageNum === 0) {
      console.log('第0阶段对主动库s1，D标记表示内容已全部复制完毕，准备进入第1阶段');
      // 关闭弹窗
      popup.value?.close();
      // 进入第1阶段
      await _addStage(data.taskId, 1);
    } else {
      // 其他情况，调用_round()重新判断状态
      _round();
    }
    return;
  }

  // 复制内容详情
  // r.stepDetailId 是当前要复制的内容详情ID（来自 contentList）
  // r.preStepDetailId 是上一个步骤的ID（来自 statusVo.stepDetailId）
  const isStop = await copyContentDetail({
    taskId: data.taskId,
    stepDetailId: r.stepDetailId,  // 修复：使用当前内容的 stepDetailId
    sign: r.sign,
    moduleCode: data.moduleCode,
    stepId: data.pageInfo?.stepId,
  });

  if (!isStop) {
    // 继续获取下一个内容，使用当前的 stepDetailId 作为 preStepDetailId
    getListInfo({ preStepDetailId: r.stepDetailId });
  } else {
    // ✅ 特殊处理：第0阶段的"对主动库s1"复制后，进入第1阶段
    if (data.detail.stepType === 'familiar_s4' && data.detail.stageNum === 0) {
      console.log('第0阶段对主动库s1复制完成，准备进入第1阶段');
      // 关闭弹窗
      popup.value?.close();
      // 进入第1阶段
      await _addStage(data.taskId, 1);
    } else {
      // 其他情况，调用_round()重新判断状态
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
    content = await getContentListOfAppoint({
      taskId: data.taskId,
      warehouseName: props.warehouseName,
      moduleCode: data.moduleCode,
    });
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
    content = await getContentListOfStep({
      taskId: data.taskId,
      moduleCode: data.moduleCode,
    });
  }
  console.log('getListInfo 返回的内容:', content);
  if (Object.keys(content || {})?.length) {
    const _sgin = content?.statusVo?.sign || '';
    console.log('内容sign:', _sgin, 'statusVo:', content?.statusVo);

    // 如果 statusVo 为 null，说明后端没有返回状态信息
    // 这种情况下，默认显示内容列表，不设置特殊的 stepSign
    if (!content?.statusVo) {
      console.warn('警告：statusVo 为 null，无法判断sign类型');
      data.stepSign = 'normal';  // 设置为普通模式
    } else if (['Z', 'AZ'].includes(_sgin)) {
      data.stepSign = 'z';
    } else if (['D', 'AD'].includes(_sgin)) {
      data.stepSign = 'd';
    } else {
      data.stepSign = 'lookfor';
    }

    data.pageInfo = content;
    data.detail = {
      ...data.detail,
      endTime: content?.statusVo?.cutDownTime || data?.detail?.endTime,
    };
    console.log('getListInfo 成功，stepSign:', data.stepSign, '返回true');
    return true;
  }
  console.log('getListInfo 失败，没有内容，返回false');
  return false;
};

// 对方主动找处理逻辑
const lookfor = async (props: { isStage?: boolean; warehouseName?: string; notRound?: boolean }) => {
  const bool = await getListInfo({ warehouseName: props?.warehouseName });

  if (bool) {
    // 直接打开对方找弹窗，无需倒计时
    popup.value!.open();
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

      // ✅ 修复：S4阶段不需要检查 endTime
      // endTime 是问3的倒计时，与"对方找"按钮无关
      // "对方找"按钮的倒计时是 otherFindEndTime（对主动等待时间）
      // 只有在用户点击"对方找"按钮后，后台才会设置 otherFindEndTime

      try {
        // 获取对主动库s1的内容并打开弹窗
        await lookfor({ warehouseName: '对主动库s1' });

        // ✅ 修改：不在这里调用_addStage
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
      try {
        await lookfor({ warehouseName: '主动库S2' });
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
      console.log('copyContentDetail返回true，调用_round()');
      _round();
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
    data.detail = detail;
    console.log('onLoad - 任务详情:', detail);

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
      // ✅ 修复：S4阶段需要检查两个倒计时
      // 1. 如果有 otherFindEndTime，说明用户已经点击了"对方找"按钮，检查对方找倒计时
      // 2. 如果没有 otherFindEndTime，说明用户还没点击，检查S4的大CD倒计时

      // ✅ 修复：S4阶段直接显示"对方找"按钮，不需要检查 endTime
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
      & > .input {
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
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
    color: white;
    weight: 600;
    text-align: center;
  }
}
</style>
