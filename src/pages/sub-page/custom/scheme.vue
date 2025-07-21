<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <block v-for="item in data.list" :key="item.id">
        <bc-title-card bgType="dark" :item="item"></bc-title-card>
      </block>
      <bc-bottom-bar
        bgType="dark"
        countdown-desc="倒计时结束后，此任务将结束，回复将消失"
        :countdownTime="data.time"
        showCountdown
        okText="开启定制"
        @ok="handleDetail"
        @back="handleBack" />
      <!-- 提示弹窗 -->
      <md-dialog ref="popup" title="温馨提示" @ok="handleOk" @cancel="handleCancel">
        点击确定后，将开启为期5天的倒计时，倒计时结束后，该页面上所有的回复将被清空，该定制方案也将结束。倒计时期间可以点击开启定制按钮，开启定制回复获取更详尽的解决方案，进行更具针对性的分析。
      </md-dialog>
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
});
const popup = ref(null);

const handleDetail = () => {
  uni.navigateTo({
    url: '/pages/sub-page/custom/custom',
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
 * 弹窗处理
 */
const handleOk = () => {
  fetchTaskEndTime();
};

const handleCancel = () => {
  uni.redirectTo({
    url: '/pages/sub-page/wenzhen/list',
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
  } catch (error) {}
};

// 任务结束时间
const fetchTaskEndTime = async () => {
  try {
    const res = await api.task.taskEndTime({ moduleCode: taskModule['定制模块'], taskId: data.prevPageQuery?.taskId });
    if (!!res?.data) {
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
