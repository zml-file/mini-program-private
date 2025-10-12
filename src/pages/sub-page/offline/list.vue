<template>
  <md-page title="线下模块">
    <template #head>
      <view>
        <view class="head-actions">
          <bc-tequan />
        </view>
        <bc-title-text text="对于比较复杂的用户问题，用户可以选择问诊功能，进行咨询的人工服务。" />
      </view>
    </template>

    <view class="container">
      <block v-for="item in data.list" :key="item.taskId">
        <bc-task-item
          :item="item"
          desc="咨询方案保留时间倒计时:"
          bgType="yellow"
          tag="线"
          @click="() => handleJump(item)"
          @swipeClick="onSwipeClick"></bc-task-item>
      </block>
    </view>

    <!-- 创建弹窗 -->
    <md-dialog title="创建线下计划" ref="popup" @ok="handleOk" @cancel="handleCancel">
      <uni-easyinput
        v-model="data.value"
        primaryColor="#827afd"
        :styles="{ borderColor: '#827afd' }"
        :maxlength="6"
        placeholder="请输入名称"></uni-easyinput>
    </md-dialog>

    <!-- 底部自定义创建按钮（使用 xianxia.png） -->
    <template #footer>
      <view class="mf-footer">
        <view class="mf-btn" @click="openCreateDialog">
          <image class="mf-bg" src="@/static/images/xianxia.png" mode="widthFix" />
          <view class="mf-text">
            <text class="mf-plus">＋</text>
            <text class="mf-label">创建线下任务</text>
          </view>
        </view>
      </view>
    </template>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Task } from '@/api/data';
// 工具
import { Toast } from '@/utils/util';
import { taskModule } from '@/utils/data';

// 声明变量
const data = reactive<any>({
  list: [],
  value: '',
});
const popup = ref<any>(null);

const onSwipeClick = () => {
  getTaskList();
};

const handleOk = () => {
  if (!data.value) {
    Toast('请输入任务名称');
    return;
  }
  fetchCreateTask({ taskName: data.value });
};

const handleCancel = () => {
  data.value = '';
};

const openCreateDialog = () => {
  popup.value?.open();
};

const handleJump = (item: Task.List.Data) => {
  // 初始化状态跳【创建任务】
  if (item.taskStatus === 10) {
    uni.navigateTo({
      url: `/pages/sub-page/offline/problem?taskId=${item.taskId}&taskName=${item?.taskName}`,
    });
  } else if (item.taskStatus === 20) {
    // 无答案
    uni.navigateTo({
      url: `/pages/sub-page/offline/analysis?taskId=${item.taskId}&taskName=${item?.taskName}`,
    });
  } else if (item.taskStatus === 30) {
    // 有答案
    uni.navigateTo({
      url: `/pages/sub-page/offline/scheme?taskId=${item.taskId}&taskName=${item?.taskName}`,
    });
  }
};

/**
 * 接口相关
 */
// 查询任务列表
const getTaskList = async () => {
  try {
    const res = await api.task.list({
      moduleCode: taskModule['线下模块'],
    });
    data.list = res.data || [];
  } catch (error) {}
};

// 创建任务
const fetchCreateTask = async (params: Pick<Task.Create.Body, 'taskName'>) => {
  try {
    const res = await api.task.createTask({ ...params, moduleCode: taskModule['线下模块'] });
    uni.navigateTo({
      url: `/pages/sub-page/offline/problem?taskId=${res.data?.taskId}&taskName=${params?.taskName}`,
    });
    handleCancel();
  } catch (error) {}
};

onShow(() => {
  getTaskList();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 180rpx 30rpx 30rpx;
  box-sizing: border-box;
}

/* 头部右侧“特权”固定在最右，不随滚动 */
.head-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 30rpx;
}

/* 底部固定大按钮（与 stepTask 保持一致风格） */
.mf-footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 16rpx 30rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx);
  box-sizing: border-box;
  z-index: 99;
}
.mf-btn { width: 100%; position: relative; }
.mf-bg { width: 100%; display: block; }
.mf-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  // transform: translateY(20rpx);
  text-align: center;
}
.mf-plus { color: #fff; font-size: 40rpx; font-weight: 700; margin-right: 12rpx; line-height: 1; }
.mf-label { color: #fff; font-size: 32rpx; font-weight: 600; line-height: 1; white-space: nowrap; }
</style>