<template>
  <view class="container">
    <!-- 头部背景图 -->
    <div class="top_bg"></div>
    <div class="content">
      <div class="logo m-bottom-20 m-left-30" :style="{ marginTop: `calc(${data.statusBarHeight} + 44px)` }">
        <md-icon type="bg" name="home/huixiang" width="180" height="68"></md-icon>
        <md-icon @click="handlePay" type="bg" name="home/vip" width="178" height="68" />
      </div>
      <!-- 文案 -->
      <div class="text m-left-30">This is the advertising Advertising slogan</div>
      <!-- 四个模块 -->
      <div class="four_tab flex">
        <div
          class="flex-1 flex-c"
          v-for="item in data.tabs"
          :key="item.key"
          @click="() => handleJump('step', item.label)">
          <md-icon type="bg" height="210" width="146" :name="'home/' + item.key"></md-icon>
        </div>
      </div>
      <!-- 问诊、超熟、定制、线下 -->
      <div class="main">
        <div class="ad m-right-18" @click="() => handleJump('imageText')">
          <md-icon type="bg" name="home/ao" width="176" height="316"></md-icon>
        </div>
        <div class="four">
          <div class="item flex-c" @click="() => handleJump('wenzhen')">
            <md-icon type="bg" name="home/wenzhen" width="236" height="140"></md-icon>
          </div>
          <div class="item flex-c" @click="() => handleJump('step', '超熟模块')">
            <md-icon type="bg" name="home/chaoshu" width="212" height="164"></md-icon>
          </div>
          <div class="item flex-c" @click="() => handleJump('custom')">
            <md-icon type="bg" name="home/dingzhi" width="236" height="140"></md-icon>
          </div>
          <!-- @click="() => handleJump('key')" -->
          <div class="item flex-c">
            <md-icon type="bg" name="home/key" width="200" height="120"></md-icon>
          </div>
        </div>
      </div>
      <div class="offline m-top-20" @click="() => handleJump('offline')">
        <md-icon type="bg" name="home/offline" width="656" height="156"></md-icon>
      </div>
    </div>
    <!-- 底部背景图 -->
    <div class="bottom_bg" :style="`background: url(${data.bottom_bg})`"></div>
    <!-- 问号图片 -->
    <view class="wenhao" @click="handleWenhao"><md-icon name="wenhao" width="60" height="60"></md-icon></view>
  </view>
  <bottom-tab-bar :current="2" />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
// 接口
import api from '@/api';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { convertToBase64 } from '@/utils/util';

const data = reactive<any>({
  statusBarHeight: uni.getWindowInfo().statusBarHeight + 'px',
  tabs: [
    { label: '免费模块', key: 'free' },
    { label: '陌生模块', key: 'mosheng' },
    { label: '不熟模块', key: 'bushu' },
    { label: '熟悉模块', key: 'shuxi' },
  ],
  bottom_bg: '',
  moduleList: [],
  info: {},
});

// 充值
const handlePay = () => {
  uni.navigateTo({
    url: '/pages/recharge/index',
  });
};

const handleWenhao = () => {
  uni.navigateTo({
    url: '/pages/sub-page/describe/wenhao',
  });
};

const handleJump = (type: string, module?: string) => {
  // 免费陌生不熟熟悉超熟
  if (type === 'step') {
    uni.navigateTo({
      url: '/pages/sub-page/stepTask/list?module=' + module,
    });
  } else if (type === 'offline') {
    uni.navigateTo({
      url: '/pages/sub-page/offline/list',
    });
  } else if (type === 'imageText') {
    uni.navigateTo({
      url: '/pages/sub-page/image-text/index',
    });
  } else if (type === 'wenzhen') {
    uni.navigateTo({
      url: '/pages/sub-page/wenzhen/list',
    });
  } else if (type === 'custom') {
    uni.navigateTo({
      url: '/pages/sub-page/custom/list',
    });
  }
};

/**
 * 接口相关
 */
const fetchModuleList = async () => {
  try {
    const res = await api.task.moduleList();
    data.moduleList = res.data;
  } catch (error) {}
};

// 获取会员信息
const getVipInfo = async () => {
  try {
    const res = await api.common.info();
    data.info = res.data;
  } catch (error) {}
  // console.log('获取会员信息');
};

onLoad(async () => {
  fetchModuleList();
  data.bottom_bg = await convertToBase64('/static/images/page_bottom_bg.png');
});

onShow(() => {
  getVipInfo();
});
</script>
<style lang="scss" scoped>
.container {
  height: 100vh;
  position: relative;
  .top_bg {
    background: url('~@/static/images/top-bg.png') no-repeat;
    background-size: cover;
    background-position: center;
    width: 750rpx;
    height: 465rpx;
    position: absolute;
    top: 0;
    left: 0;
  }
  .bottom_bg {
    // background: url('~@/static/images/page_bottom_bg.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    width: 750rpx;
    height: calc(100vh - 465rpx);
    position: absolute;
    bottom: 0;
    left: 0;
  }
  .content {
    padding: $safe-top 12rpx 12px;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    top: 0;
    height: 100vh;
    width: 100%;
    z-index: 1;
    & > .logo {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    & > .text {
      width: 40%;
    }
    & > .four_tab {
      margin-top: 100rpx;
      padding: 20rpx;
    }
    & > .main {
      margin-top: 20rpx;
      display: flex;
      padding: 0 20rpx;
      .ad {
        border-radius: 32rpx;
        background: #f8f8f8;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .four {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        .item {
          border-radius: 40rpx;
          background: #f8f8f8;
          .text {
            font-weight: 400;
          }
        }
      }
    }
    .offline {
      padding: 0 20rpx;
    }
  }
  .wenhao {
    position: fixed;
    right: 50rpx;
    bottom: 20%;
    z-index: 98;
  }
}
</style>
