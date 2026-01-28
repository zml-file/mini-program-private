<template>
  <md-page title="会员充值">
    <view class="container">
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
      <view class="list">
        <block v-for="item in data.list" :key="item.gold">
          <view
            :class="['item', data.current === item.gold ? 'active' : '']"
            hover-class="hover-gray"
            :hover-start-time="20"
            :hover-stay-time="70"
            @click="() => handleSelect(item)">
            <view>{{ item.gold }}金币</view>
            <view class="price">￥{{ item.price }}</view>
          </view>
        </block>
        <view
          :class="['item', data.isCustom ? 'active' : '']"
          hover-class="hover-gray"
          :hover-start-time="20"
          :hover-stay-time="70"
          @click="() => handleSelect('custom')">自定义</view>
      </view>

      <!-- 自定义金额输入框 -->
      <view class="custom-input-wrapper" v-if="data.isCustom">
        <view class="input-label">自定义金额</view>
        <view class="input-box">
          <view class="input-prefix">￥</view>
          <uni-easyinput
            ref="customInputRef"
            v-model="data.customPrice"
            type="number"
            placeholder="最低充值1元"
            :styles="{
              borderColor: '#7A59ED',
              backgroundColor: '#f9f9ff',
            }"
            :maxlength="10"
            @input="handleCustomInput" />
          <view class="input-suffix">元</view>
        </view>
        <view class="input-tip">最低充值1元，最高充值999,999元</view>
      </view>
      <!-- 协议 及 充值按钮 -->
      <view class="bottom-btns">
        <view class="m-bottom-20">
          <cc-protocolBox
            :agree="data.agree"
            :protocolArr="data.protocolArr"
            @click="data.agree = !data.agree"
            @protocolClick="protocolClick" />
        </view>
        <md-button title="充值" @click="handlePay" />
      </view>
    </view>
  </md-page>
  <!-- 底部背景图 -->
  <div class="bottom_bg" :style="`background: url(${data.bottom_bg})`"></div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { convertToBase64 } from '@/utils/util';
import api from '@/api';

const data = reactive<any>({
  bottom_bg: '',
  list: [
    // { gold: 1, price: 0.01 },
    { gold: 850, price: 50 },
    { gold: 2176, price: 128 },
    { gold: 4556, price: 268 },
    { gold: 7106, price: 418 },
    { gold: 11356, price: 668 },
    { gold: 18360, price: 1080 },
    { gold: 28560, price: 1680 },
    { gold: 32266, price: 1898 },
  ],
  current: null,
  currentPrice: null,
  // 自定义相关
  isCustom: false,
  customAmount: '',
  customPrice: '',
  // 协议
  agree: false,
  protocolArr: ['《会员协议》', '《隐私政策》'],
  // 会员信息
  info: {},
});

// 自定义金额输入框ref
const customInputRef = ref();

// 协议点击回调
const protocolClick = (tag: string) => {
  console.log('点击协议序列 = ' + tag);
};

// 自定义金额输入处理
const handleCustomInput = (e: any) => {
  const value = e.detail?.value || '';
  // 只保留数字和小数点
  const numericValue = value.replace(/[^\d.]/g, '');

  // 限制最大金额
  const maxAmount = 999999;
  if (numericValue && parseFloat(numericValue) > maxAmount) {
    uni.showToast({
      title: `充值金额不能超过${maxAmount}元`,
      icon: 'none',
      duration: 2000
    });
    data.customPrice = String(maxAmount);
    data.currentPrice = maxAmount;
    return;
  }

  data.customPrice = numericValue;

  // 更新当前价格为输入的金额
  if (numericValue && parseFloat(numericValue) > 0) {
    data.currentPrice = parseFloat(numericValue);
  } else {
    data.currentPrice = null;
  }
};

const handleSelect = (item: any) => {
  if (item === 'custom') {
    console.log('选择自定义');
    data.isCustom = true;
    data.current = null;
    data.currentPrice = data.customPrice ? parseFloat(data.customPrice) : null;
    // 延迟聚焦到输入框
    nextTick(() => {
      setTimeout(() => {
        const inputRef = customInputRef.value;
        if (inputRef && typeof inputRef.focus === 'function') {
          inputRef.focus();
        }
      }, 100);
    });
  } else {
    // 选择固定金额
    data.isCustom = false;
    data.current = item.gold;
    data.currentPrice = item.price;
    data.customPrice = ''; // 清空自定义输入
  }
};

const handlePay = async () => {
  // 检查是否选择了金额
  if (!data.current && (!data.isCustom || !data.customPrice)) {
    uni.showToast({
      title: '请选择或输入充值金额',
      icon: 'none',
    });
    return;
  }
  // 检查自定义金额
  if (data.isCustom) {
    console.log('检查自定义金额', data.customPrice);
    const amount = parseFloat(data.customPrice);
    console.log('金额 = ' + amount);
    if (!amount || amount <= 0) {
      uni.showToast({
        title: '请输入正确的充值金额',
        icon: 'none',
      });
      return;
    }
    data.customPrice = String(amount); // 格式化输入
    data.currentPrice = amount;
  }
  if (!data.agree) {
    uni.showToast({
      title: '请先同意协议',
      icon: 'none',
    });
    return;
  }
  // console.log('充值');
  fetchGetPrePayData();
};

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

// 支付
const fetchGetPrePayData = async () => {
  try {
    // 确保金额有效
    let amount = data.currentPrice;
    if (!amount || amount <= 0) {
      uni.showToast({
        title: '请输入有效的充值金额',
        icon: 'none',
      });
      return;
    }

    // 处理自定义金额，如果是0开头或者只有整数，去掉0
    if (data.isCustom) {
      // 将金额转换为数字再传给接口
      console.log('处理自定义金额', data.customPrice);
      amount = parseFloat(amount.toString());
      console.log('处理自定义金额', amount);
      if (isNaN(amount) || amount <= 0) {
        uni.showToast({
          title: '请输入有效的充值金额',
          icon: 'none',
        });
        return;
      }
    }

    // 添加调试日志
    console.log('发起支付，金额:', amount, '自定义:', data.isCustom, '原始输入:', data.customPrice);

    const res = await api.common.getPrePayData({
      amount: amount,
    });
    // 调起微信支付
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: {},
      nonceStr: res.data?.nonceStr, // 随机字符串
      package: res.data?.packageInfo, // 固定值
      signType: res.data?.signType,
      timeStamp: String(res.data?.timeStamp), // 时间戳（单位：秒）
      paySign: res.data?.paySign, // 签名，这里用的 MD5/RSA 签名
      success() {
        uni.showModal({
          title: '提示',
          content: '支付成功',
          showCancel: false,
          success() {
            uni.navigateBack();
          },
        });
      },
      fail(e) {
        console.log(e);
      },
    });
  } catch (error) {
    console.log(error);
  }
};

onLoad(async () => {
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
  padding-bottom: calc(200rpx + $safe-bottom);
  min-height: 100vh;
  box-sizing: border-box;
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
  .list {
    display: flex;
    gap: 40rpx;
    font-size: 34rpx;
    text-align: center;
    flex-wrap: wrap;
    margin-bottom: 20rpx;
  }

  // 自定义金额输入框样式 - 美化版
  .custom-input-wrapper {
    width: 100%;
    padding: 20rpx 30rpx;
    box-sizing: border-box;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    margin-bottom: 40rpx;

    .input-label {
      font-size: 32rpx;
      color: #333333;
      margin-bottom: 24rpx;
      font-weight: 600;
      text-align: center;
      letter-spacing: 1rpx;
    }

    .input-box {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #f8faff 0%, #f0f2ff 100%);
      border: 3rpx solid #e8eaff;
      border-radius: 20rpx;
      padding: 24rpx 30rpx;
      box-sizing: border-box;
      position: relative;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

      &:focus-within {
        border-color: #7A59ED;
        background: linear-gradient(135deg, #fafaff 0%, #f5f7ff 100%);
        box-shadow: 0 8rpx 32rpx rgba(122, 89, 237, 0.15),
                    0 0 0 8rpx rgba(122, 89, 237, 0.08);
        transform: translateY(-2rpx);

        .input-prefix, .input-suffix {
          color: #7A59ED;
        }
      }

      .input-prefix {
        font-size: 36rpx;
        font-weight: 700;
        color: #666666;
        margin-right: 16rpx;
        user-select: none;
        transition: color 0.4s;
      }

      .input-suffix {
        font-size: 36rpx;
        font-weight: 700;
        color: #666666;
        margin-left: 16rpx;
        user-select: none;
        transition: color 0.4s;
      }

      :deep(.uni-easyinput__content) {
        flex: 1;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2rpx;
          height: 30rpx;
          background: linear-gradient(180deg, rgba(122, 89, 237, 0.2) 0%, rgba(122, 89, 237, 0) 100%);
        }
      }

      :deep(.uni-easyinput__content-input) {
        font-size: 36rpx;
        font-weight: 700;
        color: #333333;
        text-align: center;
        padding: 0 20rpx;
        letter-spacing: 2rpx;
        background: transparent;

        &::placeholder {
          color: #999999;
          font-weight: 400;
          letter-spacing: 0;
        }

        &:focus {
          outline: none;
        }
      }

      .input-tip {
        font-size: 24rpx;
        color: #999999;
        text-align: center;
        margin-top: 20rpx;
        padding: 8rpx 20rpx;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 12rpx;
        display: inline-block;
      }

      &.error {
        border-color: #ff6b6b;
        background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);

        .input-prefix, .input-suffix {
          color: #ff6b6b;
        }
      }
    }
  }
  .item {
    width: 190rpx;
    display: flex;
    flex-direction: column;
    align-content: center;
    padding: 20rpx 4rpx;
    box-sizing: border-box;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 8rpx 0 #00000040;
    &.active {
      background: #7A59ED;
      color: white;
    }
    .price {
      font-weight: bold;
    }
  }

  .bottom-btns {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 40rpx 40rpx calc($safe-bottom + 40rpx);
    box-sizing: border-box;
    z-index: 10;
  }
}
.bottom_bg {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center bottom;
  width: 100%;
  height: 100vh;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: -1;
  pointer-events: none;
}
</style>
