// 问题和提示板交互相关

// 接口
import { changeTaskModule, closeOverTimeDetailStep, getHint, getQuestion, savePoint } from '@/utils/api';
import type { Four } from '@/api/data';
// 工具
import { hasItTimeOut, Toast } from '@/utils/util';
import { taskModule } from '@/utils/data';

// 提示S3
const hint3 = (taskId: number) => {
  getHint(
    {
      hintCode: 'S3',
      moduleCode: 'familiar_module',
      stageNum: 0,
    },
    () => question2(taskId)
  );
};

// 提示S4
const hint4 = (params: { taskId: number; specialStepId?: number; flag?: boolean }) => {
  const { taskId, flag = true } = params;
  getHint(
    {
      hintCode: 'S4',
      moduleCode: 'familiar_module',
      stageNum: 0,
    },
    () => {
      if (flag) {
        // 关闭上一个步骤
        closeOverTimeDetailStep({ specialStepId: params?.specialStepId || -1 }, () => {
          // 保存s4节点
          savePoint(
            {
              stepNum: 0,
              stepType: 'familiar_s4',
              taskId,
            },
            () => {
              // 跳转对方主动找页面
              uni.redirectTo({ url: '/pages/sub-page/stepTask/round?module=熟悉模块&taskId=' + taskId });
            }
          );
        });
      }
    }
  );
};

// 问3
export const question3 = async (params: { taskId: number; specialStepId?: number }) => {
  const w3 = await getQuestion('q3');
  if (w3 === 'y') {
    // 提示S4
    hint4({ ...params });
  } else {
    // 提示3
    hint3(params.taskId);
  }
};

// 问2
const question2 = async (taskId: number) => {
  const w2 = await getQuestion('q2');
  if (w2 === 'y') {
    // 提示S2
    getHint(
      {
        hintCode: 'S2',
        moduleCode: 'familiar_module',
        stageNum: 0,
      },
      () => {
        savePoint(
          {
            stepNum: 0,
            stepType: 'familiar_s2',
            taskId,
          },
          () => {
            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
          }
        );
      }
    );
  } else {
    // 提示S3
    hint3(taskId);
  }
};

// 问1
const question1 = async (isScoreFlag: number, taskId: number) => {
  if (isScoreFlag == 1) {
    // 【isScoreFlag = 1】满足
    // 问1
    const w1 = await getQuestion('q1');
    if (w1 === 'y') {
      // 问2
      question2(taskId);
    } else {
      // 提示S1
      getHint(
        {
          hintCode: 'S1',
          moduleCode: 'familiar_module',
          stageNum: 0,
        },
        () => question1(isScoreFlag, taskId)
      );
    }
  } else {
    // 问1
    const res = await getQuestion('q1');
    if (res === 'y') {
      // 不熟模块
      const bool = await changeTaskModule({ moduleCode: taskModule['不熟模块'], taskId: taskId.toString() });
      bool && uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=不熟模块' });
    } else {
      await changeTaskModule({ moduleCode: taskModule['陌生模块'], taskId: taskId.toString() });
      // 陌生模块
      uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=陌生模块' });
    }
  }
};

export const shuxiModule = async (
  params: Partial<Four.GetTaskDetail.Data> & {
    isScoreFlag: number;
    taskId: number;
    stepNum?: number;
  }
) => {
  const { isScoreFlag, taskId } = params;
  switch (params?.stepType) {
    case 'familiar_s2':
      // 倒计时结束
      if (params?.endTime && hasItTimeOut(params.endTime)) {
        // 问3
        question3({ taskId });
      } else {
        Toast('倒计时还未结束！');
      }
      break;
    case 'familiar_s4':
      hint4({ taskId, flag: false });
      break;
    default:
      question1(isScoreFlag, taskId);
  }
};
