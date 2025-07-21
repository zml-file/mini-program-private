<template>
	<md-page title="分析">
		<view class="container">
			<view class="countdown">
				<uni-countdown :font-size="30" :show-day="false" :hour="2" :minute="30" :second="0" color="#000000" background-color="#ffaaaa" />
				<view class="desc">
					<md-icon name="gantanhao" width="24" height="24"></md-icon>
					<view class="m-left-8">倒计时结束后，将根据您的会员等级显示解决方案</view>
				</view>
			</view>
			<view class="list" v-for="item in 3" :key="item">
				<view class="title">方案（{{ item }}）</view>
				<view class="content flex-c">
					<view class="flex-c circle-wrap">
						<view class="circle-box flex-c m-right-16">
							<view class="circle"></view>
						</view>
					</view>
					<view>分析中...</view>
				</view>
			</view>
			<view class="bottom-btn">
				<view class="btn">返回</view>
			</view>
		</view>
	</md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const data = reactive({});
</script>

<style lang="scss" scoped>
/* 定义动画 */
@keyframes pulse {
	0% {
		width: 50rpx;
		height: 50rpx;
	}
	50% {
		width: 100rpx;
		height: 100rpx;
	}
	100% {
		width: 50rpx;
		height: 50rpx;
	}
}

.container {
	padding: 30rpx;
	padding-bottom: calc($safe-bottom + 120rpx);
	.countdown {
		display: flex;
		align-items: center;
		flex-direction: column;
		margin-bottom: 60rpx;
		.desc {
			display: flex;
			align-items: center;
			width: 100%;
			padding: 4rpx 16rpx;
			box-sizing: border-box;
			border-radius: 8rpx;
			background: #fdedea;
			color: #c98c59;
			font-size: 16rpx;
		}
	}
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
			font-weight: 500;
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
			height: 100rpx;
			.circle-wrap {
				width: 125rpx;
			}
			.circle-box {
				background: rgba(#ffaaaa, 0.5);
				width: 50rpx;
				height: 50rpx;
				border-radius: 50%;
				animation: pulse 2s infinite; /* 动画名称 持续时间 循环次数 */
				display: flex;
				align-items: center;
			}
			.circle {
				width: 50rpx;
				height: 50rpx;
				border-radius: 50%;
				background: #ffaaaa;
			}
			font-size: 48rpx;
			font-weight: 600;
		}
	}
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
		}
	}
}
</style>
