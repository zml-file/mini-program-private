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
    <md-dialog ref="popup" @ok="handleOk">提交后将消耗掉虚拟币以获取方案，请确认是否提交。</md-dialog>
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
    // 跳转无答案页面
    uni.navigateTo({
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
  .bottom-btn {
    width: 100%;
    padding: 20rpx;
    box-sizing: border-box;
    position: fixed;
    bottom: $safe-bottom;
    left: 0;
    background: white;
    box-shadow: 0 0 20rpx 0 #ebebeb80;
    z-index: 98;
    gap: 20rpx;
    display: flex;
    justify-content: flex-end;
    & > .btn {
      width: 150rpx;
      height: 72rpx;
      line-height: 70rpx;
      text-align: center;
      border-radius: 16rpx;
      border: 1rpx solid #222222;
      font-size: 32rpx;
      &.active {
        background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9753d 0%, #f8a04f 48.44%, #f7b261 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
          radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
          radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
            /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
        border-color: transparent;
        color: white;
      }
    }
  }
}
</style>
