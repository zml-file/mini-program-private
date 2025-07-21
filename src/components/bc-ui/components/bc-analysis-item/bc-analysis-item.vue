<template>
  <view class="list">
    <view :class="['title', bgType === 'dark' ? 'dark_bg' : '']">{{ item.title }}</view>
    <view class="content">
      <view v-if="item.status == 1">{{ item.content }}</view>
      <view class="analysis" v-else-if="item.status == 2">
        <view class="flex-c">
          <view class="flex-c circle-wrap">
            <view :class="['circle-box', 'flex-c', 'm-right-16', bgType === 'dark' ? 'circle_dark' : '']">
              <view :class="['circle', bgType === 'dark' ? 'dark' : '']"></view>
            </view>
          </view>
          <view class="text">{{ countdownText }}</view>
        </view>
        <uni-countdown
          :font-size="16"
          :show-day="false"
          :hour="getCountdown(item.countDownTime)?.hours"
          :minute="getCountdown(item.countDownTime)?.minutes"
          :second="getCountdown(item.countDownTime)?.seconds"
          color="#000000"
          :background-color="bgType === 'dark' ? '#fff70e' : '#ffaaaa'" />
        <view class="desc m-top-20">
          <md-icon name="gantanhao" width="24" height="24"></md-icon>
          <view class="m-left-8">{{ countdownDesc }}</view>
        </view>
      </view>
      <view class="analysis" v-else>
        <view class="flex-c">
          <view class="flex-c circle-wrap">
            <view :class="['circle-box', 'flex-c', 'm-right-16', bgType === 'dark' ? 'circle_dark' : '']">
              <view :class="['circle', bgType === 'dark' ? 'dark' : '']"></view>
            </view>
          </view>
          <view class="text">{{ countdownText }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCountdown } from '@/utils/util';

defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  countdownDesc: {
    type: String,
    default: '',
  },
  countdownText: {
    type: String,
    default: '待分析',
  },
  bgType: {
    type: String,
    default: 'white', // dark
  },
});
</script>

<style lang="scss" scoped>
/* 定义动画 */
@keyframes pulse {
  0% {
    width: 50rpx;
    height: 50rpx;
  }
  50% {
    width: 100rpx;
    height: 100rpx;
  }
  100% {
    width: 50rpx;
    height: 50rpx;
  }
}
.list {
  width: 100%;
  padding: 40rpx 36rpx;
  box-sizing: border-box;
  gap: 20rpx;
  border-radius: 24rpx;
  border: 1px solid #dddddd;
  box-shadow: 0 8rpx 8rpx 0 #00000040;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  background: white;
  .title {
    font-size: 36rpx;
    font-weight: 600;
    width: 100%;
    text-align: center;
    height: 60rpx;
    line-height: 60rpx;
    padding: 0 40rpx;
    box-sizing: border-box;
    border-radius: 10rpx;
    background: linear-gradient(0deg, #f89494 -24.14%, #fff3f3 125.86%);
    &.dark_bg {
      background: linear-gradient(355.37deg, #eafb27 3.73%, #fef8f4 109.09%);
    }
  }
  .content {
    font-size: 24rpx;
    .analysis {
      display: flex;
      flex-direction: column;
      align-items: center;
      .text {
        font-size: 48rpx;
        font-weight: 600;
      }
    }
    .circle-wrap {
      width: 125rpx;
      height: 125rpx;
    }
    .circle-box {
      background: rgba(#ffaaaa, 0.5);
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      animation: pulse 2s infinite; /* 动画名称 持续时间 循环次数 */
      display: flex;
      align-items: center;
      &.circle_dark {
        // background: linear-gradient(0deg, #ffcb11, #ffcb11), linear-gradient(180deg, rgba(255, 96, 27, 0.4) 0%, rgba(159, 215, 255, 0) 100%);
        background: rgba(#ffcb11, 0.5);
      }
    }
    .circle {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: #ffaaaa;
      &.dark {
        background: #ffcb11;
      }
    }
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
