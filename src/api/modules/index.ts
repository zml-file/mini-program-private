import request from '../request';
import type { Index } from '../data';
export const INDEX = {
  info: (data: Index.Info.Body) => request<string>('/info/index', 'POST', data),
  // 说明列表
  explanationList: () => request<Index.ExplanationList.Data[]>('/api/explanation/list', 'GET'),
};
export default INDEX;
