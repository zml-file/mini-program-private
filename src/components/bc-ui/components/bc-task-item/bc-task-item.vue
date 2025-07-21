<template>
  <view class="swiper-wrap m-bottom-30">
    <uni-swipe-action-item
      :disabled="disabled"
      :left-options="leftOptions"
      :right-options="rightOptions"
      @click="onSwipeClick">
      <view class="list" @click="onClick">
        <view class="left_arrow">
          <md-icon :name="bgType == 'dark' ? 'left_arrow_grey' : 'left_arrow'" width="80" height="80">
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
                <!-- :show-day="false" -->
                <uni-countdown
                  :font-size="14"
                  :day="getCountdown(item.endTime)?.days"
                  :hour="getCountdown(item.endTime)?.hours"
                  :minute="getCountdown(item.endTime)?.minutes"
                  :second="getCountdown(item.endTime)?.seconds"
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
import { onMounted, reactive, ref } from 'vue';
// 接口
import api from '@/api';
// 工具
import { getCountdown } from '@/utils/util';

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
  fetchDropList();
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
