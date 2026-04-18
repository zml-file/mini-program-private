<template>
  <view class="page">
    <view class="navbar" :style="{ paddingTop: data.statusBarHeight + 'px' }">
      <view class="navbar-content">
        <view class="nav-left" @click="goBack">
          <text class="back-icon">‹</text>
        </view>
        <view class="nav-title">我的会员等级</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <view class="content" :style="{ paddingTop: (44 + data.statusBarHeight) + 'px' }">
      <view class="user-header">
        <view class="avatar">
          <md-icon type="bg" name="apple"></md-icon>
        </view>
        <view class="user-info">
          <text class="username">{{ displayNickname }}</text>
        </view>
        <view class="level-badge">
          <text>{{ currentLevelLabel }}</text>
        </view>
      </view>

      <view class="vip-card">
        <view class="card-bg">
          <view class="card-content">
            <view class="card-left">
              <text class="card-label">当前称号</text>
              <text class="vip-level">{{ currentLevelLabel }}</text>
              <text class="upgrade-tip" v-if="nextLevelLabel">
                距离{{ nextLevelLabel }}还需{{ formatMoney(data.nextLevelVirtual) }}心币
              </text>
              <text class="upgrade-tip" v-else>
                已达最高等级
              </text>
              <view class="coin-info">
                <text class="coin-label">升级后可获得</text>
                <text class="coin-value">{{ nextLevelBenefits || '全部模块开放，尊享特权' }}</text>
              </view>
            </view>
            <view class="card-right">
              <view class="crown-icon">
                <md-icon type="bg" name="home/vip" width="120" height="120"></md-icon>
              </view>
            </view>
          </view>
          <view class="card-actions">
            <view class="action-btn" @click="handleRecharge">
              <text>去充值</text>
            </view>
            <view class="action-btn" @click="handlePrivilege">
              <text>我的特权</text>
            </view>
          </view>
        </view>
      </view>

      <view class="level-progress">
        <view class="progress-line"></view>
        <view class="levels">
          <view
            v-for="level in data.levels"
            :key="level.value"
            class="level-item"
            :class="{ active: level.value <= (data.info?.userLevel || 0) }">
            <view class="level-circle">
              <text>{{ level.value }}</text>
            </view>
            <view class="level-desc">
              <text>{{ level.label1 }}</text>
              <text>{{ level.label2 }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import api from '@/api/index';
import { VIP_LEVEL_RULES, getNextLevelVirtual, getLevelRule, formatVirtual } from '@/config/vip-level';

const data = reactive<any>({
  statusBarHeight: uni.getWindowInfo().statusBarHeight || 0,
  info: {},
  nextLevelVirtual: 0,
  levels: VIP_LEVEL_RULES.slice(1, 8).map(rule => ({
    value: rule.level,
    label1: rule.label,
    label2: `${formatVirtual(rule.requirement)}心币`
  })),
});

const displayNickname = computed(() => {
  if (data.info?.nickname) {
    return data.info.nickname;
  }
  const localNickname = uni.getStorageSync('userNickname');
  if (localNickname) {
    return localNickname;
  }
  return '牛大胆';
});

const currentLevelLabel = computed(() => {
  const rule = getLevelRule(data.info?.userLevel ?? 0);
  return rule?.label || '游客/来宾';
});

const nextLevelLabel = computed(() => {
  const nextLevel = (data.info?.userLevel ?? 0) + 1;
  const rule = getLevelRule(nextLevel);
  return rule?.label || '';
});

const nextLevelBenefits = computed(() => {
  const nextLevel = (data.info?.userLevel ?? 0) + 1;
  const rule = getLevelRule(nextLevel);
  return rule?.benefits || '';
});

const formatMoney = formatVirtual;

const getVipInfo = async () => {
  try {
    const res = await api.common.info();
    data.info = res.data;

    if (data.info?.userLevel !== undefined && data.info?.accumulateVirtual !== undefined) {
      data.nextLevelVirtual = getNextLevelVirtual(data.info.userLevel, data.info.accumulateVirtual);
    }
  } catch (error) {
    console.error('获取会员信息失败:', error);
  }
};

const goBack = () => {
  uni.navigateBack();
};

const handleRecharge = () => {
  uni.navigateTo({
    url: '/pages/recharge/index'
  });
};

const handlePrivilege = () => {
  uni.showToast({
    title: '特权功能开发中...',
    icon: 'none',
    duration: 2000
  });
};

onLoad(() => {
  getVipInfo();
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%);
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(44, 44, 44, 0.95);
}

.navbar-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
}

.nav-left {
  width: 80rpx;
}

.back-icon {
  font-size: 60rpx;
  color: #fff;
  font-weight: 300;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  color: #fff;
  font-weight: 500;
}

.nav-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20rpx;
}

.icon-menu, .icon-help {
  font-size: 44rpx;
  color: #fff;
}

/* 内容区域 */
.content {
  padding: 40rpx 30rpx;
}

/* 用户信息 */
.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 36rpx;
  color: #fff;
  font-weight: 600;
}

.level-badge {
  padding: 8rpx 24rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999rpx;

  text {
    font-size: 24rpx;
    color: #fff;
  }
}

/* 会员卡片 */
.vip-card {
  margin-bottom: 80rpx;
}

.card-bg {
  background: linear-gradient(135deg, #f4d7a8 0%, #e8c896 50%, #d4b585 100%);
  border-radius: 32rpx;
  padding: 48rpx 36rpx 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.card-bg::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300rpx;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.card-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.card-left {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 26rpx;
  color: #8b6f47;
  margin-bottom: 12rpx;
}

.vip-level {
  display: block;
  font-size: 48rpx;
  font-weight: 800;
  color: #2c2c2c;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}

.upgrade-tip {
  display: block;
  font-size: 24rpx;
  color: #6b5638;
  margin-bottom: 32rpx;
}

.coin-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.coin-label {
  font-size: 26rpx;
  color: #8b6f47;
}

.coin-value {
  font-size: 44rpx;
  font-weight: 700;
  color: #2c2c2c;
}

.card-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200rpx;
}

.crown-icon {
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(44, 44, 44, 0.8);
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
}

.card-actions {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  background: transparent;
  border: 2rpx solid rgba(139, 111, 71, 0.3);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 28rpx;
    color: #2c2c2c;
    font-weight: 500;
  }
}

/* 等级进度条 */
.level-progress {
  position: relative;
  padding-top: 40rpx;
}

.progress-line {
  position: absolute;
  top: 70rpx;
  left: 10%;
  right: 10%;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.2);
}

.levels {
  display: flex;
  justify-content: space-between;
  padding: 0 5%;
}

.level-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.level-circle {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(212, 181, 133, 0.3);
  border: 4rpx solid rgba(212, 181, 133, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;

  text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
  }
}

.level-item.active .level-circle {
  background: linear-gradient(135deg, #f4d7a8 0%, #d4b585 100%);
  border-color: #f4d7a8;
  box-shadow: 0 8rpx 24rpx rgba(244, 215, 168, 0.4);

  text {
    color: #2c2c2c;
  }
}

.level-desc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;

  text {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.5);
  }
}

.level-item.active .level-desc text {
  color: rgba(255, 255, 255, 0.8);
}
</style>
