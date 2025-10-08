<template>
  <view class="copylist" v-for="item in info.contentList" :key="item.stepDetailId">
    <view class="item flex-c m-bottom-30" :class="{ disabled: props.disabled }">
      <view class="content m-right-20">{{ _setContent(item.content) }}</view>
      <md-icon
        name="copy_icon"
        width="45"
        height="45"
        :style="{ opacity: props.disabled ? 0.3 : 1 }"
        @click="() => handleCopy(item)"></md-icon>
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

// 设置内容（支持服务端下发的 segmentIndex 恢复进度）
const _setContent = (content: string) => {
  if (!content) return '';
  const _content = content?.replace('FF', '');
  // 服务端可在 statusVo.segmentIndex 记录当前已复制到的段落索引（0基）
  const segIndex = Number((props?.info as any)?.statusVo?.segmentIndex ?? 0);
  // 优先按 @ 分段，其次按 LL 分段
  const partsAt = _content.split('@');
  if (partsAt.length > 1) {
    const idx = Math.min(Math.max(segIndex, 0), partsAt.length - 1);
    return partsAt[idx];
  }
  const partsLl = _content.split('LL');
  if (partsLl.length > 1) {
    const idx = Math.min(Math.max(segIndex, 0), partsLl.length - 1);
    return partsLl[idx];
  }
  return content;
};

const handleCopy = (item: any) => {
  if (props.disabled) {
    Toast('请等待倒计时结束');
    return;
  }
  if (!!props?.info?.statusVo) {
    const { stepDetailId, ...other } = props?.info?.statusVo;
    const params = { ...item, preStepDetailId: stepDetailId || undefined, ...other };
    emit('copy', params);
  } else {
    emit('copy', item);
  }
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

    //  禁用状态样式
    &.disabled {
      opacity: 0.5;

      .content {
        background: #f5f5f5;
        color: #999;
      }
    }
  }
}
</style>
