import request from '../request';
import type { Four } from '../data';

export const FOUR = {
  // 获取任务详情，处于什么阶段，什么位置
  getTaskDetail: (data: Four.Body) => request<Four.GetTaskDetail.Data>('/api/fourModule/getTaskDetail', 'GET', data),
  // 获取当前步骤和步骤内容
  getStep: (data: Four.GetStep.Body) => request<Four.GetStep.Data>('/api/fourModule/getStep', 'POST', data),
  // 提交问卷
  submitQuestion: (data: Four.SubmitQuestion.Body) =>
    request<Four.SubmitQuestion.Data>('/api/fourModule/submitQuestion', 'POST', data),
  // 获取提示板
  getHint: (data: Four.GetHint.Body) => request<Four.GetHint.Data>('/api/fourModule/getHint', 'POST', data),
  // 保存当前位置的节点
  savePoint: (data: Four.SavePoint.Body) => request<string>('/api/fourModule/savePoint', 'POST', data),
  // 关闭详细步骤
  closeOverTimeDetailStep: (data: Four.CloseOverTimeDetailStep.Query) =>
    request<string>('/api/fourModule/closeOverTimeDetailStep', 'GET', data),
  // 获取指定内容库
  getAppointContent: (data: Four.GetAppointContent.Body) =>
    request<Four.GetAppointContent.Data>('/api/fourModule/getAppointContent', 'POST', data),
  // 获取详细内容
  getContentDetail: (data: Partial<Four.GetContentDetail.Body>) =>
    request<Four.GetContentDetail.Data>('/api/fourModule/getContentDetail', 'POST', data),
  // 新增回合
  addRound: (data: Four.Body) => request<string>('/api/fourModule/addRound', 'GET', data),
  // 新增阶段
  addStage: (data: Four.Body) => request<string>('/api/fourModule/addStage', 'GET', data),
  // 获得当前回合积分
  getRoundIntegral: (data: Four.Body) =>
    request<Four.RoundIntegral.Get.Data>('/api/integral/getRoundIntegral', 'GET', data),
  // 增加当前回合积分
  addRoundIntegral: (data: Four.RoundIntegral.Add.Body) =>
    request<string>('/api/integral/addRoundIntegral', 'GET', data),
  timeConfig: (data: Partial<Four.TimeConfig.Body>) =>
    request<Four.TimeConfig.Data[]>('/api/timeConfig/timeList', 'POST', data),
  saveTempTime: (data: Partial<Four.SaveTempTime.Body>) =>
    request<Four.SaveTempTime.Data>('/api/timeConfig/saveTempTime', 'POST', data),
  // 复制内容
  copyContentDetail: (data: Partial<Four.CopyContentDetail.Body>) => request<Four.CopyContentDetail.Data>('/api/fourModule/copyContentDetail', 'POST', data),
  // 获取所有内容库列表
  getAllContent: () => request<Four.GetAllContent.Data>('/api/fourModule/getAllContent', 'GET'),
};
export default FOUR;
