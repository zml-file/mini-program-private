<template>
  <view :class="['md-tip-row', 'm-top-20', bgType === 'dark' ? 'dark_bg' : '']">
    <md-icon name="gantanhao" width="24" height="24"></md-icon>
    <view class="m-left-8"><slot /></view>
  </view>
</template>

<script setup lang="ts">
defineProps({
  bgType: {
    type: String,
    default: 'white', // dark
  },
});
</script>

<style lang="scss" scoped>
.md-tip-row {
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
</style>
