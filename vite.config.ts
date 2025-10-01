import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

const CONFIG = {
  // VUE_APP_BASEHOST: 'https://mini.997555.xyz',
  VUE_APP_BASEHOST: 'http://localhost:8069',
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
