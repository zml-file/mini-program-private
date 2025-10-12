<template>
	<md-page title="消息列表" :showLeft="false">
		<view class="container">
			<view class="list" v-for="item in 3" :key="item">
				<md-icon class="icon" name="rocket"></md-icon>
				<view class="right">
					<view class="title fs-28 m-bottom-10 font-bold">系统消息</view>
					<view class="content m-bottom-10">截止2024年12月31日，您的任务XXX消耗金币584个，回复内容已通过系统发送到该任务中，请您查收。</view>
					<view class="date">2024-05-08 23:34:45</view>
				</view>
			</view>
		</view>
	</md-page>
	<bottom-tab-bar :current="3" />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const data = reactive({});
</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx;
	min-height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: linear-gradient(180deg, #eef0ff 0%, #f6f7ff 100%);
	.list {
		display: flex;
		align-items: flex-start;
		width: 100%;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 28rpx 24rpx;
		box-sizing: border-box;
		border: none;
		box-shadow: 0 12rpx 32rpx rgba(36, 36, 36, 0.08);
		&:not(:last-of-type) {
			margin-bottom: 24rpx;
		}
		.icon {
			width: 48rpx;
			height: 48rpx;
			margin-right: 16rpx;
			flex-shrink: 0;
			color: #5f6cff;
		}
		.right {
			flex: 1;
			margin-left: 0;
			.title {
				color: #1f1f1f;
			}
			.content {
				color: #666666;
				line-height: 1.6;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
			.date {
				color: #a0a0a0;
				font-size: 24rpx;
			}
		}
	}
}
</style>
