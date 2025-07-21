<template>
  <md-page :title="data.prevPageQuery?.taskName" bgType="dark">
    <view
      class="container"
      :style="{
        height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight} + 80rpx) - (env(safe-area-inset-bottom) + 112rpx))`,
        overflowY: 'scroll',
      }">
      <bc-countdown bgType="dark" desc="倒计时结束后，将显示情况描述、问题分析和解决方案" :time="data.time" />
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card bgType="dark" :item="item"></bc-title-card>
      </block>
      <bc-bottom-bar
        bgType="dark"
        rightBtn
        okText="开启定制"
        @ok="handleOk"
        @back="handleBack"
        :okDisabled="data.disabled" />
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 工具
import { hasItTimeOut, queryString, Toast } from '@/utils/util';
// 接口
import api from '@/api';

const data = reactive<any>({
  prevPageQuery: {},
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  info: {},
  list: [],
  disabled: false,
});

const handleOk = () => {
  if (data.disabled) {
    Toast('倒计时未结束，请在倒计时结束后点击开启定制');
    return;
  }
  uni.navigateTo({
    url: '/pages/sub-page/custom/custom?' + queryString({ ...data.prevPageQuery }),
  });
};

const handleBack = () => {
  uni.showModal({
    title: '提示',
    content: '您未完成问卷填写，请确认是否要返回',
    success: res => {
      if (res.confirm) {
        uni.redirectTo({
          url: '/pages/sub-page/custom/list',
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
    data.info = res.data;
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
        url: `/pages/sub-page/custom/scheme?${queryString(data.prevPageQuery)}`,
      });
    } else {
      data.disabled = true;
    }
  } catch (error) {}
};

onLoad(option => {
  uni.showModal({
    title: '温馨提示',
    content:
      '点击确定后，将开启为期5天的倒计时（在管理后台的时间管理中进行配置），倒计时结束后，该页面上所有的回复将被清空，该定制方案也将结束。倒计时期间可以点击开启定制按钮，开启定制回复获取更详尽的解决方案，进行更具针对性的分析。',
    showCancel: false,
  });
  data.prevPageQuery = option as Record<string, any>;
  getQuestionAnswerList(option?.taskId);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  background: #333;
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
