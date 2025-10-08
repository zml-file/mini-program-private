/**
 * 阶段1状态管理
 *
 * 职责：
 * 1. 离库结束后的回合判分逻辑
 * 2. 根据积分和回合数决定进入哪个CD（普通CD/延时CD/阶段CD）
 * 3. 处理第5/6回合的特殊逻辑（与前三回合积分对比）
 *
 * 注意：
 * - 回合数+1由后端在离库结束时自动处理
 * - 积分+1由后端在copyContentDetail时自动处理
 * - 前端只负责判断逻辑和调用savePoint
 */

// 接口
import { getHint, savePoint, getTaskDetail, getRoundIntegral } from '@/utils/api';
// 工具
import { hasItTimeOut } from '@/utils/util';

const moduleCode = 'familiar_module';

/**
 * 阶段1回合结束后的判分逻辑
 * @param taskId 任务ID
 * @returns 任务详情
 */
const stage1RoundEnd = async (taskId: number) => {
  console.log('=== stage1RoundEnd 开始 ===');

  const detail = await getTaskDetail(taskId);
  const scoreInfo = await getRoundIntegral(taskId);

  const score = scoreInfo?.integral || 0;           // 当前阶段累计积分
  const roundNum = scoreInfo?.roundNum || 0;        //  修改：使用积分表的回合数（已经+1了）
  const round3Score = scoreInfo?.round3Integral || 0; // 前三回合总积分

  console.log('当前状态:', {
    score,
    roundNum,
    round3Score,
    stepType: detail?.stepType,
    detailRoundNum: detail?.roundNum,  // 步骤表的回合数（旧的）
    integralRoundNum: scoreInfo?.roundNum  // 积分表的回合数（新的）
  });

  // ========== 第1/2回合（或首轮推进）进入普通CD ==========
  if (roundNum <= 2) {
    const nextRound = roundNum + 1; //  修正：roundNum 表示当前回合，下一回合=当前+1
    console.log(`进入普通CD，下一回合为第${nextRound}回合`);
    await savePoint({
      stepNum: 0,
      stepType: 'familiar_1_cd',
      taskId,
      stageNum: 1,     //  阶段1
      roundNum: nextRound  //  保存下一回合编号
    });
    return { detail };
  }

  // ========== 第3回合结束 ==========
  if (roundNum === 3) {
    console.log('第3回合结束，判断积分');

    if (score >= 2) {
      // 积分够，进入第4回合
      console.log('积分>=2，进入普通CD，下一回合为第4回合');
      await savePoint({
        stepNum: 0,
        stepType: 'familiar_1_cd',
        taskId,
        stageNum: 1,  //  阶段1
        roundNum: 4   //  进入第4回合
      });
    } else {
      // 积分不够，进入延时CD（2倍），下一回合为第5回合
      console.log('积分<2，进入延时CD（2倍），下一回合为第5回合');
      await savePoint({
        stepNum: 0,
        stepType: 'familiar_1_cd2',
        taskId,
        stageNum: 1,  //  阶段1
        roundNum: 5   //  进入第5回合
      });
    }
    return { detail };
  }

  // ========== 第4回合结束 ==========
  if (roundNum === 4) {
    console.log('第4回合结束，进入阶段间大CD（3-5天）');
    await savePoint({
      stepNum: 0,
      stepType: 'familiar_1_stage_cd',
      taskId,
      stageNum: 1,  //  新增：阶段1
      roundNum: 4   //  保持第4回合（阶段间CD不增加回合数）
    });
    return { detail };
  }

  // ========== 第5回合结束 ==========
  if (roundNum === 5) {
    console.log('第5回合结束，判断积分是否与前三回合相同');

    if (score === round3Score) {
      // 积分相同，弹出提示S6，进入第6回合
      console.log('积分与前三回合相同，弹出提示S6');
      await getHint(
        {
          hintCode: 'S6',
          moduleCode,
          stageNum: 1,
        },
        async () => {
          console.log('用户确认S6，进入延时CD（2倍），下一回合为第6回合');
          await savePoint({
            stepNum: 0,
            stepType: 'familiar_1_cd2',
            taskId,
            stageNum: 1,  //  新增：阶段1
            roundNum: 6   //  新增：进入第6回合
          });
        }
      );
    } else {
      // 积分不同，进入阶段间大CD
      console.log('积分与前三回合不同，进入阶段间大CD（3-5天）');
      await savePoint({
        stepNum: 0,
        stepType: 'familiar_1_stage_cd',
        taskId,
        stageNum: 1,  //  新增：阶段1
        roundNum: 5   //  保持第5回合（阶段间CD不增加回合数）
      });
    }
    return { detail };
  }

  // ========== 第6回合结束 ==========
  if (roundNum === 6) {
    console.log('第6回合结束，判断积分是否与前三回合相同');

    if (score === round3Score) {
      // 积分相同，弹出提示S7，询问是否坚持
      console.log('积分与前三回合相同，弹出提示S7');
      await getHint(
        {
          hintCode: 'S7',
          moduleCode,
          stageNum: 1,
        },
        async () => {
          // 用户选择坚持，进入阶段间大CD
          console.log('用户选择坚持，进入阶段间大CD（3-5天）');
          await savePoint({
            stepNum: 0,
            stepType: 'familiar_1_stage_cd',
            taskId,
            stageNum: 1,  //  新增：阶段1
            roundNum: 6   //  保持第6回合（阶段间CD不增加回合数）
          });
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户放弃坚持，弹出S8 → S9 → 结束任务
            console.log('用户放弃坚持，弹出S8');
            await getHint(
              {
                hintCode: 'S8',
                moduleCode,
                stageNum: 1,
              },
              async () => {
                console.log('S8确认后，弹出S9');
                await getHint(
                  {
                    hintCode: 'S9',
                    moduleCode,
                    stageNum: 1,
                  },
                  () => {
                    console.log('S9确认后，任务结束，跳转到列表页');
                    // TODO: 调用后端接口删除任务
                    uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                  }
                );
              }
            );
          },
        }
      );
    } else {
      // 积分不同，进入阶段间大CD
      console.log('积分与前三回合不同，进入阶段间大CD（3-5天）');
      await savePoint({
        stepNum: 0,
        stepType: 'familiar_1_stage_cd',
        taskId,
        stageNum: 1,  //  新增：阶段1
        roundNum: 6   //  保持第6回合（阶段间CD不增加回合数）
      });
    }
    return { detail };
  }

  // ========== 异常情况 ==========
  console.error('未知的回合数:', roundNum);
  return { detail };
};

export default stage1RoundEnd;
