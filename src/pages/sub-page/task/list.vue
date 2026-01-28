<template>
  <md-page title="超熟模块" isBtn :btnTextItems="[{ text: '创建线下计划', key: 'create' }]">
    <view class="container">
      <block v-for="item in data.list" :key="item.id">
        <bc-task-item
          :item="item"
          @swipeClick="onSwipeClick"
          desc="下个回合开启时间倒计时"
          @click="handleJump"></bc-task-item>
      </block>
    </view>
  </md-page>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { reactive } from 'vue';
import api from '@/api';
import { taskModule } from '@/utils/data';

const data = reactive<any>({
  list: [],
});

const loadList = async () => {
  try {
    const res = await api.task.list({ moduleCode: taskModule['超熟模块'] });
    data.list = res.data || [];
  } catch (e) {}
};

const onSwipeClick = () => {
  loadList();
};

const handleJump = () => {
  uni.navigateTo({
    url: '/pages/sub-page/task/problem',
  });
};

onLoad(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  box-sizing: border-box;
}
</style>
