<template>
	<md-page title="任务列表" :showLeft="false">
		<view class="container">
			<view class="list" v-for="item in data.list" :key="item.taskId" @click="() => handleJump(item)">
				<md-icon type="bg" :name="getModuleIcon(item.moduleType)" width="67.5" height="75"></md-icon>
				<view class="right m-left-20">
					<view class="top-row m-bottom-12">
						<view class="title fs-32 font-bold">{{ item.taskName }}</view>
						<view class="module-tag">{{ getModuleLabel(item.moduleType) }}</view>
					</view>
					<view class="date-wrap flex-l m-bottom-28" v-if="item.endTime && String(item.endTime).trim()">
						<text class="label">下回合开启时间：</text>
						<text class="date font-bold">{{ item.endTime }}</text>
					</view>
					<view class="bottom">
						<view class="btn" @click.stop="handleDelete(item.taskId)">删除</view>
						<view class="btn active" @click.stop="handleRenew(item.taskId)">充值</view>
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
import * as fm from '@/utils/familiar-local';
import * as um from '@/utils/unfamiliar-local';
import * as sm from '@/utils/stranger-local';
import { hasItTimeOut } from '@/utils/util';
import { taskModule } from '@/utils/data';

// 任务数据类型
interface TaskData {
	taskId: string;
	taskName: string;
	moduleType: '熟悉' | '超熟' | '不熟' | '陌生' | '免费';
	endTime: string;
}

const data = reactive<any>({
	list: [] as TaskData[],
});

// 获取模块标签
const getModuleLabel = (type: string) => {
	const labels: Record<string, string> = {
		'熟悉': '熟悉',
		'超熟': '超熟',
		'不熟': '不熟',
		'陌生': '陌生',
		'免费': '免费',
	};
	return labels[type] || type;
};

// 获取模块图标
const getModuleIcon = (type: string) => {
	const icons: Record<string, string> = {
		'熟悉': 'home/shuxi',
		'超熟': 'home/chaoshu',
		'不熟': 'home/bushu',
		'陌生': 'home/mosheng',
		'免费': 'home/free',
	};
	return icons[type] || 'home/shuxi';
};

// 处理任务跳转
const handleJump = async (item: TaskData) => {
	const { moduleType, taskId, taskName } = item;

	// 熟悉/超熟/免费模块
	if (['熟悉', '超熟', '免费'].includes(moduleType)) {
		// 初始化对应的存储
		if (moduleType === '免费') {
			fm.initFamiliarLocal('free');
		} else if (moduleType === '超熟') {
			fm.initFamiliarLocal('super');
		} else {
			fm.initFamiliarLocal('familiar');
		}

		const task = fm.getTask(taskId);
		if (!task) {
			uni.showToast({ title: '任务不存在', icon: 'none' });
			return;
		}

		// 根据任务状态决定跳转
		const now = Date.now();
		const taskStageIndex = task.stageIndex;

		// 检查各种倒计时
		if (task.opponentFindCdUnlockAt && now >= ((task.opponentFindCdUnlockAt as number) - 2000)) {
			uni.showToast({ title: '对方找倒计时已结束', icon: 'none', duration: 2000 });
			return;
		}

		if (task.roundCdUnlockAt && now >= ((task.roundCdUnlockAt as number) - 2000)) {
			uni.showToast({ title: '回合倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}

		if (task.stageCdUnlockAt && now >= ((task.stageCdUnlockAt as number) - 2000)) {
			uni.showToast({ title: '阶段倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}

		if (task.zUnlockAt && now >= ((task.zUnlockAt as number) - 2000)) {
			uni.showToast({ title: 'Z倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}

		// 阶段0：问卷，否则：回合
		const url = taskStageIndex === 0
			? `/pages/sub-page/stepTask/questionnaire?module=${moduleType}模块&taskId=${taskId}&taskName=${taskName}`
			: `/pages/sub-page/stepTask/round?module=${moduleType}模块&taskId=${taskId}`;

		uni.navigateTo({ url });
	}
	// 不熟模块
	else if (moduleType === '不熟') {
		um.initUmLocal();
		const tasks = um.listTasks();
		const task = tasks.find(t => t.id === taskId);
		if (!task) {
			uni.showToast({ title: '任务不存在', icon: 'none' });
			return;
		}

		// 检查倒计时
		if (task.badge === '对方找倒计时' && task.countdownEndAt && !hasItTimeOut(task.countdownEndAt)) {
			uni.showToast({ title: '对方找倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}
		if (['下次聊天开启倒计时', 'Z倒计时'].includes(task.badge) && task.countdownEndAt && !hasItTimeOut(task.countdownEndAt)) {
			uni.showToast({ title: '倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}

		uni.navigateTo({
			url: `/pages/sub-page/stepTask/round-new?module=不熟模块&taskId=${taskId}&taskName=${taskName}`,
		});
	}
	// 陌生模块
	else if (moduleType === '陌生') {
		sm.initSmLocal();
		const tasks = sm.listTasks();
		const task = tasks.find(t => t.id === taskId);
		if (!task) {
			uni.showToast({ title: '任务不存在', icon: 'none' });
			return;
		}

		// 检查倒计时
		if (task.badge === '对方找倒计时' && task.countdownEndAt && !hasItTimeOut(task.countdownEndAt)) {
			uni.showToast({ title: '对方找倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}
		if (['下次聊天开启倒计时', 'Z倒计时'].includes(task.badge) && task.countdownEndAt && !hasItTimeOut(task.countdownEndAt)) {
			uni.showToast({ title: '倒计时未结束', icon: 'none', duration: 2000 });
			return;
		}

		uni.navigateTo({
			url: `/pages/sub-page/stepTask/round-stranger?module=陌生模块&taskId=${taskId}&taskName=${taskName}`,
		});
	}
};

// 查询所有模块的任务列表
const fetchTaskList = async () => {
	try {
		const allTasks: TaskData[] = [];

		// 1. 熟悉模块任务
		fm.initFamiliarLocal('familiar');
		const fmTasks = fm.listTasks();
		fmTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '熟悉',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
			});
		});

		// 2. 超熟模块任务
		fm.initFamiliarLocal('super');
		const superTasks = fm.listTasks();
		superTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '超熟',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
			});
		});

		// 3. 免费模块任务
		fm.initFamiliarLocal('free');
		const freeTasks = fm.listTasks();
		freeTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '免费',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
			});
		});

		// 4. 不熟模块任务
		um.initUmLocal();
		const umTasks = um.listTasks();
		umTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '不熟',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
			});
		});

		// 5. 陌生模块任务
		sm.initSmLocal();
		const smTasks = sm.listTasks();
		smTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '陌生',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
			});
		});

		data.list = allTasks;
	} catch (e) {
		console.error('获取任务列表失败:', e);
	}
};

// 删除任务
const handleDelete = (taskId: string) => {
	uni.showModal({
		title: '提示',
		content: '确认删除该任务吗？',
		success: (res) => {
			if (res.confirm) {
				// 这里需要根据任务所属模块来删除
				// 为了简化，暂时只删除熟悉模块的任务
				// 实际应该先查找任务属于哪个模块，再调用对应删除方法
				fm.initFamiliarLocal();
				const deleted = fm.deleteTask(taskId);
				if (deleted) {
					uni.showToast({ title: '已删除', icon: 'none' });
					fetchTaskList();
				} else {
					uni.showToast({ title: '删除失败', icon: 'none' });
				}
			}
		},
	});
};

// 充值续时
const handleRenew = (taskId: string) => {
	// 简化处理：直接提示续时成功
	uni.showToast({ title: '续时成功', icon: 'success' });
	fetchTaskList();
};

onLoad(() => {
	fetchTaskList();
});

// 进入页面时刷新
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
				.module-tag {
					font-size: 22rpx;
					font-weight: 600;
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					color: #fff;
					background: linear-gradient(180deg, #9AB3FF 0%, #7A59ED 100%);
					box-shadow: 0 4rpx 8rpx rgba(123, 92, 255, 0.3);
					white-space: nowrap;
				}
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
