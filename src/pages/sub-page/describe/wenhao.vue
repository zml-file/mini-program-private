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
import { routePathModule, taskModule } from '@/utils/data';

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
  let prevPage = pages?.[pages.length - 2];
  let prevPath = prevPage?.route;
  
  if (prevPath && !data.routeKey) {
    let pathList = prevPath?.split('/');
    let key = pathList[pathList.length - 2];
    data.routeKey = key;
    
    let moduleCode = '';
    
    // 特殊处理stepTask情况，需要从上一页面的参数中获取module参数
    if (key === 'stepTask') {
      // 由于无法直接获取上一页面的参数，这里可以通过其他方式处理
      // 比如通过页面路径、storage等方式传递参数
      // 暂时使用默认的熟悉模块，实际使用时可以根据业务需求调整
      moduleCode = taskModule['熟悉模块'];
    } else {
      // 其他情况使用原有逻辑
      moduleCode = routePathModule[key] || '';
    }
    
    console.log('获取上一个页面路由关键词：', key, 'moduleCode:', moduleCode);
    
    if (moduleCode) {
      fetchModuleExt(moduleCode);
    }
  }
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  box-sizing: border-box;
}
</style>
