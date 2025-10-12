<template>
  <view class="list">
    <view :class="['title', bgType === 'dark' ? 'dark_bg' : '']">{{ item.title }}</view>
    <view class="content">{{ item.content }}</view>
    <view class="btns" v-if="type === 'checkbox'">
      <view
        v-for="t in checkboxList"
        :key="t.id"
        :class="['check-box', data.selected === String(t.id) ? 'active' : '']"
        @click="() => handleSelect(String(t.id))">
        {{ t.optionContent }}
      </view>
    </view>
    <view v-if="type === 'text'" class="textarea">
      <uni-easyinput
        :maxlength="maxLength"
        :inputBorder="false"
        :styles="{ background: '#fef8f1' }"
        type="textarea"
        :value="modelValue"
        @input="updateValue"
        placeholder="请输入内容"
        autoHeight></uni-easyinput>
      <view style="text-align: right; color: #f39124">{{ `${modelValue?.length || 0} / ${maxLength}` }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
defineProps({
  modelValue: String,
  item: {
    type: Object,
    default: () => ({}),
  },
  type: {
    type: String,
    default: 'checkbox',
  },
  desc: {
    type: String,
    default: '',
  },
  bgType: {
    type: String,
    default: 'white',
  },
  checkboxList: {
    type: Array<{ id: number; optionContent: string }>,
    default: () => [],
  },
  maxLength: {
    type: Number,
    default: 500,
  },
});

const emit = defineEmits(['checked', 'update:modelValue']);
const data = reactive({
  selected: '',
});

const handleSelect = (t: string) => {
  data.selected = t;
  emit('checked', t);
};

const updateValue = (value: string) => {
  emit('update:modelValue', value);
};
</script>

<style lang="scss" scoped>
.list {
  width: 100%;
  padding: 40rpx 36rpx;
  box-sizing: border-box;
  gap: 20rpx;
  border-radius: 24rpx;
  border: 1px solid #dddddd;
  box-shadow: 0 8rpx 8rpx 0 #00000040;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  background: white;
  .title {
    font-size: 36rpx;
    // font-weight: 600;
    color: white;
    width: 100%;
    text-align: center;
    height: 60rpx;
    line-height: 60rpx;
    padding: 0 40rpx;
    box-sizing: border-box;
    border-radius: 10rpx;
    background: linear-gradient(0deg, #9AB3FF -24.14%, #7A59ED 125.86%);
    &.dark_bg {
      background: linear-gradient(0deg, #f6ed0e -24.14%, #fffef3 125.86%);
    }
  }
  .content {
    font-size: 28rpx;
    line-height: 1.6;
    width: 100%;
    text-align: left;
    padding: 10rpx 0;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
  }
  .btns {
    width: 100%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14rpx;
    .check-box {
      min-width: 100rpx;
      max-width: 100%;
      height: auto;
      min-height: 50rpx;
      line-height: 1.5;
      padding: 12rpx 24rpx;
      text-align: center;
      font-size: 24rpx;
      border-radius: 24rpx;
      border: 1rpx solid #222222;
      box-sizing: border-box;
      word-wrap: break-word;
      word-break: break-word;
      white-space: normal;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      &.active {
        background: #7A59ED;
        border-color: #7A59ED;
        color: white;
        font-weight: 500;
      }
    }
  }
  .textarea {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20rpx;
    box-sizing: border-box;
    background: #fef8f1;
  }
}
</style>
