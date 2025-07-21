<template>
  <md-page :title="data.prevPageQuery?.taskName" bgType="dark">
    <view
      class="container"
      :style="{
        height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight} + 80rpx) - (env(safe-area-inset-bottom) + 112rpx))`,
        overflowY: 'scroll',
      }">
      <y-tabs
        sticky
        type="custom"
        :scrollThreshold="3"
        :offsetTop="['-12px']"
        v-model="data.activeIndex"
        :color="' '"
        :style="{ height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight}))` }"
        title-active-color="#333"
        title-inactive-color="#777"
        scrollspy>
        <y-tab v-for="tab in data.tabs" :title="tab.label" :key="tab.key">
          <view class="content m-top-30">
            <bc-qa-list
              bgType="dark"
              :data="getDataBy2D(data.list, tab.key)"
              :submitList="data.submitList[tab.key]?.moduleUserQuestionList" />
          </view>
        </y-tab>
      </y-tabs>
    </view>
    <bc-bottom-bar showRecharge bgType="dark" rightBtn @ok="hanldeSubmit" @back="handleBack" />
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk">
      <view v-if="modelType === 'submit'">提交后将消耗掉虚拟币以获取方案，请确认是否提交。</view>
      <view v-else>您未完成问卷填写，请确认是否要返回</view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
// 接口
import api from '@/api';
import type { Task } from '@/api/data';
// 工具
import { getDataBy2D } from '@/utils/util';
// 字典
import { payModule, taskModule } from '@/utils/data';
import { checkVirtualCoin } from '@/utils/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  list: [],
  submitList: [],
  tabs: [],
  current: '',
});
const popup = ref(null);
const modelType = ref('submit');

const handleBack = () => {
  modelType.value = 'back';
  popup.value!.open();
};

const hanldeSubmit = async () => {
  modelType.value = 'submit';
  const open = await checkVirtualCoin(payModule['定制一阶段付费']);
  if (open) {
    popup.value!.open();
  }
};

const handleOk = () => {
  if (modelType.value === 'submit') {
    let moduleUserQuestionList: any[] = [];
    data.submitList?.forEach((item: { moduleUserQuestionList: any[] }) => {
      moduleUserQuestionList = moduleUserQuestionList.concat(item.moduleUserQuestionList);
    });
    submitQuestion({
      taskId: data.prevPageQuery?.taskId,
      moduleUserQuestionList,
    });
  } else {
    // 返回
    uni.navigateBack();
  }
};

/**
 * 接口相关
 */
const fetchModuleQuestionList = async () => {
  try {
    const res = await api.task.moduleQuestionList({ moduleCode: taskModule['定制模块'] });
    data.tabs = res.data?.map((item, index) => ({ label: item.stageName, key: index }));
    data.current = res.data?.[0]?.stageId;
    data.list = res.data?.map(wrap => ({
      ...wrap,
      questionVoList: wrap.questionVoList?.map(item => {
        return {
          id: item.questionId,
          title: `NO.${item.questionNum}`,
          content: item.questionTitle,
          checkboxList: item.optionContentList,
          type: item.questionType,
        };
      }),
    }));
    data.submitList = res.data?.map(wrap => {
      return {
        moduleUserQuestionList: wrap.questionVoList?.map(({ questionId, ...item }) => ({
          questionId,
          userSubmitContent: item.questionType == 1 ? undefined : '',
        })),
      };
    });
  } catch (error) {}
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  try {
    await api.task.submitQuestion(params);
    // 跳转无答案页面
    uni.navigateTo({
      url: `/pages/sub-page/custom/analysis?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
    });
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  fetchModuleQuestionList();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx 30rpx calc(30rpx + $safe-bottom + 48px);
  background: #333;
}

::v-deep .y-tabs {
  &.is-areaScroll.is-scrollNav {
    height: 100%;
  }
  .y-tabs__wrap {
    width: 100%;
    height: 84rpx;
    padding: 8rpx;
    box-sizing: border-box;
    position: sticky;
    background: linear-gradient(90deg, #f8f142 0%, #fcf9ae 100%);
    border: 1px;
    border-radius: 24rpx;
  }

  .y-tabs__nav {
    height: 100%;
    gap: 8rpx;
    white-space: nowrap;
    width: 100%;
  }

  .y-tab {
    display: inline-block;
    height: 68rpx;
    line-height: 68rpx;
    padding: 0 48rpx;
    box-sizing: border-box;
    border-radius: 16rpx;
    text-align: center;
    font-size: 28rpx;
    font-weight: 600;

    &.is-active {
      background: white;
    }
  }
}
</style>
