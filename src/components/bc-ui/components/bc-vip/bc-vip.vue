<template>
  <view class="vip">
    <md-icon name="zuan" height="31.5" width="42" />
    <view class="m-left-8">会员等级{{ level || 0 }}</view>
  </view>
</template>

<script setup lang="ts">
defineProps({
  level: Number,
});
</script>

<style lang="scss" scoped>
.vip {
  background: #3e3d3c;
  display: flex;
  align-content: center;
  height: 38rpx;
  font-size: 26rpx;
  font-weight: bold;
  color: #fff2e8;
  padding: 0 12rpx;
  border-radius: 8rpx;
}
</style>
