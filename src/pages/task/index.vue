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
							<text class="label">{{ getTimeLabel(item) }}</text>
							<text class="date font-bold">{{ item.endTime }}</text>
						</view>
						<view class="bottom">
							<view class="btn" @click.stop.prevent="handleDelete(item.taskId, item.moduleType)">删除</view>
							<view class="btn active" @click.stop.prevent="handleRenew(item.taskId)">充值</view>
						</view>
					</view>
				</view>
			</view>
		</md-page>
		<bottom-tab-bar :current="0" />
</template>

<script setup lang="ts">
import { reactive, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
// 接口
import * as fm from '@/utils/familiar-local';
import * as um from '@/utils/unfamiliar-local';
import * as sm from '@/utils/stranger-local';
import { taskModule } from '@/utils/data';
import api from '@/api';
import type { Task } from '@/api/data';

// 任务数据类型
interface TaskData {
	taskId: string;
	taskName: string;
	moduleType: '熟悉' | '超熟' | '不熟' | '陌生' | '免费' | '定制' | '问诊' | '线下' | '图文';
	endTime: string;
	taskStatus?: number;
	badge?: string;
}

const data = reactive<any>({
	list: [] as TaskData[],
	isDeleting: false,
});

const getModuleLabel = (type: string) => {
	const labels: Record<string, string> = {
		'熟悉': '熟悉',
		'超熟': '超熟',
		'不熟': '不熟',
		'陌生': '陌生',
		'免费': '免费',
		'定制': '定制',
		'问诊': '问诊',
		'线下': '线下',
		'图文': '图文',
	};
	return labels[type] || type;
};

const getModuleIcon = (type: string) => {
	const icons: Record<string, string> = {
		'熟悉': 'home/shuxi',
		'超熟': 'home/chaoshu',
		'不熟': 'home/bushu',
		'陌生': 'home/mosheng',
		'免费': 'home/free',
		'定制': 'home/dingzhi',
		'问诊': 'home/wenzhen',
		'线下': 'home/xianxia',
		'图文': 'home/tuwen',
	};
	return icons[type] || 'home/shuxi';
};

const getTimeLabel = (item: TaskData) => {
	if (item.badge === '对方找倒计时') {
		return '对方找开启时间：';
	}
	if (item.badge === 'Z倒计时') {
		return 'Z开启时间：';
	}
	if (item.badge === '下次聊天开启倒计时') {
		return '下回合开启时间：';
	}
	return '下回合开启时间：';
};

const handleJump = async (item: TaskData) => {
	if (data.isDeleting) {
		return;
	}

	const { moduleType, taskId, taskName, taskStatus } = item;

	if (['熟悉', '超熟', '免费'].includes(moduleType)) {
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

		const taskStageIndex = task.stageIndex;
		if (moduleType === '免费' && taskStageIndex === 0) {
			const enterResult = fm.enterStage1(taskId);
			if (!enterResult.ok) {
				uni.showToast({ title: enterResult.reason || '进入第一阶段失败', icon: 'none', duration: 2000 });
				return;
			}
			uni.navigateTo({ url: `/pages/sub-page/stepTask/round?module=${moduleType}模块&taskId=${taskId}` });
			return;
		}

		const url = taskStageIndex === 0
			? `/pages/sub-page/stepTask/questionnaire?module=${moduleType}模块&taskId=${taskId}&taskName=${taskName}`
			: `/pages/sub-page/stepTask/round?module=${moduleType}模块&taskId=${taskId}`;
		uni.navigateTo({ url });
		return;
	}

	if (moduleType === '不熟') {
		um.initUmLocal();
		const tasks = um.listTasks();
		const task = tasks.find(t => t.id === taskId);
		if (!task) {
			uni.showToast({ title: '任务不存在', icon: 'none' });
			return;
		}

		uni.navigateTo({
			url: `/pages/sub-page/stepTask/round-new?module=不熟模块&taskId=${taskId}&taskName=${taskName}`,
		});
		return;
	}

	if (moduleType === '陌生') {
		sm.initSmLocal();
		const tasks = sm.listTasks();
		const task = tasks.find(t => t.id === taskId);
		if (!task) {
			uni.showToast({ title: '任务不存在', icon: 'none' });
			return;
		}

		uni.navigateTo({
			url: `/pages/sub-page/stepTask/round-stranger?module=陌生模块&taskId=${taskId}&taskName=${taskName}`,
		});
		return;
	}

	if (moduleType === '定制') {
		let url = '';
		const params = `taskId=${taskId}&taskName=${encodeURIComponent(taskName || '')}`;
		if (taskStatus === 20) {
			url = `/pages/sub-page/custom/analysis?${params}`;
		} else if (taskStatus === 30) {
			url = `/pages/sub-page/custom/scheme?${params}`;
		} else if ((taskStatus || 0) >= 50) {
			url = `/pages/sub-page/custom/detail?${params}&taskStatus=${taskStatus}`;
		} else {
			url = `/pages/sub-page/custom/questionnaire?${params}`;
		}
		uni.navigateTo({ url });
		return;
	}

	if (moduleType === '问诊') {
		let url = '';
		const params = `taskId=${taskId}&taskName=${encodeURIComponent(taskName || '')}`;
		if (taskStatus === 20) {
			url = `/pages/sub-page/wenzhen/analysis?${params}`;
		} else if (taskStatus === 30) {
			url = `/pages/sub-page/wenzhen/scheme?${params}`;
		} else if ((taskStatus || 0) >= 50) {
			url = `/pages/sub-page/wenzhen/detail?${params}&taskStatus=${taskStatus}`;
		} else {
			url = `/pages/sub-page/wenzhen/questionnaire?${params}`;
		}
		uni.navigateTo({ url });
		return;
	}

	if (moduleType === '线下') {
		let url = '';
		const params = `taskId=${taskId}&taskName=${encodeURIComponent(taskName || '')}`;
		if (taskStatus === 20) {
			url = `/pages/sub-page/offline/analysis?${params}`;
		} else if (taskStatus === 30) {
			url = `/pages/sub-page/offline/scheme?${params}`;
		} else {
			url = `/pages/sub-page/offline/problem?${params}`;
		}
		uni.navigateTo({ url });
		return;
	}

	if (moduleType === '图文') {
		const params = `taskId=${taskId}&taskName=${encodeURIComponent(taskName || '')}`;
		const url = taskStatus === 10
			? `/pages/sub-page/image-text/problem?${params}`
			: `/pages/sub-page/image-text/analysis?${params}`;
		uni.navigateTo({ url });
	}
};

const fetchTaskList = async () => {
	console.log('[TaskList] 开始查询所有模块任务列表');
	try {
		const allTasks: TaskData[] = [];

		fm.initFamiliarLocal('familiar');
		const fmTasks = fm.listTasks();
		fmTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '熟悉',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
				badge: t.badge,
			});
		});

		fm.initFamiliarLocal('super');
		const superTasks = fm.listTasks();
		superTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '超熟',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
				badge: t.badge,
			});
		});

		fm.initFamiliarLocal('free');
		const freeTasks = fm.listTasks();
		freeTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '免费',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
				badge: t.badge,
			});
		});

		um.initUmLocal();
		const umTasks = um.listTasks();
		umTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '不熟',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
				badge: t.badge,
			});
		});

		sm.initSmLocal();
		const smTasks = sm.listTasks();
		smTasks.forEach(t => {
			allTasks.push({
				taskId: t.id,
				taskName: t.name,
				moduleType: '陌生',
				endTime: t.countdownEndAt ? new Date(t.countdownEndAt).toLocaleString() : '',
				badge: t.badge,
			});
		});

		const backendModuleConfigs: Array<{ moduleType: TaskData['moduleType']; moduleCode: string }> = [
			{ moduleType: '定制', moduleCode: taskModule['定制模块'] },
			{ moduleType: '问诊', moduleCode: taskModule['问诊模块'] },
			{ moduleType: '线下', moduleCode: taskModule['线下模块'] },
			{ moduleType: '图文', moduleCode: taskModule['图文模块'] },
		];

		const backendResults = await Promise.allSettled(
			backendModuleConfigs.map(config => api.task.list({ moduleCode: config.moduleCode }))
		);

		backendResults.forEach((result, index) => {
			const config = backendModuleConfigs[index];
			if (result.status === 'rejected') {
				console.error(`[TaskList] ${config.moduleType} 请求失败:`, result.reason);
				return;
			}
			console.log(`[TaskList] ${config.moduleType} 模块返回数据:`, result.value.data?.length, '条', result.value.data);
			(result.value.data || []).forEach((task: Task.List.Data) => {
				allTasks.push({
					taskId: task.taskId,
					taskName: task.taskName,
					moduleType: config.moduleType,
					taskStatus: task.taskStatus,
					endTime: task.endTime || '',
				});
			});
		});

		data.list = allTasks;
		console.log('[TaskList] 汇总后的任务列表:', allTasks.length, allTasks);
	} catch (e) {
		console.error('获取任务列表失败:', e);
	}
};

const handleDelete = (taskId: string, moduleType: TaskData['moduleType']) => {
	data.isDeleting = true;
	uni.showModal({
		title: '提示',
		content: '确认删除该任务吗？',
		success: async (res) => {
			if (res.confirm) {
				let deleted = false;

				try {
					await api.task.delTask({ taskId });

					if (moduleType === '熟悉') {
						fm.initFamiliarLocal('familiar');
						deleted = !!fm.deleteTask(taskId);
					} else if (moduleType === '超熟') {
						fm.initFamiliarLocal('super');
						deleted = !!fm.deleteTask(taskId);
					} else if (moduleType === '免费') {
						fm.initFamiliarLocal('free');
						deleted = !!fm.deleteTask(taskId);
					} else if (moduleType === '不熟') {
						um.initUmLocal();
						deleted = !!um.deleteTask(taskId);
					} else if (moduleType === '陌生') {
						sm.initSmLocal();
						deleted = !!sm.deleteTask(taskId);
					} else {
						deleted = true;
					}
				} catch (error) {
					console.error('[TaskList] 删除任务失败:', error);
					deleted = false;
				}

				if (deleted) {
					data.list = data.list.filter((item: TaskData) => !(item.taskId === taskId && item.moduleType === moduleType));
					uni.showToast({ title: '已删除', icon: 'none' });
					fetchTaskList();
				} else {
					uni.showToast({ title: '删除失败', icon: 'none' });
				}
			}

			setTimeout(() => {
				data.isDeleting = false;
			}, 300);
		},
	});
};

const handleRenew = (taskId: string) => {
	uni.showToast({ title: '续时成功', icon: 'success' });
	fetchTaskList();
};

const handleDataSyncCompleted = (event: { action: string }) => {
	console.log('[TaskList] 收到数据同步完成事件:', event.action);
	fetchTaskList();
};

onLoad(() => {
	uni.$on('dataSyncCompleted', handleDataSyncCompleted);
	fetchTaskList();
});

onShow(() => {
	fetchTaskList();
});

onUnmounted(() => {
	uni.$off('dataSyncCompleted', handleDataSyncCompleted);
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
		padding: 24rpx 32rpx 24rpx 24rpx;
		box-sizing: border-box;
		overflow: hidden;
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
				white-space: normal;
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