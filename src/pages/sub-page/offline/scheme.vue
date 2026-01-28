<template>
  <md-page :title="data.prevPageQuery?.taskName">
    <view class="container">
      <block v-for="item in displayList" :key="item.id">
        <bc-title-card :item="item" @click="handleClick" :showLevel="data.showLevel"></bc-title-card>
      </block>
      <bc-bottom-bar
        countdown-desc="倒计时结束后，此任务将结束，回复将消失"
        :countdownTime="data.time"
        showCountdown
        :showOk="false" />
      <!-- 提示弹窗 -->
      <md-dialog ref="popup" title="温馨提示" @ok="handleOk" @cancel="handleCancel">
        点击确定后，将开启为期3天的倒计时，倒计时结束后，该页面上所有的回复将被清空，该线下计划也将结束。
      </md-dialog>
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
// 工具
import { hasItTimeOut } from '@/utils/util';
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带过来的参数
  list: [],
  allSets: [], // 所有套餐数据
  time: '',
  showLevel: -1,
});
const popup = ref(null);

// 本地存储的key
const STORAGE_KEY_PREFIX = 'offline_scheme_';

// 获取当前任务的存储key
const getStorageKey = (taskId: number) => {
  return `${STORAGE_KEY_PREFIX}${taskId}`;
};

// 获取或创建随机套餐选择
const getOrCreateRandomSet = (taskId: number, totalSets: number) => {
  const storageKey = getStorageKey(taskId);
  const stored = uni.getStorageSync(storageKey);

  const now = Date.now();
  const EXPIRE_TIME = 36 * 60 * 60 * 1000; // 36小时（毫秒）

  // 如果存在存储数据且未过期，返回存储的索引
  if (stored && stored.selectedIndex !== undefined && stored.expireAt) {
    if (now < stored.expireAt) {
      console.log('[Offline] 使用已存储的套餐:', stored.selectedIndex);
      return stored.selectedIndex;
    } else {
      console.log('[Offline] 套餐已过期，重新随机选择');
    }
  }

  // 随机选择一个套餐
  const randomIndex = Math.floor(Math.random() * totalSets);
  const expireAt = now + EXPIRE_TIME;

  // 存储选择和过期时间
  uni.setStorageSync(storageKey, {
    selectedIndex: randomIndex,
    expireAt: expireAt,
    createdAt: now
  });

  console.log('[Offline] 新随机选择套餐:', randomIndex, '过期时间:', new Date(expireAt).toLocaleString());
  return randomIndex;
};

// 计算当前显示的内容列表
const displayList = computed(() => {
  if (data.allSets.length === 0) {
    return [];
  }

  const taskId = data.prevPageQuery?.taskId;
  if (!taskId) {
    return data.allSets[0] || [];
  }

  const selectedIndex = getOrCreateRandomSet(taskId, data.allSets.length);
  return data.allSets[selectedIndex] || [];
});

const handleClick = () => {
  uni.navigateTo({
    url: '/pages/sub-page/offline/analysis',
  });
};

/**
 * 弹窗处理
 */
const handleOk = () => {
  fetchTaskEndTime();
};

const handleCancel = () => {
  uni.redirectTo({
    url: '/pages/sub-page/offline/list',
  });
};

/**
 * 接口相关
 */

// 获取问题列表
const getQuestionAnswerList = async (taskId: number) => {
  try {
    const res = await api.task.searchQuestionAnswer({ taskId });

    // 映射原始数据
    const mappedList = res.data?.contentList.map(item => ({
      title: item.answerTitle,
      content: item.answerContent,
      status: 1,
      replayId: item.replayId,
      showLevel: item.showLevel,
    })) || [];

    // 将内容按 replayId 分组成不同的套餐
    // 假设 replayId 的值可以用来区分不同的套餐
    // 如果后端没有明确的套餐标识，可以按顺序分组
    const setMap: Record<string, any[]> = {};
    mappedList.forEach(item => {
      // 使用 replayId 的某种规则来分组，这里假设每3个为一套
      // 或者如果有明确的套餐标识字段，使用该字段
      const setKey = String(Math.floor((item.replayId || 0) / 3)); // 示例：每3个replayId为一套
      if (!setMap[setKey]) {
        setMap[setKey] = [];
      }
      setMap[setKey].push(item);
    });

    // 按照 key 排序，确保套餐顺序一致
    const sortedKeys = Object.keys(setMap).sort((a, b) => Number(a) - Number(b));
    data.allSets = sortedKeys.map(key => setMap[key]);

    // 保留原有的 list 用于兼容性
    data.list = mappedList;
    data.time = res.data.endTime;

    console.log('[Offline] 套餐总数:', data.allSets.length);

    // 如果没返回时间，则是第一次进入
    if (!res.data?.endTime) {
      // 用户第一次打开任务，如果该任务显示此页面的时候，页面上会有灰色蒙版挡住，并弹出如下对话框
      popup.value!.open();
      return;
    }
    let _hasItTimeOut = hasItTimeOut(res.data.endTime);
    // 超时
    if (_hasItTimeOut) {
      uni.showModal({
        title: '温馨提示',
        content: '您的线下计划有效期已经截止。',
        showCancel: false,
      });
    }
  } catch (error) {}
};

const fetchGetInfo = async () => {
  try {
    const res = await api.common.info();
    data.showLevel = res.data?.userLevel || -1;
  } catch (error) {}
};

// 任务结束时间
const fetchTaskEndTime = async () => {
  try {
    const res = await api.task.taskEndTime({ moduleCode: taskModule['线下模块'], taskId: data.prevPageQuery?.taskId });
    if (!!res?.data) {
    }
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  getQuestionAnswerList(option?.taskId);
});

onShow(() => {
  fetchGetInfo();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  .list {
    width: 100%;
    padding: 16rpx 36rpx;
    box-sizing: border-box;
    gap: 20rpx;
    border-radius: 24rpx;
    border: 1rpx solid #dddddd;
    box-shadow: 0 8rpx 8rpx 0 #00000040;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
    .title {
      margin-top: -40rpx;
      font-size: 36rpx;
      display: inline-block;
      height: 60rpx;
      line-height: 60rpx;
      padding: 0 40rpx;
      box-sizing: border-box;
      gap: 2px;
      border-radius: 10rpx;
      background: linear-gradient(159.7deg, #fff8ee 10.76%, #fde3e0 93.75%);
      box-shadow: 0 0 12rpx 0 #c4ae8680;
    }
    .content {
      font-size: 24rpx;
    }
  }
}
</style>
