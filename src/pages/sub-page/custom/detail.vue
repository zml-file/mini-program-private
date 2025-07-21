<template>
  <md-page :title="data.prevPageQuery?.taskName" bgType="dark">
    <view
      class="container"
      :style="{
        height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight} + 80rpx) - (env(safe-area-inset-bottom) + 112rpx))`,
        overflowY: 'scroll',
      }">
      <block v-if="!data.info.timeOut">
        <bc-countdown bgType="dark" desc="倒计时结束后，将显示第一条回复内容" :time="data.info?.endTime" />
      </block>
      <block v-for="item in data.info.list" :key="item.id">
        <bc-analysis-item
          bgType="dark"
          :item="item"
          countdownDesc="倒计时结束后，回复内容将显示出来"></bc-analysis-item>
      </block>
      <bc-bottom-bar
        bgType="dark"
        countdown-desc="倒计时结束后，此任务将结束，回复将消失"
        showCountdown
        :countdownTime="data.info?.functionEndTime"
        :showBack="false"
        okText="清空并返回"
        @ok="handleReset" />
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
// 工具
import { hasItTimeOut } from '@/utils/util';

const data = reactive<any>({
  prevPageQuery: {},
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  list: [],
});

// 清空并返回
const handleReset = () => {
  uni.showModal({
    title: '清空定制',
    content: '清空定制回复后，所有回复都将清空，此定制回复也将结束删除，请确认是否清空',
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
const fetchSearchSecondQuestionAnswer = async (taskId: string) => {
  try {
    const res = await api.task.searchSecondQuestionAnswer({
      taskId,
    });
    const _index = res.data?.contentList.findIndex(item => !hasItTimeOut(item.countDownTime));
    let list = res.data?.contentList?.map((item, index) => {
      let _item = { ...item, id: item.answerTitle, title: item.answerTitle, content: item.answerContent };
      // 如果没有找到一条数据是【不超时】的，那就是所有的数据都有【答案】了
      if (_index !== -1) {
        if (index <= _index) {
          if (index === _index) {
            return { ..._item, status: 2 }; // 显示倒计时
          }
          return { ..._item, status: 1 }; // 显示答案
        } else {
          return { ..._item, status: 3 }; // 显示分析中..
        }
      } else {
        return { ..._item, status: 1 }; // 显示答案
      }
    });

    // 判断时间是否超时
    const _hasItTimeOut = hasItTimeOut(res.data?.endTime);
    data.info = {
      ...res.data,
      list,
      hasItTimeOut: _hasItTimeOut,
    };
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  fetchSearchSecondQuestionAnswer(option?.taskId);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  height: calc(100vh - $safe-bottom - 74rpx - 16rpx);
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
