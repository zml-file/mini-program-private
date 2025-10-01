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
              :data="getDataBy2D(data.list, tab.key)"
              :submitList="data.submitList[tab.key]?.moduleUserQuestionList" />
          </view>
        </y-tab>
      </y-tabs>
    </view>
    <bc-bottom-bar showRecharge rightBtn @ok="hanldeSubmit" @back="handleBack" />
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk">
      <view v-if="modelType === 'submit'">您已完成了所有问卷内容的填写，请确认是否提交</view>
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
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
// 字典
import { shuxiModule } from './shuxi/stage0';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  list: [],
  submitList: [],
  tabs: [],
  activeIndex: 0, // 标签页当前选择项的下标
  loading: false, // 加载状态
});

const popup = ref<any>(null);
const modelType = ref('submit');

const handleBack = () => {
  modelType.value = 'back';
  popup.value!.open();
};

const hanldeSubmit = async () => {
  if (data.loading) return; // 防止重复点击
  modelType.value = 'submit';
  popup.value!.open();
};

const handleOk = () => {
  if (data.loading) return; // 防止重复点击
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
  uni.showLoading({ title: '加载中...', mask: true });
  try {
    const res = await api.task.moduleQuestionList({
      moduleCode: taskModule[data.prevPageQuery.module as taskModuleKey],
    });
    data.tabs = res.data?.map((item, index) => ({ label: item.stageName, key: index }));
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
  } catch (error) {
  } finally {
    uni.hideLoading();
  }
};

// 提交问卷
const submitQuestion = async (params: Task.SubmitQuestion.Body) => {
  data.loading = true;
  uni.showLoading({ title: '提交中...', mask: true });
  try {
    const res = await api.four.submitQuestion(params);
    console.log('问卷提交成功，返回数据:', res);
    popup.value!.close();
    uni.hideLoading();
    data.loading = false;

    if (data.prevPageQuery.module === '熟悉模块') {
      // 熟悉模块：执行特殊流程
      // shuxiModule 内部会通过弹窗引导用户，并在最后使用 redirectTo 跳转到对应列表
      // 这个过程会替换当前的问卷页面，所以不需要手动返回
      console.log('开始执行熟悉模块流程, isScoreFlag:', res.data.isScoreFlag);
      shuxiModule({
        isScoreFlag: res.data.isScoreFlag,
        taskId: data.prevPageQuery?.taskId,
      });
    } else if (data.prevPageQuery.module === '超熟模块') {
      // 超熟模块：返回超熟列表
      console.log('超熟模块，返回列表');
      uni.navigateBack();
    } else {
      // 其他模块（不熟、陌生、免费）：返回对应列表
      console.log('其他模块，返回列表');
      uni.navigateBack();
    }
  } catch (error) {
    console.error('问卷提交失败:', error);
    data.loading = false;
    uni.hideLoading();
  }
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
    background: linear-gradient(90deg, #ff9d8d 0%, #ffd4cc 100%);
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
