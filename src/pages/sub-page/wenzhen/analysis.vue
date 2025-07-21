<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <bc-countdown desc="倒计时结束后，将显示情况描述、问题分析和解决方案" :time="data.time" />
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card :item="item"></bc-title-card>
      </block>
      <bc-bottom-bar rightBtn okText="详细问诊" @ok="handleOk" @back="handleBack" :okDisabled="data.disabled" />
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import { hasItTimeOut, Toast } from '@/utils/util';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
  time: '',
  disabled: false,
});

const handleOk = () => {
  if (data.disabled) {
    Toast('倒计时未结束，请在倒计时结束后点击详细问诊');
    return;
  }
  uni.navigateTo({
    url: '/pages/sub-page/wenzhen/detail',
  });
};

const handleBack = () => {
  uni.showModal({
    title: '提示',
    content: '您未完成问卷填写，请确认是否要返回',
    success: res => {
      if (res.confirm) {
        uni.redirectTo({
          url: '/pages/sub-page/wenzhen/list',
        });
      }
    },
  });
};

/**
 * 接口相关
 */

// 获取问题答案列表
const getQuestionAnswerList = async (taskId: number) => {
  try {
    const res = await api.task.searchQuestionAnswer({ taskId });
    data.list = res.data?.contentList.map(item => ({
      title: item.answerTitle,
      content: '分析中...',
      status: 2,
    }));
    data.time = res.data.functionEndTime;
    // 获取目标时间是否超时
    const _hasItTimeOut = hasItTimeOut(res.data?.functionEndTime);
    // 如果时间超时，则跳转到有答案页面
    if (_hasItTimeOut) {
      // 跳转有答案页面
      uni.redirectTo({
        url: `/pages/sub-page/wenzhen/scheme?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
      });
    } else {
      data.disabled = true;
    }
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  getQuestionAnswerList(option?.taskId);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  .countdown {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-bottom: 60rpx;
    .desc {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 4rpx 16rpx;
      box-sizing: border-box;
      border-radius: 8rpx;
      background: #fdedea;
      color: #c98c59;
      font-size: 16rpx;
    }
  }
}
</style>
