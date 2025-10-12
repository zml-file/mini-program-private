<template>
  <md-page title="个人中心" :showLeft="false">
    <view class="container">
      <!-- 个人信息头部 -->
      <view class="header">
        <view class="avatar">
          <md-icon type="bg" name="apple"></md-icon>
        </view>
        <view class="info">
          <view class="row">
            <text class="nickname">{{ data.info?.nickname || '牛大胆' }}</text>
            <text class="arrow">›</text>
          </view>
          <view class="labels">
            <text class="chip">预留标签</text>
            <bc-vip :level="data.info?.userLevel" />
          </view>
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stats">
        <view class="card">
          <view class="card-title">我的会员等级</view>
          <view class="card-main">
            <text class="vip-level">VIP等级 {{ data.info?.userLevel ?? 2 }}</text>
          </view>
          <view class="card-sub">
            距离下一级会员还有
            <text class="num">5,000,000</text> 个金币
          </view>
          <view class="card-arrow">→</view>
        </view>

        <view class="card">
          <view class="card-title">我的金币</view>
          <view class="card-main">
            <text class="coin">200,000</text>
          </view>
          <view class="card-sub link">去充值</view>
        </view>
      </view>

      <!-- 列表项 -->
      <view class="list">
        <view class="item">
          <view class="left">
            <view class="icon-badge">💎</view>
            <text>我的特权</text>
          </view>
          <text class="chevron">›</text>
        </view>
      </view>
    </view>
  </md-page>
  <bottom-tab-bar :current="4" />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api/index';

const data = reactive<any>({
  info: {},
});

/**
 * 接口相关
 */
// 获取会员信息
const getVipInfo = async () => {
  try {
    const res = await api.common.info();
    data.info = res.data;
  } catch (error) {}
  // console.log('获取会员信息');
};

onShow(() => {
  getVipInfo();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(180deg, #eef0ff 0%, #f8f9ff 60%, #ffffff 100%);
}

/* 头部资料卡 */
.header {
  display: flex;
  align-items: center;
  padding: 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #f0f3ff 0%, #ffffff 100%);
  box-shadow: 0 12rpx 24rpx rgba(36,36,36,0.06);
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 20rpx rgba(36,36,36,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 让 md-icon 自适应 */
  :deep(.md-icon), :deep(svg) { width: 100%; height: 100%; }
}
.info { flex: 1; }
.row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f1f1f;
}
.arrow {
  margin-left: 12rpx;
  font-size: 40rpx;
  color: #999;
}
.labels {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.chip {
  padding: 6rpx 16rpx;
  background: #f2f3f5;
  border-radius: 999rpx;
  color: #666;
  font-size: 22rpx;
}

/* 中部统计卡 */
.stats {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}
.card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 12rpx 32rpx rgba(36,36,36,0.08);
  position: relative;
}
.card-title {
  font-size: 26rpx;
  color: #6b6b6b;
  margin-bottom: 12rpx;
}
.card-main {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.vip-level {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f1f1f;
}
.coin {
  font-size: 40rpx;
  font-weight: 800;
  color: #f0c200; /* 近似截图的金色 */
}
.card-sub {
  font-size: 24rpx;
  color: #8c8c8c;
}
.card-sub .num { font-weight: 700; color: #1f1f1f; }
.card-sub.link { color: #6b6b6b; }
.card-arrow {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  color: #bfbfbf;
  font-size: 28rpx;
}

/* 列表 */
.list {
  margin-top: 28rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 12rpx 24rpx rgba(36,36,36,0.06);
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.item:last-child { border-bottom: none; }
.left { display: flex; align-items: center; gap: 16rpx; color: #1f1f1f; }
.icon-badge {
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: #f6f0ff;
  color: #7a5cff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}
.chevron { color: #bfbfbf; font-size: 36rpx; }
</style>
