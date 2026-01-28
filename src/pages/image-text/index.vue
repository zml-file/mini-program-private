<template>
  <md-page title="图文" :subHead="40" :showLeft="false">
    <template #head>
      <view>
        <view class="head-actions">
          <bc-tequan />
        </view>
      </view>
    </template>
    <view class="container">
      <!-- 图文说明 -->
      <block v-if="data?.describe">
        <bc-img-text-item
          :item="{
            title: '图文说明',
            content: data.describe,
            type: 'text',
          }"></bc-img-text-item>
      </block>
      <!-- 正常图文内容 -->
      <block v-for="item in data.list" :key="item">
        <bc-img-text-item
          disabled
          :item="{ ...item, title: item.title }"></bc-img-text-item>
      </block>
    <template #footer>
      <view class="mf-footer">
        <view class="mf-btn" @click="handleClick">
          <image class="mf-bg" src="@/static/images/xianxia.png" mode="widthFix" />
          <view class="mf-text">
            <text class="mf-plus">＋</text>
            <text class="mf-label">开启图文权限</text>
          </view>
        </view>
      </view>
    </template>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog
      ref="popup"
      @ok="handleOk"
      @cancel="handleCancel"
      :okText="popupInfo?.okText"
      :cancelText="popupInfo?.cancelText">
      <view class="pupup-content">{{ popupInfo.text }}</view>
    </md-dialog>
  </md-page>
  <bottom-tab-bar :current="1" />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Task, Common } from '@/api/data';
// 工具
import { taskModule, payModule } from '@/utils/data';

const data = reactive<any>({
  describe: '', // 图文说明
  list: [],
  value: '',
});

// 添加用户信息
const userInfo = ref<Common.Info.Data>();
const popup = ref<any>(null);
const popupInfo = ref<{ type: 'create' | 'recharge'; okText?: string; text?: string; cancelText?: string }>({
  type: 'create',
});

const handleOk = () => {
  // 充值
  if (popupInfo.value.type === 'recharge') {
    // 跳转充值页面
    uni.navigateTo({
      url: '/pages/recharge/index',
    });
  } else {
    // 创建任务
    fetchCreateTask({ taskName: '图文用户问答' });
  }
  popup.value!.close();
};

const handleClick = async () => {
  try {
    // 1. 获取用户余额信息
    await getUserInfo();

    // 2. 检查余额是否充足
    const isBalanceSufficient = await checkVirtualCoin();

    if (!isBalanceSufficient) {
      // 余额不足
      popupInfo.value = {
        type: 'recharge',
        text: '您的余额不足，请充值后开通图文权限',
        okText: '去充值',
        cancelText: '取消'
      };
    } else {
      // 余额充足，确认开通
      popupInfo.value = {
        type: 'create',
        text: '是否确认开通图文权限并进入用户问答界面？',
        okText: '确定',
        cancelText: '取消'
      };
    }
    popup.value!.open();
  } catch (error) {
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    });
  }
};

// 添加取消按钮处理
const handleCancel = () => {
  popup.value!.close();
};

/**
 * 接口相关
 */
// 获取用户信息
const getUserInfo = async () => {
  try {
    const res = await api.common.info();
    userInfo.value = res.data;
  } catch (error) {
    throw error;
  }
};

// 检查虚拟币是否充足
const checkVirtualCoin = async () => {
  try {
    const res = await api.common.checkVirtualCoin({ payScene: payModule['图文一阶段付费'] });
    return res.data;
  } catch (error) {
    return false;
  }
};

// 查询图文列表
const getList = async () => {
  try {
    const res = await api.task.moduleImg();
    data.list = res.data?.moduleImgVoList.map(item => ({
      ...item,
      title: item?.title || '图文内容',
      content: item.imgContent,
      imgs: item.imgUrlList,
      type: 'img_text',
      dataType: item.type,
    }));
    data.describe = res.data?.describe || '';
  } catch (error) {}
};

// 创建任务
const fetchCreateTask = async (params: Pick<Task.Create.Body, 'taskName'>) => {
  try {
    const res = await api.task.createTask({ ...params, moduleCode: taskModule['图文模块'] });
    uni.navigateTo({
      url: `/pages/sub-page/image-text/problem?taskId=${res.data?.taskId}&taskName=${params?.taskName}`,
    });
  } catch (error) {}
};

onShow(() => {
  getList();
  getUserInfo(); // 页面显示时获取用户信息
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  /* 为底部按钮和tab-bar留出空间：按钮高度约80rpx + tab-bar 48px + 额外间距 */
  padding-bottom: calc(48px + env(safe-area-inset-bottom) + 160rpx);
}

/* 底部固定大按钮（与 offline/list 保持一致风格） */
.mf-footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 16rpx 30rpx;
  /* 为 tab-bar 留出空间：48px(tab-bar高度) + safe-area + 16rpx(原有padding) */
  padding-bottom: calc(48px + env(safe-area-inset-bottom) + 16rpx);
  box-sizing: border-box;
  /* 降低 z-index，确保不遮挡 tab-bar (tab-bar 的 z-index 是 98) */
  z-index: 97;
}
.mf-btn { width: 100%; position: relative; }
.mf-bg { width: 100%; display: block; }
.mf-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  // transform: translateY(20rpx);
  text-align: center;
}
.mf-plus { color: #fff; font-size: 40rpx; font-weight: 700; margin-right: 12rpx; line-height: 1; }
.mf-label { color: #fff; font-size: 32rpx; font-weight: 600; line-height: 1; white-space: nowrap; }

.pupup-content {
  padding: 20rpx;
}
/* 统一卡片视觉，匹配参考图 */
:deep(.bc-img-text-item),
:deep(.bc-img-text-item .card) {
  position: relative;
  background: #ffffff;
  border: 1rpx solid #e7e7f7; /* 边框颜色 */
  border-radius: 16rpx;       /* 圆角 */
  box-shadow: 0 8rpx 18rpx rgba(123, 92, 255, 0.08); /* 柔和阴影 */
  padding: 24rpx 24rpx 28rpx; /* 内边距 */
  margin: 22rpx 0;            /* 外边距 */
}

/* 标题胶囊（居中紫色条） */
:deep(.bc-img-text-item .title),
:deep(.bc-img-text-item .card .title) {
  position: absolute;
  left: 50%;
  top: -30rpx;
  transform: translateX(-50%);
  padding: 10rpx 28rpx;
  border-radius: 16rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  background: linear-gradient(180deg, #9AB3FF 0%, #7A59ED 100%);
  box-shadow: 0 8rpx 18rpx rgba(123, 92, 255, 0.28);
  white-space: nowrap;
}

/* 右上角复制按钮（仅样式，不改模板逻辑） */
:deep(.bc-img-text-item)::after {
  content: '';
  position: absolute;
  right: 16rpx;
  top: 16rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #efeaff;
  box-shadow: 0 6rpx 14rpx rgba(123,92,255,0.15);
  background-image: url('@/static/icons/copy_icon.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 28rpx 28rpx;
  opacity: 0.9;
}
:deep(.bc-img-text-item:active)::after { opacity: 0.6; }

/* 文本内容配色与间距 */
:deep(.bc-img-text-item .content),
:deep(.bc-img-text-item .card .content) {
  color: #333;
  font-size: 26rpx;
  line-height: 1.7;
  margin-top: 16rpx;
}

/* 图片区域样式 */
:deep(.bc-img-text-item .imgs),
:deep(.bc-img-text-item .card .imgs) {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}
:deep(.bc-img-text-item .imgs image),
:deep(.bc-img-text-item .card .imgs image) {
  border-radius: 12rpx;
  box-shadow: 0 6rpx 12rpx rgba(0,0,0,0.08);
}
.head-actions { display: flex; justify-content: flex-end; padding: 0 30rpx; }
</style>
