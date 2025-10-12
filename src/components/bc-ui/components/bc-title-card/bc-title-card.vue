<template>
  <view :class="['list', color ? `theme-${color}` : '']" @click="onClick">
    <view :class="['title', bgType === 'dark' ? 'dark_bg' : '']">{{ item.title }}</view>
    <view class="text-content" v-if="item.status == 1">
      <view class="text-content-mask flex-c" v-if="item.showLevel >= showLevel">请升级至VIP4解锁方案二</view>
      {{ item.content }}
    </view>
    <view class="content flex-c" v-else>
      <view class="flex-c circle-wrap">
        <view :class="['circle-box', 'flex-c', 'm-right-16', bgType === 'dark' ? 'circle_dark' : '']">
          <view :class="['circle', bgType === 'dark' ? 'dark' : '']"></view>
        </view>
      </view>
      <view>{{ item?.content || '倒计时中...' }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
// import { reactive } from 'vue';
// const data = reactive({});
defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  bgType: {
    type: String,
    default: 'white',
  },
  color: {
    type: String,
    default: '',
  },
  showLevel: {
    type: Number,
    default: -1,
  },
});

const emit = defineEmits(['click']);
const onClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
/* 定义动画 */
@keyframes pulse {
  0% {
    width: 50rpx;
    height: 50rpx;
  }
  50% {
    width: 100rpx;
    height: 100rpx;
  }
  100% {
    width: 50rpx;
    height: 50rpx;
  }
}

.list {
  width: 100%;
  padding: 16rpx 36rpx;
  box-sizing: border-box;
  gap: 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid #dddddd;
  box-shadow: 0 8rpx 8rpx 0 #00000040;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  .title {
    margin-top: -40rpx;
    font-size: 36rpx;
    font-weight: 500;
    display: inline-block;
    height: 60rpx;
    line-height: 60rpx;
    padding: 0 40rpx;
    box-sizing: border-box;
    gap: 2px;
    border-radius: 10rpx;
    background: linear-gradient(159.7deg, #fff8ee 10.76%, #fde3e0 93.75%);
    box-shadow: 0 0 12rpx 0 #c4ae8680;
    &.dark_bg {
      background: linear-gradient(0deg, #f6ed0e -24.14%, #fffef3 125.86%);
    }
  }
  .text-content {
    position: relative;
    .text-content-mask {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      background: #ffffffb5;
      box-shadow: 0 280rpx 40rpx 0 #ffffff40 inset;
      backdrop-filter: blur(8rpx);
      font-weight: 500;
      font-size: 40rpx;
    }
  }
  .content {
    height: 100rpx;
    .circle-wrap {
      width: 125rpx;
    }
    .circle-box {
      background: rgba(#ffaaaa, 0.5);
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      animation: pulse 2s infinite; /* 动画名称 持续时间 循环次数 */
      display: flex;
      align-items: center;
      &.circle_dark {
        // background: linear-gradient(0deg, #ffcb11, #ffcb11), linear-gradient(180deg, rgba(255, 96, 27, 0.4) 0%, rgba(159, 215, 255, 0) 100%);
        background: rgba(#ffcb11, 0.5);
      }
    }
    .circle {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: #ffaaaa;
      &.dark {
        background: #ffcb11;
      }
    }
    font-size: 48rpx;
    font-weight: 600;
  }
}
/* 紫色主题，仅变更配色，不改变结构与动画 */
.theme-purple {
  border-color: #e6e0ff;
  box-shadow: 0 8rpx 18rpx rgba(123, 92, 255, 0.12);
}
.theme-purple .title {
  background: linear-gradient(180deg, #8f73ff 0%, #7b5cff 100%);
  color: #fff;
  box-shadow: 0 0 12rpx rgba(123, 92, 255, 0.35);
}
.theme-purple .content .circle-box {
  background: rgba(#7b5cff, 0.25);
}
.theme-purple .content .circle {
  background: #7b5cff;
}
</style>
