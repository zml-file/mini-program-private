<template>
  <!-- <page-meta :page-style="'overflow:' + (data.show ? 'hidden' : 'visible')"></page-meta> -->
  <uni-popup ref="popup" @change="change" class="custom-popup">
    <view class="popup-wrapper" :style="{ width: typeof props.width === 'number' ? props.width + 'rpx' : width }">
      <!-- 标题栏 -->
      <view class="title">{{ props.title }}</view>
      <view class="content"><slot /></view>
      <view class="btns flex">
        <view v-if="!hideOk" class="btn confirm" @click="handleOk">{{ okText }}</view>
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
  hideOk: {
    type: String,
    default: false,
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
  box-sizing: border-box;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16rpx 36rpx rgba(0,0,0,0.12);

  .title {
    width: 100%;
    padding: 22rpx 24rpx;
    box-sizing: border-box;
    font-weight: 700;
    font-size: 28rpx;
    color: #ffffff;
    line-height: 1.2;
    background: #7b5cff;
    border-top-left-radius: 24rpx;
    border-top-right-radius: 24rpx;
  }
  .content {
    padding: 36rpx 42rpx 24rpx;
    box-sizing: border-box;
  }
  .btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    padding: 0 42rpx 32rpx;
    box-sizing: border-box;
    position: static;
    width: 100%;
    color: #333;
  }
  .btns .btn {
    min-width: 160rpx;
    height: 64rpx;
    line-height: 64rpx;
    text-align: center;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
  }
  .btns .confirm {
    background: #7b5cff;
    color: #fff;
  }
  .btns .cancel {
    background: #f4f4f8;
    color: #7b5cff;
  }
}

/* 输入框（对话框内）的统一样式 */
:deep(.uni-easyinput__content) {
  border: 2rpx solid #8c87ff;
  border-radius: 16rpx;
  background-color: #ffffff;
  height: 72rpx;
  padding: 0 20rpx;
}
:deep(.uni-easyinput__content input) {
  font-size: 26rpx;
  color: #333;
}
:deep(.uni-easyinput__placeholder-class) {
  color: #999 !important;
}
</style>
