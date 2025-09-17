<template>
	<md-page title="方案">
		<view class="container">
			<view class="search-wrap m-bottom-30">
				<md-icon name="search_icon" width="30" height="36"></md-icon>
				<input placeholder="请输入搜索内容" class="m-left-20 input" placeholder-style="color: #FC9382;" />
			</view>
			<view class="list" v-for="item in 3" :key="item">
				<view class="item flex-c m-bottom-30">
					<view class="content m-right-20">好！你放心大胆地去 我会在你身后支持你的@别的不说 我一定会在精神和眼神上支持你的哈！</view>
					<md-icon name="copy_icon" width="45" height="45"></md-icon>
				</view>
			</view>
			<view class="countdown">
				<uni-countdown :font-size="30" :show-day="false" :hour="2" :minute="30" :second="0" color="#000000" background-color="#ffaaaa" />
				<view class="desc">
					<md-icon name="gantanhao" width="24" height="24"></md-icon>
					<view class="m-left-8">倒计时结束后，将根据您的会员等级显示下一回合内容</view>
				</view>
			</view>
			<view class="btn fs-36">对方主动联系</view>
		</view>
	</md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const data = reactive({});
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30rpx;
	padding-bottom: calc($safe-bottom + 120rpx);
	.search-wrap {
		border-radius: 100rpx;
		box-shadow: 0 8rpx 8rpx 0 #00000040;
		background: white;
		height: 76rpx;
		width: 100%;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
		box-sizing: border-box;
		& > .input {
			flex: 1;
		}
	}
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
		.item {
			& > .content {
				flex: 1;
				padding: 20rpx;
				box-sizing: border-box;
				gap: 10px;
				border-radius: 20rpx;
				border: 1rpx solid #0000001a;
			}
		}
	}
	.btn {
		width: 460rpx;
		height: 72rpx;
		line-height: 72rpx;
		border-radius: 16rpx;
		background: #eb4c60;
		color: white;
		weight: 600;
		text-align: center;
	}
}
</style>
