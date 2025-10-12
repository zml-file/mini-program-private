<template>
  <md-page title="说明" :showLeft="false">
    <view class="container">
      <view class="list" v-for="item in data.list" :key="item.id">
        <view class="title fs-28 m-bottom-20 font-bold">{{ item.explainTitle }}</view>
        <view class="content m-bottom-20" v-html="item.explainContent ">

        </view>
        <view class="date">{{ item.extInfo }}</view>
      </view>
    </view>
  </md-page>
  <bottom-tab-bar :current="1" />
</template>
<script setup lang="ts">
import api from '@/api';
import { onLoad } from '@dcloudio/uni-app';
import { reactive } from 'vue';

let data = reactive<any>({
  list: [],
});

/**
 * 接口相关
 */
const fetchExplanationList = async () => {
  try {
    const res = await api.index.explanationList();
    data.list = res.data;
  } catch (error) {}
};

onLoad(() => {
  fetchExplanationList();
});
</script>
<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc(48px + $safe-bottom + 20rpx);
  box-sizing: border-box;
  .list {
    width: 100%;
    padding: 24rpx 40rpx;
    box-sizing: border-box;
    gap: 20rpx;
    border-radius: 8rpx 0 0 0;
    box-shadow: 0px 8rpx 24rpx 0 #00000040;
    &:not(:last-of-type) {
      margin-bottom: 20rpx;
    }
    .content {
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}
</style>
