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

    <!-- 免责声明弹窗 -->
    <DisclaimerModal
      :visible="showDisclaimer"
      @agree="handleDisclaimerAgree"
      @disagree="handleDisclaimerDisagree"
    />
  </md-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api/index';
// 免责声明组件
import DisclaimerModal from '@/components/DisclaimerModal.vue';
// 免责声明工具
import { hasUserAgreedDisclaimer, setUserAgreedDisclaimer } from '@/utils/disclaimer';
// 内容库数据同步工具
import { syncContentLibrary } from '@/utils/content-library-sync';

const data = reactive<any>({
  userId: null,
  configInfo: {},
  isLoadingUserId: false, // 是否正在获取 userId
});

const showDisclaimer = ref(false); // 是否显示免责声明弹窗

// 等待 userId 获取完成（最多等待10秒）
const waitForUserId = async (): Promise<boolean> => {
  const maxWaitTime = 10000; // 最多等待10秒
  const checkInterval = 100; // 每100ms检查一次
  let waited = 0;

  while (!data.userId && waited < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    waited += checkInterval;
  }

  return !!data.userId;
};

// 授权手机号回调
async function decryptPhoneNumber(e: any) {
  console.log('[decryptPhoneNumber] 开始处理手机号授权', e.detail);

  // 首先检查免责声明
  if (!hasUserAgreedDisclaimer()) {
    console.log('[decryptPhoneNumber] 用户尚未同意免责声明，显示弹窗');
    showDisclaimer.value = true;
    return;
  }

  // 如果 userId 还没获取到，显示加载提示并等待
  if (!data.userId) {
    console.log('[decryptPhoneNumber] userId 为空，等待获取...');
    uni.showLoading({ title: '正在登录...', mask: true });

    const success = await waitForUserId();
    uni.hideLoading();

    if (!success) {
      console.error('[decryptPhoneNumber] 等待 userId 超时');
      uni.showToast({ title: '登录超时，请重试', icon: 'none' });
      return;
    }

    console.log('[decryptPhoneNumber] userId 获取成功:', data.userId);
  }

  fetchAuthMobileLogin(e.detail.code);
}

/**
 * 接口相关
 */
// 微信登录获取user_wx_id
const fetchWxLogin = async (code: string) => {
  data.isLoadingUserId = true;
  try {
    const res = await api.common.login({ code });
    data.userId = res.data;
    console.log('[fetchWxLogin] 成功获取 userId:', data.userId);
  } catch (e) {
    console.error('[fetchWxLogin] 获取 userId 失败:', e);
    uni.showToast({ title: '微信登录失败，请重试', icon: 'none' });
  } finally {
    data.isLoadingUserId = false;
  }
};

// 免责声明处理函数
const handleDisclaimerAgree = () => {
  console.log('[handleDisclaimerAgree] 用户同意免责声明');
  setUserAgreedDisclaimer(true);
  showDisclaimer.value = false;

  // 显示同意成功的提示
  uni.showToast({
    title: '感谢您的信任！',
    icon: 'success',
    duration: 2000
  });
};

const handleDisclaimerDisagree = () => {
  console.log('[handleDisclaimerDisagree] 用户不同意免责声明');
  setUserAgreedDisclaimer(false);
  showDisclaimer.value = false;

  // 显示不同意后的提示，并阻止继续登录
  uni.showModal({
    title: '提示',
    content: '很抱歉，您需要同意用户协议才能继续使用我们的服务。感谢您的理解。',
    showCancel: false,
    confirmText: '知道了',
    success: () => {
      // 用户点击确定后，可以选择退出小程序或停留在当前页面
      console.log('[handleDisclaimerDisagree] 用户确认不同意，阻止登录流程');
    }
  });
};

// 授权手机登录
const fetchAuthMobileLogin = async (code: string) => {
  try {
    console.log('[fetchAuthMobileLogin] 开始获取手机号，userId:', data.userId, 'code:', code);

    const res = await api.common.getPhoneNumber({
      code,
      userId: data.userId,
    });

    console.log('[fetchAuthMobileLogin] 获取手机号成功，token:', res.data);
    uni.setStorageSync('token', res.data);
    // 返回的页面执行刷新
    uni.setStorageSync('isRefresh', 1);

    // 登录成功后，同步内容库数据
    try {
      console.log('[fetchAuthMobileLogin] 开始同步内容库数据...');
      await syncContentLibrary(false); // false 表示替换模式，获取最新数据
      console.log('[fetchAuthMobileLogin] 内容库数据同步成功');
    } catch (syncError) {
      // 同步失败不影响登录流程，只记录错误
      console.error('[fetchAuthMobileLogin] 内容库数据同步失败:', syncError);
      // 可选：显示提示
      // uni.showToast({ title: '数据同步失败，请稍后重试', icon: 'none', duration: 2000 });
    }

    // 返回上一页；如果当前是第一个页面（无返回栈），跳转到首页 Tab
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      uni.navigateBack({ delta: 1 });
    } else {
      // 注意：switchTab 只能跳转到 tabBar 页面
      uni.switchTab({ url: '/pages/task/index' });
    }
  } catch (e) {
    console.error('[fetchAuthMobileLogin] 获取手机号失败:', e);
    uni.showToast({ title: '获取手机号失败，请重试', icon: 'none' });
  }
};

onLoad(() => {
  // 检查用户是否已同意免责声明
  if (!hasUserAgreedDisclaimer()) {
    console.log('[onLoad] 用户尚未同意免责声明，显示弹窗');
    showDisclaimer.value = true;
  }

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
