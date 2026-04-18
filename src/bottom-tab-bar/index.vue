<template>
  <view class="tab-bar">
    <!-- <view class="tab-bar-border"></view> -->
    <block v-for="(item, index) in data.list" :key="item.pagePath">
      <view v-if="item.text !== '首页'" class="tab-bar-item" @click="() => switchTab(index)">
        <view class="icon-wrapper">
          <image :src="data.selected === index ? item.selectedIconPath : item.iconPath"></image>
          <view v-if="item.badge > 0" class="badge" :class="{ 'dot-only': item.badge === true }">
            <text v-if="item.badge !== true">{{ item.badge > 99 ? '99+' : item.badge }}</text>
          </view>
        </view>
        <view :style="{ color: data.selected === index ? data.selectedColor : data.color }">{{ item.text }}</view>
      </view>
      <view v-else class="tab-bar-home flex-c" @click="() => switchTab(index)">
        <view class="tab-bar-home-shell flex-c">
          <view class="tab-bar-home-inner flex-c">
            <view class="qr-icon">
              <view class="qr-finder qr-finder-tl"></view>
              <view class="qr-finder qr-finder-tr"></view>
              <view class="qr-finder qr-finder-bl"></view>
              <view class="qr-pixel qr-pixel-1"></view>
              <view class="qr-pixel qr-pixel-2"></view>
              <view class="qr-pixel qr-pixel-3"></view>
              <view class="qr-pixel qr-pixel-4"></view>
              <view class="qr-pixel qr-pixel-5"></view>
            </view>
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { reactive, watch } from 'vue';
import { useTabBadge } from '@/composables/useTabBadge';

const props = defineProps({
  current: {
    type: Number,
    default: 0,
  },
});

const { getAllBadges, tabBadges, hideBadge } = useTabBadge();
const data = reactive({
  selected: 0,
  color: '#1B1B1B',
  selectedColor: '#7A59ED',
  list: [
    {
      pagePath: '/pages/task/index',
      iconPath: '/static/images/tabbar/liebiao.png',
      selectedIconPath: '/static/images/tabbar/liebiao_a.png',
      text: '对话列表',
      badge: 0,
    },
    {
      pagePath: '/pages/image-text/index',
      iconPath: '/static/images/tabbar/shuoming.png',
      selectedIconPath: '/static/images/tabbar/shuoming_a.png',
      text: 'A0',
      badge: 0,
    },
    {
      pagePath: '/pages/index/index',
      iconPath: '/static/images/tabbar/home.png',
      // selectedIconPath: '/static/images/tabbar/home.png',
      text: '首页',
      badge: 0,
    },
    {
      pagePath: '/pages/message/index',
      iconPath: '/static/images/tabbar/message.png',
      selectedIconPath: '/static/images/tabbar/message_a.png',
      text: '消息列表',
      badge: 0,
    },
    {
      pagePath: '/pages/my/index',
      iconPath: '/static/images/tabbar/my.png',
      selectedIconPath: '/static/images/tabbar/my_a.png',
      text: '我的',
      badge: 0,
    },
  ],
});

// 监听badge变化
watch(
  tabBadges,
  (newBadges) => {
    // 更新每个tab的badge
    data.list[0].badge = newBadges.task;
    data.list[1].badge = newBadges.describe;
    data.list[2].badge = newBadges.index;
    data.list[3].badge = newBadges.message;
    data.list[4].badge = newBadges.my;
  },
  { immediate: true, deep: true }
);

const switchTab = (index: number) => {
  const item = data.list[index];
  const url = item.pagePath;
  const tabNameMap = ['task', 'describe', 'index', 'message', 'my'];
  const tabName = tabNameMap[index];

  // 对话列表(0)、A0(1)、消息列表(3)、我的(4) 需要登录；首页(2) 不拦截
  const requireLoginTabs = [0, 1, 3, 4];
  if (requireLoginTabs.includes(index)) {
    const token = uni.getStorageSync('token');
    if (!token) {
      uni.navigateTo({ url: '/pages/login/index' });
      return;
    }
  }

  if (tabName) {
    hideBadge(tabName);
  }

  uni.switchTab({ url });
  data.selected = index;
};

// 更新badge数量的方法
const updateBadge = (index: number, count: number) => {
  if (index >= 0 && index < data.list.length) {
    data.list[index].badge = count;
  }
};

// 暴露方法给父组件
defineExpose({
  updateBadge,
});

onShow(() => {
  data.selected = props.current;
});
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: white;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 98;
}

.tab-bar-border {
  background-color: rgba(0, 0, 0, 0.33);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 1px;
  transform: scaleY(0.5);
  z-index: -1;
}

.tab-bar-home {
  position: relative;
  width: 132rpx;
  height: 132rpx;
  margin-top: -34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tab-bar-home-shell,
.tab-bar-home-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-sizing: border-box;
}

.tab-bar-home-shell {
  width: 124rpx;
  height: 124rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(94, 73, 205, 0.14);
}

.tab-bar-home-inner {
  position: relative;
  width: 104rpx;
  height: 104rpx;
  background: linear-gradient(180deg, #8a6aff 0%, #6e53eb 100%);
  box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 0.24);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.tab-bar-home-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, rgba(255, 255, 255, 0.16), transparent 34%);
}

.tab-bar-home:active .tab-bar-home-inner {
  transform: scale(0.97);
}

.qr-icon {
  position: relative;
  z-index: 1;
  width: 40rpx;
  height: 40rpx;
}

.qr-finder,
.qr-pixel {
  position: absolute;
  background: #fff;
  box-sizing: border-box;
}

.qr-finder {
  width: 14rpx;
  height: 14rpx;
  border: 3rpx solid #fff;
  background: transparent;
  border-radius: 2rpx;
}

.qr-finder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4rpx;
  height: 4rpx;
  background: #fff;
  border-radius: 1rpx;
  transform: translate(-50%, -50%);
}

.qr-finder-tl {
  top: 0;
  left: 0;
}

.qr-finder-tr {
  top: 0;
  right: 0;
}

.qr-finder-bl {
  left: 0;
  bottom: 0;
}

.qr-pixel {
  width: 4rpx;
  height: 4rpx;
  border-radius: 1rpx;
}

.qr-pixel-1 {
  right: 8rpx;
  bottom: 9rpx;
}

.qr-pixel-2 {
  right: 1rpx;
  bottom: 9rpx;
}

.qr-pixel-3 {
  right: 8rpx;
  bottom: 2rpx;
}

.qr-pixel-4 {
  right: 1rpx;
  bottom: 2rpx;
}

.qr-pixel-5 {
  right: 15rpx;
  bottom: 2rpx;
}

.flex-c {
  display: flex;
  align-items: center;
  justify-content: center;
}

.active {
  transform: translateY(-2rpx);
}

.tab-bar-home .tab-bar-home-inner.active,
.tab-bar-home-inner.active {
  background: linear-gradient(180deg, #8b6bff 0%, #6a4fe9 100%);
}

.tab-bar-item {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.tab-bar-item image {
  width: 27px;
  height: 27px;
}

.tab-bar-item view {
  font-size: 10px;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.badge.dot-only {
  width: 8px;
  height: 8px;
  min-width: auto;
  padding: 0;
  border-radius: 50%;
  top: -2px;
  right: -2px;
}

.tab-bar-home-shell,
.tab-bar-home-inner,
.qr-icon {
  pointer-events: none;
}
.tab-bar-item {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.tab-bar-item image {
  width: 27px;
  height: 27px;
}

.tab-bar-item view {
  font-size: 10px;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.badge.dot-only {
  width: 8px;
  height: 8px;
  min-width: auto;
  padding: 0;
  border-radius: 50%;
  top: -2px;
  right: -2px;
}
</style>
