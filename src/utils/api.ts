import api from '@/api';
import type { Four } from '@/api/data';
import { questionTemplete } from './data';

// 检查是否有足够的虚拟币
export const checkVirtualCoin = async (payScene: string) => {
  try {
    const res = await api.common.checkVirtualCoin({ payScene });
    if (!res?.data) {
      uni.showModal({
        title: '提示',
        content: `虚拟币不足，请充值后再进行操作`,
        showCancel: false,
      });
      return false;
    }
    return true;
  } catch (error) {}
  return false;
};

// 获取提示板信息
export const getHint = async (
  params: Four.GetHint.Body,
  cb?: () => Promise<void> | void,
  config?: Partial<{ showCancel: boolean; cancelCb: () => void }>
) => {
  try {
    const res = await api.four.getHint({ ...params });
    if (res?.data) {
      uni.showModal({
        title: '提示',
        content: res.data?.hintContent || '',
        showCancel: config?.showCancel || false,
        success: res => {
          if (res.confirm) {
            cb?.();
          } else {
            config?.cancelCb?.();
          }
        },
      });
    }
  } catch (error) {}
};

// 保存阶段
export const savePoint = async (
  params: Four.SavePoint.Body,
  cb?: () => any
) => {
  try {
    const res = await api.four.savePoint({ ...params });
    // request 成功时会 resolve res.data (整个响应对象)
    // 所以 res 的结构是 { code: 200, message: '...', data: string }
    // 只要请求成功（没有抛出异常），就执行回调
    console.log('保存节点成功', res);
    cb?.();
  } catch (error) {
    console.error('保存节点失败', error);
  }
};

// 关闭阶段
export const closeOverTimeDetailStep = async (
  params: Four.CloseOverTimeDetailStep.Query,
  cb?: () => any
) => {
  try {
    await api.four.closeOverTimeDetailStep(params);
    console.log('关闭详细步骤成功');
    cb?.();
  } catch (error) {}
};

// 更改任务的模块
export const changeTaskModule = async (params: {
  moduleCode: string;
  taskId: string;
}) => {
  try {
    await api.task.changeTaskModule({ ...params });
    return true;
  } catch (error) {}
  return false;
};

// 获取问1，问2，问3
export const getQuestion = (x: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '问题',
      content: questionTemplete[x],
      confirmText: '是',
      cancelText: '否',
      success: res => {
        if (res.confirm) {
          // 问2
          resolve('y');
        } else {
          // 提示S1
          resolve('n');
        }
      },
      fail: err => {
        reject(err);
      },
    });
  });
};

// 获取当前任务详情
export const getTaskDetail = async (
  taskId: number
): Promise<Four.GetTaskDetail.Data> => {
  try {
    const res = await api.four.getTaskDetail({
      taskId,
    });
    return res?.data;
  } catch (error) {}
  return {} as any;
};

// 获取指定【内容库】
const getAppointContent = async (params: Four.GetAppointContent.Body) => {
  try {
    const res = await api.four.getAppointContent({
      ...params,
    });
    return res?.data;
  } catch (error) {}
  return null;
};

// 获取当前步骤和步骤内容
const getStep = async (params: Four.GetStep.Body) => {
  try {
    const res = await api.four.getStep({
      ...params,
    });
    return res?.data;
  } catch (error) {}
  return null;
};

// 获取【详情内容】
export const getContentList = async (
  params: Partial<Four.GetContentDetail.Body>
) => {
  try {
    const res = await api.four.getContentDetail({
      ...params,
    });
    return res.data;
  } catch (error) {}
  return null;
};

// 通过获取指定【内容库】获取【详情内容】
export const getContentListOfAppoint = async (
  params: Omit<Four.GetContentDetail.Body, 'preStepDetailId' | 'stepId'> & {
    warehouseName: string;
  }
) => {
  try {
    const appoint = await getAppointContent({
      taskId: params.taskId,
      moduleCode: params.moduleCode,
      warehouseName: params.warehouseName,
    });
    if (appoint) {
      const data = await getContentList({
        preStepDetailId: appoint?.stepDetailId ?? 0,
        stepId: appoint?.stepId ?? 0,
        ...params,
      });
      return { ...data, stepId: appoint?.stepId };
    }
    return null;
  } catch (error) {}
  return null;
};

// 通过获取【当前步骤】获取【详情内容】
export const getContentListOfStep = async (
  params: Omit<Four.GetContentDetail.Body, 'preStepDetailId' | 'stepId'>
) => {
  try {
    const step = await getStep({
      taskId: params.taskId,
      moduleCode: params.moduleCode,
    });
    console.log('getContentListOfStep - getStep返回:', step);
    // 第一次获取内容时，preStepDetailId 应该传0，而不是 step.stepDetailId
    // step.stepDetailId 是当前步骤的ID，不是上一次复制的内容ID
    const data = await getContentList({
      preStepDetailId: 0,  // 修复：第一次获取时传0
      stepId: step?.stepId ?? 0,
      ...params,
    });
    console.log('getContentListOfStep - getContentList返回:', data);
    return {
      ...data,
      stepId: step?.stepId,
      closeContent: step?.warehouseType == 2, // 离开库状态，配合点copy后执行下面的步骤
    };
  } catch (error) {
    console.error('getContentListOfStep 错误:', error);
  }
  return null;
};

// 新增一个阶段
export const addStage = async (taskId: number, cb?: () => any) => {
  try {
    await api.four.addStage({
      taskId,
    });
    cb?.();
  } catch (error) {}
};

// 新增一个回合
export const addRound = async (taskId: number, cb?: () => any) => {
  try {
    await api.four.addRound({
      taskId,
    });
    cb?.();
  } catch (error) {}
};

// 获取当前回合的分数
export const getRoundIntegral = async (taskId: number) => {
  try {
    const res = await api.four.getRoundIntegral({
      taskId,
    });
    return res.data;
  } catch (error) {}
  return null;
};

// 增加当前回合的分数
export const addRoundIntegral = async (params: Four.RoundIntegral.Add.Body) => {
  try {
    await api.four.addRoundIntegral({
      ...params,
    });
    return true;
  } catch (error) {}
  return false;
};

// 获取倒计时时间配置
export const timeConfig = async (params: Partial<Four.TimeConfig.Body>) => {
  try {
    const res = await api.four.timeConfig({
      ...params,
    });
    return res.data?.[0];
  } catch (error) {}
  return null;
};

// 保存倒计时时间配置
export const saveTempTime = async (params: Four.SaveTempTime.Body) => {
  try {
    const res = await api.four.saveTempTime({ ...params });
    return res.data;
  } catch (error) {}
  return null;
};

// 复制内容，并返回是否继续复制内容
export const copyContentDetail = async (
  params: Partial<Four.CopyContentDetail.Body>
) => {
  try {
    const res = await api.four.copyContentDetail({
      ...params,
    });
    return res.data.isStop;
  } catch (error) {}
  return false;
};
