<template>
  <view class="copylist" v-for="item in info.contentList" :key="item.stepDetailId">
    <view class="item flex-c m-bottom-30" @click="() => handleCopy({ ...item, ...info.statusVo })">
      <view class="content m-right-20">{{ item.content }}</view>
      <md-icon name="copy_icon" width="60" height="60"></md-icon>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { Toast } from '@/utils/util';
import type { Four } from '@/api/data';

const props = defineProps({
  info: {
    type: Object as () => Four.GetContentDetail.Data,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['copy']);

const handleCopy = (item: any) => {
  if (props.disabled) {
    Toast('请等待倒计时结束');
    return;
  }
  emit('copy', item);
};
</script>

<style lang="scss" scoped>
.copylist {
  width: 100%;
  .item {
    & > .content {
      flex: 1;
      padding: 20rpx;
      box-sizing: border-box;
      gap: 10px;
      border-radius: 20rpx;
      border: 1rpx solid #0000001a;
    }
  }
}
</style>
