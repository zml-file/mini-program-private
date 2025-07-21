<template>
	<md-page title="消息列表" :showLeft="false">
		<view class="container">
			<view class="list" v-for="item in 3" :key="item">
				<md-icon name="rocket" width="58" height="58"></md-icon>
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
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	.list {
		display: flex;
		width: 100%;
		background: $cardBg;
		border-radius: 16rpx;
		padding: 20rpx;
		box-sizing: border-box;
		border: 1rpx solid $lineColor;
		box-shadow: 0px 24rpx 32rpx -16rpx #24242414;
		&:not(:last-of-type) {
			margin-bottom: 20rpx;
		}
		.icon {
			width: 74rpx;
			height: 74rpx;
		}
		.right {
			flex: 1;
			margin-left: 10rpx;
			.title {
			}
			.content {
			}
		}
	}
}
</style>
