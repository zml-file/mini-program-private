<template>
  <md-page title="手机号登录">
    <view class="container">
      <!-- 授权登录 -->
      <view>
        <button class="phone-btn btn" open-type="getPhoneNumber" @getphonenumber="decryptPhoneNumber">
          手机号码一键登录
        </button>
      </view>
    </view>
  </md-page>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api/index';

const data = reactive<any>({
  userId: null,
  configInfo: {},
});

// 授权手机号回调
function decryptPhoneNumber(e: any) {
  console.log(e.detail); // 动态令牌
  fetchAuthMobileLogin(e.detail.code);
}

/**
 * 接口相关
 */
// 微信登录获取user_wx_id
const fetchWxLogin = async (code: string) => {
  try {
    const res = await api.common.login({ code });
    data.userId = res.data;
  } catch (e) {
    //TODO handle the exception
  }
};

// 授权手机登录
const fetchAuthMobileLogin = async (code: string) => {
  try {
    const res = await api.common.getPhoneNumber({
      code,
      userId: data.userId,
    });
    uni.setStorageSync('token', res.data);
    // 返回的页面执行刷新
    uni.setStorageSync('isRefresh', 1);
    setTimeout(() => {
      uni.navigateBack({
        delta: 1,
      });
    }, 500);
  } catch (e) {
    //TODO handle the exception
  }
};

onLoad(() => {
  uni.login({
    provider: 'weixin', //使用微信登录
    success: function (res) {
      console.log(res);
      // data.LoginCode = res.code;
      fetchWxLogin(res.code);
    },
  });
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  .phone-btn {
    margin: 0;
    width: 694rpx;
    height: 88rpx;
    border-radius: 20rpx;
    font-size: 34rpx;
  }
  .title {
    color: $title;
    font-size: 40rpx;
    text-align: center;
    margin-bottom: 60rpx;
  }
  .line {
    height: 1rpx;
    background: #cccccc;
  }
  .btn {
    margin-top: 100rpx;
  }
}
</style>
