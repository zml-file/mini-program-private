<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <bc-countdown desc="倒计时结束后，将显示情况描述、问题分析和解决方案" :time="data.time" @timeup="handleTimeup" />
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card :item="item" color="purple"></bc-title-card>
      </block>
      <bc-bottom-bar rightBtn okText="详细问诊" @ok="handleOk" @back="handleBack" :showOk="!data.disabled" />
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
  disabled: true, // 默认禁用，倒计时结束后启用
});

const handleTimeup = () => {
  // 倒计时结束，启用按钮并跳转
  data.disabled = false;
  uni.redirectTo({
    url: `/pages/sub-page/wenzhen/scheme?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
  });
};

const handleOk = () => {
  uni.navigateTo({
    url: `/pages/sub-page/wenzhen/detail?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
  });
};

const handleBack = () => {
  uni.showModal({
    title: '提示',
    content: '当前问题已提交，确认返回问诊列表吗？',
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
  // 验证taskId是否存在并转换为数字
    const taskId = Number(data.prevPageQuery.taskId);
    if (isNaN(taskId) || !taskId) {
      Toast('参数错误，无法获取任务信息');
      // 可以跳回列表页或其他处理
      // setTimeout(() => {
      //   uni.redirectTo({
      //     url: '/pages/sub-page/wenzhen/list'
      //   });
      // }, 1500);
      return;
    }
  getQuestionAnswerList(option?.taskId);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  background: linear-gradient(180deg, #f5f0ff 0%, #ffffff 100%);
  min-height: 100vh;

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
      background: #EAE4FF;
      color: #7A59ED;
      font-size: 16rpx;
    }
  }
}
</style>
