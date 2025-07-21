<template>
  <md-page title="超熟模块" isBtn :btnTextItems="[{ text: '创建线下任务', key: 'create' }]">
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
import { reactive } from 'vue';
const data = reactive({
  list: [
    { id: 1, title: '王老师的摄影超熟任务', date: '21:21:21' },
    { id: 2, title: '王老师的摄影超熟任务', date: '21:21:21' },
    { id: 3, title: '王老师的摄影超熟任务', date: '21:21:21' },
  ],
});

const onSwipeClick = () => {};

const handleJump = () => {
  uni.navigateTo({
    url: '/pages/sub-page/task/problem',
  });
};
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  box-sizing: border-box;
}
</style>
