<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card :item="item" @click="handleClick" :showLevel="data.showLevel"></bc-title-card>
      </block>
      <bc-bottom-bar
        countdown-desc="倒计时结束后，此任务将结束，回复将消失"
        :countdownTime="data.time"
        showCountdown
        :showOk="false" />
      <!-- 提示弹窗 -->
      <md-dialog ref="popup" title="温馨提示" @ok="handleOk" @cancel="handleCancel">
        点击确定后，将开启为期3天的倒计时，倒计时结束后，该页面上所有的回复将被清空，该线下计划也将结束。
      </md-dialog>
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
// 工具
import { hasItTimeOut } from '@/utils/util';
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
  time: '',
  showLevel: -1,
});
const popup = ref(null);

const handleClick = () => {
  uni.navigateTo({
    url: '/pages/sub-page/offline/analysis',
  });
};

/**
 * 弹窗处理
 */
const handleOk = () => {
  fetchTaskEndTime();
};

const handleCancel = () => {
  uni.redirectTo({
    url: '/pages/sub-page/offline/list',
  });
};

/**
 * 接口相关
 */

// 获取问题列表
const getQuestionAnswerList = async (taskId: number) => {
  try {
    const res = await api.task.searchQuestionAnswer({ taskId });
    data.list = res.data?.contentList.map(item => ({
      title: item.answerTitle,
      content: item.answerContent,
      status: 1,
    }));
    data.time = res.data.endTime;
    // 如果没返回时间，则是第一次进入
    if (!res.data?.endTime) {
      // 用户第一次打开任务，如果该任务显示此页面的时候，页面上会有灰色蒙版挡住，并弹出如下对话框
      popup.value!.open();
      return;
    }
    let _hasItTimeOut = hasItTimeOut(res.data.endTime);
    // 超时
    if (_hasItTimeOut) {
      uni.showModal({
        title: '温馨提示',
        content: '您的线下计划有效期已经截止。',
        showCancel: false,
      });
    }
  } catch (error) {}
};

const fetchGetInfo = async () => {
  try {
    const res = await api.common.info();
    data.showLevel = res.data?.userLevel || -1;
  } catch (error) {}
};

// 任务结束时间
const fetchTaskEndTime = async () => {
  try {
    const res = await api.task.taskEndTime({ moduleCode: taskModule['线下模块'], taskId: data.prevPageQuery?.taskId });
    if (!!res?.data) {
    }
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  getQuestionAnswerList(option?.taskId);
});

onShow(() => {
  fetchGetInfo();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  .list {
    width: 100%;
    padding: 16rpx 36rpx;
    box-sizing: border-box;
    gap: 20rpx;
    border-radius: 24rpx;
    border: 1rpx solid #dddddd;
    box-shadow: 0 8rpx 8rpx 0 #00000040;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
    .title {
      margin-top: -40rpx;
      font-size: 36rpx;
      display: inline-block;
      height: 60rpx;
      line-height: 60rpx;
      padding: 0 40rpx;
      box-sizing: border-box;
      gap: 2px;
      border-radius: 10rpx;
      background: linear-gradient(159.7deg, #fff8ee 10.76%, #fde3e0 93.75%);
      box-shadow: 0 0 12rpx 0 #c4ae8680;
    }
    .content {
      font-size: 24rpx;
    }
  }
}
</style>
