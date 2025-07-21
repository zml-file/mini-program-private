<template>
  <md-page title="说明" notDescribe>
    <view class="container">
      <rich-text :nodes="data.nodes" />
    </view>
  </md-page>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import api from '@/api';
import { routePathModule } from '@/utils/data';

const data = reactive({
  routeKey: '',
  nodes: '',
});

/**
 * 接口相关
 */
const fetchModuleExt = async (moduleCode: string) => {
  try {
    const res = await api.common.moduleExt({ extType: 2, moduleCode });
    data.nodes = res.data;
  } catch (error) {
    console.log(error);
  }
};

onLoad(option => {
  let pages = getCurrentPages();
  let prevPath = pages?.[pages.length - 2]?.route;
  if (prevPath && !data.routeKey) {
    let pathList = prevPath?.split('/');
    let key = pathList[pathList.length - 2];
    data.routeKey = key;
    console.log('获取上一个页面路由关键词：', key, routePathModule[key]);
    fetchModuleExt(routePathModule[key]);
  }
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  box-sizing: border-box;
}
</style>
