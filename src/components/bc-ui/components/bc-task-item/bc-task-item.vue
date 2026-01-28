<template>
  <view class="swiper-wrap m-bottom-30">
    <uni-swipe-action-item
      :disabled="disabled"
      :left-options="leftOptions"
      :right-options="rightOptions"
      @click="onSwipeClick">
      <view
        class="list"
        hover-class="hover-gray"
        :hover-start-time="20"
        :hover-stay-time="70"
        @click="onClick">
        <view class="left_arrow">
          <md-icon :name="getLeftArrowIcon" width="80" height="80">
            <view class="text">{{ tag }}</view>
          </md-icon>
        </view>
        <view class="right_arrow"><md-icon name="right_arrow" width="80" height="80"></md-icon></view>
        <view class="arrow"><md-icon name="arrow" width="40" height="40"></md-icon></view>
        <view class="content m-left-20">
          <view class="top-wrap flex-b">
            <view class="top">
              <view class="title fs-32 font-bold m-bottom-12">{{ item?.taskName }}</view>
              <view class="desc flex-l m-bottom-12">
                {{ desc }}
              </view>
              <view class="date font-bold" v-if="![64, 90].includes(item.taskStatus)">
                <!--  使用计算属性 countdownTime，根据实际情况选择时间字段 -->
                <uni-countdown
                  :font-size="14"
                  :day="countdownResult?.days"
                  :hour="countdownResult?.hours"
                  :minute="countdownResult?.minutes"
                  :second="countdownResult?.seconds"
                  color="#000000" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </uni-swipe-action-item>
    <!-- 续时弹窗 -->
    <md-dialog ref="popup" title="请选择续时周期" @ok="handleOk" @cancel="handleCancel">
      <view class="radio_wrap" v-if="currDialogType === '续时'">
        <uni-data-checkbox
          mode="list"
          icon="right"
          v-model="data.continuedTimeValue"
          :localdata="data.continuedTimeList"></uni-data-checkbox>
      </view>
      <view v-else>删除该订单后不能恢复，请确认是否删除。</view>
    </md-dialog>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
// 接口
import api from '@/api';
// 工具
import { getCountdown, hasItTimeOut } from '@/utils/util';

const data = reactive<any>({
  continuedTimeValue: null, // 选中的续时项
  continuedTimeList: [],
});

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  tag: {
    type: String,
    default: '问',
  },
  desc: {
    type: String,
    default: '',
  },
  bgType: {
    type: String,
    default: 'white', // dark
  },
  useAltArrow: {
    type: Boolean,
    default: false, // 是否使用备用的 left_arrow1 图标
  },
  taskType: {
    type: String,
    default: '', // 任务类型：熟悉、不熟、超熟、陌生
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // eg: option配置项 [{ text: '取消', style: { backgroundColor: '#007aff', } }],
  leftOptions: {
    type: Array,
  },
  rightOptions: {
    type: Array,
    default: [
      {
        text: '续时',
        style: {
          backgroundColor: '#FB9F3B',
        },
      },
      {
        text: '删除',
        style: {
          backgroundColor: '#F95251',
        },
      },
    ],
  },
});
const popup = ref<any>(null);
const currDialogType = ref<string>('');

//  计算属性：根据实际情况选择倒计时时间
const countdownTime = computed(() => {
  const item = props.item;
  const status = item.taskStatus;

  // 如果是"对方找"状态（65）
  if (status === 65) {
    // 检查 otherFindEndTime 是否已过期
    if (item.otherFindEndTime && hasItTimeOut(item.otherFindEndTime)) {
      // 已过期，使用 endTime（回合/阶段倒计时）
      return item.endTime;
    }
    // 未过期，使用 otherFindEndTime
    return item.otherFindEndTime;
  }

  // 其他状态，使用 endTime
  return item.endTime;
});

// 调试：计算倒计时结果
const countdownResult = computed(() => {
  const time = countdownTime.value;
  if (!time) return null;
  const result = getCountdown(time);
  console.log('[bc-task-item] 倒计时计算:', { time, result });
  return result;
});

// 计算属性：根据任务类型选择左侧箭头图标
const getLeftArrowIcon = computed(() => {
  // 如果指定了任务类型，优先使用任务类型对应的图标
  if (props.taskType) {
    switch (props.taskType) {
      case '熟悉':
        return 'left_arrow1';
      case '不熟':
        return 'left_arrow_bushu';
      case '超熟':
        return 'left_arrow_chaoshu';
      case '陌生':
        // 陌生类型使用默认的 left_arrow，与免费类型一致
        return 'left_arrow';
      default:
        break;
    }
  }

  // 回退到原有的 bgType 逻辑
  if (props.bgType === 'yellow') {
    return 'yellow_left_arrow';
  } else if (props.bgType === 'dark') {
    return 'left_arrow_grey';
  } else if (props.useAltArrow) {
    return 'left_arrow1';
  }

  return 'left_arrow';
});

/**
 * 弹窗处理
 */
const handleOk = () => {
  if (currDialogType.value === '续时') {
    console.log('当前选择：', data.continuedTimeValue);
    // 调用续时接口
    fetchRenewTime();
  } else {
    console.log('删除：', props.item);
    // 调用删除接口
    fetchDelTask();
  }
};

const handleCancel = () => {
  data.continuedTimeValue = null;
};

const emit = defineEmits(['click', 'swipeClick']);
const onClick = () => {
  emit('click');
};

// 针对当前业务【续时】和【删除】两个按钮
const onSwipeClick = (e: { position: string; content: { text: any } }) => {
  // console.log(e);
  let text = e.content.text;
  currDialogType.value = text;
  // 打开弹窗
  popup.value!.open();
};

/**
 * 接口相关
 */
// 获取续时下拉
const fetchDropList = async () => {
  try {
    const res = await api.common.dropList(['renew_time']);
    data.continuedTimeList = res.data?.renew_time?.map(item => ({ ...item, text: item.label }));
  } catch (error) {}
};

// 任务续时
const fetchRenewTime = async () => {
  try {
    await api.task.renewTime({
      taskId: props.item.taskId,
      time: data.continuedTimeValue,
    });
    uni.showModal({
      title: '提示',
      content: '任务续时成功',
      showCancel: false,
      success: res => {
        if (res.confirm) {
          emit('swipeClick');
          popup.value!.close();
        }
      },
    });
  } catch (error) {}
};

// 任务删除
const fetchDelTask = async () => {
  try {
    await api.task.delTask({
      taskId: props.item.taskId,
    });
    emit('swipeClick');
  } catch (error) {}
  popup.value!.close();
};

onMounted(() => {
  // fetchDropList();
});
</script>

<style lang="scss" scoped>
// 处理续时弹窗单选样式
.radio_wrap {
  padding: 0 20rpx;
}

.swiper-wrap {
  border-radius: 16rpx;
  box-shadow: 0px 2rpx 48rpx 0 #0000001f;
  background: white;
}
.list {
  position: relative;
  .left_arrow {
    position: absolute;
    left: -4rpx;
    top: -2rpx;
    color: white;
    .text {
      padding: 6rpx 14rpx;
      box-sizing: border-box;
      color: black;
    }
  }
  .right_arrow {
    position: absolute;
    right: -4rpx;
    bottom: -2rpx;
  }
  .arrow {
    position: absolute;
    top: 32rpx;
    right: 32rpx;
  }
  width: 686rpx;
  display: flex;
  padding: 20rpx 40rpx;
  box-sizing: border-box;
  &:not(:last-of-type) {
    margin-bottom: 20rpx;
  }
  .btn {
    width: 112rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    border-radius: 20rpx;
    border: 1rpx solid $title;
    &.active {
      color: $theme-color;
      border-color: $theme-color;
    }
    &.full {
      border: 0;
      background-color: $theme-color;
      color: white;
    }
  }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .top-wrap {
      flex: 1;
      .top {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .desc {
        color: #9b9b9b;
      }
      .date {
        color: $title;
      }
    }

    .bottom {
      display: flex;
      justify-content: flex-end;
      .btn:not(:last-of-type) {
        margin-right: 20rpx;
      }
    }
  }
}
</style>
