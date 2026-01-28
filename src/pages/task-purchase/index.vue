<template>
  <md-page title="任务购买">
    <view class="container">
      <!-- 用户信息 -->
      <view class="info m-bottom-40">
        <view class="info-left">
          <!-- 金额 -->
          <view>金币余额</view>
          <view class="flex-l">
            <md-icon name="bag" height="50" width="50" />
            <view class="m-left-8">{{ data.info?.remainingVirtual || 0 }}</view>
          </view>
        </view>
        <!-- 会员等级 -->
        <view class="info-right" v-if="data.info?.userLevel >= 0">
          <bc-vip :level="data.info?.userLevel" />
        </view>
      </view>

      <!-- 任务购买选项 -->
      <view class="task-list">
        <block v-for="item in data.taskOptions" :key="item.days">
          <view :class="['task-item', data.currentDays === item.days ? 'active' : '']" @click="() => handleSelect(item)">
            <view class="days-badge">{{ item.days }}天</view>
            <view class="task-info">
              <view class="task-title">{{ item.title }}</view>
              <view class="task-desc">{{ item.desc }}</view>
              <view class="task-price">
                <text class="price-value">¥{{ item.price }}</text>
                <text class="price-unit">/{{ item.days }}天</text>
              </view>
            </view>
            <!-- 选中标记 -->
            <view v-if="data.currentDays === item.days" class="check-mark">
              <md-icon name="check" width="40" height="40" />
            </view>
          </view>
        </block>
      </view>

      <!-- 温馨提示 -->
      <view class="tips m-top-40">
        <view class="tips-title">
          <md-icon name="gantanhao" width="24" height="24"></md-icon>
          <text class="m-left-8">购买说明</text>
        </view>
        <view class="tips-content">
          <view class="tip-item">• 购买任务后将立即生效，有效期为所选天数</view>
          <view class="tip-item">• 任务期间可使用熟悉模块的全部功能</view>
          <view class="tip-item">• 任务到期后，未完成的进度将保留</view>
          <view class="tip-item">• 购买前请确保金币余额充足</view>
        </view>
      </view>

      <!-- 协议 及 购买按钮 -->
      <view class="bottom-btns">
        <view class="m-bottom-20">
          <cc-protocolBox
            :agree="data.agree"
            :protocolArr="data.protocolArr"
            @click="data.agree = !data.agree"
            @protocolClick="protocolClick" />
        </view>
        <md-button title="立即购买" @click="handlePurchase" />
      </view>
    </view>
  </md-page>
  <!-- 底部背景图 -->
  <div class="bottom_bg" :style="`background: url(${data.bottom_bg})`"></div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { convertToBase64 } from '@/utils/util';
import { initFamiliarLocal, createTask } from '@/utils/familiar-local';
import api from '@/api';

const data = reactive<any>({
  bottom_bg: '',
  // 任务购买选项
  taskOptions: [
    {
      days: 5,
      price: 138,
      title: '5天任务',
      desc: '适合短期快速推进'
    },
    {
      days: 9,
      price: 225,
      title: '9天任务',
      desc: '适合稳步进展'
    },
    {
      days: 16,
      price: 294,
      title: '16天任务',
      desc: '适合长期深入发展'
    },
  ],
  currentDays: null,     // 当前选择的天数
  currentPrice: null,    // 当前选择的价格
  // 协议
  agree: false,
  protocolArr: ['《会员协议》', '《隐私政策》'],
  // 会员信息
  info: {},
  // 来源页面参数
  fromPage: null,        // 来源页面（questionnaire/list）
  taskId: null,          // 任务ID（如果从问卷页面跳转）
  module: null,          // 模块名称（熟悉模块）
});

// 协议点击回调
const protocolClick = (tag: string) => {
  console.log('[任务购买] 点击协议序列:', tag);
};

// 选择任务
const handleSelect = (item: any) => {
  console.log('[任务购买] 选择任务:', item);
  data.currentDays = item.days;
  data.currentPrice = item.price;
};

// 购买任务
const handlePurchase = async () => {
  console.log('[任务购买] 开始购买流程');

  // 1. 验证是否选择了任务
  if (!data.currentDays) {
    uni.showToast({
      title: '请选择任务天数',
      icon: 'none',
    });
    return;
  }

  // 2. 验证是否同意协议
  if (!data.agree) {
    uni.showToast({
      title: '请先同意协议',
      icon: 'none',
    });
    return;
  }

  // 3. 验证金币余额是否充足
  const balance = data.info?.remainingVirtual || 0;
  if (balance < data.currentPrice) {
    // 检查用户是否是会员
    const userLevel = data.info?.userLevel || 0;
    const isGuest = userLevel < 1;

    uni.showModal({
      title: '金币不足',
      content: isGuest
        ? '充值即可升级为会员'
        : `您的金币余额不足，需要${data.currentPrice}金币，当前余额${balance}金币。是否前往充值？`,
      confirmText: isGuest ? '立即充值' : '去充值',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/recharge/index',
          });
        }
      }
    });
    return;
  }

  // 4. 显示确认对话框
  uni.showModal({
    title: '确认购买',
    content: `确认购买${data.currentDays}天任务，需支付${data.currentPrice}金币？`,
    confirmText: '确认购买',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        await executePurchase();
      }
    }
  });
};

// 执行购买逻辑
const executePurchase = async () => {
  console.log('[任务购买] 执行购买，天数:', data.currentDays, '价格:', data.currentPrice);

  uni.showLoading({ title: '购买中...', mask: true });

  try {
    // 初始化本地存储
    initFamiliarLocal();

    // TODO: 调用后端接口扣除金币
    // await api.task.purchaseTask({
    //   days: data.currentDays,
    //   price: data.currentPrice,
    //   module: '熟悉模块'
    // });

    // 本地模拟：创建任务
    const taskName = `${data.currentDays}天熟悉任务`;
    const newTaskId = createTask(taskName, data.currentDays, '熟悉模块');

    console.log('[任务购买] 任务创建成功，taskId:', newTaskId);

    // 本地模拟：扣除金币（实际应该由后端完成）
    // 这里仅作演示，实际应该等待后端接口返回
    if (data.info) {
      data.info.remainingVirtual = (data.info.remainingVirtual || 0) - data.currentPrice;
    }

    uni.hideLoading();

    // 显示购买成功提示
    uni.showModal({
      title: '购买成功',
      content: `已成功购买${data.currentDays}天任务，请前往任务列表查看`,
      showCancel: false,
      confirmText: '去查看',
      success: () => {
        // 根据来源页面决定返回路径
        if (data.fromPage === 'questionnaire' && data.taskId) {
          // 从问卷页面跳转来的，返回问卷页面
          uni.navigateBack();
        } else {
          // 从其他页面跳转来的，跳转到任务列表
          uni.redirectTo({
            url: '/pages/sub-page/stepTask/list?module=熟悉模块'
          });
        }
      }
    });

  } catch (error) {
    console.error('[任务购买] 购买失败:', error);
    uni.hideLoading();
    uni.showToast({
      title: '购买失败，请重试',
      icon: 'none',
    });
  }
};

/**
 * 接口相关
 */
// 获取会员信息
const getVipInfo = async () => {
  try {
    const res = await api.common.info();
    data.info = res.data;
    console.log('[任务购买] 会员信息:', data.info);
  } catch (error) {
    console.error('[任务购买] 获取会员信息失败:', error);
  }
};

onLoad(async (options: any) => {
  console.log('[任务购买] onLoad, options:', options);

  // 保存来源页面参数
  data.fromPage = options.from || null;
  data.taskId = options.taskId || null;
  data.module = options.module || '熟悉模块';

  // 底部图片加载
  data.bottom_bg = await convertToBase64('/static/images/page_bottom_bg.png');
});

onShow(() => {
  getVipInfo();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;
  padding-bottom: 200rpx; // 为底部按钮留出空间

  .info {
    background-color: #f5ee9e;
    height: 144rpx;
    padding: 26rpx;
    border-radius: 16rpx;
    display: flex;
    justify-content: space-between;
    font-size: 40rpx;
    &-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;

    .task-item {
      position: relative;
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-radius: 16rpx;
      background: white;
      box-shadow: 0 8rpx 16rpx 0 rgba(0, 0, 0, 0.1);
      border: 2rpx solid transparent;
      transition: all 0.3s ease;

      &.active {
        background: linear-gradient(135deg, #f5f7ff 0%, #e8edff 100%);
        border-color: #7A59ED;
        box-shadow: 0 8rpx 24rpx 0 rgba(122, 89, 237, 0.3);
      }

      .days-badge {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #7A59ED 0%, #9AB3FF 100%);
        color: white;
        font-size: 32rpx;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .task-info {
        flex: 1;
        margin-left: 30rpx;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .task-title {
          font-size: 36rpx;
          font-weight: 600;
          color: #333;
        }

        .task-desc {
          font-size: 24rpx;
          color: #999;
        }

        .task-price {
          margin-top: 8rpx;

          .price-value {
            font-size: 48rpx;
            font-weight: bold;
            color: #7A59ED;
          }

          .price-unit {
            font-size: 24rpx;
            color: #999;
            margin-left: 8rpx;
          }
        }
      }

      .check-mark {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        background: #7A59ED;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
    }
  }

  .tips {
    padding: 30rpx;
    border-radius: 16rpx;
    background: #fdedea;

    .tips-title {
      display: flex;
      align-items: center;
      font-size: 28rpx;
      font-weight: 600;
      color: #c98c59;
      margin-bottom: 20rpx;
    }

    .tips-content {
      .tip-item {
        font-size: 24rpx;
        color: #c98c59;
        line-height: 1.8;
        margin-bottom: 8rpx;
      }
    }
  }

  .bottom-btns {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 40rpx 40rpx calc($safe-bottom + 40rpx);
    box-sizing: border-box;
    background: white;
    box-shadow: 0 -4rpx 20rpx 0 rgba(0, 0, 0, 0.1);
  }
}

.bottom_bg {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  width: 750rpx;
  height: 1224rpx;
  position: absolute;
  bottom: -($safe-bottom);
  left: 0;
  z-index: -1;
}
</style>
