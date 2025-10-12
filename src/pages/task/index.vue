<template>
	<md-page title="任务列表" :showLeft="false">
		<view class="container">
			<view class="list" v-for="item in data.list" :key="item.taskId" @click="handleJump">
				<md-icon type="bg" name="lv" width="67.5" height="75"></md-icon>
				<view class="right m-left-20">
					<view class="top-row m-bottom-12">
						<view class="title fs-32 font-bold">{{ item.taskName }}</view>
						<view class="btn full">特权</view>
					</view>
					<view class="date-wrap flex-l m-bottom-28" v-if="item.endTime && String(item.endTime).trim()">
						<text class="label">下回合开启时间：</text>
						<text class="date font-bold">{{ item.endTime }}</text>
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
import { onLoad, onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  list: [],
});

const handleJump = () => {
  uni.navigateTo({
    url: '/pages/sub-page/task/list',
  });
};

// 获取任务列表（示例：超熟模块）
const fetchTaskList = async () => {
  try {
    const res = await api.task.list({ moduleCode: taskModule['熟悉模块'] });
    data.list = res.data || [];
  } catch (e) {}
};

onLoad(() => {
  fetchTaskList();
});

// 进入页面（包含从登录页跳转回来）时刷新一次
onShow(() => {
  fetchTaskList();
});

</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx;
	min-height: 100vh;
	box-sizing: border-box;
	background: linear-gradient(180deg, #eef0ff 0%, #f6f7ff 60%, #ffffff 100%);
	.list {
		width: 100%;
		background: #ffffff;
		border-radius: 24rpx;
		box-shadow: 0 12rpx 32rpx rgba(36,36,36,0.08);
		display: flex;
		align-items: flex-start;
		padding: 24rpx 32rpx 24rpx 24rpx; /* 右侧留更多内边距 */
		box-sizing: border-box;
		overflow: hidden; /* 防止子元素超出圆角边框 */
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
			.top-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				:deep(.btn) {
					margin-left: 24rpx;
					flex-shrink: 0;
				}
			}
			.date-wrap {
				display: flex;
				align-items: center;
				gap: 8rpx;
				white-space: normal; /* 单独一行显示，不与特权同一行 */
				flex-wrap: wrap;
				.label {
					color: #9aa0a6;
				}
				.date {
					color: $title;
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
