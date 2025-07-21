<template>
  <view :class="['countdown', size === 'default' ? 'm-b-60' : '']">
    <uni-countdown
      :font-size="size === 'default' ? 30 : 16"
      :show-day="!getCountdown(time)?.days"
      :show-hour="!getCountdown(time)?.hours"
      :show-minute="!getCountdown(time)?.minutes"
      :show-second="!getCountdown(time)?.seconds"
      :day="getCountdown(time)?.days"
      :hour="getCountdown(time)?.hours"
      :minute="getCountdown(time)?.minutes"
      :second="getCountdown(time)?.seconds"
      @timeup="() => emit('timeup')"
      color="#000000"
      :background-color="bgType === 'dark' ? '#fff70e' : '#ffaaaa'" />
    <view :class="['desc', 'm-top-20', bgType === 'dark' ? 'dark_bg' : '']">
      <md-icon name="gantanhao" width="24" height="24"></md-icon>
      <view class="m-left-8">{{ desc }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCountdown } from '@/utils/util';
const emit = defineEmits(['timeup']);

defineProps({
  size: {
    type: String,
    default: 'default', // default | small
  },
  desc: {
    type: String,
    default: '',
  },
  time: {
    type: String, // 未来时间，做倒计时用
    default: '',
  },
  bgType: {
    type: String,
    default: 'white', // dark
  },
});
</script>

<style lang="scss" scoped>
.countdown {
  display: flex;
  align-items: center;
  flex-direction: column;
  // margin-bottom: 60rpx;
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
    &.dark_bg {
      background: linear-gradient(355.37deg, #eafb27 3.73%, #fef8f4 109.09%);
    }
  }
}
</style>
