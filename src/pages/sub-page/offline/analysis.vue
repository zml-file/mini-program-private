<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <bc-countdown desc="倒计时结束后，将根据您的会员等级显示解决方案" :time="data.time" />
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card :item="item"></bc-title-card>
      </block>
      <bc-bottom-bar :showOk="false" @back="handleBack" rightBtn />
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面携带过来的参数
  list: [
    {
      id: 1,
      title: '指导内容一',
      content:
        '这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！这里是第一条指导内容！',
      status: 1,
    },
    {
      id: 2,
      title: '指导内容二',
      content: '分析中...',
      status: 2,
    },
  ],
  time: '',
});

const handleBack = () => {
  // uni.navigateTo({
  // 	url: '/pages/sub-page/chaoshu/round',
  // });
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
