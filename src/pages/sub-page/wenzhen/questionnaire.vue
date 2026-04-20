<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <y-tabs
        sticky
        type="custom"
        :scrollThreshold="3"
        :offsetTop="[88]"
        v-model="data.activeIndex"
        :color="' '"
        :style="{ height: `calc(100vh - (env(safe-area-inset-top) + 44px + ${data.statusBarHeight}))` }"
        title-active-color="#333"
        title-inactive-color="#777"
        scrollspy>
        <y-tab v-for="tab in data.tabs" :title="tab.label" :key="tab.key">
          <view class="content m-top-30">
            <bc-qa-list
              :data="getDataBy2D(data.list || [], tab.key) || []"
              :submitList="data.submitList?.[tab.key]?.moduleUserQuestionList || []" />
          </view>
        </y-tab>
      </y-tabs>
    </view>
    <bc-bottom-bar showRecharge rightBtn @ok="hanldeSubmit" @back="handleBack" />
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk" :hideCancel="true">
      <view v-if="modelType === 'submit'">提交后将消耗心币以获取方案，请确认是否提交。</view>
      <view v-else>您未完成问卷填写，请确认是否要返回</view>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Task } from '@/api/data';
// 工具
import { getDataBy2D } from '@/utils/util';
// 字典
import { taskModule, payModule } from '@/utils/data';
import { checkVirtualCoin } from '@/utils/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  list: [],
  submitList: [],
  tabs: [],
  activeIndex: 0, // 标签页当前选择项的下标
});

const popup = ref(null);
const modelType = ref('submit');

const handleBack = () => {
  modelType.value = 'back';
  popup.value!.open();
};

const hanldeSubmit = async () => {
  modelType.value = 'submit';
  const open = await checkVirtualCoin(payModule['问诊一阶段付费']);
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
    const res = await api.task.moduleQuestionList({ moduleCode: taskModule['问诊模块'] });
    // 固定生成三个 tab：问卷A、问卷B、问卷C
    data.tabs = [
      { label: '问卷A', key: 0 },
      { label: '问卷B', key: 1 },
      { label: '问卷C', key: 2 },
    ];
    data.list = res.data?.map(wrap => ({
      ...wrap,
      questionVoList: wrap.questionVoList?.map(item => {
        return {
          id: item.questionId,
          title: `问题.${item.questionNum}`,
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
    // 跳转无答案页面（使用redirectTo替换当前页面，避免返回到问卷页）
    uni.redirectTo({
      url: `/pages/sub-page/wenzhen/analysis?taskId=${data.prevPageQuery.taskId}&taskName=${data.prevPageQuery?.taskName}`,
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
    background: linear-gradient(90deg, #9AB3FF 0%, #7A59ED 100%);
    border-radius: 24rpx;
  }

  .y-tabs__nav {
    height: 100%;
    width: 100%;
    display: flex;
    gap: 8rpx;
    white-space: nowrap;
  }

  .y-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 68rpx;
    line-height: 68rpx;
    padding: 0;
    box-sizing: border-box;
    border-radius: 16rpx;
    text-align: center;
    font-size: 28rpx;
    font-weight: 600;

    &.is-active {
      background: white;
      color: #7A59ED !important;
    }
  }
}
</style>
