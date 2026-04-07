<template>
  <md-page :title="data.moduleTitle || data.prevPageQuery?.taskName">
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
        showBack
        backText="返回"
        @ok="handleOk"
        @back="handleBack"
        @timeup="countDownTimeup" />
    </view>
    <!-- 续时弹窗 -->
    <md-dialog ref="popup" title="请选择续时周期" @ok="handleConfirm" @cancel="handleCancel">
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
  moduleTitle: '', // 模块标题
  list: [],
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

const handleSelRowImg = async (selectedKey: number) => {
  if (!selectedKey) return;
  try {
    await api.task.updateReplyIsUsed({ replyId: selectedKey });
    data.selectedNum = selectedKey;
    uni.showToast({ title: '已选中', icon: 'success' });
  } catch (error) {
    console.error('[图文分析] 选中答案上报失败:', error);
    uni.showToast({ title: '选中失败，请稍后重试', icon: 'none' });
  }
};

/**
 * 弹窗处理
 */
// 点击续时按钮，打开弹窗
const handleOk = () => {
  console.log('[图文分析] 点击续时按钮');
  console.log('[图文分析] 续时周期列表:', data.continuedTimeList);
  console.log('[图文分析] 续时周期列表长度:', data.continuedTimeList?.length);

  if (!data.continuedTimeList || data.continuedTimeList.length === 0) {
    console.error('[图文分析] 续时周期列表为空，无法显示弹窗');
    uni.showToast({
      title: '续时周期数据加载失败，请稍后重试',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  popup.value!.open();
};

// 弹窗确认回调
const handleConfirm = async () => {
  console.log('[图文分析] 确认续时，选中的周期:', data.continuedTimeValue);

  if (!data.continuedTimeValue) {
    uni.showToast({
      title: '请选择续时周期',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  try {
    await api.task.renewTime({
      taskId: data.prevPageQuery?.taskId,
      time: data.continuedTimeValue,
    });

    uni.showToast({
      title: '续时成功',
      icon: 'success',
      duration: 2000
    });

    data.continuedTimeValue = '';
    popup.value!.close();
    await getQuestionAnswerList(data.prevPageQuery?.taskId);
  } catch (error) {
    console.error('[图文分析] 续时失败:', error);
    uni.showToast({
      title: '续时失败，请稍后重试',
      icon: 'none',
      duration: 2000
    });
  }
};

const handleCancel = () => {
  console.log('[图文分析] 取消续时');
  data.continuedTimeValue = '';
  popup.value!.close();
};

// 返回按钮处理
const handleBack = () => {
  console.log('[图文分析] 点击返回按钮');
  uni.navigateBack({
    delta: 1
  });
};

// 获取问题答案列表
const getQuestionAnswerList = async (taskId?: string) => {
  try {
    console.log('[图文分析] 开始获取问题答案列表，taskId:', taskId);
    const res = await api.task.searchQuestionAnswer({ taskId: taskId || data.prevPageQuery?.taskId });
    console.log('[图文分析] 接口响应:', res);
    console.log('[图文分析] functionEndTime:', res.data?.functionEndTime);
    console.log('[图文分析] endTime:', res.data?.endTime);
    console.log('[图文分析] contentList:', res.data?.contentList);

    // 处理 contentList 为 null 的情况
    if (res.data?.contentList && Array.isArray(res.data.contentList)) {
      data.list = res.data.contentList.map(item => ({
        replayId: item.replayId,
        title: item.answerTitle,
        content: item.answerContent,
        imgs: item.imgUrl,
        type: 'img_text',
        status: 2,
      }));
      console.log('[图文分析] 内容列表已设置，长度:', data.list.length);
    } else {
      console.warn('[图文分析] contentList 为空或不是数组，清空列表');
      data.list = [];
    }

    data.time = res.data.functionEndTime;
    data.bottomTime = res.data.endTime;

    console.log('[图文分析] 设置后的 data.time:', data.time);
    console.log('[图文分析] 设置后的 data.bottomTime:', data.bottomTime);

    // 检查时间是否有效
    if (!data.time) {
      console.warn('[图文分析] functionEndTime 为空，倒计时将显示为0');
    }
    if (!data.bottomTime) {
      console.warn('[图文分析] endTime 为空，底部倒计时将显示为0');
    }
  } catch (error) {
    console.error('[图文分析] 获取问题答案列表失败:', error);
    data.list = [];
    data.time = '';
    data.bottomTime = '';
    uni.showToast({ title: '获取图文结果失败', icon: 'none' });
  }
};

// 获取续时下拉
const fetchDropList = async () => {
  try {
    console.log('[图文分析] 开始获取续时周期列表');
    const res = await api.common.dropList(['renew_time']);
    console.log('[图文分析] 续时周期接口响应:', res);
    console.log('[图文分析] renew_time 数据:', res.data?.renew_time);

    if (!res.data?.renew_time) {
      console.error('[图文分析] renew_time 数据为空');
      return;
    }

    // 打印原始数据的每一项
    res.data.renew_time.forEach((item, index) => {
      console.log(`[图文分析] 原始数据[${index}]:`, JSON.stringify(item));
      console.log(`[图文分析] 原始数据[${index}] 所有字段:`, Object.keys(item));
    });

    // 根据 value 值生成描述性文字
    data.continuedTimeList = res.data?.renew_time?.map(item => {
      // 如果 label 只是数字，根据 value 生成描述
      let displayText = item.label;

      // 尝试根据 value 生成更友好的显示文本
      if (item.value) {
        const value = Number(item.value);
        if (value === 1) {
          displayText = '1天';
        } else if (value === 3) {
          displayText = '3天';
        } else if (value === 5) {
          displayText = '5天';
        } else if (value === 7) {
          displayText = '7天';
        } else if (value === 10) {
          displayText = '10天';
        } else if (value === 15) {
          displayText = '15天';
        } else if (value === 30) {
          displayText = '30天';
        } else {
          displayText = `${value}天`;
        }
      }

      return {
        ...item,
        text: displayText,
        label: item.label
      };
    });

    console.log('[图文分析] 续时周期列表:', data.continuedTimeList);

    // 打印映射后数据的每一项
    data.continuedTimeList.forEach((item, index) => {
      console.log(`[图文分析] 映射后数据[${index}]:`, JSON.stringify(item));
      console.log(`[图文分析] 映射后数据[${index}] text:`, item.text, 'value:', item.value);
    });
  } catch (error) {
    console.error('[图文分析] 获取续时周期列表失败:', error);
  }
};

onLoad(option => {
  data.prevPageQuery = {
    ...(option as Record<string, any>),
    taskId: option?.taskId,
    taskName: option?.taskName ? decodeURIComponent(option.taskName as string) : '',
  };

  // 从路由参数中获取模块标题
  if (option?.moduleName) {
    data.moduleTitle = decodeURIComponent(option.moduleName as string);
    console.log('[图文分析] 从路由参数获取模块标题:', data.moduleTitle);
  }

  getQuestionAnswerList(data.prevPageQuery?.taskId);
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
