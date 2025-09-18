<template>
	<md-page title="您咨询">
		<view class="container">
			<block v-for="item in data.list" :key="item.id">
				<bc-qa-item :item="item"></bc-qa-item>
			</block>
			<view class="bottom-btn">
				<view class="btn active" @click="handleSubmit">提交</view>
				<view class="btn">返回</view>
			</view>
		</view>
	</md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const data = reactive({
	list: [
		{ id: 1, title: 'NO.1', content: '这是一个问题，一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题' },
		{ id: 2, title: 'NO.2', content: '这是一个问题，一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题' },
		{ id: 3, title: 'NO.3', content: '这是一个问题，一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题一个问题' },
	],
});

const handleSubmit =() => {
	uni.navigateTo({
		url:'/pages/sub-page/chaoshu/analysis'
	})
}
</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx 30rpx calc(30rpx + $safe-bottom + 48px);
	.bottom-btn {
		width: 100%;
		padding: 20rpx;
		box-sizing: border-box;
		position: fixed;
		bottom: $safe-bottom;
		left: 0;
		background: white;
		box-shadow: 0 0 20rpx 0 #ebebeb80;
		z-index: 98;
		gap: 20rpx;
		display: flex;
		justify-content: flex-end;
		& > .btn {
			width: 150rpx;
			height: 72rpx;
			line-height: 70rpx;
			text-align: center;
			border-radius: 16rpx;
			border: 1rpx solid #222222;
			font-size: 32rpx;
			&.active {
				background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9753d 0%, #f8a04f 48.44%, #f7b261 100%)
						/* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
					radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
						/* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
					radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
						/* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
				border-color: transparent;
				color: white;
			}
		}
	}
}
</style>
