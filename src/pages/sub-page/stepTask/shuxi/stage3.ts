/**
 * 阶段3状态管理 - 关键推进
 *
 * 职责：
 * 1. 离库结束后的回合判分逻辑
 * 2. 处理特殊回合a/b的转换
 * 3. 第2回合得分记录和判分
 * 4. 提示板S15/S16/S17/S18/S19的展示
 *
 * 注意：
 * - 第三阶段使用内容库S12-S16（随机抽取不重复）
 * - 特殊回合使用内容库S3.5，开库S3.5，离库S3.5
 * - CD机制：普通CD、3倍CD、无阶段CD（直接进入第四阶段）
 * - Z时间：3-7分钟
 */

// 接口
import { getHint, savePoint, getTaskDetail, getRoundIntegral } from '@/utils/api';
// 工具
import {
  enterRoundBigCd,
  checkStage3RoundTransition,
  enterStage4,
  halfPriceRestart,
  finishTask,
  getTask
} from '@/utils/familiar-local';
// 第四阶段UI
import enterStage4UI, { handleMultiChatComplete } from './stage4';

const moduleCode = 'familiar_module';

/**
 * 阶段3回合结束后的判分逻辑
 * @param taskId 任务ID
 * @returns 任务详情和判分结果
 */
const stage3RoundEnd = async (taskId: number) => {
  console.log('=== stage3RoundEnd 开始 ===');

  const detail = await getTaskDetail(taskId);
  const scoreInfo = await getRoundIntegral(taskId);

  const score = scoreInfo?.integral || 0;           // 当前阶段累计积分
  const roundNum = scoreInfo?.roundNum || 0;        // 当前回合数
  const round2Integral = scoreInfo?.round2Integral || 0; // 第2回合得分

  console.log('当前状态:', {
    score,
    roundNum,
    round2Integral,
    stepType: detail?.stepType,
  });

  // 检测是否是"多聊一次"回合
  const task = getTask(taskId.toString());
  if (task?.stage4?.returnedFromStage3 && task.stageIndex === 3) {
    // 这是多聊一次回合，完成后返回第四阶段
    console.log('检测到多聊一次回合，完成并返回第四阶段');
    await handleMultiChatComplete(taskId);
    return { detail };
  }

  // 调用checkStage3RoundTransition获取判分结果
  const transitionResult = checkStage3RoundTransition(taskId);

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
        stepType: 'familiar_3_cd',
        taskId,
        stageNum: 3,
        roundNum: 2
      });
      break;

    case 'enterStage4':
      // 得分足够或特殊回合得分超过，直接进入第四阶段
      console.log('得分足够，直接进入第四阶段（无阶段CD）');
      // enterStage4已经在checkStage3RoundTransition中调用

      // 调用第四阶段UI初始化函数，显示S20提示板
      await enterStage4UI(taskId);
      break;

    case 'showPromptS15':
      // 第二回合后得分不足，显示S15提示板，询问是否坚持
      console.log('第二回合得分不足，显示提示板S15');
      await getHint(
        {
          hintCode: 'S15',
          moduleCode,
          stageNum: 3,
        },
        async () => {
          // 用户选择"坚持"，进入特殊回合a，3倍CD
          console.log('用户选择坚持，进入特殊回合a，3倍CD');

          const task = await getTaskDetail(taskId);
          await savePoint({
            stepNum: 0,
            stepType: 'familiar_3_cd3',  // 3倍CD
            taskId,
            stageNum: 3,
            roundNum: (task?.roundNum || 2) + 1,  // 回合数+1
            specialRound: 'a'  // 设置特殊回合a标识
          });
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户选择"放弃"，显示S16（半价重开/结束任务）
            console.log('用户选择放弃，显示提示板S16');
            await getHint(
              {
                hintCode: 'S16',
                moduleCode,
                stageNum: 3,
              },
              async () => {
                // 用户选择"半价重开"
                console.log('用户选择半价重开');
                const result = halfPriceRestart(taskId);
                if (result.ok) {
                  uni.showToast({ title: '任务已半价重开', icon: 'success' });
                  uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                }
              },
              {
                showCancel: true,
                cancelCb: async () => {
                  // 用户选择"结束任务"
                  console.log('用户选择结束任务');
                  finishTask(taskId);
                  uni.showToast({ title: '任务已结束', icon: 'success' });
                  uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                }
              }
            );
          },
        }
      );
      break;

    case 'showPromptS16':
      // 特殊回合a，得分=第2回合且回合<4，显示S16（询问坚持/放弃）
      console.log('特殊回合a得分相等且回合<4，显示提示板S16');
      await getHint(
        {
          hintCode: 'S16',
          moduleCode,
          stageNum: 3,
        },
        async () => {
          // 用户选择"坚持"，显示S17，进入特殊回合b
          console.log('用户选择坚持，显示提示板S17，进入特殊回合b');
          await getHint(
            {
              hintCode: 'S17',
              moduleCode,
              stageNum: 3,
            },
            async () => {
              // S17确认后，进入特殊回合b，3倍CD
              console.log('S17确认，进入特殊回合b，3倍CD');

              const task = await getTaskDetail(taskId);
              await savePoint({
                stepNum: 0,
                stepType: 'familiar_3_cd3',  // 3倍CD
                taskId,
                stageNum: 3,
                roundNum: (task?.roundNum || 3) + 1,  // 回合数+1
                specialRound: 'b'  // 设置特殊回合b标识
              });
            }
          );
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户选择"放弃"，半价重开/结束任务
            console.log('用户选择放弃，显示半价重开/结束任务选项');
            await getHint(
              {
                hintCode: 'S16',
                moduleCode,
                stageNum: 3,
              },
              async () => {
                // 半价重开
                const result = halfPriceRestart(taskId);
                if (result.ok) {
                  uni.showToast({ title: '任务已半价重开', icon: 'success' });
                  uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                }
              },
              {
                showCancel: true,
                cancelCb: async () => {
                  // 结束任务
                  finishTask(taskId);
                  uni.showToast({ title: '任务已结束', icon: 'success' });
                  uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
                }
              }
            );
          },
        }
      );
      break;

    case 'showPromptS17':
      // 得分=第2回合且回合≥4，显示S18（对方找确认）
      console.log('得分相等且回合≥4，显示提示板S18');
      await getHint(
        {
          hintCode: 'S18',
          moduleCode,
          stageNum: 3,
        },
        async () => {
          // 用户点击"对方找"，显示S19（对方找回复信息）
          console.log('用户点击对方找，显示提示板S19');
          await getHint(
            {
              hintCode: 'S19',
              moduleCode,
              stageNum: 3,
            },
            () => {
              // S19确认后，结束任务
              console.log('S19确认后，结束任务');
              finishTask(taskId);
              uni.showToast({ title: '任务已结束', icon: 'success' });
              uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
            }
          );
        }
      );
      break;

    case 'showPromptS18':
      // 得分<第2回合，显示S18（半价重开/结束任务）
      console.log('得分不足，显示提示板S18');
      await getHint(
        {
          hintCode: 'S18',
          moduleCode,
          stageNum: 3,
        },
        async () => {
          // 用户选择"半价重开"
          console.log('用户选择半价重开');
          const result = halfPriceRestart(taskId);
          if (result.ok) {
            uni.showToast({ title: '任务已半价重开', icon: 'success' });
            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
          }
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户选择"结束任务"
            console.log('用户选择结束任务');
            finishTask(taskId);
            uni.showToast({ title: '任务已结束', icon: 'success' });
            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
          }
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

export default stage3RoundEnd;
