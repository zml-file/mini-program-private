import request from '../request';
import type { Custom, ImageText, Task } from '../data';
export const TASK = {
  // 模块列表
  moduleList: () => request<Task.ModuleList.Data>('/api/module/moduleList', 'GET'),
  // 查询任务列表
  list: (data: { moduleCode: string }) => request<Task.List.Data[]>('/api/task/queryTaskList', 'GET', data),
  // 任务结束时间
  taskEndTime: (data: { moduleCode: string; taskId: string }) =>
    request<boolean>('/api/question/taskEndTime', 'GET', data),
  // 任务续时
  renewTime: (data: { time: number; taskId: string }) => request<boolean>('/api/task/renewTime', 'GET', data),
  // 删除任务
  delTask: (data: { taskId: string }) => request<boolean>('/api/task/delTask', 'GET', data),
  // 更改任务的模块
  changeTaskModule: (data: { moduleCode: string; taskId: string }) =>
    request<boolean>('/api/task/changeTaskModule', 'GET', data),
  /**
   * 线下模块 / 图文模块
   */
  // 创建任务
  createTask: (data: Task.Create.Body) => request<Task.Create.Data>('/api/task/createTask', 'GET', data),
  // 图文/线下 单个问卷及问卷里的题目
  moduleQuestion: (data: { moduleCode: string }) =>
    request<Task.ModuleQuestionList.Data>('/api/question/moduleQuestion', 'GET', data),
  // 提交问卷
  submitQuestion: (data: Task.SubmitQuestion.Body) =>
    request<Task.ModuleQuestionList.Data>('/api/question/submitQuestion', 'POST', data),
  // 查看问卷答案
  searchQuestionAnswer: (data: { taskId: number }) =>
    request<Task.SearchQuestionAnswer.Data>('/api/question/searchQuestionAnswer', 'GET', data),
  // 线下模块结束时间
  offlineEndTime: (data: { taskId: number }) =>
    request<Task.SearchQuestionAnswer.Data>('/api/question/offlineEndTime', 'GET', data),
  // 图文模块列表
  moduleImg: () => request<ImageText.ModuleImg.Data>('/api/module/moduleImg', 'GET'),
  // 图文问卷，回复的答案被用户选中
  updateReplyIsUsed: (data: ImageText.UpdateReplyIsUsed.Body) =>
    request<string>('/api/question/updateReplyIsUsed', 'GET', data),
  /**
   * 定制 或 问诊
   */
  // 定制/问诊 多个问卷及问卷里的题目
  moduleQuestionList: (data: { moduleCode: string }) =>
    request<Task.ModuleQuestionList.Data[]>('/api/question/moduleQuestionList', 'GET', data),
  searchSecondQuestionAnswer: (data: { taskId: string }) =>
    request<Task.SearchQuestionAnswer.Data>('/api/question/searchSecondQuestionAnswer', 'GET', data),
  // 定制模块的二次问卷
  customerSearchSecondQuestion: (data: { taskId: string }) =>
    request<Custom.CustomerSearchSecondQuestion.Data>('/api/question/customerSearchSecondQuestion', 'GET', data),
  submitSecondQuestion: (data: Custom.SubmitSecondQuestion.Body) =>
    request<string>('/api/question/submitSecondQuestion', 'POST', data),
};
export default TASK;
