<template>
  <md-icon name="tequan" width="110" height="56" @click="handleOpen"></md-icon>
  <md-dialog ref="popup" title="特权信息" @ok="handleOk" okText="充值" cancelText="关闭">
    <view class="content">
      <view>有效期剩余天数：{{ 100 }}</view>
      <view>会员等级：会员等级{{ info?.userLevel || 0 }}</view>
      <view>金币余额：{{ info?.remainingVirtual || 0 }}</view>
    </view>
  </md-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Common } from '@/api/data';
const popup = ref(null);
const info = ref<Common.Info.Data>();

const handleOpen = () => {
  // console.log('handleOpen');
  popup.value!.open();
};

const handleOk = () => {
  uni.navigateTo({
    url: '/pages/recharge/index',
  });
  popup.value!.close();
};
</script>
