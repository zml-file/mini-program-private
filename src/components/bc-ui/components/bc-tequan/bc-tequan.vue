<template>
  <md-icon name="tequan" width="90" height="46" @click="handleOpen"></md-icon>
  <md-dialog ref="popup" title="特权信息" @ok="handleOk" okText="充值" cancelText="关闭">
    <view class="content">
      <view>有效期剩余天数：{{ 100 }}</view>
      <view>会员等级：会员等级{{ info?.userLevel || 0 }}</view>
      <view>金币余额：{{ info?.remainingVirtual || 0 }}</view>
    </view>
  </md-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Common } from '@/api/data';
import api from '@/api';

const popup = ref(null);
const info = ref<Common.Info.Data>();

// 获取用户信息
const getUserInfo = async () => {
  try {
    const res = await api.common.info();
    info.value = res.data;
    console.log('[bc-tequan] 用户信息:', info.value);
  } catch (error) {
    console.error('[bc-tequan] 获取用户信息失败:', error);
  }
};

// 组件挂载时获取用户信息
onMounted(() => {
  getUserInfo();
});

const handleOpen = () => {
  // 打开弹窗前刷新用户信息
  getUserInfo();
  popup.value!.open();
};

const handleOk = () => {
  console.log('[bc-tequan] 点击充值, 用户VIP等级:', info.value?.userLevel);

  // 如果用户是游客/来宾（VIP等级<1），显示提示
  if (!info.value?.userLevel || info.value.userLevel < 1) {
    popup.value!.close();
    uni.showModal({
      title: '提示',
      content: '充值即可升级为会员',
      confirmText: '立即充值',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，跳转到充值页面
          uni.navigateTo({
            url: '/pages/recharge/index',
          });
        }
      }
    });
    return;
  }

  // 已经是会员，直接跳转充值页面
  uni.navigateTo({
    url: '/pages/recharge/index',
  });
  popup.value!.close();
};
</script>
