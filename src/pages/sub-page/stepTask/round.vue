<template>
  <md-page title="王先生的咨询">
    <view class="container">
      <view v-if="data.stepSign" class="search-wrap m-bottom-30">
        <view class="search flex-c m-right-12">
          <input placeholder="请输入对方的问题" class="m-left-20 input" placeholder-style="color: #FC9382;" />
        </view>
        <md-icon name="search_btn" width="76" height="76"></md-icon>
      </view>
      <!-- 大CD倒计时 -->
      <view class="m-bottom-30">
        <bc-countdown :time="data.detail?.endTime" :desc="data.cdMsg" @timeup="cdTimeup" />
      </view>
      <!-- 问题列表 -->
      <block v-if="data.detail?.endTime && hasItTimeOut(data.detail.endTime)">
        <bc-copy-list :data="data.pageInfo?.contentList || []" @copy="handleCopy"></bc-copy-list>
      </block>
      <!-- 三个状态圆圈 -->
      <view class="status flex-c m-bottom-30">
        <view class="circle_status status_z flex-c" v-if="data.stepSign === 'z'" @click="() => handleNext('z')">Z</view>
        <view class="circle_status status_d flex-c" v-if="data.stepSign === 'd'" @click="() => handleNext('d')">D</view>
        <view
          :class="[
            'circle_status',
            'status_lookfor',
            'flex-c',
            { disabeld: !hasItTimeOut(data.detail?.otherFindEndTime) },
          ]"
          v-if="data.stepSign === 'lookfor'"
          @click="() => handleNext('lookfor')">
          对方找
        </view>
      </view>
      <!-- 大CD倒计时 -->
      <bc-countdown v-if="['z', 'd'].includes(data.stepSign)" :time="data.detail?.endTime" :desc="data.cdMsg" />
      <!-- 对方找倒计时 -->
      <bc-countdown
        v-if="data.stepSign === 'lookfor' && !hasItTimeOut(data.detail?.otherFindEndTime)"
        size="small"
        :time="data.detail?.otherFindEndTime"
        desc="倒计时结束后，对方找按钮将变为可点击"
        @timeup="lookforTimeup" />
    </view>
    <!-- 提示弹窗 -->
    <md-dialog ref="popup" @ok="handleOk" title="请选择对方找的回复内容" width="80%">
      <bc-copy-list
        :data="data.pageInfo?.contentList || []"
        @copy="handleCopy"
        :disabled="!hasItTimeOut(data.cdTime)" />
      <bc-countdown
        v-if="!hasItTimeOut(data.cdTime)"
        size="small"
        :time="data?.cdTime"
        desc="倒计时结束后，复制按钮可点击" />
    </md-dialog>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 工具
import { hasItTimeOut } from '@/utils/util';
import {
  addRound,
  addRoundIntegral,
  addStage,
  closeOverTimeDetailStep,
  getContentList,
  getContentListOfAppoint,
  getContentListOfStep,
  getTaskDetail,
  timeConfig,
} from '@/utils/api';
import { taskModule } from '@/utils/data';
import type { taskModuleKey } from '@/utils/data';
import type { Four } from '@/api/data';
import stage1 from './shuxi/stage1';

const data = reactive<any>({
  taskId: null,
  moduleCodeName: '',
  moduleCode: '',
  detail: {},
  cdMsg: '倒计时结束后，将根据您的会员等级显示下一回合内容',
  list: [
    { id: 1, content: '好！你放心大胆地去 我会在你身后支持你的@别的不说 我一定会在精神和眼神上支持你的哈！' },
    { id: 1, content: '吃不了有什么关系？你喜欢吃什么？你告诉我 @下次我开个直播吃给你看！' },
    { id: 1, content: '嗯...好吧 你的对话框你做主@你说没有就没有 我支持你！' },
    { id: 1, content: '没有就没有吧 这不重要@ 重要的是 不论有没有都不会影响咱俩的友谊对不对？' },
  ],
  pageInfo: {},
  status: 0,
  cdTime: 0,
});
const popup = ref<any>(null);

/**
 * CD倒计时回调
 */
// 大CD倒计时回调
const cdTimeup = () => {
  // 关闭上一个步骤
  // closeOverTimeDetailStep({ specialStepId: data.detail?.specialStepId || -1 }, () => {
  //   if (data.detail.stepType === 'familiar_1_stage_cd') {
  //     // 阶段+1
  //     addStage(data.taskId, () => {
  //       // stage1(data.taskId);
  //     });
  //   } else {
  //     // 回合数+1
  //     addRound(data.taskId, async () => {
  //       await stage1(data.taskId);
  //       await getListInfo();
  //     });
  //   }
  // });
};

// 回合CD
const roundTimeup = async () => {
  stage1(data.taskId, { finish: true });
};

// 对方找CD倒计时回调
const lookforTimeup = () => {
  // if (['familiar_1_cd2', 'familiar_1_cd'].includes(data.detail.stepType)) {
  //   lookfor({ warehouseName: '主动库S2' });
  // }
};

/**
 * 弹窗相关
 */
const handleOk = () => {
  // popup.value!.close();
};

// 点击复制按钮
const handleCopy = async (r: Four.GetContentDetail.ContentList) => {
  // 分数+1
  addRoundIntegral({ taskId: data.taskId, integralNum: 1 });
  // 第零回合
  if (data.detail.roundNum == 0) {
    // 阶段数+1
    // addStage(data.taskId);
  } else if (data.detail.roundNum == 1) {
    // 第一回合
    // await getListInfo({ preStepDetailId: r.stepDetailId });
    // const detail = await fetchGetTaskDetail(data.taskId, false);
    // if ((detail?.roundNum || -1) >= 4) {
    //   await getListInfo();
    // } else {
    //   await getListInfo({ preStepDetailId: r.stepDetailId });
    // }
  }
};

const getListInfo = async (props?: Partial<{ warehouseName: string; preStepDetailId: number; stepId: number }>) => {
  let content: Four.GetContentDetail.Data | null;
  // 提取内容库
  // 有库名，通过库名获取
  if (props?.warehouseName) {
    content = await getContentListOfAppoint({
      taskId: data.taskId,
      warehouseName: props.warehouseName,
      moduleCode: data.moduleCode,
    });
  } else if (props?.preStepDetailId || props?.stepId) {
    content = await getContentList({
      preStepDetailId: props.preStepDetailId,
      taskId: data.taskId,
      stepId: props.stepId,
      moduleCode: data.moduleCode,
    });
  } else {
    // 没有库名，通过模块获取
    content = await getContentListOfStep({
      taskId: data.taskId,
      moduleCode: data.moduleCode,
    });
  }
  if (Object.keys(content || {})?.length) {
    if (['Z', 'AZ'].includes(content?.statusVo.sign || '')) {
      data.stepSign = 'z';
    } else if (['A', 'AD'].includes(content?.statusVo.sign || '')) {
      data.stepSign = 'a';
    } else {
      data.stepSign = 'lookfor';
    }
    data.pageInfo = content;
    data.detail = { ...data.detail, endTime: content?.statusVo?.cutDownTime || data?.detail?.endTime };
    return true;
  }
  return false;
};

// 对方主动找处理逻辑
const lookfor = async (props: { isStage?: boolean; warehouseName?: string; notRound?: boolean }) => {
  const bool = await getListInfo({ warehouseName: props?.warehouseName });

  if (bool) {
    // 对方找弹窗倒计时处理
    const timeInfo = await timeConfig({
      moduleCode: data.moduleCode,
      intervalTimeName: '复制按钮CD时间',
      stageNum: data.detail?.stageNum ?? 0,
    });
    // data.cdTime = timeInfo?.intervalTime || 0;

    // 打开对方找弹窗
    popup.value!.open();
  }
};

// 主动点击按钮
const handleNext = async (type: string) => {
  // 对方找
  if (type === 'lookfor') {
    // 对方主动找倒计时【未结束】，不能点击
    if (data.detail?.otherFindEndTime && !hasItTimeOut(data.detail.otherFindEndTime)) {
      return;
    }
    // 第0阶段，主动库S1
    if (data.detail.stepType === 'familiar_s4') {
      lookfor({ warehouseName: '主动库s1' });
    }
    // if (data.detail.stageNum == 0) {
    // } else if (data.detail.stageNum == 1) {
    //   lookfor({ warehouseName: '主动库S2' });
    // }
  } else if (type === 'd') {
    // D
    // 用户点击D，程序再给出一条新的内容
    // 通过上一个步骤id获取内容
    getContentList({ taskId: data.taskId, moduleCode: data.moduleCode, preStepDetailId: data.detail.stepDetailId });
  } else {
    // Z
    uni.showModal({ content: '倒计时结束后，将回复新内容', showCancel: false });
  }
};

/**
 * 接口相关
 */

onLoad(async options => {
  const { taskId, module } = options as Record<string, any>;
  data.taskId = taskId;
  data.moduleCodeName = module;
  data.moduleCode = taskModule[module as taskModuleKey];

  if (taskId) {
    // 获取任务详情
    const detail = await getTaskDetail(taskId);
    // const detail = await stage1(taskId);
    if (['familiar_s4'].includes(detail.stepType)) {
      data.stepSign = 'lookfor';
    }
    data.detail = detail;
  }
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  padding-bottom: calc($safe-bottom + 120rpx);
  .search-wrap {
    width: 100%;
    display: flex;
    align-items: center;
    .search {
      border-radius: 100rpx;
      box-shadow: 0 8rpx 8rpx 0 #00000040;
      background: white;
      height: 72rpx;
      line-height: 72rpx;
      width: 100%;
      padding: 0 30rpx;
      box-sizing: border-box;
      flex: 1;
      & > .input {
        width: 100%;
      }
    }
  }
  .status {
    .circle_status {
      width: 300rpx;
      height: 300rpx;
      border-radius: 50%;
      angle: -180 deg;
      backdrop-filter: blur(128rpx);
      font-size: 160rpx;
      font-weight: 600;
      &.status_z {
        background: #f7df71;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #ffd206 inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #ffd3070f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #fccf0324;
        box-shadow: 0 3.2rpx 6.4rpx 0 #fcd0080a inset;
      }
      &.status_d {
        background: #a0bf52;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #b0f20b inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #b4f1190f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #aced0a24;
        box-shadow: 0 3.2rpx 6.4rpx 0 #b6fc080a inset;
      }
      &.status_lookfor {
        background: #eecace;
        box-shadow: 3.2rpx 12.8rpx 12.8rpx 0 #eb4c60 inset;
        box-shadow: -3.2rpx -12.8rpx 12.8rpx 0 #ff11110f inset;
        box-shadow: 25.6rpx 115.2rpx 166.4rpx 0 #f42e1324;
        box-shadow: 0 3.2rpx 6.4rpx 0 #f087870a inset;
        font-size: 48rpx;
        &.disabeld {
          background: #888888;
          color: white;
        }
      }
    }
  }
  .btn {
    width: 460rpx;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 16rpx;
    background: radial-gradient(100% 12158.24% at 99.42% 0%, #f9753d 0%, #f8a04f 48.44%, #f7b261 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #f8ad3c 0%, #f0c778 48.44%, #ffd18d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(100% 12158.24% at 99.42% 0%, #faa580 0%, #fc983c 48.44%, #f08f1d 100%)
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
    color: white;
    weight: 600;
    text-align: center;
  }
}
</style>
