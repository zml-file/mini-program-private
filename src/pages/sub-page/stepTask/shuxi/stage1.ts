// 阶段1状态管理
// 接口
import { getHint, savePoint, getTaskDetail, getRoundIntegral } from '@/utils/api';
// 工具
import { hasItTimeOut } from '@/utils/util';

const moduleCode = 'familiar_module';

interface OtherProps {
  finish?: boolean; // 完成任务
}

const stage1 = async (taskId: number, otherProps?: Partial<OtherProps>) => {
  const detail = await getTaskDetail(taskId);
  const gri = await getRoundIntegral(taskId); // 获得当前回合积分
  const score = gri?.integral || 0;
  const roundNum = detail?.roundNum || 0;
  let round3Score = 0;

  // 第三回合结束后的分数
  if (gri?.roundNum === 3) {
    round3Score = gri?.integral || 0;
  }

  if (score >= 2) {
    if (roundNum >= 4) {
      // 第一阶段结束，进入下一个阶段
      // 执行此方法，CD开始
      savePoint(
        {
          stepNum: 0,
          stepType: 'familiar_1_stage_cd',
          taskId,
        },
        async () => {
          stage1(taskId);
        }
      );
    } else {
      savePoint(
        {
          stepNum: 0,
          stepType: 'familiar_1_cd',
          taskId,
        },
        async () => {
          stage1(taskId);
        }
      );
    }
  } else {
    if (roundNum < 3) {
      savePoint(
        {
          stepNum: 0,
          stepType: 'familiar_1_cd',
          taskId,
        },
        async () => {
          stage1(taskId);
        }
      );
    } else {
      /**
       * 初始回合为3，且分数小于2
       */
      if (!detail?.endTime) {
        savePoint(
          {
            stepNum: 0,
            stepType: 'familiar_1_cd2',
            taskId,
          },
          async () => {
            stage1(taskId);
          }
        );
      } else {
        // 大CD结束
        if (hasItTimeOut(detail?.endTime)) {
          // 回合cd结束 或 离库结束
          if (!!otherProps?.finish) {
            // 当前分数 等于 第三回合的分数
            if (score == round3Score) {
              if (roundNum < 6) {
                // 提示S6
                getHint(
                  {
                    hintCode: 'xx06',
                    moduleCode,
                    stageNum: 0,
                  },
                  () => {
                    savePoint(
                      {
                        stepNum: 0,
                        stepType: 'familiar_1_cd2',
                        taskId,
                      },
                      async () => {
                        stage1(taskId);
                      }
                    );
                  }
                );
              } else {
                // 提示S7
                getHint(
                  {
                    hintCode: 'xx06',
                    moduleCode,
                    stageNum: 0,
                  },
                  () => {
                    savePoint(
                      {
                        stepNum: 1,
                        stepType: 'familiar_1_stage_cd',
                        taskId,
                      },
                      async () => {
                        stage1(taskId);
                      }
                    );
                  },
                  {
                    showCancel: true,
                    cancelCb: () => {
                      // 提示S8
                      getHint(
                        {
                          hintCode: 'xx08',
                          moduleCode,
                          stageNum: 0,
                        },
                        () => {
                          // 提示S9
                          getHint({
                            hintCode: 'xx09',
                            moduleCode,
                            stageNum: 0,
                          });
                        }
                      );
                    },
                  }
                );
              }
            } else {
              savePoint(
                {
                  stepNum: 1,
                  stepType: 'familiar_1_stage_cd',
                  taskId,
                },
                async () => {
                  stage1(taskId);
                }
              );
            }
          }
        }
      }
    }
  }
  return { detail };
};

export default stage1;
