<template>
  <md-page title="个人中心" :showLeft="false">
    <view class="container">
      <div class="flex ai-center">
        <md-icon type="bg" name="apple" width="130" height="130"></md-icon>
        <div class="name m-left-30 flex">
          <div class="nickname fs-36 m-bottom-20">牛大胆</div>
          <!-- <div class="tag">
            <md-icon name="vip2" width="110" height="28"></md-icon>
          </div> -->
          <bc-vip :level="data.info?.userLevel" />
        </div>
      </div>
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
  .name {
    flex-direction: column;
    justify-content: center;
    font-weight: 400;
  }
}
</style>
