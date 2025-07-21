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
    data.list = res.data?.questionVoList?.map(item => ({
      id: item.questionId,
      title: `NO.${item.questionNum}`,
      content: item.questionTitle,
      checkboxList: item.optionContentList,
      type: item.questionType,
    }));
    data.submitList = res.data?.questionVoList.map(({ questionId, ...item }) => ({
      questionId,
      userSubmitContent: item.questionType == 1 ? undefined : '',
    }));
  } catch (error) {}
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  console.log(params);
  try {
    // await api.task.submitQuestion(params);
    // 跳转无答案页面
    // uni.navigateTo({
    //   url: `/pages/sub-page/image-text/analysis?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
    // });
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
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
  .bottom-btn {
    width: 100%;
    padding: 20rpx;
    box-sizing: border-box;
    position: fixed;
    bottom: $safe-bottom;
    left: 0;
    background: white;
    box-shadow: 0 0 20rpx 0 #ebebeb80;
    z-index: 98;
    gap: 20rpx;
    display: flex;
    justify-content: flex-end;
    .btn {
      width: 150rpx;
      height: 72rpx;
      line-height: 70rpx;
      text-align: center;
      border-radius: 16rpx;
      border: 1rpx solid #222222;
      font-size: 32rpx;
      &.active {
        background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9753d 0%, #f8a04f 48.44%, #f7b261 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
          radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
          radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
        border-color: transparent;
        color: white;
      }
    }
    .recharge {
      width: 100%;
    }
  }
}
</style>
