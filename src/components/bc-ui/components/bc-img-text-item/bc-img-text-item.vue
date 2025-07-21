<template>
  <view class="list m-bottom-60">
    <view class="title">{{ item.title }}</view>
    <view class="content" v-if="item.type === 'text'">{{ item.content }}</view>
    <view class="content" v-else>
      <view class="text">
        <!-- 复制图标 -->
        <view
          class="copy_icon"
          @click="() => handleCopy(item.content)"
          v-if="!selectedNum || item.replayId == selectedNum">
          <md-icon name="copy_icon" width="60" height="60"></md-icon>
        </view>
        {{ item.content }}
      </view>
      <view class="line"></view>
      <view class="image-wrap">
        <image
          class="image"
          :src="im"
          v-for="im in item.imgs"
          :key="im"
          @click="() => handlePreview(item.imgs, im)"></image>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import api from '@/api';
import { Toast } from '@/utils/util';
const emit = defineEmits(['select']);

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  disabled: Boolean,
  selectedNum: Number,
});

/**
 * 接口处理
 */
// 选择图文
const fetchUpdateReplyIsUsed = async (replyId: number) => {
  try {
    await api.task.updateReplyIsUsed({ replyId });
    return true;
  } catch (error) {}
  return false;
};

// 图片预览
const handlePreview = (imgList: string[], currImg: string) => {
  if (!!props?.disabled) return;
  if (imgList?.length <= 0) return;
  // 如果不存在被选中的项
  if (!props?.selectedNum) {
    uni.showModal({
      title: '温馨提示',
      content: `您当前选择了内容${props.item.replayId}，确定后其他的内容不可以查看，是否确定？`,
      success: async res => {
        if (res.confirm) {
          const bool = await fetchUpdateReplyIsUsed(props.item.replayId);
          // 接口处理，通过则返回当前的num
          if (bool) {
            emit('select', props.item.replayId);
            uni.previewImage({
              current: currImg,
              urls: imgList,
            });
          }
        }
      },
    });
    return;
  }
  // 存在被选中的项，且点击的不是当前项则提示
  if (props?.selectedNum && props.item?.replayId != props?.selectedNum) {
    uni.showModal({
      title: '温馨提示',
      content: `您已经选择了图文内容${props.item.replayId}，其他图文的大图不可查看`,
      showCancel: false,
    });
    return;
  }
  uni.previewImage({
    current: currImg,
    urls: imgList,
  });
};

// 复制到粘贴板
const handleCopy = (text: string) => {
  if (!!props?.disabled) return Toast('请开启图文权限');
  uni.setClipboardData({
    data: text,
    success(res) {
      console.log(res);
    },
  });
};
</script>

<style lang="scss" scoped>
.list {
  width: 100%;
  padding: 16rpx 36rpx;
  box-sizing: border-box;
  gap: 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid #dddddd;
  box-shadow: 0 8rpx 8rpx 0 #00000040;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30rpx;
  .title {
    margin-top: -40rpx;
    font-size: 36rpx;
    display: inline-block;
    height: 60rpx;
    line-height: 60rpx;
    padding: 0 40rpx;
    box-sizing: border-box;
    gap: 2px;
    border-radius: 10rpx;
    background: linear-gradient(159.7deg, #fff8ee 10.76%, #fde3e0 93.75%);
    box-shadow: 0 0 12rpx 0 #c4ae8680;
  }
  .content {
    width: 100%;
    font-weight: 600;
    font-size: 24rpx;
    & > .text {
      box-shadow: 2rpx 4rpx 4rpx 0 #fc7c7c40;
      background: #fef8f5e5;
      border-radius: 20rpx;
      word-break: break-all;
      padding: 20rpx;
      box-sizing: border-box;
      position: relative;
      .copy_icon {
        position: absolute;
        top: -30rpx;
        right: -30rpx;
      }
    }
    .line {
      width: 100%;
      height: 1rpx;
      border-top: 1px dashed #bca78ab2;
      margin: 20rpx 0;
    }
    & > .image-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 20rpx;
      & > .image {
        width: 180rpx;
        height: 136rpx;
        border-radius: 20rpx;
        background: linear-gradient(180deg, #f95858 0%, #efd2d2 100%);
      }
    }
  }
}
</style>
