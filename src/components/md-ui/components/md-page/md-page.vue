<template>
  <view class="app-warp">
    <view class="title-bg" :style="{ background: bgType === 'dark' ? '#333' : undefined }">
      <md-nav-bar
        :color="bgType === 'dark' ? '#fff' : undefined"
        :title="title"
        :left-icon="leftIcon"
        :showLeft="showLeft"
        :notDescribe="notDescribe" />
      <slot name="head"></slot>
    </view>
    <view class="content">
      <view v-if="subHead >= 0" :style="{ height: subHead + 'rpx' }"></view>
      <view class="app-container">
        <slot />
      </view>
    </view>
    <!-- 底部按钮悬浮固定在底部 -->
    <slot class="footer-box" name="footer">
      <view :class="['footer-container', 'shadow', 'flex-l', bgType === 'dark' ? 'dark_bg' : '']" v-if="isBtn">
        <md-button
          :bgType="bgType"
          class="button"
          v-for="(item, i) in btnTextItems"
          :key="i"
          @click="() => btnClick({ index: i, item })"
          :loading="!!item?.loading"
          :title="item.text"
          :color="item.color"
          :openType="buttonType?.openType" />
      </view>
    </slot>
    <!-- 用于弹窗，防止弹窗级别过低 -->
    <slot name="dialog" />
  </view>
</template>
<script setup lang="ts">
export type BtnTextItem = {
  text: string;
  color?: string;
  key?: string;
  loading?: boolean;
};

interface PropsType {
  bgType: string; // white | dark
  // 导航栏属性
  title?: string;
  leftIcon?: string;
  showLeft?: boolean;
  subHead?: number;
  // 底部按钮属性
  isBtn?: boolean;
  loading?: boolean;
  btnTextItems?: BtnTextItem[];
  buttonType?: Record<string, any>;
  // 是否显示页面问号
  notDescribe?: boolean;
}

type InfoType = { index: number; item: BtnTextItem };
// 接收props
withDefaults(defineProps<PropsType>(), {
  // 导航栏属性
  title: '',
  leftIcon: 'left',
  showLeft: true,
  subHead: -1,
  // 底部按钮属性
  isBtn: false,
  loading: false,
  btnTextItems: () => [{ text: '按钮', key: 'button' }],
  notDescribe: false,
});

// $emit

const emit = defineEmits<{
  (e: 'btnClick', info: InfoType): void;
}>();

// 按钮点击事件
const btnClick = (info: InfoType) => {
  emit('btnClick', info);
};
</script>
<style lang="scss" scoped>
.app-warp {
  .title-bg {
    height: calc(465rpx - $safe-top);
    width: 100%;
    background-image: url('/static/images/top-bg.png');
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .content {
    margin-top: calc(-250rpx + $safe-top);
  }
}

.footer-box {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.footer-container {
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 0;
  background: white;
  padding: 16rpx 30rpx $safe-bottom;
  box-sizing: border-box;
  &.dark_bg {
    background: #333;
  }
  .button {
    flex: 1;
    &:not(:last-of-type) {
      margin-right: 20rpx;
    }
  }
}
</style>
