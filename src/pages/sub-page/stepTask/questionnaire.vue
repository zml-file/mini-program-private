<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <y-tabs
        sticky
        type="custom"
        :scrollThreshold="3"
        :offsetTop="[88]"
        v-model="data.activeIndex"
        :color="' '"
        :style="{ height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight}))` }"
        title-active-color="#333"
        title-inactive-color="#777"
        scrollspy>
        <y-tab v-for="tab in data.tabs" :title="tab.label" :key="tab.key">
          <view class="content m-top-30">
            <bc-qa-list
              :data="getDataBy2D(data.list, tab.key)"
              :submitList="data.submitList[tab.key]?.moduleUserQuestionList" />
          </view>
        </y-tab>
      </y-tabs>
    </view>
    <bc-bottom-bar
      showRecharge
      rightBtn
      rechargeUrl="/pages/task-purchase/index?from=questionnaire&module=熟悉模块"
      @ok="hanldeSubmit"
      @back="handleBack" />
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk">
      <view v-if="modelType === 'submit'">您已完成了所有问卷内容的填写，请确认是否提交</view>
      <view v-else>您未完成问卷填写，请确认是否要返回</view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import { initFamiliarLocal, getTask, saveQuestionnaireAnswer, submitQuestionnaire } from '@/utils/familiar-local';
import { getCountdownTimeMs } from '@/config';
import type { Task } from '@/api/data';
// 工具
import { getDataBy2D } from '@/utils/util';
import { ensureQuestionnaireMock } from '@/utils/fm-questionnaire-mock';
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
// 字典
import { shuxiModule } from './shuxi/stage0';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  list: [],
  submitList: [],
  tabs: [],
  activeIndex: 0, // 标签页当前选择项的下标
  loading: false, // 加载状态
});

const popup = ref<any>(null);
const modelType = ref('submit');

const handleBack = () => {
  modelType.value = 'back';
  popup.value!.open();
};

const hanldeSubmit = async () => {
  if (data.loading) return; // 防止重复点击

  //  校验：检查所有问题是否都已填写
  let allAnswered = true;
  let unansweredQuestions: string[] = [];

  data.submitList?.forEach((stage: { moduleUserQuestionList: any[] }, stageIndex: number) => {
    stage.moduleUserQuestionList?.forEach((question: any, questionIndex: number) => {
      // 获取对应的问题信息
      const questionInfo = data.list[stageIndex]?.questionVoList?.[questionIndex];

      if (!questionInfo) return;

      // 检查是否已填写
      let isAnswered = false;

      if (questionInfo.type === 1) {
        // 单选题：检查 optionId 是否有值
        isAnswered = question.optionId !== undefined && question.optionId !== null && question.optionId !== '';
      } else {
        // 问答题（类型2/3/4）：检查 userSubmitContent 是否有值
        isAnswered = question.userSubmitContent && question.userSubmitContent.trim() !== '';
      }

      if (!isAnswered) {
        allAnswered = false;
        unansweredQuestions.push(`${data.tabs[stageIndex]?.label || '阶段' + (stageIndex + 1)} - ${questionInfo.title}`);
      }
    });
  });

  if (!allAnswered) {
    console.log('未完成的问题:', unansweredQuestions);
    uni.showToast({
      title: `请完成所有问题后再提交（还有${unansweredQuestions.length}个问题未填写）`,
      icon: 'none',
      duration: 3000
    });
    return;
  }

  modelType.value = 'submit';
  popup.value!.open();
};

const handleOk = () => {
  if (data.loading) return; // 防止重复点击
  if (modelType.value === 'submit') {
    let moduleUserQuestionList: any[] = [];
    data.submitList?.forEach((item: { moduleUserQuestionList: any[] }) => {
      moduleUserQuestionList = moduleUserQuestionList.concat(item.moduleUserQuestionList);
    });
    submitQuestion({
      taskId: data.prevPageQuery?.taskId,
      moduleUserQuestionList,
    });
  } else {
    // 返回
    uni.navigateBack();
  }
};

/**
 * 接口相关
 */
const fetchModuleQuestionList = async () => {
  uni.showLoading({ title: '加载中...', mask: true });
  try {
    // 使用本地apiMock，保持结构与后端完全一致
    initFamiliarLocal();
    const libs = uni.getStorageSync('fm:libs') || {};
    const apiMock = libs?.questionnaire?.apiMock || [];
    console.log('[Questionnaire] libs.questionnaire.apiMock exists:', !!libs?.questionnaire?.apiMock, 'length:', Array.isArray(apiMock) ? apiMock.length : -1);
    const resData = Array.isArray(apiMock) ? apiMock : [];
    console.log('[Questionnaire] resData length:', Array.isArray(resData) ? resData.length : -1, 'sample:', Array.isArray(resData) && resData[0]);

    data.tabs = resData.map((item: any, index: number) => ({ label: item.stageName, key: index }));
    data.list = resData.map((wrap: any) => ({
      ...wrap,
      questionVoList: (wrap.questionVoList || []).map((item: any) => ({
        id: item.questionId,
        title: `问题.${item.questionNum}`,
        content: item.questionTitle,
        checkboxList: item.optionContentList, // 与后端一致：[{id, optionContent, optionIntegral}]
        type: item.questionType,
      })),
    }));
    data.submitList = resData.map((wrap: any) => ({
      moduleUserQuestionList: (wrap.questionVoList || []).map((q: any) => ({
        questionId: q.questionId,
        optionId: undefined,                 // 单选题用 optionId
        userSubmitContent: q.questionType == 1 ? undefined : '', // 问答题预留
      })),
    }));
    console.log('[Questionnaire] tabs:', data.tabs, 'list[0]?.questionVoList length:', data.list?.[0]?.questionVoList?.length, 'submit stage0 length:', data.submitList?.[0]?.moduleUserQuestionList?.length);

    // 回填已答选项（刷新不丢失）
    const t = getTask(data.prevPageQuery?.taskId);
    const answered = t?.questionnaire?.answers || [];
    const stage0 = data.submitList?.[0]?.moduleUserQuestionList || [];
    answered.forEach((a: any) => {
      const found = stage0.find((q: any) => String(q.questionId) === String(a.questionId));
      if (found) found.optionId = a.optionId;
    });
  } finally {
    uni.hideLoading();
  }
};

// 问1/问2/问3交互流程（使用真实用户交互）
const runAskFlow = async (taskId: string, scoreGreaterThanX: boolean): Promise<void> => {
  console.log('[runAskFlow] 开始问1/问2/问3流程，taskId:', taskId, 'scoreGreaterThanX:', scoreGreaterThanX);
  
  // 问1
  const ask1 = await showQuestion('问1');
  console.log('[runAskFlow] 问1选择:', ask1);
  
  if (ask1 === '否') {
    // 显示提示板S1
    await showTipsBoard('S1', taskId);
    // 重新选择问1
    return runAskFlow(taskId, scoreGreaterThanX);
  }
  
  // 如果得分<X，问1选择"是"后分流到其他模块
  if (!scoreGreaterThanX) {
    console.log('[runAskFlow] 得分<X，分流到不熟模块');
    uni.showToast({ title: '将进入不熟模块', icon: 'none', duration: 2000 });
    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
    return;
  }
  
  // 问2
  const ask2 = await showQuestion('问2');
  console.log('[runAskFlow] 问2选择:', ask2);
  
  if (ask2 === '否') {
    // 显示提示板S3
    await showTipsBoard('S3', taskId);
    // 重新选择问2
    return runAskFlow(taskId, scoreGreaterThanX);
  }
  
  // 显示提示板S2，并设置9-10天倒计时
  await showTipsBoard('S2', taskId);
  const days1 = Math.floor(9 + Math.random() * 2); // 9-10天
  const unlockAt1 = Date.now() + getCountdownTimeMs(days1 * 24 * 60 * 60 * 1000);
  const t1 = getTask(taskId);
  if (t1) {
    t1.listBadge = '下次聊天开启倒计时';
    t1.listCountdownEndAt = unlockAt1;
    t1.stageCdUnlockAt = unlockAt1;
    uni.setStorageSync(`fm:task:${taskId}`, t1);
  }
  console.log('[runAskFlow] S2倒计时设置:', days1, '天，结束时间:', new Date(unlockAt1).toLocaleString());
  
  // 提示用户倒计时已设置，并返回列表
  uni.showToast({ 
    title: `已设置${days1}天倒计时，请等待倒计时结束后继续`, 
    icon: 'none', 
    duration: 3000 
  });
  
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
  }, 3000);
  
  // 注意：问3需要在倒计时结束后在列表页触发
};

// 显示问题对话框
const showQuestion = (questionType: '问1' | '问2' | '问3'): Promise<'是' | '否'> => {
  return new Promise((resolve) => {
    let content = '';
    if (questionType === '问1') {
      content = '有对方微信或其他线上可交流方式吗？';
    } else if (questionType === '问2') {
      content = '需要让对方见不到您20天左右。其中前10天左右什么也不用做，后10天左右请根据之后指引操作，确定可以开始并准备好之后请选"是"（即是否准备好）';
    } else if (questionType === '问3') {
      content = '请确定完成第一阶段，即倒计时结束前未与对方见面或主动联系，是或否？';
    }
    
    uni.showModal({
      title: '温馨提示',
      content,
      confirmText: '是',
      cancelText: '否',
      success: (res) => {
        resolve(res.confirm ? '是' : '否');
      }
    });
  });
};

// 显示提示板
const showTipsBoard = (tipsType: 'S1' | 'S2' | 'S3' | 'S4', taskId: string): Promise<void> => {
  return new Promise((resolve) => {
    let content = '';
    if (tipsType === 'S1') {
      content = '建议您先获取对方的联系方式后再继续';
    } else if (tipsType === 'S2') {
      content = '请保持耐心，接下来将进入9-10天的等待期';
    } else if (tipsType === 'S3') {
      content = '请您做好准备后再开始';
    } else if (tipsType === 'S4') {
      content = '很好！接下来将进入正式阶段，请继续保持';
    }
    
    // 保存提示板状态
    const t = getTask(taskId);
    if (t) {
      t.prompts = { ...(t.prompts || {}), [tipsType]: { shown: true, at: Date.now() } };
      uni.setStorageSync(`fm:task:${taskId}`, t);
    }
    
    uni.showModal({
      title: '温馨提示',
      content,
      showCancel: false,
      confirmText: '确定',
      success: () => {
        resolve();
      }
    });
  });
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  data.loading = true;
  uni.showLoading({ title: '提交中...', mask: true });
  try {
    // 本地保存所有单选题的答案
    initFamiliarLocal();
    const taskId = data.prevPageQuery?.taskId;
    const stage0 = data.submitList?.[0]?.moduleUserQuestionList || [];
    stage0.forEach((q: any) => {
      if (q.optionId !== undefined && q.optionId !== null && q.optionId !== '') {
        saveQuestionnaireAnswer(taskId, String(q.questionId), String(q.optionId));
      }
    });

    // 本地评分与路由（熟悉模块.md一致）
    // 1) 读取题库 apiMock（与后端一致）
    const libs = uni.getStorageSync('fm:libs') || {};
    const apiMock = libs?.questionnaire?.apiMock || [];
    const resData = Array.isArray(apiMock) ? apiMock : [];
    // 2) 累计分数：根据用户选择的 optionId 找到对应 optionIntegral
    let totalScore = 0;
    const stage0Submit = data.submitList?.[0]?.moduleUserQuestionList || [];
    const stage0Questions = resData?.[0]?.questionVoList || [];
    stage0Submit.forEach((q: any) => {
      const qInfo = stage0Questions.find((x: any) => String(x.questionId) === String(q.questionId));
      if (!qInfo) return;
      const opt = (qInfo.optionContentList || []).find((o: any) => String(o.id) === String(q.optionId));
      const s = opt ? Number(opt.optionIntegral || 0) : 0;
      totalScore += s;
    });
    // 3) 阈值判断：取 familiar-local 的settings.stageThresholdX["0"]（默认10）
    const settings = uni.getStorageSync('fm:settings') || {};
    const thresholdX = (settings?.stageThresholdX && Number(settings.stageThresholdX["0"])) || 10;
    const routed = totalScore >= thresholdX ? 'familiar' : 'stranger';
    // 4) 持久化到任务对象 + 日志
    const tSnap = getTask(taskId);
    if (tSnap) {
      tSnap.questionnaire = {
        ...(tSnap.questionnaire || {}),
        totalScore,
        routedModule: routed
      };
      uni.setStorageSync(`fm:task:${taskId}`, tSnap);
    }
    console.log('[Questionnaire][评分日志] totalScore:', totalScore, 'thresholdX:', thresholdX, 'routed:', routed);
    console.log('[Questionnaire][评分细节] submit:', stage0Submit, 'questions:', stage0Questions);

    // 关闭弹窗与loading
    popup.value!.close();
    uni.hideLoading();
    data.loading = false;

    // 执行真实的问1/问2/问3交互流程
    if (data.prevPageQuery.module === '熟悉模块') {
      console.log('[Questionnaire][链路] 开始问1/问2/问3交互流程，得分:', totalScore, '阈值:', thresholdX);
      const scoreGreaterThanX = totalScore >= thresholdX;
      
      // 初始化任务状态
      const t = getTask(taskId);
      if (t) {
        t.stageIndex = 0; 
        t.roundIndex = null; 
        t.stepIndex = 0;
        t.askFlow = { ...(t.askFlow || {}) };
        t.prompts = { ...(t.prompts || {}) };
        uni.setStorageSync(`fm:task:${taskId}`, t);
      }
      
      // 调用真实的问1/问2/问3流程
      runAskFlow(taskId, scoreGreaterThanX);
    } else {
      // 其他模块直接返回
      uni.showToast({ title: '问卷提交成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  } catch (error) {
    data.loading = false;
    uni.hideLoading();
  }
};

onLoad(option => {
  // 处理从路由带过来的中文被 URL 编码（%E6%B5%8B...）的问题
  const q = option as Record<string, any>;
  const decode = (v: any) => {
    if (typeof v !== 'string') return v;
    try { return decodeURIComponent(v); } catch { return v; }
  };
  data.prevPageQuery = {
    ...q,
    taskName: decode(q?.taskName),
    module: decode(q?.module),
  };

  // 本地初始化与恢复阶段0
  initFamiliarLocal();
  ensureQuestionnaireMock(); // 确保问卷本地题库已注入
  const taskId = data.prevPageQuery?.taskId;
  const t = getTask(taskId);
  if (t) {
    t.stageIndex = 0; t.roundIndex = null; t.stepIndex = 0;
    uni.setStorageSync(`fm:task:${taskId}`, t);
  }

  fetchModuleQuestionList();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx 30rpx calc(30rpx + $safe-bottom + 48px);
}

::v-deep .y-tabs {
  &.is-areaScroll.is-scrollNav {
    height: 100%;
  }

  .y-tabs__wrap {
    width: 100%;
    height: 84rpx;
    padding: 8rpx;
    box-sizing: border-box;
    position: sticky;
    background: #ECF1FF;
    border: 1px;
    border-radius: 24rpx;
  }

  .y-tabs__nav {
    height: 100%;
    gap: 8rpx;
    white-space: nowrap;
    width: 100%;
  }

  .y-tab {
    display: inline-block;
    height: 68rpx;
    line-height: 68rpx;
    padding: 0 48rpx;
    box-sizing: border-box;
    border-radius: 16rpx;
    text-align: center;
    font-size: 28rpx;
    font-weight: 600;

    &.is-active {
      background: white;
    }
  }
}
</style>
