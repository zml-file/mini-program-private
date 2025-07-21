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
          <view :class="['item', data.current === item.gold ? 'active' : '']" @click="() => handleSelect(item)">
            <view>{{ item.gold }}金币</view>
            <view class="price">￥{{ item.price }}</view>
          </view>
        </block>
        <view class="item" style="justify-content: center" @click="() => handleSelect('custom')">自定义</view>
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
import { reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { convertToBase64 } from '@/utils/util';
import api from '@/api';

const data = reactive<any>({
  bottom_bg: '',
  list: [
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
  // 协议
  agree: false,
  protocolArr: ['《会员协议》', '《隐私政策》'],
  // 会员信息
  info: {},
});

// 协议点击回调
const protocolClick = (tag: string) => {
  console.log('点击协议序列 = ' + tag);
};

const handleSelect = (item: any) => {
  // console.log(item);
  if (item === 'custom') {
    console.log('自定义');
    data.current = null;
    data.currentPrice = null;
  } else {
    data.current = item.gold;
    data.currentPrice = item.price;
  }
};

const handlePay = async () => {
  if (!data.current) {
    uni.showToast({
      title: '请选择充值金额',
      icon: 'none',
    });
    return;
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
    const res = await api.common.getPrePayData({
      amount: data.currentPrice,
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
        background: $warn;
        color: white;
      }
      .price {
        font-weight: bold;
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
