<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <block v-for="(item, index) in data.list" :key="item.id">
        <block v-if="item.type == 1">
          <bc-qa-item
            @checked="(val: string | number) => (data.submitList[index].optionId = +val)"
            :item="item"
            :checkboxList="item.checkboxList"></bc-qa-item>
        </block>
        <block v-else>
          <bc-qa-item v-model="data.submitList[index].userSubmitContent" :item="item" type="text"></bc-qa-item>
        </block>
      </block>
      <bc-bottom-bar rightBtn @ok="handleSubmit" @back="handleBack" />
    </view>
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk">提交后将消耗心币以获取方案，请确认是否提交。</md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { List } from './data';
// 接口
import api from '@/api';
import type { Task } from '@/api/data';
// 字典
import { taskModule, payModule } from '@/utils/data';
import { checkVirtualCoin } from '@/utils/api';

// 声明变量
const data = reactive<List.IProps>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
  submitList: [],
});
const popup = ref(null);

const handleSubmit = async () => {
  const open = await checkVirtualCoin(payModule['线下一阶段付费']);
  if (open) {
    popup.value!.open();
  }
};

const handleBack = () => {
  uni.showModal({
    title: '提示',
    content: '您未完成问卷填写，请确认是否要返回',
    success: res => {
      if (res.confirm) {
        uni.redirectTo({
          url: '/pages/sub-page/offline/list',
        });
      }
    },
  });
};

const handleOk = () => {
  // console.log(data.submitList);
  submitQuestion({
    taskId: data.prevPageQuery?.taskId,
    moduleUserQuestionList: data.submitList,
  });
};

/**
 * 接口相关
 */
// 获取问题列表
const getQuestionList = async () => {
  try {
    const res = await api.task.moduleQuestion({
      moduleCode: taskModule['线下模块'],
    });
    data.list = res.data?.questionVoList?.map(item => ({
      id: item.questionId,
      title: `NO.${item.questionNum}`,
      content: item.questionTitle,
      checkboxList: item.optionContentList,
      type: item.questionType,
    }));
    data.submitList = res.data?.questionVoList.map(({ questionId, ...item }) => ({
      questionId,
      userSubmitContent: item.questionType == 1 ? undefined : '',
    }));
  } catch (error) {}
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  try {
    await api.task.submitQuestion(params);
    // 跳转无答案页面（使用redirectTo替换当前页面，避免返回到问卷页）
    uni.redirectTo({
      url: `/pages/sub-page/offline/analysis?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
    });
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  getQuestionList();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx 30rpx calc(30rpx + $safe-bottom + 48px);
}

:deep(.list) {
  width: 88%;
  margin-left: auto;
  margin-right: auto;
}
</style>
