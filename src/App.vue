<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { syncContentLibrary } from '@/utils/content-library-sync';

onLaunch(async () => {
	console.log("App Launch");

	// 检查是否已登录（是否有 token）
	const token = uni.getStorageSync('token');
	if (token) {
		// 已登录：启动时同步内容库数据
		try {
			console.log('[App] 用户已登录，开始同步内容库数据...');
			await syncContentLibrary(false); // false 表示替换模式，获取最新数据
			console.log('[App] 内容库数据同步成功');
		} catch (error) {
			console.error('[App] 内容库数据同步失败:', error);
		}
	} else {
		// 未登录：登录成功后会自动同步（在 login/index.vue 中处理）
		console.log('[App] 用户未登录，登录后将自动同步内容库数据');
	}
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
