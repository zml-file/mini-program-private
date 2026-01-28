<template>
  <!-- 固定显示4条内容框 -->
  <view class="copylist" v-for="(item, index) in displayList" :key="item.stepDetailId || index">
    <view class="item flex-c m-bottom-30" :class="{ disabled: props.disabled || item.isBlurred }">
      <!-- 内容区域 -->
      <view class="content-wrapper m-right-20">
        <view class="content">{{ _setContent(item.content) }}</view>
        <!-- VIP模糊遮罩 -->
        <view v-if="item.isBlurred" class="vip-mask flex-c">
          <view class="vip-mask-text">
            <view class="vip-icon">🔒</view>
            <view class="vip-tip">升级VIP{{ item.requiredVipLevel }}解锁</view>
          </view>
        </view>
      </view>
      <!-- 复制按钮 -->
      <view
        class="copy-btn"
        :class="{ disabled: props.disabled || item.isBlurred }"
        @click="() => handleCopy(item)">
        <md-icon name="copy_icon" width="36" height="36"></md-icon>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
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
  userVipLevel: {
    type: Number,
    default: 1, // 默认VIP1
  },
});
const emit = defineEmits(['copy']);

// VIP等级对应的可见条数配置
const VIP_VISIBLE_CONFIG: Record<number, number> = {
  1: 2, // VIP1: 2条可见
  2: 2, // VIP2: 2条可见
  3: 3, // VIP3: 3条可见
  4: 3, // VIP4: 3条可见
  5: 4, // VIP5: 4条全部可见
};

// 固定显示的总条数
const TOTAL_DISPLAY_COUNT = 4;

/**
 * 根据内容索引计算需要的最低VIP等级
 * @param index 内容索引（0-based）
 * @returns 需要的最低VIP等级
 */
const getRequiredVipLevel = (index: number): number => {
  // 索引0-1（前2条）：VIP1就能看到
  if (index < 2) return 1;
  // 索引2（第3条）：需要VIP3才能看到
  if (index === 2) return 3;
  // 索引3（第4条）：需要VIP5才能看到
  if (index === 3) return 5;
  return 5; // 默认返回最高等级
};

// 处理显示列表：固定显示4条，根据VIP等级控制可见性
const displayList = computed(() => {
  const contentList = props.info?.contentList || [];
  const visibleCount = VIP_VISIBLE_CONFIG[props.userVipLevel] || 2;

  // 创建固定4条的显示列表
  const result = [];
  for (let i = 0; i < TOTAL_DISPLAY_COUNT; i++) {
    if (i < contentList.length) {
      // 有真实内容
      result.push({
        ...contentList[i],
        isBlurred: i >= visibleCount, // 超过可见条数的内容模糊
        requiredVipLevel: getRequiredVipLevel(i), // 添加所需VIP等级
      });
    } else {
      // 没有内容，显示占位
      result.push({
        stepDetailId: `placeholder_${i}`,
        content: '暂无更多内容',
        isBlurred: true,
        isPlaceholder: true,
        requiredVipLevel: getRequiredVipLevel(i), // 添加所需VIP等级
      });
    }
  }

  return result;
});

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
  // 如果是模糊的内容，提示升级VIP
  if (item.isBlurred) {
    const requiredLevel = item.requiredVipLevel || 5;
    Toast(`升级至VIP${requiredLevel}解锁更多内容`);
    return;
  }

  // 如果是占位内容，不允许复制
  if (item.isPlaceholder) {
    Toast('暂无更多内容');
    return;
  }

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
    position: relative;

    .content-wrapper {
      flex: 1;
      position: relative;

      & > .content {
        padding: 20rpx;
        box-sizing: border-box;
        gap: 10px;
        border-radius: 20rpx;
        border: 1rpx solid #0000001a;
        min-height: 100rpx;
      }

      // VIP模糊遮罩
      .vip-mask {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8rpx);
        border-radius: 20rpx;
        z-index: 2;

        .vip-mask-text {
          text-align: center;

          .vip-icon {
            font-size: 48rpx;
            margin-bottom: 8rpx;
          }

          .vip-tip {
            font-size: 24rpx;
            color: #666;
            font-weight: 500;
          }
        }
      }
    }

    .copy-btn {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: #827AFD;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6rpx 10rpx rgba(130, 122, 253, .35);
    }

    // 禁用状态样式
    &.disabled {
      opacity: 0.5;

      .content {
        background: #f5f5f5;
        color: #999;
      }
    }

    .copy-btn.disabled {
      opacity: 0.5;
      background: #ccc;
    }
  }
}
</style>
