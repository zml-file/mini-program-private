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
        <view :class="['tab-bar-home-inner', 'flex-c', data.selected === index ? 'active' : '']">
          <image v-if="data.selected === index" src="/static/images/home/qrcode.png" class="qrcode-img" />
          <md-icon v-else :url="item.iconPath" width="52" height="52"></md-icon>
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

const { getAllBadges, tabBadges } = useTabBadge();
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
      text: 'AO',
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
  uni.switchTab({ url });
  data.selected = index;
  // 清除该tab的badge（可选，根据需求）
  // item.badge = 0;
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
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: white;
  margin-top: -30rpx;
  .tab-bar-home-inner {
    width: 108rpx;
    height: 108rpx;
    border-radius: 50%;
    background: #333;
    overflow: hidden;
    &.active {
      background: transparent; /* 选中时完全使用图片 */
    }
    .qrcode-img { width: 108rpx; height: 108rpx; border-radius: 50%; display: block; }
  }
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
