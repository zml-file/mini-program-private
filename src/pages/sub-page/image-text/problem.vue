<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <block v-for="(item, index) in data.list" :key="item.id">
        <block v-if="item.type == 1">
          <bc-qa-item
            @checked="(val: string | number) => (data.submitList[index].optionId = +val)"
            :item="item"
            :checkboxList="item.checkboxList"></bc-qa-item>
        </block>
        <block v-else-if="item.type == 2">
          <bc-qa-item v-model="data.submitList[index].userSubmitContent" :item="item" type="text"></bc-qa-item>
        </block>
        <block v-else-if="item.type == 3">
          <bc-qa-item
            v-model="data.submitList[index].userSubmitContent"
            :item="item"
            type="text"
            :maxLength="2000"></bc-qa-item>
        </block>
      </block>
      <bc-bottom-bar showRecharge rightBtn @ok="handleSubmit" @back="handleBack" />
    </view>
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk" :hideCancel="popupInfo?.type === 'msg'">
      <view>{{ popupInfo?.text }}</view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Task } from '@/api/data';
// 字典
import { payModule, taskModule } from '@/utils/data';
import { checkVirtualCoin } from '@/utils/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
  submitList: [],
});
const popup = ref(null);
const popupInfo = ref<{ type: 'submit' | 'msg' | 'back'; text?: string }>();

// 底部提交按钮回调
const handleSubmit = async () => {
  let _index = data.submitList.findIndex(
    (item: { userSubmitContent: string; optionId: number }) => !item.userSubmitContent && !item?.optionId
  );
  // 您还未完成所有问卷内容的填写
  if (_index !== -1) {
    popupInfo.value = { type: 'msg', text: '您还未完成所有问卷内容的填写，请完成所有题目填写后提交' };
    popup.value!.open();
  } else {
    // 完成所有问卷内容的填写
    const open = await checkVirtualCoin(payModule['图文一阶段付费']);
    if (open) {
      popupInfo.value = { type: 'submit', text: `您已完成了所有问卷内容的填写，请确认是否提交` };
      popup.value!.open();
    }
  }
};

// 返回
const handleBack = () => {
  popupInfo.value = { type: 'back', text: '您未完成问卷填写，请确认是否要返回' };
  popup.value!.open();
};

/**
 * 弹窗相关处理
 */
// 弹窗确认回调
const handleOk = () => {
  if (popupInfo.value?.type === 'submit') {
    // 提交
    submitQuestion({
      taskId: data.prevPageQuery?.taskId,
      moduleUserQuestionList: data.submitList,
    });
  } else if (popupInfo.value?.type === 'back') {
    // 返回
    uni.redirectTo({
      url: '/pages/sub-page/image-text/index',
    });
  }
  popup.value!.close();
};

/**
 * 接口相关
 */
// 获取问题列表
const getQuestionList = async () => {
  try {
    const res = await api.task.moduleQuestion({
      moduleCode: taskModule['图文模块'],
    });

    console.log('[图文问答] 原始问题列表:', res.data?.questionVoList);

    // 按照 questionNum 排序（升序）
    const sortedQuestions = (res.data?.questionVoList || []).sort((a, b) => {
      return (a.questionNum || 0) - (b.questionNum || 0);
    });

    console.log('[图文问答] 排序后问题列表:', sortedQuestions);

    data.list = sortedQuestions.map(item => ({
      id: item.questionId,
      title: `NO.${item.questionNum}`,
      content: item.questionTitle,
      checkboxList: item.optionContentList,
      type: item.questionType,
      questionNum: item.questionNum, // 保留 questionNum 用于调试
    }));

    data.submitList = sortedQuestions.map(({ questionId, ...item }) => ({
      questionId,
      userSubmitContent: item.questionType == 1 ? undefined : '',
    }));

    console.log('[图文问答] 最终显示列表:', data.list);
  } catch (error) {
    console.error('[图文问答] 获取问题列表失败:', error);
  }
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  try {
    await api.task.submitQuestion(params);
    // 跳转无答案页面（使用redirectTo替换当前页面，避免返回到问卷页）
    // taskName 就是模块名��（如"A0模块"），将其作为 moduleName 传递
    uni.redirectTo({
      url: `/pages/sub-page/image-text/analysis?taskId=${data.prevPageQuery.taskId}&taskName=${encodeURIComponent(data.prevPageQuery?.taskName || '')}&moduleName=${encodeURIComponent(data.prevPageQuery?.taskName || '图文模块')}`,
    });
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = {
    ...(option as Record<string, any>),
    taskName: option?.taskName ? decodeURIComponent(option.taskName as string) : '',
  };
  getQuestionList();
});

onShow(() => {
  console.log('onShow');
  uni.setStorageSync('backRoute', '/pages/sub-page/image-text/index');
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx 30rpx calc(30rpx + $safe-bottom + 48px);
}

:deep(.list) {
  width: 88%;
  margin-left: auto;
  margin-right: auto;
}
</style>
