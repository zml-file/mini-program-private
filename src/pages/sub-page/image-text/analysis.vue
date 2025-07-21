<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <bc-countdown desc="倒计时结束后，将刷新页面上的内容；" :time="data.time" />
      <block v-for="item in data.list" :key="item">
        <bc-img-text-item :item="item" @select="handleSelRowImg" :selectedNum="data.selectedNum"></bc-img-text-item>
      </block>
      <bc-bottom-bar
        countdown-desc="倒计时结束后，此任务将结束，内容将消失"
        showCountdown
        :countdownTime="data.bottomTime"
        okText="续时"
        @ok="handleOk"
        @timeup="countDownTimeup" />
    </view>
    <!-- 续时弹窗 -->
    <md-dialog ref="popup" title="请选择续时周期" @ok="handleOk" @cancel="handleCancel">
      <uni-data-checkbox
        mode="list"
        icon="right"
        v-model="data.continuedTimeValue"
        :localdata="data.continuedTimeList"></uni-data-checkbox>
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面携带过来的参数
  list: [
    {
      title: '图文说明',
      content: '这是图文模块的文字说明，这是图文模块的文字说明，这是图文模块的文字说明，这是图文模块的文字说明！',
      type: 'text',
    },
    {
      title: '图文内容一',
      type: 'img_text',
      content:
        '这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，',
      imgs: 3,
    },
    {
      title: '图文内容二',
      type: 'img_text',
      content:
        '这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，这段话是根据您的情况描述所得出的情况描述的结论，',
      imgs: 3,
    },
  ],
  time: '',
  bottomTime: '',
  continuedTimeValue: '', // 选中的续时项
  continuedTimeList: [],
  // 点击图片相关处理
  selectedNum: '',
});
const popup = ref(null);

const countDownTimeup = () => {
  // 倒计时结束
  getQuestionAnswerList();
};

/**
 * 图文处理
 */

const handleSelRowImg = (num: number) => {
  data.selectedNum = num;
};

/**
 * 弹窗处理
 */
const handleOk = () => {
  popup.value!.open();
};

const handleCancel = () => {
  // popup.value!.open();
};

// 获取问题答案列表
const getQuestionAnswerList = async (taskId?: string) => {
  try {
    const res = await api.task.searchQuestionAnswer({ taskId: taskId || data.prevPageQuery?.taskId });
    data.list = res.data?.contentList.map(item => ({
      replayId: item.replayId,
      title: item.answerTitle,
      content: item.answerContent,
      imgs: item.imgUrl,
      type: 'img_text',
      status: 2,
    }));
    data.time = res.data.functionEndTime;
    data.bottomTime = res.data.endTime;
  } catch (error) {}
};

// 获取续时下拉
const fetchDropList = async () => {
  try {
    const res = await api.common.dropList(['renew_time']);
    data.continuedTimeList = res.data?.renew_time?.map(item => ({ ...item, text: item.label }));
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  getQuestionAnswerList(option?.taskId);
  fetchDropList();
});
</script>

<style lang="scss" scoped>
/*::v-deep {
  .uni-data-checklist .checklist-group {
    flex-direction: column;
    .checklist-box {
      justify-content: center;
      margin: 10px 0;
      .checklist-content {
        flex: none;
      }
    }
  }
}*/
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  .countdown {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-bottom: 60rpx;
    .desc {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 4rpx 16rpx;
      box-sizing: border-box;
      border-radius: 8rpx;
      background: #fdedea;
      color: #c98c59;
      font-size: 16rpx;
    }
  }
}
</style>
