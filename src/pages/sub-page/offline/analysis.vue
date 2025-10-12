<template>
  <md-page :title="data.prevPageQuery?.taskName || '咨询分析'">
    <view class="container">
      <!-- 块状倒计时 -->
      <view class="countdown-wrap" v-if="countdown.running">
        <view class="box-line">
          <!-- 时 -->
          <template v-for="(ch, idx) in countdown.hoursStr" :key="'h'+idx">
            <view class="time-box" :class="{ 'time-box--first': idx === 0 }">{{ ch }}</view>
          </template>
          <view class="sep">:</view>
          <!-- 分 -->
          <template v-for="(ch, idx) in countdown.minutesStr" :key="'m'+idx">
            <view class="time-box">{{ ch }}</view>
          </template>
          <view class="sep">:</view>
          <!-- 秒 -->
          <template v-for="(ch, idx) in countdown.secondsStr" :key="'s'+idx">
            <view class="time-box">{{ ch }}</view>
          </template>
        </view>
      </view>

      <!-- 提示条 -->
      <view class="tip">
        <md-icon name="gantanhao" width="41" height="37" color="#7b5cff" />
        <text class="tip-text">倒计时结束后，将根据您的会员等级显示解决方案</text>
      </view>

      <!-- 方案卡片 -->
      <block v-for="(item, idx) in data.list" :key="(item.id || item.replayId || idx)">
        <bc-title-card :item="item" color="purple"></bc-title-card>
      </block>

      <bc-bottom-bar :showOk="false" @back="handleBack" rightBtn />
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
// 接口
import api from '@/api';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面携带过来的参数
  list: [],
  time: '',
});

/* 倒计时状态与工具 */
const countdown = reactive<{
  running: boolean;
  daysStr: string[];
  hoursStr: string[];
  minutesStr: string[];
  secondsStr: string[];
  timer: any;
  target: number;
}>({
  running: false,
  daysStr: ['0','0'],
  hoursStr: ['0','0'],
  minutesStr: ['0','0'],
  secondsStr: ['0','0'],
  timer: 0,
  target: 0,
});

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);
const split2 = (s: string) => s.split('');
const setBoxes = (d: number, h: number, m: number, s: number) => {
  countdown.daysStr = split2(String(d).padStart(2, '0'));
  countdown.hoursStr = split2(pad2(h));
  countdown.minutesStr = split2(pad2(m));
  countdown.secondsStr = split2(pad2(s));
};
const stopCountdown = () => {
  if (countdown.timer) {
    clearInterval(countdown.timer);
    countdown.timer = 0;
  }
  countdown.running = false;
};
const updateCountdown = () => {
  const now = Date.now();
  let diff = Math.max(0, Math.floor((countdown.target - now) / 1000));
  if (diff <= 0) {
    setBoxes(0, 0, 0, 0);
    stopCountdown();
    return;
  }
  const days = Math.floor(diff / 86400); diff %= 86400;
  const hours = Math.floor(diff / 3600); diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  setBoxes(days, hours, minutes, seconds);
};
const startCountdown = (targetTs: number) => {
  stopCountdown();
  countdown.target = targetTs;
  countdown.running = targetTs > Date.now();
  if (!countdown.running) {
    setBoxes(0, 0, 0, 0);
    return;
  }
  updateCountdown();
  countdown.timer = setInterval(updateCountdown, 1000);
};

const handleBack = () => {
  const pages = getCurrentPages();
  if (pages && pages.length > 1) {
    uni.navigateBack({ delta: 1 });
  } else {
    // 无历史栈时回到 tabBar 首页（可按需改为其它 tab）
    uni.switchTab({ url: '/pages/index/index' });
  }
};

/**
 * 接口相关
 */
const getQuestionAnswerList = async (taskId: number) => {
  try {
    const res = await api.task.searchQuestionAnswer({ taskId });
    // 方案列表
    data.list = (res.data?.contentList || []).map((item: any, i: number) => ({
      id: item?.replayId || i + 1,
      title: item?.answerTitle || `方案${i + 1}`,
      content: '分析中...',
      status: 2,
    }));

    // 倒计时目标：functionEndTime（仅未来时间才计时）
    data.time = res.data?.functionEndTime || '';
    if (data.time) {
      // iOS 兼容：将 yyyy-MM-dd 替换为 yyyy/MM/dd
      const ts = new Date(String(data.time).replace(/-/g, '/')).getTime();
      if (ts && ts > Date.now()) {
        startCountdown(ts);
      } else {
        stopCountdown();
      }
    } else {
      stopCountdown();
    }
  } catch (error) {
    stopCountdown();
  }
};

onLoad(option => {
  data.prevPageQuery = option as Record<string, any>;
  const taskId = Number(option?.taskId);
  if (taskId) getQuestionAnswerList(taskId);
});

onUnload(() => {
  stopCountdown();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
}

/* 块状倒计时样式（紫色方块） */
.countdown-wrap { display: flex; justify-content: center; margin-top: 12rpx; }
.box-line { display: flex; align-items: center; gap: 14rpx; }
.time-box {
  width: 40rpx; height: 60rpx; border-radius: 0;
  background: #f0edff; color: #000; font-weight: 900; font-size: 34rpx;
  line-height: 60rpx; text-align: center;
  box-shadow: 0 8rpx 18rpx rgba(123, 92, 255, 0.18);
}
.time-box--first {
  background: #7b5cff;
  color: #fff;
}
.sep { color: #7a5cff; font-weight: 800; font-size: 36rpx; padding: 0 2rpx; }

/* 提示条（与设计一致的浅蓝底+边框） */
.tip {
  display: flex; align-items: center; gap: 10rpx;
  padding: 10rpx 14rpx; margin: 16rpx 0 50rpx;
  border-radius: 12rpx; background: #f6f8ff;
  border: 1rpx solid #c9d5ff; box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
  color: #6b6b6b; font-size: 24rpx;
}
.tip-text { line-height: 1.6; }

/* 方案卡片与胶囊标题 */
.plan-card {
  position: relative; background: #fff; border-radius: 20rpx;
  padding: 28rpx 24rpx; margin: 28rpx 0;
  box-shadow: 0 12rpx 24rpx rgba(0,0,0,0.12);
}
.plan-tag {
  position: absolute; top: -26rpx; left: 50%; transform: translateX(-50%);
  background: linear-gradient(180deg, #8f73ff 0%, #7b5cff 100%);
  color: #fff; font-size: 26rpx; border-radius: 16rpx;
  padding: 10rpx 28rpx; box-shadow: 0 8rpx 18rpx rgba(123,92,255,0.28);
}
.plan-content { display: flex; align-items: center; gap: 16rpx; min-height: 80rpx; }
.loading-dot {
  width: 24rpx; height: 24rpx; border-radius: 50%;
  background: radial-gradient(circle at center, #a48bff 0%, #7b5cff 60%, #6a43ff 100%);
  box-shadow: 0 10rpx 18rpx rgba(123,92,255,0.35);
}
.plan-text { font-size: 32rpx; font-weight: 800; color: #333; }
</style>