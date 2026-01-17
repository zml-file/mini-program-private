<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import api from '@/api';
import { saveContentLibraryData, formatContentLibraryData } from '@/utils/content-library-storage';

onLaunch(async () => {
	console.log("App Launch");

	// 程序启动时获取内容库数据
	try {
		const res = await api.four.getAllContent();
		if (res && res.data) {
			// 格式化并保存数据到本地存储
			const formattedData = formatContentLibraryData(res.data);
			saveContentLibraryData(formattedData);
			console.log('内容库数据加载成功，共', formattedData.length, '条');
		}
	} catch (error) {
		console.error('获取内容库数据失败:', error);
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
