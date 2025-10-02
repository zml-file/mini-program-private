<template>
  <view class="page-wrap" :style="`background-image: url(${data.bottom_bg}); background-repeat: no-repeat; background-size: cover; background-position: center bottom;`">
    <md-page
      :title="data.title">
    <template #head>
      <view>
        <view class="flex-l" style="justify-content: flex-end">
          <view class="flex flex-b p-right-30" style="width: calc(50% + 10rpx)">
            <!-- <md-icon type="bg" name="chaoshu_icon" width="80" height="80" circle></md-icon> -->
             <view></view>
            <bc-tequan />
          </view>
        </view>
        <bc-title-text text="对于比较复杂的用户问题，用户可以选择问诊功能，进行咨询的人工服务。" />
      </view>
    </template>
    <view class="container">
      <block v-for="item in data.list" :key="item.id">
        <view @click="() => handleJump(item)">
          <bc-task-item
            :item="item"
            :desc="roundDesc(item.taskStatus)"
            @swipeClick="onSwipeClick"></bc-task-item>
        </view>
      </block>
      <mescroll-empty v-if="data.list.length == 0"></mescroll-empty>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog :title="`创建${data.title.slice(0, 2)}任务`" ref="popup" @ok="handleOk" @cancel="handleCancel">
      <!-- :maxlength="6" -->
      <uni-easyinput
        v-model="data.value"
        primaryColor="#827afd"
        :styles="{
          borderColor: '#827afd',
        }"
        placeholder="请输入名称"></uni-easyinput>
    </md-dialog>
    <!-- 自定义底部创建免费任务按钮 -->
    <template #footer>
      <view class="mf-footer">
        <view class="mf-btn" @click="openCreateDialog">
          <image class="mf-bg" :src="footerConfig.bg" mode="widthFix" />
          <view class="mf-text">
            <text class="mf-plus">＋</text>
            <text class="mf-label">{{ footerConfig.label }}</text>
          </view>
        </view>
      </view>
    </template>
    </md-page>

  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { reactive, ref, computed } from 'vue';
// 接口
import api from '@/api';
import type { Four, Task } from '@/api/data';
// 工具
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import { hasItTimeOut, Toast, convertToBase64 } from '@/utils/util';
import { question3 } from './shuxi/stage0';
import { getTaskDetail } from '@/utils/api';

const data = reactive<any>({
  title: '',
  list: [],
  module: '',
  value: '',
  bottom_bg: '',
  loading: false, // 加载状态
  isFirstLoad: true, // 是否首次加载
});
const popup = ref<any>(null);


const footerConfig = computed(() => {
  if (data.title.includes('超熟')) return { bg: '/static/images/chaoshu.png', label: '创建超熟任务' };
  if (data.title.includes('熟悉')) return { bg: '/static/images/shuxi.png', label: '创建熟悉任务' };
  if (data.title.includes('不熟')) return { bg: '/static/images/bushu.png', label: '创建不熟任务' };
  if (data.title.includes('陌生')) return { bg: '/static/images/mosheng.png', label: '创建陌生任务' };
  if (data.title.includes('免费')) return { bg: '/static/images/mianfei.png', label: '创建免费任务' };
  return { bg: '/static/images/mianfei.png', label: '创建免费任务' };
});

const roundDesc = (status: number) => {
  if ([61, 62].includes(status)) {
    return '下次聊天开启倒计时';
  } else if (status === 63) {
    return 'Z倒计时';
  } else if (status === 65) {
    return '对方找倒计时';
  }
  return '聊天任务进行中';
};

const handleOk = () => {
  if (data.loading) return; // 防止重复点击
  if (!data.value) {
    Toast('请输入任务名称');
    return;
  }
  fetchCreateTask({ taskName: data.value });
};

const handleCancel = () => {
  data.value = '';
};

const openCreateDialog = () => {
  const inst: any = popup.value;
  if (inst && typeof inst.open === 'function') {
    inst.open();
  } else {
    // 等待下一帧再尝试，避免未挂载时点击
    setTimeout(() => {
      const again: any = popup.value;
      if (again && typeof again.open === 'function') {
        again.open();
      } else {
        Toast('弹窗暂未就绪，请稍后再试');
      }
    }, 0);
  }
};


const handleJump = async (item: Task.List.Data & Four.GetTaskDetail.Data) => {
  // familiar_s2（阶段0的问答流程）需要等大CD结束
  if (item.stepType === 'familiar_s2') {
    const _hasItTimeOut = hasItTimeOut(item?.endTime);
    if (!_hasItTimeOut) {
      // 倒计时未结束，提示用户等待
      uni.showToast({
        title: '倒计时未结束，请耐心等待',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    await question3({
      taskId: item.taskId,
      specialStepId: item.specialStepId,
      // 当用户选择"否"时，会触发S3提示，确认后需要刷新列表以更新倒计时
      onNoSelected: () => {
        console.log('问3选择了"否"，刷新列表');
        getTaskList();
      }
    });
    return; // 该流程会在内部引导跳转
  }

  // “对方找倒计时”未结束时禁止点击（taskStatus=65）
  if (item.taskStatus === 65 && item.otherFindEndTime && !hasItTimeOut(item.otherFindEndTime)) {
    uni.showToast({
      title: '对方找倒计时未结束，请稍后再试',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  // 通用倒计时检查：回合/阶段倒计时（taskStatus=61,62）或Z倒计时（taskStatus=63）
  if ([61, 62, 63].includes(item.taskStatus) && item.endTime && !hasItTimeOut(item.endTime)) {
    const statusText = item.taskStatus === 63 ? 'Z倒计时' : '下次聊天开启倒计时';
    uni.showToast({
      title: `${statusText}未结束，请耐心等待`,
      icon: 'none',
      duration: 2000
    });
    return;
  }

  // 进入回合页
  uni.redirectTo({ url: '/pages/sub-page/stepTask/round?module=熟悉模块&taskId=' + item.taskId });
};

const onSwipeClick = () => {
  getTaskList();
};

/**
 * 接口相关
 */
// 获取任务列表
const getTaskList = async (module?: any) => {
  if (data.loading) return; // 防止重复请求
  data.loading = true;
  uni.showLoading({ title: '加载中...', mask: true });
  try {
    const res = await api.task.list({
      moduleCode: module || data.module,
    });
    const list = [];
    for (let item of res?.data || []) {
      // 获取任务详情
      const detail = await getTaskDetail(item.taskId);
      list.push({ ...item, ...detail });
    }
    data.list = list;
  } catch (error) {
  } finally {
    data.loading = false;
    uni.hideLoading();
  }
};

// 创建任务
const fetchCreateTask = async (params: Pick<Task.Create.Body, 'taskName'>) => {
  if (data.loading) return; // 防止重复点击
  data.loading = true;
  uni.showLoading({ title: '创建中...', mask: true });
  try {
    const res = await api.task.createTask({ ...params, moduleCode: data.module });
    // 关闭弹窗并清空输入
    popup.value?.close();
    handleCancel();

    // 只有【熟悉模块】和【超熟模块】才有问卷
    if (['熟悉模块', '超熟模块'].includes(data.title)) {
      uni.navigateTo({
        url: `/pages/sub-page/stepTask/questionnaire?taskId=${res.data?.taskId}&taskName=${params?.taskName}&module=${data.title}`,
      });
    } else {
      // 对于不需要问卷的模块，创建成功后立即刷新列表
      data.loading = false; // 重置loading状态，允许刷新
      await getTaskList();
    }
  } catch (error) {
  } finally {
    data.loading = false;
    uni.hideLoading();
  }
};

onLoad(async (options: any) => {
  const module = options?.module as taskModuleKey;
  data.module = taskModule[module];
  data.title = module;
  data.isFirstLoad = true;
  await getTaskList(taskModule[module]);
  data.bottom_bg = await convertToBase64('/static/images/page_bottom_bg.png');
  data.isFirstLoad = false;
});

onShow(() => {
  // 页面显示时刷新任务列表（例如从问卷页面返回时）
  // 但不在首次加载时刷新，避免重复请求
  if (data.module && !data.isFirstLoad) {
    getTaskList();
  }
});
</script>

<style lang="scss" scoped>
.container {
  padding: 180rpx 30rpx 30rpx;
  box-sizing: border-box;
}

/* 底部免费按钮 */
.mf-footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 16rpx 30rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx);
  box-sizing: border-box;
  z-index: 99;
}

/* 页面底部背景 */
.page-wrap { position: relative; min-height: 100vh; }

.mf-btn { width: 100%; position: relative; }
.mf-bg { width: 100%; display: block; }
.mf-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: translateY(20rpx); }
.mf-plus { color: #fff; font-size: 40rpx; font-weight: 700; margin-right: 12rpx; line-height: 1; }
.mf-label { color: #fff; font-size: 32rpx; font-weight: 600; line-height: 1; }

</style>
