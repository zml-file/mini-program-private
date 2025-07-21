<template>
  <md-page
    title="线下模块"
    isBtn
    :btnTextItems="[{ text: '创建线下计划', key: 'create' }]"
    :subHead="40"
    @btnClick="bottomBtnClick">
    <template #head>
      <view class="flex-l" style="justify-content: flex-end">
        <view class="flex flex-b p-right-30" style="width: calc(50% + 10rpx)">
          <md-icon type="bg" name="offline_icon" width="80" height="80" circle></md-icon>
          <bc-tequan />
        </view>
      </view>
    </template>
    <view class="container">
      <block v-for="item in data.list" :key="item.taskId">
        <bc-task-item
          :item="item"
          desc="咨询方案保留时间倒计时:"
          @click="() => handleJump(item)"
          @swipeClick="onSwipeClick"
          tag="线"></bc-task-item>
      </block>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog title="创建线下计划" ref="popup" @ok="handleOk" @cancel="handleCancel">
      <uni-easyinput
        v-model="data.value"
        primaryColor="#FD7A7A"
        :styles="{
          borderColor: '#FD7A7A',
        }"
        :maxlength="6"
        placeholder="请输入名称"></uni-easyinput>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { BtnTextItem } from '@/components/md-ui/components/md-page/md-page.vue';
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
const popup = ref(null);

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

const bottomBtnClick = (info: { item: BtnTextItem }) => {
  const { key } = info.item;
  if (key === 'create') {
    popup.value!.open();
  }
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
    data.list = res.data;
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
  padding: 30rpx;
  box-sizing: border-box;
}
</style>
