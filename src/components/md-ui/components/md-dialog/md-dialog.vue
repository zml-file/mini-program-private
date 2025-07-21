<template>
  <page-meta :page-style="'overflow:' + (data.show ? 'hidden' : 'visible')"></page-meta>
  <uni-popup ref="popup" @change="change" class="custom-popup">
    <view class="popup-wrapper" :style="{ width: typeof props.width === 'number' ? props.width + 'rpx' : width }">
      <!-- 标题栏 -->
      <view class="title">{{ props.title }}</view>
      <view class="content"><slot /></view>
      <view class="btns flex">
        <view class="btn confirm" @click="handleOk">{{ okText }}</view>
        <view v-if="!hideCancel" class="btn cancel" @click="close">{{ cancelText }}</view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
const props = defineProps({
  title: {
    type: String,
    default: '温馨提示',
  },
  okText: {
    type: String,
    default: '确定',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  hideCancel: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [String, Number],
    default: 520,
  },
});
const popup = ref<any>(null);

const data = reactive({
  show: false,
});

const change = (e: any) => {
  data.show = e.show;
};

const open = () => {
  popup.value!.open('center');
};

const close = () => {
  popup.value?.close?.();
  data.show = false;
  emit('cancel');
};

const emit = defineEmits(['ok', 'cancel']);

const handleOk = () => {
  emit('ok');
};

defineExpose({
  open,
  close,
});
</script>

<style lang="scss" scoped>
.popup-wrapper {
  width: 520rpx;
  border-radius: 24rpx;
  box-sizing: border-box;
  background: white;
  overflow: hidden;
  margin: 0 auto;
  .title {
    width: 100%;
    height: 76rpx;
    line-height: 76rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    font-weight: 800;
    font-size: 32rpx;
    background: linear-gradient(0deg, #f89494 -24.14%, #fff3f3 125.86%);
  }
  .content {
    padding: 40rpx;
  }
  .btns {
    gap: 24rpx;
    color: white;
    justify-content: flex-end;
    padding: 24rpx;
    box-sizing: border-box;
    .btn {
      width: 160rpx;
      height: 56rpx;
      line-height: 56rpx;
      border-radius: 24rpx;
      text-align: center;
      border-radius: 24rpx;
    }
    .confirm {
      background: radial-gradient(100% 12158.24% at 99.42% 0%, #eb8e15 0%, #feb30b 48.44%, #f1b42c 100%)
          /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
        radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
          /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
        radial-gradient(100% 12158.24% at 99.42% 0%, #ffb240 0%, #f2b61d 48.44%, #f1c35c 100%)
          /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
    }
    .cancel {
      background: linear-gradient(90deg, #f48484 -25%, #fa0808 110%);
    }
  }
}
</style>
