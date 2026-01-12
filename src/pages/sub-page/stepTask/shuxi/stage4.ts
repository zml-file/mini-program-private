/**
 * 阶段4状态管理 - 确认邀约
 *
 * 职责：
 * 1. 进入第四阶段后显示S20提示板
 * 2. 处理用户在S20中的选择（马上邀约、多聊一次、暂时不做选择）
 * 3. 马上邀约流程：S17→邀约判断→S18/CD/S25
 * 4. 多聊一次流程：S21→返回第三阶段→S22→S20
 * 5. 邀约成功流程：S18→Go→S23→S24→S29/S30
 * 6. 邀约失败流程：3×CD/5×CD/S25→S26→S27
 * 7. 半价重开和结束任务的提示板处理
 *
 * 注意：
 * - 第四阶段没有回合概念（roundIndex = null）
 * - 内容库：S17（邀约）、S18（成功）
 * - 多聊一次：返回第三阶段进行一个回合
 * - 邀约失败：第1次3×CD、第2次5×CD、第3次显示S25
 */

// 接口
import { getHint, savePoint, getTaskDetail } from '@/utils/api';
// 工具
import {
  handleInvitation,
  handleMultiChat,
  finishMultiChat,
  halfPriceRestart,
  finishTask,
  enterRoundBigCd,
  startStage3Round
} from '@/utils/familiar-local';

const moduleCode = 'familiar_module';

/**
 * 第四阶段入口函数
 * 进入第四阶段后立即调用，显示S20提示板
 * @param taskId 任务ID
 */
const enterStage4UI = async (taskId: number) => {
  console.log('=== 进入第四阶段UI ===');

  // 显示S20提示板，让用户选择下一步操作
  await showS20(taskId);
};

/**
 * 显示S20提示板
 * 三个选择：马上邀约、多聊一次、暂时不做选择
 * @param taskId 任务ID
 */
const showS20 = async (taskId: number) => {
  console.log('显示S20提示板 - 选择下一步操作');

  // S20提示板有三个自定义按钮
  await getHint(
    {
      hintCode: 'S20',
      moduleCode,
      stageNum: 4,
    },
    undefined, // S20没有默认确定按钮
    {
      showChoices: true,
      choices: [
        { text: '马上邀约', value: 'invite' },
        { text: '多聊一次', value: 'multiChat' },
        { text: '暂时不做选择', value: 'later' }
      ],
      choiceCb: async (choice: string) => {
        switch (choice) {
          case 'invite':
            // 马上邀约
            await handleInviteFlow(taskId);
            break;

          case 'multiChat':
            // 多聊一次
            await handleMultiChatFlow(taskId);
            break;

          case 'later':
            // 暂时不做选择
            uni.showToast({
              title: '请了解对方需求后，尽快进行选择',
              icon: 'none',
              duration: 2000
            });
            // S20保持弹出状态，再次显示
            setTimeout(() => {
              showS20(taskId);
            }, 2100);
            break;
        }
      }
    }
  );
};

/**
 * 处理邀约流程
 * 抽取内容库S17，用户选择邀约成功/失败
 * @param taskId 任务ID
 */
const handleInviteFlow = async (taskId: number) => {
  console.log('处理邀约流程');

  // TODO: 抽取内容库S17，让用户复制邀约内容
  // 这里简化处理，直接询问用户邀约结果

  // 询问用户邀约是否成功
  uni.showModal({
    title: '邀约结果',
    content: '请选择邀约结果',
    confirmText: '邀约成功',
    cancelText: '邀约失败',
    success: async (res) => {
      if (res.confirm) {
        // 邀约成功
        await handleInviteSuccess(taskId);
      } else if (res.cancel) {
        // 邀约失败
        await handleInviteFail(taskId);
      }
    }
  });
};

/**
 * 处理邀约成功流程
 * S18 → Go按钮 → S23 → S24 → S29/S30
 * @param taskId 任务ID
 */
const handleInviteSuccess = async (taskId: number) => {
  console.log('邀约成功');

  // 调用handleInvitation标记邀约成功
  const result = handleInvitation(taskId, true);

  if (result.ok && result.action === 'showContentS18') {
    // 显示内容库S18
    // TODO: 抽取并显示内容库S18的内容

    // 用户在当前页面选择是否点击Go
    uni.showModal({
      title: '温馨提示',
      content: '是否点击Go按钮？',
      confirmText: '点击Go',
      cancelText: '暂不点击',
      success: async (res) => {
        if (res.confirm) {
          // 点击Go，开启延时
          await handleGoClick(taskId);
        } else {
          // 暂不点击，返回S20
          await showS20(taskId);
        }
      }
    });
  }
};

/**
 * 处理Go按钮点击
 * 弹出S23延时提示 → S24选择关闭/放弃
 * @param taskId 任务ID
 */
const handleGoClick = async (taskId: number) => {
  console.log('点击Go按钮');

  // 显示S23延时提示
  await getHint(
    {
      hintCode: 'S23',
      moduleCode,
      stageNum: 4,
    },
    async () => {
      // S23确认后，显示S24询问是否关闭任务
      await getHint(
        {
          hintCode: 'S24',
          moduleCode,
          stageNum: 4,
        },
        async () => {
          // 用户选择"关闭任务"，显示S29确认
          await getHint(
            {
              hintCode: 'S29',
              moduleCode,
              stageNum: 4,
            },
            () => {
              // S29确认后，结束任务
              finishTask(taskId);
              uni.showToast({ title: '任务已结束', icon: 'success' });
              uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
            }
          );
        },
        {
          showCancel: true,
          cancelCb: async () => {
            // 用户选择"放弃关闭任务"，显示S30
            await getHint(
              {
                hintCode: 'S30',
                moduleCode,
                stageNum: 4,
              },
              () => {
                // S30确认后，任务继续，3秒后自动消失
                console.log('任务继续，可以使用搜索问答功能');
                // 任务正常计时，在任务有效期内可以使用搜索问答
              }
            );
          }
        }
      );
    }
  );
};

/**
 * 处理邀约失败流程
 * ≤2次：3×CD或5×CD
 * >2次：S25 → 指导/关闭
 * @param taskId 任务ID
 */
const handleInviteFail = async (taskId: number) => {
  console.log('邀约失败');

  // 调用handleInvitation标记邀约失败
  const result = handleInvitation(taskId, false);

  if (!result.ok) {
    console.error('邀约失败处理错误:', result.reason);
    return;
  }

  if (result.action === 'enterBigCd') {
    // 失败次数≤2，进入CD
    const cdMultiplier = result.cdMultiplier || 1;
    console.log(`邀约失败，进入${cdMultiplier}倍大CD`);

    // 进入CD倒计时
    enterRoundBigCd(taskId, cdMultiplier);

    uni.showToast({
      title: `进入${cdMultiplier}倍大CD倒计时`,
      icon: 'none',
      duration: 2000
    });

    // CD结束后，返回S20让用户再次选择
    // TODO: CD倒计时结束后的处理逻辑（可能需要在round1.vue中处理）

  } else if (result.action === 'showPromptS25') {
    // 失败次数>2，显示S25提示板
    console.log('邀约失败超过2次，显示S25');

    await getHint(
      {
        hintCode: 'S25',
        moduleCode,
        stageNum: 4,
      },
      undefined, // S25没有默认确定按钮
      {
        showChoices: true,
        choices: [
          { text: '进行指导', value: 'guide' },
          { text: '关闭任务', value: 'close' }
        ],
        choiceCb: async (choice: string) => {
          if (choice === 'guide') {
            // 用户选择"进行指导"
            await handleGuide(taskId);
          } else if (choice === 'close') {
            // 用户选择"关闭任务"
            await handleCloseTask(taskId);
          }
        }
      }
    );
  }
};

/**
 * 处理指导流程
 * S26 → 选择关闭/放弃
 * @param taskId 任务ID
 */
const handleGuide = async (taskId: number) => {
  console.log('显示指导提示板S26');

  await getHint(
    {
      hintCode: 'S26',
      moduleCode,
      stageNum: 4,
    },
    async () => {
      // 用户选择"关闭任务"
      await handleCloseTask(taskId);
    },
    {
      showCancel: true,
      cancelCb: async () => {
        // 用户选择"放弃关闭任务"，显示S30
        await getHint(
          {
            hintCode: 'S30',
            moduleCode,
            stageNum: 4,
          },
          () => {
            console.log('任务继续，可以使用搜索问答功能');
          }
        );
      }
    }
  );
};

/**
 * 处理关闭任务流程
 * S27 → 半价重开/结束任务
 * @param taskId 任务ID
 */
const handleCloseTask = async (taskId: number) => {
  console.log('显示关闭任务提示板S27');

  await getHint(
    {
      hintCode: 'S27',
      moduleCode,
      stageNum: 4,
    },
    async () => {
      // 用户选择"半价重启"
      console.log('用户选择半价重启');
      const result = halfPriceRestart(taskId);
      if (result.ok) {
        // 显示S28成功提示
        await getHint(
          {
            hintCode: 'S28',
            moduleCode,
            stageNum: 4,
          },
          () => {
            uni.showToast({ title: '任务已半价重开', icon: 'success' });
            uni.redirectTo({ url: '/pages/sub-page/stepTask/list?module=熟悉模块' });
          }
        );
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
};

/**
 * 处理多聊一次流程
 * S21 → 判断是否第一次 → 返回第三阶段/关闭S21
 * @param taskId 任务ID
 */
const handleMultiChatFlow = async (taskId: number) => {
  console.log('处理多聊一次流程');

  // 调用handleMultiChat判断是否可以使用多聊一次
  const result = handleMultiChat(taskId);

  if (!result.ok) {
    // 不是第一次点击多聊一次
    console.log('多聊一次已使用过，关闭S21，回到S20');

    uni.showModal({
      title: '温馨提示',
      content: '您已使用过"多聊一次"功能',
      showCancel: false,
      success: async () => {
        // 回到S20
        await showS20(taskId);
      }
    });
    return;
  }

  // 第一次点击多聊一次，显示S21确认
  await getHint(
    {
      hintCode: 'S21',
      moduleCode,
      stageNum: 4,
    },
    async () => {
      // S21确认后，返回第三阶段
      console.log('返回第三阶段进行一个回合');

      // 获取任务信息，确定回合数
      const task = await getTaskDetail(taskId);
      const nextRoundNum = (task.roundNum || 0) + 1;

      // 开始第三阶段回合
      startStage3Round(taskId, nextRoundNum);

      // TODO: 需要在round1.vue中处理多聊一次回合的流程
      // 多聊一次回合结束后，应该调用handleMultiChatComplete

      uni.showToast({
        title: '返回第三阶段，开始多聊一次回合',
        icon: 'none',
        duration: 2000
      });
    }
  );
};

/**
 * 完成多聊一次回合
 * 显示S22 → 回到S20
 * @param taskId 任务ID
 */
const handleMultiChatComplete = async (taskId: number) => {
  console.log('多聊一次回合完成');

  // 调用finishMultiChat返回第四阶段
  const result = finishMultiChat(taskId);

  if (result.ok && result.action === 'showPromptS20') {
    // 显示S22提示
    await getHint(
      {
        hintCode: 'S22',
        moduleCode,
        stageNum: 4,
      },
      async () => {
        // S22确认后，回到S20
        await showS20(taskId);
      }
    );
  }
};

// 导出主函数
export default enterStage4UI;

// 导出其他可能需要的函数
export {
  showS20,
  handleMultiChatComplete
};
