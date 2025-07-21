import request, { uploadRequest } from '../request';
import type { Common, UploadImageBodyType } from '../data';

export const COMMON = {
  // 微信登录
  login: (data: Common.Login.Body) => request<string>('/auth/wx/login', 'GET', data),
  getPhoneNumber: (data: Common.GetPhoneNumber.Body) => request<string>('/auth/wx/getPhoneNumber', 'GET', data),
  // 判断是否有充足的虚拟币可以扣减
  checkVirtualCoin: (data: { payScene: string }) => request<boolean>('/api/pay/checkVirtualCoin', 'GET', data),
  // 上传图片
  uploadImage: (data: UploadImageBodyType) =>
    uploadRequest<string>('/controller-common/web/uploadData', data.filePath, data?.formData),
  // 通用下拉
  dropList: (data: Common.DropList.Body) =>
    request<Common.DropList.Data>('/controller-common/web/dropList', 'POST', data),
  // 模块里的广告和问号
  moduleExt: (data: Common.ModuleExt.Body) => request<string>('/api/module/moduleExt', 'POST', data),
  // 查询用户详细信息
  info: () => request<Common.Info.Data>('/api/member/info', 'GET'),
  // 微信充钱获得预付单号
  getPrePayData: (data: Common.GetPrePayData.Body) => request<Common.GetPrePayData.Data>('/api/pay/getPrePayData', 'GET', data),
  // 充值金额和虚拟币的比例兑换
  exchange: (data: Common.GetPrePayData.Body) => request<Common.GetPrePayData.Data>('/api/pay/exchange', 'GET', data),
};
export default COMMON;
