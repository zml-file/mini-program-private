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
            :desc="roundDesc(item)"
            :taskType="data.title.includes('熟悉') ? '熟悉' :
                      data.title.includes('不熟') ? '不熟' :
                      data.title.includes('超熟') ? '超熟' :
                      data.title.includes('陌生') ? '陌生' : ''"
            @swipeClick="onSwipeClick"></bc-task-item>
        </view>
      </block>
      <mescroll-empty v-if="data.list.length == 0"></mescroll-empty>
    </view>
    <!-- 创建弹窗 -->
    <md-dialog :title="`创建${data.title.slice(0, 2)}任务`" ref="popup" @ok="handleOk" @cancel="handleCancel">
      <!-- 任务名称输入 -->
      <view class="m-bottom-20">
        <view class="dialog-label m-bottom-10">任务名称</view>
        <uni-easyinput
          v-model="data.value"
          primaryColor="#827afd"
          :styles="{
            borderColor: '#827afd',
          }"
          placeholder="请输入名称"></uni-easyinput>
      </view>

      <!-- 周期价格选择 -->
      <view>
        <view class="dialog-label m-bottom-10">选择周期</view>
        <uni-data-checkbox
          mode="list"
          icon="right"
          v-model="data.selectedPeriod"
          :localdata="data.periodOptions"></uni-data-checkbox>
      </view>
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
import * as fm from '@/utils/familiar-local';
import * as um from '@/utils/unfamiliar-local';
import * as sm from '@/utils/stranger-local';
import { getCountdownTimeMs } from '@/config';
// 工具
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import { hasItTimeOut, Toast, convertToBase64 } from '@/utils/util';
import { question3 } from './shuxi/stage0';

const data = reactive<any>({
  title: '',
  list: [],
  module: '',
  value: '',
  bottom_bg: '',
  loading: false, // 加载状态
  isFirstLoad: true, // 是否首次加载
  // 周期价格选择相关
  selectedPeriod: '', // 选中的周期
  periodOptions: [
    { value: '5', text: '782心币/5天', days: 5, price: 782 },
    { value: '8', text: '1394心币/8天', days: 8, price: 1394 },
    { value: '15', text: '1666心币/15天', days: 15, price: 1666 },
  ],
});
const popup = ref<any>(null);


const footerConfig = computed(() => {
  if (data.title.includes('超熟')) return { bg: '/static/images/chaoshu.png', label: '创建超熟对话' };
  if (data.title.includes('熟悉')) return { bg: '/static/images/shuxi.png', label: '创建熟悉对话' };
  if (data.title.includes('不熟')) return { bg: '/static/images/bushu.png', label: '创建不熟对话' };
  if (data.title.includes('陌生')) return { bg: '/static/images/mosheng.png', label: '创建陌生对话' };
  if (data.title.includes('免费')) return { bg: '/static/images/mianfei.png', label: '创建免费对话' };
  return { bg: '/static/images/mianfei.png', label: '创建免费对话' };
});

const roundDesc = (item: Task.List.Data) => {
  const status = item.taskStatus;

  //  优先检查"对方找"倒计时是否已结束
  if (status === 65) {
    // 如果 otherFindEndTime 已过期，检查是否有其他倒计时
    if (item.otherFindEndTime && hasItTimeOut(item.otherFindEndTime)) {
      // "对方找"倒计时已结束，检查是否有回合/阶段倒计时
      if (item.endTime && !hasItTimeOut(item.endTime)) {
        // 有未结束的回合/阶段倒计时
        return '下次聊天开启倒计时';
      }
      // 没有其他倒计时，显示进行中
      return '聊天任务进行中';
    }
    // "对方找"倒计时未结束
    return '对方找倒计时';
  }

  //  检查回合/阶段倒计时
  if ([61, 62].includes(status)) {
    return '下次聊天开启倒计时';
  }

  //  检查Z倒计时
  if (status === 63) {
    return 'Z倒计时';
  }

  return '聊天任务进行中';
};

const handleOk = () => {
  if (data.loading) return; // 防止重复点击
  if (!data.value) {
    Toast('请输入任务名称');
    return;
  }
  if (!data.selectedPeriod) {
    Toast('请选择周期');
    return;
  }

  // 获取选中的周期配置
  const selectedOption = data.periodOptions.find((opt: any) => opt.value === data.selectedPeriod);
  if (!selectedOption) {
    Toast('周期选择错误');
    return;
  }

  fetchCreateTask({
    taskName: data.value,
    durationDays: selectedOption.days,
    price: selectedOption.price
  });
};

const handleCancel = () => {
  data.value = '';
  data.selectedPeriod = '';
};

const openCreateDialog = () => {
  // 如果是免费对话，直接创建，无需弹出问卷
  if (data.title.includes('免费')) {
    fetchCreateTask({ taskName: '免费对话', durationDays: 5, price: 0 });
    return;
  }

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


const handleJump = async (item: Task.List.Data) => {
  // 非熟悉模块：不熟 / 陌生 分别进入各自的回合页
  if (data.title.includes('不熟') || data.title.includes('陌生')) {
    // “对方找倒计时”未结束时禁止点击（taskStatus=65）
    if (item.taskStatus === 65 && item.otherFindEndTime && !hasItTimeOut(item.otherFindEndTime)) {
      uni.showToast({ title: '对方找倒计时未结束，请稍后再试', icon: 'none', duration: 2000 });
      return;
    }
    // 通用倒计时检查：回合/阶段倒计时（taskStatus=61,62）或Z倒计时（taskStatus=63）
    if ([61, 62, 63].includes(item.taskStatus) && item.endTime && !hasItTimeOut(item.endTime)) {
      const statusText = item.taskStatus === 63 ? 'Z倒计时' : '下次聊天开启倒计时';
      uni.showToast({ title: `${statusText}未结束，请耐心等待`, icon: 'none', duration: 2000 });
      return;
    }
    const name = item.taskName || '';
    if (data.title.includes('不熟')) {
      // 不熟模块：继续使用 round-new.vue
      uni.navigateTo({ url: `/pages/sub-page/stepTask/round-new?module=不熟模块&taskId=${item.taskId}&taskName=${encodeURIComponent(name)}` });
    } else {
      // 陌生模块：使用专用页面 round-stranger.vue
      uni.navigateTo({ url: `/pages/sub-page/stepTask/round-stranger?module=陌生模块&taskId=${item.taskId}&taskName=${encodeURIComponent(name)}` });
    }
    return;
  }

  // 以下为熟悉模块专属逻辑
  fm.initFamiliarLocal();
  const t = fm.getTask(String(item.taskId));
  if (t && t.stageIndex === 0 && t.stageCdUnlockAt) {
    const now = Date.now();
    // 检查是否已经完成了问3（即S4倒计时）
    if (t.askFlow?.ask3 === '是' && now >= t.stageCdUnlockAt) {
      console.log('[handleJump] S4倒计时结束，进入阶段1');
      const result = fm.enterStage1(String(item.taskId));
      if (result.ok) {
        uni.showToast({ title: '欢迎进入第一阶段！', icon: 'success', duration: 2000 });
        setTimeout(() => { uni.navigateTo({ url: `/pages/sub-page/stepTask/round?module=熟悉模块&taskId=${item.taskId}` }); }, 2000);
      } else {
        uni.showToast({ title: '进入第一阶段失败', icon: 'error', duration: 2000 });
      }
      return;
    }
    // 检查是否尚未完成问3（即S2倒计时）
    if (!t.askFlow?.ask3 && now >= t.stageCdUnlockAt) {
      console.log('[handleJump] S2倒计时结束，触发问3');
      await handleQuestion3(String(item.taskId));
      return;
    }
    // 倒计时未结束
    if (now < t.stageCdUnlockAt) {
      uni.showToast({ title: '倒计时未结束，请耐心等待', icon: 'none', duration: 2000 });
      return;
    }
  }

  // familiar_s2（阶段0的问答流程）需要等大CD结束（旧逻辑兼容）
  if (item.stepType === 'familiar_s2') {
    const _hasItTimeOut = hasItTimeOut(item?.endTime);
    if (!_hasItTimeOut) {
      uni.showToast({ title: '倒计时未结束，请耐心等待', icon: 'none', duration: 2000 });
      return;
    }
    await question3({
      taskId: item.taskId,
      specialStepId: item.specialStepId,
      onNoSelected: () => { console.log('问3选择了"否"，刷新列表'); getTaskList(); }
    });
    return;
  }

  // “对方找倒计时”未结束时禁止点击（taskStatus=65）
  if (item.taskStatus === 65 && item.otherFindEndTime && !hasItTimeOut(item.otherFindEndTime)) {
    uni.showToast({ title: '对方找倒计时未结束，请稍后再试', icon: 'none', duration: 2000 });
    return;
  }
  // 通用倒计时检查：回合/阶段倒计时（taskStatus=61,62）或Z倒计时（taskStatus=63）
  if ([61, 62, 63].includes(item.taskStatus) && item.endTime && !hasItTimeOut(item.endTime)) {
    const statusText = item.taskStatus === 63 ? 'Z倒计时' : '下次聊天开启倒计时';
    uni.showToast({ title: `${statusText}未结束，请耐心等待`, icon: 'none', duration: 2000 });
    return;
  }

  // 根据本地状态决定路由：阶段0进问卷，其余进回合页
  let taskForRouting = t;
  if (!taskForRouting) { fm.initFamiliarLocal(); taskForRouting = fm.getTask(String(item.taskId)); }
  const name = item.taskName || '';
  if (taskForRouting && taskForRouting.stageIndex === 0) {
    uni.navigateTo({ url: `/pages/sub-page/stepTask/questionnaire?module=熟悉模块&taskId=${item.taskId}&taskName=${encodeURIComponent(name)}` });
  } else {
    uni.navigateTo({ url: `/pages/sub-page/stepTask/round?module=熟悉模块&taskId=${item.taskId}` });
  }
};

const onSwipeClick = () => {
  getTaskList();
};

// 处理问3逻辑
const handleQuestion3 = async (taskId: string) => {
  // 显示问3对话框
  const result = await new Promise<'是' | '否'>((resolve) => {
    uni.showModal({
      title: '温馨提示',
      content: '请确定完成第一阶段，即倒计时结束前未与对方见面或主动联系，是或否？',
      confirmText: '是',
      cancelText: '否',
      success: (res) => {
        resolve(res.confirm ? '是' : '否');
      }
    });
  });
  
  console.log('[handleQuestion3] 用户选择:', result);

  fm.initFamiliarLocal();
  const t = fm.getTask(taskId);
  if (!t) return;

  // 保存选择
  t.askFlow = { ...(t.askFlow || {}), ask3: result };
  uni.setStorageSync(`fm:task:${taskId}`, t);
  
  if (result === '是') {
    // 显示提示板S4
    await new Promise<void>((resolve) => {
      uni.showModal({
        title: '温馨提示',
        content: '很好！接下来将进入正式阶段，请继续保持',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          resolve();
        }
      });
    });

    // 保存S4提示板状态
    const t2 = fm.getTask(taskId);
    if (t2) {
      t2.prompts = { ...(t2.prompts || {}), S4: { shown: true, at: Date.now() } };
      uni.setStorageSync(`fm:task:${taskId}`, t2);
    }

    // 设置6-9天倒计时（进入阶段1前的倒计时）
    const days = Math.floor(6 + Math.random() * 4); // 6-9天
    const unlockAt = Date.now() + getCountdownTimeMs(days * 24 * 60 * 60 * 1000);
    const t3 = fm.getTask(taskId);
    if (t3) {
      t3.listBadge = '下次聊天开启倒计时';
      t3.listCountdownEndAt = unlockAt;
      t3.stageCdUnlockAt = unlockAt;
      uni.setStorageSync(`fm:task:${taskId}`, t3);
    }
    
    console.log('[handleQuestion3] S4倒计时设置:', days, '天，结束时间:', new Date(unlockAt).toLocaleString());
    
    // 刷新列表显示
    getTaskList();
    
    uni.showToast({
      title: `已设置${days}天倒计时，到期后进入第一阶段`,
      icon: 'none',
      duration: 3000
    });
  } else {
    // 显示提示板S3
    await new Promise<void>((resolve) => {
      uni.showModal({
        title: '温馨提示',
        content: '请您做好准备后再开始',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          resolve();
        }
      });
    });

    // 保存S3提示板状态
    const t2 = fm.getTask(taskId);
    if (t2) {
      t2.prompts = { ...(t2.prompts || {}), S3: { shown: true, at: Date.now() } };
      uni.setStorageSync(`fm:task:${taskId}`, t2);
    }

    // 重新设置9-10天倒计时（回到问2）
    const days = Math.floor(9 + Math.random() * 2); // 9-10天
    const unlockAt = Date.now() + getCountdownTimeMs(days * 24 * 60 * 60 * 1000);
    const t3 = fm.getTask(taskId);
    if (t3) {
      t3.listBadge = '下次聊天开启倒计时';
      t3.listCountdownEndAt = unlockAt;
      t3.stageCdUnlockAt = unlockAt;
      t3.askFlow = { ...(t3.askFlow || {}), ask3: undefined }; // 清除ask3选择
      uni.setStorageSync(`fm:task:${taskId}`, t3);
    }
    
    console.log('[handleQuestion3] S3触发，重新设置倒计时:', days, '天');
    
    // 刷新列表显示
    getTaskList();
    
    uni.showToast({
      title: '请准备好后再次尝试',
      icon: 'none',
      duration: 2000
    });
  }
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
    // 按模块分流到对应本地引擎
    const title = data.title || '';
    let lt: Array<{ id: string; name: string; status: any; badge: string; countdownEndAt: number | null }> = [];
    if (title.includes('不熟')) {
      um.initUmLocal();
      lt = um.listTasks();
      if (!lt || lt.length === 0) {
        const created = um.createTask({ name: '测试订单', durationDays: 5 });
        if (created.ok) { lt = um.listTasks(); uni.showToast({ title: '已创建示例订单', icon: 'none' }); }
      }
    } else if (title.includes('陌生')) {
      sm.initSmLocal();
      lt = sm.listTasks();
      if (!lt || lt.length === 0) {
        const created = sm.createTask({ name: '测试订单', durationDays: 5 });
        if (created.ok) { lt = sm.listTasks(); uni.showToast({ title: '已创建示例订单', icon: 'none' }); }
      }
    } else if (title.includes('免费')) {
      // 免费模块使用独立存储
      fm.initFamiliarLocal('free');
      lt = fm.listTasks();
      if (!lt || lt.length === 0) {
        const created = fm.createTask({ name: '测试订单', durationDays: 5 });
        if (created.ok) { lt = fm.listTasks(); uni.showToast({ title: '已创建示例订单', icon: 'none' }); }
      }
    } else if (title.includes('超熟')) {
      // 超熟模块使用独立存储
      fm.initFamiliarLocal('super');
      lt = fm.listTasks();
      if (!lt || lt.length === 0) {
        const created = fm.createTask({ name: '测试订单', durationDays: 5 });
        if (created.ok) { lt = fm.listTasks(); uni.showToast({ title: '已创建示例订单', icon: 'none' }); }
      }
    } else {
      // 熟悉模块使用默认存储
      fm.initFamiliarLocal('familiar');
      lt = fm.listTasks();
      if (!lt || lt.length === 0) {
        const created = fm.createTask({ name: '测试订单', durationDays: 5 });
        if (created.ok) { lt = fm.listTasks(); uni.showToast({ title: '已创建示例订单', icon: 'none' }); }
      }
    }

    // 映射到该页面现有字段，保持模板不改
    const toLocalYmdHms = (ms?: number | null) => {
      if (!ms && ms !== 0) return '';
      const d = new Date(ms as number);
      const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
      const y = d.getFullYear();
      const m = pad(d.getMonth()+1);
      const dd = pad(d.getDate());
      const h = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      return `${y}-${m}-${dd} ${h}:${mi}:${s}`; // 与 getCountdown 解析一致
    };

    data.list = (lt || []).map((i) => {
      const badge = i.badge;
      const endAt = i.countdownEndAt || null;
      console.log('[getTaskList] 任务数据:', { id: i.id, badge, endAt, endAtDate: endAt ? toLocalYmdHms(endAt) : null });
      let taskStatus = 0;
      let otherFindEndTime = '';
      let endTime = '';
      if (badge === '对方找倒计时') {
        taskStatus = 65;
        otherFindEndTime = toLocalYmdHms(endAt);
      } else if (badge === 'Z倒计时') {
        taskStatus = 63;
        endTime = toLocalYmdHms(endAt);
      } else if (badge === '下次聊天开启倒计时') {
        taskStatus = 61;
        endTime = toLocalYmdHms(endAt);
      }
      console.log('[getTaskList] 映射后数据:', { taskStatus, endTime, otherFindEndTime });
      return {
        id: i.id,
        taskId: i.id,
        taskName: i.name,
        taskStatus,
        endTime,
        otherFindEndTime,
        stepType: '', // 默认空，避免阻塞跳转
        specialStepId: '',
      } as any as Task.List.Data;
    });

    console.log('任务列表加载成功（本地），共', data.list.length, '个任务');
  } catch (error) {
    console.error('获取任务列表失败(本地):', error);
  } finally {
    data.loading = false;
    uni.hideLoading();
  }
};

// 创建任务
const fetchCreateTask = async (params: { taskName: string; durationDays: number; price: number }) => {
  if (data.loading) return; // 防止重复点击
  data.loading = true;
  uni.showLoading({ title: '创建中...', mask: true });
  try {
    // 关闭弹窗并清空输入
    popup.value?.close();
    handleCancel();

    const name = (params.taskName || '').slice(0, 6);
    const title = data.title || '';

    if (title.includes('不熟')) {
      um.initUmLocal();
      const res = um.createTask({ name, durationDays: params.durationDays });
      if (res.ok && res.task) {
        // 使用 round-new.vue（round-local 编译有问题，复制一份）
        uni.navigateTo({ url: `/pages/sub-page/stepTask/round-new?taskId=${res.task.id}&taskName=${params?.taskName}&module=不熟模块` });
      } else {
        uni.showToast({ title: res.reason || '创建失败', icon: 'none' });
        data.loading = false;
        await getTaskList();
      }
    } else if (title.includes('陌生')) {
      sm.initSmLocal();
      const res = sm.createTask({ name, durationDays: params.durationDays });
      if (res.ok && res.task) {
        // 陌生模块使用专用页面 round-stranger.vue
        uni.navigateTo({ url: `/pages/sub-page/stepTask/round-stranger?taskId=${res.task.id}&taskName=${encodeURIComponent(params?.taskName || '')}&module=陌生模块` });
      } else {
        uni.showToast({ title: res.reason || '创建失败', icon: 'none' });
        data.loading = false;
        await getTaskList();
      }
    } else {
      // 熟悉/超熟/免费模块
      // 根据模块类型初始化不同的存储
      if (title.includes('免费')) {
        fm.initFamiliarLocal('free');
      } else if (title.includes('超熟')) {
        fm.initFamiliarLocal('super');
      } else {
        fm.initFamiliarLocal('familiar');
      }

      const res = fm.createTask({ name, durationDays: params.durationDays });
      if (res.ok && res.task) {
        // 免费模块直接进入对话页，跳过问卷
        if (title.includes('免费')) {
          uni.navigateTo({ url: `/pages/sub-page/stepTask/round?module=免费模块&taskId=${res.task.id}` });
        } else {
          // 熟悉/超熟模块需要问卷
          uni.navigateTo({ url: `/pages/sub-page/stepTask/questionnaire?taskId=${res.task.id}&taskName=${params?.taskName}&module=${data.title}` });
        }
      } else {
        uni.showToast({ title: res.reason || '创建失败', icon: 'none' });
        data.loading = false;
        await getTaskList();
      }
    }
  } catch (error) {
    console.error('创建任务失败(本地):', error);
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

/* 弹窗标签样式 */
.dialog-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
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
.mf-bg { width: 100%; display: block; image-rendering: pixelated; }
.mf-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: translateY(20rpx); }
.mf-plus { color: #fff; font-size: 40rpx; font-weight: 700; margin-right: 12rpx; line-height: 1; }
.mf-label { color: #fff; font-size: 32rpx; font-weight: 600; line-height: 1; }

</style>
