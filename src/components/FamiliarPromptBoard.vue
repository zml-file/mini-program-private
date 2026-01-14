<template>
  <md-dialog 
    ref="dialog" 
    :title="promptTitle" 
    :width="730"
    :hideOk="hideOk"
    :hideCancel="hideCancel"
    :okText="okText"
    :cancelText="cancelText"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <view class="prompt-content">
      <view class="prompt-text">{{ promptContent }}</view>
      
      <!-- S7/S15/S25等需要选择的提示板 -->
      <view v-if="showChoices" class="prompt-choices">
        <view 
          v-for="(choice, index) in choices" 
          :key="index"
          class="choice-btn"
          @click="handleChoice(choice.value)"
        >
          {{ choice.text }}
        </view>
      </view>
    </view>
  </md-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  promptCode: string;  // 提示板编号，如 S1, S2, S7, S15 等
  showChoices?: boolean;  // 是否显示选择按钮
  choices?: Array<{ text: string; value: string }>;  // 选择项
}

const props = withDefaults(defineProps<Props>(), {
  showChoices: false,
  choices: () => []
});

const emit = defineEmits<{
  (e: 'ok'): void;
  (e: 'cancel'): void;
  (e: 'choice', value: string): void;
}>();

const dialog = ref<any>(null);

// 提示板内容配置
const promptConfig: Record<string, { title: string; content: string; hideOk?: boolean; hideCancel?: boolean; okText?: string; cancelText?: string }> = {
  // 阶段0提示板
  S1: {
    title: '温馨提示',
    content: '建议您先获取对方的联系方式后再继续',
    hideCancel: true,
    okText: '确定'
  },
  S2: {
    title: '温馨提示',
    content: '请保持耐心，接下来将进入9-10天的等待期',
    hideCancel: true,
    okText: '确定'
  },
  S3: {
    title: '温馨提示',
    content: '请您做好准备后再开始',
    hideCancel: true,
    okText: '确定'
  },
  S4: {
    title: '温馨提示',
    content: '很好！接下来将进入正式阶段，请继续保持',
    hideCancel: true,
    okText: '确定'
  },
  
  // 第一阶段提示板
  S5: {
    title: '熟悉提示',
    content: '第一阶段提示内容',
    hideCancel: true,
    okText: '确定'
  },
  S6: {
    title: '温馨提示',
    content: '您的得分与前三回合相同，是否继续坚持？',
    hideCancel: true,
    okText: '确定'
  },
  S7: {
    title: '温馨提示',
    content: '您的得分与前三回合相同，是否继续坚持？',
    okText: '坚持',
    cancelText: '放弃'
  },
  S8: {
    title: '温馨提示',
    content: '您选择了放弃坚持',
    hideCancel: true,
    okText: '确定'
  },
  S9: {
    title: '温馨提示',
    content: '任务即将结束，感谢您的使用',
    hideCancel: true,
    okText: '确定'
  },
  
  // 第二阶段提示板
  S10: {
    title: '温馨提示',
    content: '进入特殊回合a，请继续努力',
    hideCancel: true,
    okText: '确定'
  },
  S11: {
    title: '温馨提示',
    content: '是否继续坚持？',
    okText: '坚持',
    cancelText: '放弃'
  },
  S12: {
    title: '温馨提示',
    content: '您选择了放弃坚持',
    hideCancel: true,
    okText: '确定'
  },
  S13: {
    title: '温馨提示',
    content: '15天倒计时后，请确认是否有对方找',
    hideCancel: true,
    okText: '确定'
  },
  S14: {
    title: '温馨提示',
    content: '任务即将结束',
    hideCancel: true,
    okText: '确定'
  },
  
  // 第三阶段提示板
  S15: {
    title: '温馨提示',
    content: '得分不足，是否继续坚持？',
    okText: '坚持',
    cancelText: '放弃'
  },
  S16: {
    title: '温馨提示',
    content: '是否选择半价重开？',
    okText: '半价重开',
    cancelText: '结束任务'
  },
  S17: {
    title: '温馨提示',
    content: '进入特殊回合b',
    hideCancel: true,
    okText: '确定'
  },
  S18: {
    title: '温馨提示',
    content: '请确认是否有对方找',
    okText: '有对方找',
    cancelText: '没有'
  },
  S19: {
    title: '对方找回复',
    content: '这是对方找的回复信息，请复制后使用',
    hideCancel: true,
    okText: '确定'
  },
  
  // 第四阶段提示板
  S20: {
    title: '温馨提示',
    content: '请选择下一步操作',
    hideOk: true,
    hideCancel: true
  },
  S21: {
    title: '温馨提示',
    content: '您已选择多聊一次，将返回第三阶段',
    hideCancel: true,
    okText: '确定'
  },
  S22: {
    title: '温馨提示',
    content: '多聊一次回合已完成',
    hideCancel: true,
    okText: '确定'
  },
  S23: {
    title: '温馨提示',
    content: 'Go延时提示',
    hideCancel: true,
    okText: '确定'
  },
  S24: {
    title: '温馨提示',
    content: '是否关闭任务？',
    okText: '关闭任务',
    cancelText: '放弃关闭'
  },
  S25: {
    title: '温馨提示',
    content: '邀约失败超过2次，请选择',
    hideOk: true,
    hideCancel: true
  },
  S26: {
    title: '指导提示',
    content: '这是邀约指导内容',
    okText: '关闭任务',
    cancelText: '放弃关闭'
  },
  S27: {
    title: '温馨提示',
    content: '是否半价重启任务？',
    okText: '半价重启',
    cancelText: '结束任务'
  },
  S28: {
    title: '温馨提示',
    content: '半价重启任务成功，新任务已创建',
    hideCancel: true,
    okText: '确定'
  },
  S29: {
    title: '温馨提示',
    content: '确认结束任务？',
    hideCancel: true,
    okText: '确定'
  },
  S30: {
    title: '温馨提示',
    content: '任务继续，您可以使用搜索问答功能',
    hideCancel: true,
    okText: '确定'
  },
  S31_1: {
    title: '熟悉一阶段提示',
    content: '第一阶段提示S31',
    hideCancel: true,
    okText: '确定'
  }
};

// 计算属性
const config = computed(() => promptConfig[props.promptCode] || {
  title: '温馨提示',
  content: '提示内容',
  hideCancel: true,
  okText: '确定'
});

const promptTitle = computed(() => config.value.title);
const promptContent = computed(() => config.value.content);
const hideOk = computed(() => config.value.hideOk || false);
const hideCancel = computed(() => config.value.hideCancel || false);
const okText = computed(() => config.value.okText || '确定');
const cancelText = computed(() => config.value.cancelText || '取消');

// 方法
const show = () => {
  dialog.value?.show();
};

const close = () => {
  dialog.value?.close();
};

const handleOk = () => {
  emit('ok');
  close();
};

const handleCancel = () => {
  emit('cancel');
  close();
};

const handleChoice = (value: string) => {
  emit('choice', value);
  close();
};

// 暴露方法
defineExpose({
  show,
  close
});
</script>

<style lang="scss" scoped>
.prompt-content {
  padding: 20rpx;
  
  .prompt-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
    text-align: center;
    margin-bottom: 30rpx;
  }
  
  .prompt-choices {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    
    .choice-btn {
      background: #667eea;
      color: #fff;
      padding: 24rpx;
      border-radius: 12rpx;
      font-size: 28rpx;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      
      &:active {
        background: #5568d3;
        transform: scale(0.98);
      }
    }
  }
}
</style>

