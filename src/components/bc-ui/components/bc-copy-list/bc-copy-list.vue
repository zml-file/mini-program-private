<template>
  <view
    class="copylist"
    v-for="item in info.contentList"
    :key="item.stepDetailId"
  >
    <view class="item flex-c m-bottom-30">
      <view class="content m-right-20">{{ _setContent(item.content) }}</view>
      <md-icon
        name="copy_icon"
        width="60"
        height="60"
        @click="() => handleCopy(item)"
      ></md-icon>
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
console.log(props.info);

// 设置内容
const _setContent = (content: string) => {
  if (!content) return '';
  const _content = content?.replace('FF', '');
  const at = _content?.split('@');
  const ll = _content?.split('LL');
  if (at?.length > 1) {
    return at[0];
  } else if (ll?.length) {
    return ll[0];
  }
  return content;
};

const handleCopy = (item: any) => {
  const { stepDetailId, ...other } = props?.info?.statusVo;
  const params = { ...item, preStepDetailId: stepDetailId, ...other };
  if (props.disabled) {
    Toast('请等待倒计时结束');
    return;
  }
  emit('copy', params);
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
