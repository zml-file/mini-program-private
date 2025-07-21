<template>
  <md-page
    title="问诊模块"
    isBtn
    :subHead="40"
    :btnTextItems="[{ text: '创建问诊分析', key: 'create' }]"
    @btnClick="bottomBtnClick">
    <template #head>
      <view class="flex-l" style="justify-content: flex-end">
        <view class="flex flex-b p-right-30" style="width: calc(50% + 10rpx)">
          <md-icon type="bg" name="wenzhen_icon" width="80" height="80" circle></md-icon>
          <bc-tequan />
        </view>
      </view>
    </template>
    <view class="container">
      <block v-for="item in data.list" :key="item.taskId">
        <bc-task-item
          :item="item"
          @swipeClick="onSwipeClick"
          desc="详细方案回复3内容显示倒计时:"
          @click="() => handleJump(item)"></bc-task-item>
      </block>
      <mescroll-empty v-if="data.list.length == 0"></mescroll-empty>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog ref="popup" @ok="handleOk" @cancel="handleCancel" title="创建问诊分析">
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
import api from '@/api/index';
import type { Task } from '@/api/data';
// 工具
import { Toast } from '@/utils/util';
// 字典
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  list: [],
  value: '',
});
const popup = ref(null);

const onSwipeClick = () => {
  getTaskList();
};

const handleOk = () => {
  console.log('ok', data.value);
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
  let url = '';
  let params = `taskId=${item.taskId}&taskName=${item.taskName}`;
  if (item.taskStatus === 20) {
    // 20-问题已提交
    url = `/pages/sub-page/wenzhen/analysis?${params}`;
  } else if (item.taskStatus === 30) {
    // 30-问题答案已给出
    url = `/pages/sub-page/wenzhen/scheme?${params}`;
  } else if (item.taskStatus >= 50) {
    // 50-二次提交的问题等待回复，51-二次提交的问题回复中，52-二次提交的问题回复完成
    url = `/pages/sub-page/wenzhen/detail?${params}&taskStatus=${item.taskStatus}`;
  } else {
    // 10-初始化
    url = `/pages/sub-page/wenzhen/questionnaire?${params}`;
  }
  uni.navigateTo({
    url,
  });
};

/**
 * 接口相关
 */
const getTaskList = async () => {
  try {
    const res = await api.task.list({
      moduleCode: taskModule['问诊模块'],
    });
    data.list = res.data;
  } catch (error) {}
};

// 创建任务
const fetchCreateTask = async (params: Pick<Task.Create.Body, 'taskName'>) => {
  try {
    const res = await api.task.createTask({ ...params, moduleCode: taskModule['问诊模块'] });
    uni.navigateTo({
      url: `/pages/sub-page/wenzhen/questionnaire?taskId=${res.data?.taskId}&taskName=${params?.taskName}`,
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
