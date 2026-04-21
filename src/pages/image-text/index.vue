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
      <block v-for="item in sortedList" :key="item">
        <bc-img-text-item
          disabled
          allowItemClickWhenDisabled
          :item="{ ...item, title: item.title }"
          @itemClick="handleItemClick"></bc-img-text-item>
      </block>
    <template #footer>
      <view v-if="!hasImageTextAccess" class="mf-footer">
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

    <!-- 特殊图文激活提示板 -->
    <md-dialog
      ref="specialActivatedDialog"
      title="特殊图文已激活"
      :showCancel="false"
      okText="我知道了">
      <view class="pupup-content">特殊图文已成功激活，您现在可以查看特殊内容了！</view>
    </md-dialog>

    <!-- 首次点击普通图文提示板 -->
    <md-dialog
      ref="normalFirstClickDialog"
      title="温馨提示"
      :showCancel="false"
      okText="我知道了">
      <view class="pupup-content">您已激活特殊图文，现在点击普通图文查看内容。</view>
    </md-dialog>
  </md-page>
  <bottom-tab-bar :current="1" />
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Task, Common } from '@/api/data';
// 工具
import { taskModule, payModule } from '@/utils/data';

const IMAGE_TEXT_STATE_KEY = 'imageTextPageState';

const data = reactive<any>({
  describe: '', // 图文说明
  list: [],
  value: '',
  specialActivated: false, // 特殊图文是否已激活
  normalFirstClicked: false, // 激活后是否已首次点击普通图文
});

const restoreImageTextState = () => {
  const saved = uni.getStorageSync(IMAGE_TEXT_STATE_KEY) || {};
  data.specialActivated = !!saved.specialActivated;
  data.normalFirstClicked = !!saved.normalFirstClicked;
};

const persistImageTextState = () => {
  uni.setStorageSync(IMAGE_TEXT_STATE_KEY, {
    specialActivated: data.specialActivated,
    normalFirstClicked: data.normalFirstClicked,
  });
};

// 排序后的列表：普通图文在前，特殊图文在后
const hasImageTextAccess = computed(() => data.list.length > 0 || !!data.describe);

const sortedList = computed(() => {
  return [...data.list].sort((a, b) => {
    // dataType === 1 表示特殊图文，其他为普通图文
    const aIsSpecial = a.dataType === 1;
    const bIsSpecial = b.dataType === 1;

    // 普通图文排在前面（返回负数），特殊图文排在后面（返回正数）
    if (aIsSpecial && !bIsSpecial) return 1;
    if (!aIsSpecial && bIsSpecial) return -1;
    return 0; // 相同类型保持原顺序
  });
});

// 添加用户信息
const userInfo = ref<Common.Info.Data>();
const popup = ref<any>(null);
const specialActivatedDialog = ref<any>(null);
const normalFirstClickDialog = ref<any>(null);
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
    fetchCreateTask({ taskName: 'A0模块' });
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

// 处理图文卡片点击
const handleItemClick = (item: any) => {
  console.log('[图文] 点击卡片:', item);

  // 判断是否为特殊图文（dataType === 1 表示特殊图文，根据实际情况调整）
  const isSpecial = item.dataType === 1;

  if (isSpecial) {
    // 点击特殊图文
    if (!data.specialActivated) {
      // 首次激活特殊图文，显示提示板
      data.specialActivated = true;
      persistImageTextState();
      specialActivatedDialog.value?.open();
      console.log('[图文] 特殊图文已激活');
    }
  } else {
    // 点击普通图文
    if (data.specialActivated && !data.normalFirstClicked) {
      // 特殊图文已激活，且首次点击普通图文，显示提示板
      data.normalFirstClicked = true;
      persistImageTextState();
      normalFirstClickDialog.value?.open();
      console.log('[图文] 首次点击普通图文');
    }
  }
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
    console.log('[图文] 开始获取图文列表');
    console.log('[图文] Token:', uni.getStorageSync('token'));

    const res = await api.task.moduleImg();

    console.log('[图文] 接口响应:', res);
    console.log('[图文] 响应码:', res.code);
    console.log('[图文] 响应数据:', res.data);

    // 检查数据有效性
    if (!res.data) {
      console.error('[图文] 响应数据为空');
      uni.showToast({ title: '获取图文数据失败', icon: 'none' });
      return;
    }

    if (!res.data.moduleImgVoList) {
      console.error('[图文] 图文列表字段不存在');
      uni.showToast({ title: '图文列表数据异常', icon: 'none' });
      return;
    }

    console.log('[图文] 图文列表长度:', res.data.moduleImgVoList.length);

    if (res.data.moduleImgVoList.length === 0) {
      console.warn('[图文] 图文列表为空');
      uni.showToast({ title: '暂无图文内容', icon: 'none', duration: 2000 });
    }

    // 数据映射
    data.list = res.data.moduleImgVoList.map(item => ({
      ...item,
      title: item?.title || '图文内容',
      content: item.imgContent,
      imgs: item.imgUrlList,
      type: 'img_text',
      dataType: item.type,
    }));

    data.describe = res.data?.describe || '';

    console.log('[图文] 映射后的列表:', data.list);
    console.log('[图文] 图文说明:', data.describe);

  } catch (error: any) {
    console.error('[图文] 获取列表失败:', error);
    console.error('[图文] 错误详情:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
    uni.showToast({
      title: error.message || '获取图文列表失败',
      icon: 'none',
      duration: 3000
    });
  }
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
  restoreImageTextState();
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
