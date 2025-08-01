<template>
  <md-page
    :title="data.title"
    isBtn
    :btnTextItems="[{ text: `创建${data.title.slice(0, 2)}任务`, key: 'create' }]"
    @btnClick="bottomBtnClick">
    <template #head>
      <view>
        <view class="flex-l" style="justify-content: flex-end">
          <view class="flex flex-b p-right-30" style="width: calc(50% + 10rpx)">
            <md-icon type="bg" name="chaoshu_icon" width="80" height="80" circle></md-icon>
            <bc-tequan />
          </view>
        </view>
        <bc-title-text text="对于比较复杂的用户问题，用户可以选择问诊功能，进行咨询的人工服务。" />
      </view>
    </template>
    <view class="container">
      <block v-for="item in data.list" :key="item.id">
        <bc-task-item
          :item="item"
          :desc="roundDesc(item.taskStatus)"
          @click="() => handleJump(item)"
          @swipeClick="onSwipeClick"></bc-task-item>
      </block>
      <mescroll-empty v-if="data.list.length == 0"></mescroll-empty>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog :title="`创建${data.title.slice(0, 2)}任务`" ref="popup" @ok="handleOk" @cancel="handleCancel">
      <!-- :maxlength="6" -->
      <uni-easyinput
        v-model="data.value"
        primaryColor="#FD7A7A"
        :styles="{
          borderColor: '#FD7A7A',
        }"
        placeholder="请输入名称"></uni-easyinput>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
// 接口
import api from '@/api';
import type { Four, Task } from '@/api/data';
// 工具
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import { hasItTimeOut, Toast } from '@/utils/util';
import type { BtnTextItem } from '@/components/md-ui/components/md-page/md-page.vue';
import { question3, shuxiModule } from './shuxi/stage0';
import { closeOverTimeDetailStep, getTaskDetail, savePoint } from '@/utils/api';

const data = reactive<any>({
  title: '',
  list: [],
  module: '',
  value: '',
});
const popup = ref<any>(null);

const roundDesc = (status: number) => {
  if ([61, 62].includes(status)) {
    return '下次聊天开启倒计时';
  } else if (status === 63) {
    return 'Z倒计时';
  } else if (status === 65) {
    return '对方找倒计时';
  }
  return '聊天任务进行中';
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

const handleJump = async (item: Task.List.Data & Four.GetTaskDetail.Data) => {
  if (item.stepType === 'familiar_s2') {
    // 获取目标时间是否超时
    const _hasItTimeOut = hasItTimeOut(item?.endTime);
    // 如果时间倒计时未结束，则不让点击
    if (!_hasItTimeOut) {
      return;
    }
    question3({
      taskId: item.taskId,
      specialStepId: item.specialStepId,
    });
  }
  // if (item.stepType === 'familiar_s4') {
  // }
  // 跳转对方主动找页面
  uni.redirectTo({ url: '/pages/sub-page/stepTask/round?module=熟悉模块&taskId=' + item.taskId });
  // shuxiModule({
  //   isScoreFlag: 0,
  //   taskId: item.taskId,
  //   endTime: item.endTime,
  //   // stepType: item.stepType,
  // });
  // const data = await fetchGetTaskDetail(item.taskId);
  // uni.navigateTo({
  //   url: '/pages/sub-page/stepTask/problem',
  // });
};

const onSwipeClick = () => {
  getTaskList();
};

/**
 * 接口相关
 */
// 获取任务列表
const getTaskList = async (module?: any) => {
  try {
    const res = await api.task.list({
      moduleCode: module || data.module,
    });
    const list = [];
    for (let item of res?.data || []) {
      // 获取任务详情
      const detail = await getTaskDetail(item.taskId);
      list.push({ ...item, ...detail });
    }
    data.list = list;
  } catch (error) {}
};

// 创建任务
const fetchCreateTask = async (params: Pick<Task.Create.Body, 'taskName'>) => {
  try {
    const res = await api.task.createTask({ ...params, moduleCode: data.module });
    // 只有【熟悉模块】和【超熟模块】才有问卷
    if (['熟悉模块', '超熟模块'].includes(data.title)) {
      uni.navigateTo({
        url: `/pages/sub-page/stepTask/questionnaire?taskId=${res.data?.taskId}&taskName=${params?.taskName}&module=${data.title}`,
      });
    }
    handleCancel();
  } catch (error) {}
};

onLoad((options: any) => {
  const module = options?.module as taskModuleKey;
  data.module = taskModule[module];
  data.title = module;
  getTaskList(taskModule[module]);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 180rpx 30rpx 30rpx;
  box-sizing: border-box;
}
</style>
