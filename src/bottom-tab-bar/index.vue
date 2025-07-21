<template>
  <view class="tab-bar">
    <!-- <view class="tab-bar-border"></view> -->
    <block v-for="(item, index) in data.list" :key="item.pagePath">
      <view v-if="item.text !== '首页'" class="tab-bar-item" @click="() => switchTab(index)">
        <image :src="data.selected === index ? item.selectedIconPath : item.iconPath"></image>
        <view :style="{ color: data.selected === index ? data.selectedColor : data.color }">{{ item.text }}</view>
      </view>
      <view v-else class="tab-bar-home flex-c" @click="() => switchTab(index)">
        <view :class="['tab-bar-home-inner', 'flex-c', data.selected === index ? 'active' : '']">
          <md-icon :url="item.iconPath" width="52" height="52"></md-icon>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { reactive } from 'vue';
const props = defineProps({
  current: {
    type: Number,
    default: 0,
  },
});
const data = reactive({
  selected: 0,
  color: '#1B1B1B',
  selectedColor: '#EB4C60',
  list: [
    {
      pagePath: '/pages/task/index',
      iconPath: '/static/images/tabbar/liebiao.png',
      selectedIconPath: '/static/images/tabbar/liebiao_a.png',
      text: '任务列表',
    },
    {
      pagePath: '/pages/describe/index',
      iconPath: '/static/images/tabbar/shuoming.png',
      selectedIconPath: '/static/images/tabbar/shuoming_a.png',
      text: '说明',
    },
    {
      pagePath: '/pages/index/index',
      iconPath: '/static/images/tabbar/home.png',
      // selectedIconPath: '/static/images/tabbar/home.png',
      text: '首页',
    },
    {
      pagePath: '/pages/message/index',
      iconPath: '/static/images/tabbar/message.png',
      selectedIconPath: '/static/images/tabbar/message_a.png',
      text: '消息列表',
    },
    {
      pagePath: '/pages/my/index',
      iconPath: '/static/images/tabbar/my.png',
      selectedIconPath: '/static/images/tabbar/my_a.png',
      text: '我的',
    },
  ],
});

const switchTab = (index: number) => {
  const item = data.list[index];
  const url = item.pagePath;
  uni.switchTab({ url });
  data.selected = index;
};

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
    &.active {
      background: linear-gradient(180deg, #eb4c60 0%, #fa5721 66.7%, #d41e3c 100%);
    }
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
</style>
