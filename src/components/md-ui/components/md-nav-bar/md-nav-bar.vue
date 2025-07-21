<template>
  <uni-nav-bar
    :color="color"
    backgroundColor="transparent"
    @clickLeft="customLeft"
    :fixed="fixed"
    statusBar
    :left-icon="showLeft ? leftIcon : ''"
    :border="false">
    <view class="title">{{ title }}</view>
  </uni-nav-bar>
  <!-- 问号图片 -->
  <view v-if="!notDescribe" class="wenhao">
    <md-icon name="wenhao" width="80" height="80" @click="handleJump"></md-icon>
  </view>
  <!-- 提示弹窗 -->
  <md-dialog ref="popup" @ok="handleOk">
    <view>您未完成问卷填写，请确认是否要返回</view>
  </md-dialog>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { ref } from 'vue';

interface PropsType {
  color?: string;
  title?: string;
  leftIcon?: string;
  showLeft?: boolean;
  fixed?: boolean;
  notDescribe?: boolean;
}

// 接收props
let props = withDefaults(defineProps<PropsType>(), {
  title: '',
  leftIcon: 'left',
  showLeft: true,
  fixed: true,
  notDescribe: false,
});

const popup = ref(null);

const handleJump = () => {
  uni.navigateTo({
    url: '/pages/sub-page/describe/wenhao',
  });
};

const handleOk = () => {
  uni.reLaunch({
    url: uni.getStorageSync('backRoute'),
  });
  uni.removeStorageSync('backRoute');
};

// 返回 【click】
let customLeft = () => {
  // 如果有记录，则用记录的记录的跳转路由
  if (uni.getStorageSync('backRoute')) {
    popup.value!.open();
    return;
  }
  if (!props.showLeft || !props.leftIcon) return;
  //获取路由
  let routes = getCurrentPages();
  // 去重
  let uniqueRoutes = _.uniqBy(routes, 'route');
  // 说明不是刷新，分享等单个路由。
  if (uniqueRoutes && uniqueRoutes.length > 1) {
    // 如果路由栈只有两个路由，则跳到一级路由
    if (uniqueRoutes.length == 2) {
      uni.switchTab({
        url: '/' + uniqueRoutes[0].route,
      });
    } else {
      uni.navigateBack();
    }
    return;
  }
  uni.reLaunch({
    url: '/pages/index/index',
  });
};
</script>

<style lang="scss" scoped>
.wenhao {
  position: fixed;
  right: 50rpx;
  bottom: 20%;
  z-index: 98;
}
.title {
  font-size: 32rpx;
  line-height: 44px;
  width: 100%;
  text-align: center;
}
</style>
