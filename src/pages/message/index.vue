<template>
  <md-page title="消息列表" :showLeft="false">
    <view class="container">
      <block v-if="data.list.length > 0">
        <uni-swipe-action>
          <uni-swipe-action-item
            v-for="(item, index) in data.list"
            :key="item.id || index"
            :right-options="data.options"
            @click="handleDel(index)">
            <view class="list">
              <md-icon class="icon" name="rocket"></md-icon>
              <view class="right">
                <view class="title fs-28 m-bottom-10 font-bold">{{ item.msgTitle || '系统消息' }}</view>
                <view class="content m-bottom-10">{{ item.msgContent }}</view>
                <view class="date">{{ item.createTime }}</view>
              </view>
            </view>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </block>
      <mescroll-empty v-else></mescroll-empty>
    </view>
  </md-page>
  <bottom-tab-bar :current="3" />
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import api from '@/api';
import type { Common } from '@/api/data';

const data = reactive<{
  list: Common.GetMessageList.Data[];
  options: any[];
  loading: boolean;
}>({
  list: [],
  options: [
    {
      text: '删除',
      style: {
        backgroundColor: '#F56C6C',
      },
    },
  ],
  loading: false,
});

// 获取消息列表
const fetchMessageList = async () => {
  if (data.loading) return;
  data.loading = true;

  try {
    const res = await api.common.getMessageList();
    if (res.data && Array.isArray(res.data)) {
      data.list = res.data;
    } else {
      data.list = [];
    }
  } catch (error) {
    console.error('[MessageList] 获取消息列表失败:', error);
    data.list = [];
  } finally {
    data.loading = false;
  }
};

const handleDel = async (index: number) => {
  const message = data.list[index];
  if (!message?.id) return;

  uni.showModal({
    title: '提示',
    content: '确定要删除这条消息吗？',
    success: async function (res) {
      if (res.confirm) {
        try {
          await api.common.deleteMessage({ id: message.id });
          data.list.splice(index, 1);
          uni.showToast({
            title: '删除成功',
            icon: 'none'
          });
        } catch (error) {
          console.error('[MessageList] 删除消息失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 页面加载时获取消息列表
onMounted(() => {
  fetchMessageList();
});
</script>

<style lang="scss" scoped>
.container {
	padding: 30rpx;
	padding-bottom: calc(30rpx + env(safe-area-inset-bottom) + 100rpx);
	min-height: 100vh;
	box-sizing: border-box;
	background: linear-gradient(180deg, #eef0ff 0%, #f6f7ff 100%);

	:deep(.uni-swipe) {
		width: 100%;
	}

	:deep(.uni-swipe-action-item) {
		width: 100%;
		margin-bottom: 24rpx;
	}

	.list {
		display: flex;
		align-items: flex-start;
		width: 100%;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 28rpx 24rpx;
		box-sizing: border-box;
		border: none;
		box-shadow: 0 12rpx 32rpx rgba(36, 36, 36, 0.08);

		.icon {
			width: 48rpx;
			height: 48rpx;
			margin-right: 16rpx;
			flex-shrink: 0;
			color: #5f6cff;
		}
		.right {
			flex: 1;
			min-width: 0;
			.title {
				color: #1f1f1f;
			}
			.content {
				color: #666666;
				line-height: 1.6;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				word-break: break-all;
			}
			.date {
				color: #a0a0a0;
				font-size: 24rpx;
			}
		}
	}
}
</style>
