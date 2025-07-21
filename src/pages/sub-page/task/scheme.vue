<template>
	<md-page title="方案">
		<view class="container">
			<view class="list" v-for="item in 3" :key="item">
				<view class="title">方案（{{ item }}）</view>
				<view class="content">
					这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论。
				</view>
			</view>
			<bc-bottom-bar countdown-desc="倒计时结束后，此任务将结束，回复将消失" showCountdown :showOk="false" />
		</view>
	</md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const data = reactive({});
</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx;
	padding-bottom: calc($safe-bottom + 120rpx);
	.list {
		width: 100%;
		padding: 16rpx 36rpx;
		box-sizing: border-box;
		gap: 20rpx;
		border-radius: 24rpx;
		border: 1rpx solid #dddddd;
		box-shadow: 0 8rpx 8rpx 0 #00000040;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 60rpx;
		.title {
			margin-top: -40rpx;
			font-size: 36rpx;
			display: inline-block;
			height: 60rpx;
			line-height: 60rpx;
			padding: 0 40rpx;
			box-sizing: border-box;
			gap: 2px;
			border-radius: 10rpx;
			background: linear-gradient(159.7deg, #fff8ee 10.76%, #fde3e0 93.75%);
			box-shadow: 0 0 12rpx 0 #c4ae8680;
		}
		.content {
			font-size: 24rpx;
		}
	}
}
</style>
