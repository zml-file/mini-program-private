<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
	console.log("App Launch");
	// 注意：内容库数据已在登录成功后通过 content-library-sync.ts 同步
	// 移除启动时的接口调用，避免未登录状态下的无效请求
});

onShow(() => {
	// console.log("App Show");
});
onHide(() => {
	// console.log("App Hide");
});
</script>
<style lang="scss">
@import '~@/styles/index.scss';
/*每个页面公共css */

page {
	font-size: 24rpx;
	color: $title;
}

/* 全局 image 标签样式 - 使图片在缩放时保持像素风格 */
image,
img {
	// image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
}
</style>
