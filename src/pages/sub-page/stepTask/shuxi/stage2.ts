/**
 * 阶段2状态管理 - 深化关系
 *
 * 职责：
 * 1. 离库结束后的回合判分逻辑
 * 2. 处理特殊回合a/b的转换
 * 3. 前两回合总分计算和判分
 * 4. 提示板S10/S11/S12/S13/S14的展示
 *
 * 注意：
 * - 第二阶段使用内容库S6-S11（随机抽取不重复）
 * - 特殊回合使用内容库S2.5，跳过开场库
 * - CD机制：普通CD、2倍CD、3倍CD、阶段CD(3-5天)、15天CD
 */

// 接口
import { getHint, savePoint, getTaskDetail, getRoundIntegral } from '@/utils/api';
// 工具
import {
  enterRoundBigCd,
  enterStageCd,
  checkStage2RoundTransition,
  finishStage2Round as finishStage2RoundLocal
} from '@/utils/familiar-local';

const moduleCode = 'familiar_module';

/**
 * 阶段2回合结束后的判分逻辑
 * @param taskId 任务ID
 * @returns 任务详情和判分结果
 */
const stage2RoundEnd = async (taskId: number) => {
  console.log('=== stage2RoundEnd 开始 ===');

  const detail = await getTaskDetail(taskId);
  const scoreInfo = await getRoundIntegral(taskId);

  const score = scoreInfo?.integral || 0;           // 当前阶段累计积分
  const roundNum = scoreInfo?.roundNum || 0;        // 当前回合数
  const round2Integral = scoreInfo?.round2Integral || 0; // 前两回合总积分

  console.log('当前状态:', {
    score,
    roundNum,
    round2Integral,
    stepType: detail?.stepType,
  });

  // 调用checkStage2RoundTransition获取判分结果
  const transitionResult = checkStage2RoundTransition(taskId);

  if (!transitionResult.ok) {
    console.error('判分失败:', transitionResult.reason);
    return { detail };
  }

  console.log('判分结果:', transitionResult);

  // 根据判分结果执行相应操作
  switch (transitionResult.action) {
    case 'enterRound2':
      // 第一回合后，进入第二回合
      console.log('第一回合结束，进入普通CD，下一回合为第2回合');
      await savePoint({
        stepNum: 0,
        stepType: 'familiar_2_cd',
        taskId,
        stageNum: 2,
        roundNum: 2
      });
      break;

    case 'showPromptS10':
      // 第二回合后得分不足，显示S10提示板，然后进入特殊回合a
      console.log('第二回合得分不足，显示提示板S10');
      await getHint(
        {
          hintCode: 'S10',
          moduleCode,
          stageNum: 2,
        },
        async () => {
          console.log('S10确认后，进入特殊回合a，2倍CD');
          // 进入2倍CD已经在checkStage2RoundTransition中处理
        }
      );
      break;

    case 'enterStageCd':
      // 得分足够或特殊回合得分超过，进入阶段CD
      console.log('得分足够，进入阶段CD（3-5天），等待进入第3阶段');
      // 阶段CD已经在checkStage2RoundTransition中处理
      break;

    case 'showPromptS11':
      // 特殊回合a，得分=前2回合且回合<4，显示S11（询问坚持/放弃）
      console.log('特殊回合a得分相等且回合<4，显示提示板S11');
      await getHint(
        {
          hintCode: 'S11',
          moduleCode,
          stageNum: 2,
        },
        async () => {
          // 用户选择"坚持"，进入特殊回合b
          console.log('用户选择坚持，进入特殊回合b，3倍CD');

          // 获取任务并设置特殊回合b
          const task = await getTaskDetail(taskId);
          // 设置特殊回合b标识（通过API）
          await savePoint({
            stepNum: 0,
            stepType: 'familiar_2_cd3',  // 3倍CD
            taskId,
            stageNum: 2,
            roundNum: (task?.roundNum || 3) + 1,  // 回合数+1
            specialRound: 'b'  // 设置特殊回合b标识
          });
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户选择"不坚持"，显示S12 → S14 → 结束任务
            console.log('用户选择不坚持，显示提示板S12');
            await getHint(
              {
                hintCode: 'S12',
                moduleCode,
                stageNum: 2,
              },
              async () => {
                console.log('S12确认后，显示提示板S14');
                await getHint(
                  {
                    hintCode: 'S14',
                    moduleCode,
                    stageNum: 2,
                  },
                  () => {
                    console.log('S14确认后，任务结束，跳转到列表页');
                    uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                  }
                );
              }
            );
          },
        }
      );
      break;

    case 'showPromptS13':
      // 得分=前2回合且回合≥4，15天倒计时，显示S13
      console.log('得分相等且回合≥4，15天倒计时，显示提示板S13');
      await getHint(
        {
          hintCode: 'S13',
          moduleCode,
          stageNum: 2,
        },
        async () => {
          console.log('S13确认，等待对方找');
          // 15天CD已经在checkStage2RoundTransition中处理
        }
      );
      break;

    case 'showPromptS14':
      // 得分不足，15天倒计时，显示S14
      console.log('得分不足，15天倒计时，显示提示板S14');
      await getHint(
        {
          hintCode: 'S14',
          moduleCode,
          stageNum: 2,
        },
        () => {
          console.log('S14确认后，任务结束，跳转到列表页');
          uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
        }
      );
      break;

    case 'continue':
      // 继续当前回合（正常情况不应该到这里）
      console.log('继续当前回合');
      break;

    default:
      console.error('未知的判分操作:', transitionResult.action);
  }

  return { detail, transitionResult };
};

export default stage2RoundEnd;
