<template>
	<md-page title="任务列表" :showLeft="false">
		<view class="container">
			<view class="list" v-for="item in 3" :key="item" @click="handleJump">
				<md-icon type="bg" name="apple" width="76" height="76"></md-icon>
				<view class="right m-left-20">
					<view class="top-wrap m-bottom-40 flex-c">
						<view class="top">
							<view class="title fs-32 font-bold">王老师的摄影不熟任务</view>
							<view class="date-wrap flex-l">
								{{ '下回合开启时间:' }}
								<view class="date font-bold">{{ '2024-09-30 21:21:21' }}</view>
							</view>
						</view>
						<view class="btn full">特权</view>
					</view>
					<view class="bottom">
						<view class="btn">重置</view>
						<view class="btn">删除</view>
						<view class="btn active">充值</view>
					</view>
				</view>
			</view>
		</view>
	</md-page>
	<bottom-tab-bar :current="0" />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
// 接口
import api from '@/api/index';
const data = reactive({});

const handleJump = () => {
	uni.navigateTo({
		url: '/pages/sub-page/task/list',
	});
};

/**
 * 接口相关
 */
const fetchTaskList = async () => {
	try{
		const res = await api.task.list({
			appId: '',
			code: ''
		});
	}catch(e){
		//TODO handle the exception
	}
}
</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx;
	box-sizing: border-box;
	.list {
		width: 686rpx;
		height: 254rpx;
		border-radius: 16rpx;
		box-shadow: 0px 2rpx 48rpx 0 #0000001f;
		display: flex;
		padding: 20rpx;
		box-sizing: border-box;
		&:not(:last-of-type) {
			margin-bottom: 20rpx;
		}
		.btn {
			width: 112rpx;
			height: 56rpx;
			line-height: 56rpx;
			text-align: center;
			border-radius: 20rpx;
			border: 1rpx solid $title;
			&.active {
				color: $theme-color;
				border-color: $theme-color;
			}
			&.full {
				border: 0;
				background-color: $theme-color;
				color: white;
			}
		}
		.right {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			.top-wrap {
				flex: 1;
				.top {
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
				}
				.date-wrap {
					.date {
						color: $title;
					}
				}
			}

			.bottom {
				display: flex;
				justify-content: flex-end;
				.btn:not(:last-of-type) {
					margin-right: 20rpx;
				}
			}
		}
	}
}
</style>
