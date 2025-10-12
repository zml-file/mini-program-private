<template>
  <button :class="['md-button', bgType === 'dark' ? 'dark_bg' : '']" :loading="props.loading" @click="$emit('click')">
    {{ props.title }}
  </button>
</template>
<script setup lang="ts">
// 接收props
let props = defineProps<{
  title?: String;
  loading: Boolean;
  bgType?: String; // white | dark
}>();
</script>
<style lang="scss" scoped>
.md-button {
  height: 74rpx;
  line-height: 74rpx;
  border-radius: 8rpx;
  // background: $theme-color;
  background: #7A59ED;
  &.dark_bg {
    background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9e63d 0%, #f8dd4f 48.44%, #ebf761 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #f8da3c 0%, #edf078 48.44%, #fffa8d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #ecff0c 0%, #fce83c 48.44%, #f0db1d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
    color: #333;
  }
  color: white;
  font-size: 32rpx;
}
</style>
