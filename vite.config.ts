import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

const CONFIG = {
  VUE_APP_BASEHOST: 'https://www-test.zghuixiang.com',
  VUE_APP_THEME: '#EB4C60',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  define: {
    'process.env': CONFIG,
  },
  css: {
    preprocessorOptions: {
      css: {
        charset: false,
      },
      scss: {
        additionalData: `
          @import '~@/styles/varable.scss';
          $theme-color: ${CONFIG.VUE_APP_THEME};
        `,
      },
    },
  },
});
