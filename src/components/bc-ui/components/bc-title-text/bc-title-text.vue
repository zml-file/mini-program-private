<template>
  <view class="bc-title-text">
    {{ text }}
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<style lang="scss" scoped>
.bc-title-text {
  background: linear-gradient(180deg, #fde5e2, #fef8f4);
  padding: 10rpx;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  box-sizing: border-box;
  color: #c98c59;
}
</style>
