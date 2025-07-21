<template>
  <md-page title="王先生的咨询" bgType="dark">
    <div class="container">
      <uni-forms ref="form" :modelValue="data.form" label-width="100">
        <uni-forms-item
          name="questionContent"
          :rules="[
            {
              required: true,
              errorMessage: '请输入定制问题',
            },
            {
              minLength: 6,
              errorMessage: '最少输入6个字',
            },
          ]">
          <template #label></template>
          <bc-qa-item
            bgType="dark"
            :item="{
              title: '定制问题',
              content: data.item?.questionTitle,
            }"
            type="text"
            v-model="data.form.questionContent"></bc-qa-item>
        </uni-forms-item>
        <uni-forms-item name="imgUrlList">
          <uni-file-picker
            :limit="data.item?.imgSize || 1"
            :title="`最多选择${data.item?.imgSize || 1}张图片`"
            file-mediatype="image"
            @select="handleUpload" />
        </uni-forms-item>
        <uni-forms-item
          label="联系方式"
          name="phone"
          :rules="[
            {
              required: true,
              errorMessage: '请输入联系方式',
            },
            {
              pattern: /^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/,
              errorMessage: '请输入正确的手机号',
            },
          ]">
          <uni-easyinput placeholder="请输入联系方式" v-model="data.form.phone" />
        </uni-forms-item>
      </uni-forms>
      <bc-bottom-bar bgType="dark" rightBtn okText="提交" @ok="handleOk" @back="handlePrev" backText="上一步" />
    </div>
  </md-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 接口
import api from '@/api';
import type { Custom } from '@/api/data';
// 工具
import { checkVirtualCoin } from '@/utils/api';
import { queryString } from '@/utils/util';
import { payModule } from '@/utils/data';

const data = reactive<any>({
  prevPageQuery: {}, // 上一个页面带来的参数
  item: {},
  form: {
    phone: '',
    questionContent: '',
    imgUrlList: [],
  },
});
const form = ref(null);

const handleOk = async () => {
  try {
    const res = await form.value?.validate();
    // 判断是否有充足的虚拟币
    const hasPrice = await checkVirtualCoin(payModule['定制二阶段付费']);
    if (hasPrice) {
      uni.showModal({
        title: '温馨提示',
        content: `提交后将消耗掉虚拟币以获取方案，请确认是否提交`,
        success: s => {
          if (s.confirm) {
            fetchSubmitSecondQuestion({ ...res, imgUrlList: res.imgUrlList?.map((item: { url: string }) => item.url) });
          }
        },
      });
    }
  } catch (error) {}
};

// 上一步
const handlePrev = () => {
  uni.redirectTo({
    url: '/pages/sub-page/custom/analysis?' + queryString(data.prevPageQuery),
  });
};

/**
 * 上传相关
 */
const handleUpload = async (e: any) => {
  // console.log('选择文件：', e);
  let { tempFilePaths } = e;
  uni.showLoading({
    title: '图片上传中...',
    mask: true,
  });
  let uploadTasks = tempFilePaths.map(async (filePath: string) => {
    let res = await api.common.uploadImage({ filePath });
    const url = res.data;
    const name = url?.split?.('/')?.slice(-1);
    // 格式化组件需要的格式
    return {
      url,
      extname: 'png',
      name,
    };
  });
  Promise.all(uploadTasks).then(imgs => {
    uni.hideLoading();
    console.log('所有图片上传成功', imgs);
    data.form.imgUrlList = imgs;
  });
};

/**
 * 接口相关
 */
const fetchCustomerSearchSecondQuestion = async (taskId: string) => {
  try {
    const res = await api.task.customerSearchSecondQuestion({
      taskId,
    });
    data.item = res.data;
    data.limitImageNum = res.data.imgSize;
  } catch (error) {}
};

// 提交
const fetchSubmitSecondQuestion = async (params: Custom.SubmitSecondQuestion.Body) => {
  try {
    await api.task.submitSecondQuestion({
      ...params,
      questionId: data.item?.questionId,
      taskId: data.prevPageQuery?.taskId,
    });
    uni.showModal({
      title: '提示',
      content: '提交成功',
      showCancel: false,
      success: res => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/sub-page/custom/detail?' + queryString(data.prevPageQuery),
          });
        }
      },
    });
  } catch (error) {}
};

onLoad(option => {
  data.prevPageQuery = option;
  fetchCustomerSearchSecondQuestion(option?.taskId);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  box-sizing: border-box;
  height: calc(100vh - $safe-bottom - 74rpx - 16rpx);
  background: #333;
}
</style>
