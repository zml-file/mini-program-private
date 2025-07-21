import { Toast } from '@/utils/util';

// 后端返回的通用响应结构
export type ResponseData<T> = {
  code: number;
  message: string;
  data: T;
};

// resolve和reject不返回任何值，但通知promise更改状态
const handleResponse = <T>(res: any, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
  // 分离了验证状态码逻辑
  if (isSuccessStatusCode(res.statusCode) && res?.data?.code == 200) {
    resolve(res.data);
  } else if (res.statusCode == 401) {
    // 登录失败
    uni.removeStorageSync('token');
    // 跳转至登录页面
    uni.navigateTo({ url: '/pages/login/index' });
    reject(res);
  } else {
    // 分离了报错状态码逻辑
    showErrorToast(res.data);
    reject(res);
  }
};

const handleError = (err: any, reject: (reason?: any) => void) => {
  Toast('网络可能开小差了~');
  console.error(err);
  reject(err);
};

const isSuccessStatusCode = (statusCode: number) => {
  return statusCode >= 200 && statusCode < 300;
};

const showErrorToast = <T>(data: ResponseData<T>) => {
  Toast(data.message || '请求错误');
};

const request = <T>(url: string, method: 'GET' | 'POST', data?: Record<string, any>): Promise<ResponseData<T>> => {
  return new Promise((reslove, reject) => {
    uni.request({
      url: process.env.VUE_APP_BASEHOST + url,
      header: {
        Authorization: uni.getStorageSync('token'),
      },
      method,
      data,
      success: res => {
        // 成功响应
        handleResponse(res, reslove, reject);
      },
      fail: err => {
        handleError(err, reject);
      },
    });
  });
};

// 上传图片
export const uploadRequest = <T>(
  url: string,
  filePath: string,
  formData?: Record<string, any>
): Promise<ResponseData<T>> =>
  new Promise((reslove, reject) => {
    uni.uploadFile({
      url: process.env.VUE_APP_BASEHOST + url,
      header: {
        Authorization: uni.getStorageSync('token'),
      },
      filePath,
      name: 'file',
      formData,
      success: res => {
        res.data = JSON.parse(res.data);
        handleResponse(res, reslove, reject);
      },
      fail: err => {
        console.error(err);
        reject(err);
      },
    });
  });

export default request;
