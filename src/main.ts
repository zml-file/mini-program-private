import { createSSRApp } from "vue";
import App from "./App.vue";

// import API from "./api";
import { Toast } from '@/utils/util';
import bottomTabBar from '@/bottom-tab-bar/index.vue';

export function createApp() {
  const app = createSSRApp(App);
  // app.config.globalProperties.$api = API;
  app.config.globalProperties.$toast = Toast;
  // 全局注册组件
	app.component('bottom-tab-bar', bottomTabBar);
  return {
    app,
  };
}
