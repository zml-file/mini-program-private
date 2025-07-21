<template>
  <view
    class="md-icon"
    :style="{ width: width + 'rpx', height: height + 'rpx', borderRadius: circle ? '50%' : 'initial' }"
    @click="onClick">
    <image
      class="image"
      mode="aspectFill"
      :src="url ? url : `/static/${type === 'icon' ? 'icons' : 'images'}/${name}.png`" />
    <!-- 默认插槽 -->
    <view class="content" :style="customStyle">
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits(['click']);
defineProps({
  width: {
    type: String,
    default: '38',
  },
  height: {
    type: String,
    default: '38',
  },
  name: String,
  url: String,
  type: {
    type: String, // icon | bg
    default: 'icon',
  },
  customStyle: Object,
  circle: {
    type: Boolean,
    default: false,
  },
});

const onClick = () => emit('click');
</script>

<style lang="scss" scoped>
.md-icon {
  position: relative;
  overflow: hidden;
  .image,
  .content {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  .content {
    z-index: 1;
  }
}
</style>
