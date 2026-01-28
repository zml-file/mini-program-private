<template>
  <view :class="['bottom-btn', 'flex-b', rightBtn ? 'right_btn' : '', bgType === 'dark' ? 'dark_bg' : '']">
    <!-- 倒计时 -->
    <bc-countdown v-if="showCountdown" size="small" :time="countdownTime" :desc="countdownDesc" />
    <!-- 充值 -->
    <view v-if="showRecharge" class="recharge" @click="handleRecharge">
      <md-icon :name="bgType === 'dark' ? 'recharge_dark' : 'recharge'" width="72" height="46"></md-icon>
    </view>
    <view :class="['btn', { active: !okDisabled }, { disabled: okDisabled }]" v-if="showOk" @click="onOk">
      {{ okText }}
    </view>
    <view :class="['btn', bgType === 'dark' ? 'dark' : '']" v-if="showBack" @click="onBack">{{ backText }}</view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { getCountdown } from '@/utils/util';
import api from '@/api';

const data = reactive({});
const userVipLevel = ref(0); // 用户VIP等级，默认0（游客）

const props = defineProps({
  // 显示充值
  showRecharge: {
    type: Boolean,
    default: false,
  },
  // 充值跳转URL（自定义充值页面路径）
  rechargeUrl: {
    type: String,
    default: '/pages/recharge/index',
  },
  // 显示倒计时
  showCountdown: {
    type: Boolean,
    default: false,
  },
  countdownDesc: {
    type: String,
    default: '',
  },
  countdownTime: {
    type: String,
    default: () => ({}),
  },
  showOk: {
    type: Boolean,
    default: true,
  },
  okText: {
    type: String,
    default: '提交',
  },
  okDisabled: {
    type: Boolean,
    default: false,
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  backText: {
    type: String,
    default: '返回',
  },
  rightBtn: {
    type: Boolean,
    default: false,
  },
  bgType: {
    type: String,
    default: 'white',
  },
});

// 获取用户VIP等级
const getUserVipLevel = async () => {
  try {
    const res = await api.common.info();
    userVipLevel.value = res.data?.userLevel || 0;
    console.log('[bc-bottom-bar] 用户VIP等级:', userVipLevel.value);
  } catch (error) {
    console.error('[bc-bottom-bar] 获取VIP等级失败:', error);
    userVipLevel.value = 0; // 失败时默认游客
  }
};

// 组件挂载时获取用户VIP等级
onMounted(() => {
  if (props.showRecharge) {
    getUserVipLevel();
  }
});

// 充值
const handleRecharge = () => {
  console.log('[bc-bottom-bar] 点击充值按钮, 用户VIP等级:', userVipLevel.value);

  // 如果用户是游客/来宾（VIP等级<1），显示提示
  if (userVipLevel.value < 1) {
    uni.showModal({
      title: '提示',
      content: '充值即可升级为会员',
      confirmText: '立即充值',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，跳转到充值页面
          console.log('[bc-bottom-bar] 跳转充值页面:', props.rechargeUrl);
          uni.navigateTo({
            url: props.rechargeUrl,
          });
        }
      }
    });
    return;
  }

  // 已经是会员，直接跳转充值页面
  console.log('[bc-bottom-bar] 跳转充值页面:', props.rechargeUrl);
  uni.navigateTo({
    url: props.rechargeUrl,
  });
};

const emit = defineEmits(['ok', 'back', 'timeup']);
const onOk = () => {
  emit('ok');
};

const onBack = () => {
  emit('back');
};
</script>

<style lang="scss" scoped>
.bottom-btn {
  width: 100%;
  padding: 20rpx 20rpx $safe-bottom;
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  left: 0;
  background: white;
  box-shadow: 0 0 20rpx 0 #ebebeb80;
  z-index: 98;
  gap: 20rpx;
  &.dark_bg {
    background: #333;
  }
  &.right_btn {
    justify-content: flex-end;
  }
  & > .btn {
    background: #9AB3FF;
    color: white;
    min-width: 150rpx;
    padding: 0 12rpx;
    height: 72rpx;
    line-height: 70rpx;
    text-align: center;
    border-radius: 16rpx;
    // border: 1rpx solid #222222;
    font-size: 32rpx;
    &.dark {
      border-color: white;
      color: white;
    }
    &.active {
      background: #7A59ED;
      border: 0;
      color: white;
    }
    &.disabled {
      background: radial-gradient(100% 12158.24% at 99.42% 0%, #888888 0%, #b1acae 48.44%, #ede9ea 100%)
          /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
        radial-gradient(100% 12158.24% at 99.42% 0%, #887c80 0%, #c0bbbd 48.44%, #888888 100%)
          /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
        linear-gradient(180deg, #d9d5d5 -29.17%, #737171 133.33%);
      border: 0;
      color: white;
    }
  }
  & > .countdown {
    display: flex;
    flex-direction: column;
    .desc {
      display: flex;
      align-items: center;
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
  & > .recharge {
    width: 100%;
  }
}
</style>
