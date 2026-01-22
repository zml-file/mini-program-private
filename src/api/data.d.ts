import { stageEnum } from '@/utils/data';
export type StageEnumType = keyof typeof stageEnum;

export type UploadImageBodyType = {
  filePath: string;
  formData?: Record<string, any>;
};

export type QuestionType = {
  1: '单选题';
  2: '问答题(短文字）';
  3: '问答题(长文字）';
  4: '问答题(图文）';
};

export type TaskStatusType = {
  10: '初始化';
  20: '问题已提交';
  30: '问题答案已给出';
  50: '二次提交的问题等待回复';
  51: '二次提交的问题回复中';
  52: '二次提交的问题回复完成';
  61: '回合之间倒计时';
  62: '阶段之间倒计时';
  63: 'z/az倒计时';
  64: 'D/AD'; // 没有倒计时
  65: '用户点击对方找倒计时';
  66: '对话进行中倒计时';
  90: '已结束';
};

type ModuleCode = string;

export namespace Common {
  namespace Login {
    interface Body {
      code: string;
    }
  }

  namespace GetPhoneNumber {
    interface Body {
      userId: number;
      code: string;
    }
  }

  // 通用下拉接口
  namespace DropList {
    // 续时周期：renew_time
    // 虚拟币付费场景：vir_pay_scene
    type Enum = 'renew_time' | 'vir_pay_scene';
    interface DataType {
      label: string;
      value: number | string;
    }
    type Body = Enum[];
    type Data = Record<Enum, DataType[]>;
  }

  namespace ModuleExt {
    interface Body {
      moduleCode: ModuleCode;
      extType: number; // 1-广告，2-问号
    }
  }

  namespace Info {
    export interface Data {
      accumulateMoney: number; // RMB累积充值金额
      accumulateVirtual: number; // 虚拟币累积总共数值
      remainingVirtual: number; // 虚拟币剩余数值
      userId: number;
      userLevel: number; // 用户vip等级
    }
  }

  namespace GetPrePayData {
    interface Body {
      amount: number;
    }
    interface Data {
      nonceStr: string;
      packageInfo: string;
      paySign: string;
      signType: string;
      timeStamp: string;
    }
  }
}

// 线下任务
export namespace Task {
  // 模块
  namespace ModuleList {
    interface Data {
      [x: string]: string;
    }
  }

  // 任务列表
  namespace List {
    interface Data {
      //  基础字段
      taskId: number;
      taskName: string;
      moduleCode: ModuleCode; // 模块的code
      taskStatus: keyof TaskStatusType;
      amount: number; // 具体的虚拟币
      startTime: string;
      endTime: string; // 任务的结束时间
      functionEndTime: string; // 功能结束时间（后端新增）

      //  任务详情字段（后端已补齐）
      stepType: StageEnumType; // 步骤类型
      stageNum: number; // 阶段数
      roundNum: number; // 回合数
      stepNum: number; // 步骤数
      stepId: number; // 步骤ID
      stepDetailId: number; // 步骤内容ID
      otherFindEndTime: string; // 对方找结束时间
      specialStepId: number; // 需要被关闭的步骤ID
      needManualHandle: number; // 是否需要手动关闭（1：需要，-1：不需要）
    }
  }

  namespace Create {
    interface Body {
      moduleCode: ModuleCode;
      taskName: string;
    }
    interface Data {
      amount: number; // 具体的虚拟币
      taskId: number;
    }
  }

  // 问卷
  namespace ModuleQuestionList {
    interface OptionContentList {
      id: number;
      optionContent: string;
    }

    interface QuestionVoList {
      optionContentList: OptionContentList[];
      questionId: number;
      questionNum: number;
      questionTitle: string;
      questionType: number; // 1:单选题、2:问答题(短文字）、3:问答题(长文字）、4:问答题(图文）
    }

    interface Data {
      stageName: string;
      moduleCode: ModuleCode;
      questionVoList: QuestionVoList[];
      stageId: number;
    }
  }

  // 提交问卷
  namespace SubmitQuestion {
    interface ModuleUserQuestion {
      optionId?: number; // 选择题，提交一个选项的id
      questionId: number; // 题目id
      userSubmitContent?: string; // 用户提交的答案 * 如果是问答题，则为用户提交的内容 * 如果是选择题，则为选择题里选项的内容
    }
    interface Body {
      moduleUserQuestionList: ModuleUserQuestion[];
      taskId: string;
    }
  }

  // 查看问卷答案
  namespace SearchQuestionAnswer {
    export interface ContentList {
      answerContent: string;
      answerTitle: string;
      countDownTime: string;
      imgUrl: string[];
      replayId: number; // 回复的标题
      replyUsed: string; // 是否被用户选中，0：没有，1：选中（图文用）
      showLevel: number; // 可查看的等级
    }

    export interface Data {
      contentList: ContentList[];
      describe: string;
      endTime: string;
      functionEndTime: string;
      moduleName: string;
      needPayNum: number;
    }
  }
}

// 图文任务
export namespace ImageText {
  namespace ModuleImg {
    export interface ModuleImgVoList {
      imgContent: string;
      imgUrlList: string[];
      type: number | null; // null为普通图片，1为特殊图文
      title?: string;
    }

    export interface Data {
      describe?: string;
      moduleImgVoList: ModuleImgVoList[];
    }
  }

  namespace UpdateReplyIsUsed {
    interface Body {
      replyId: number;
    }
  }
}

// 定制模块
export namespace Custom {
  namespace CustomerSearchSecondQuestion {
    interface Data {
      imgSize: number; // 能上传的图片数量
      questionId: number; // 问题id
      questionTitle: string; // 问题标题
    }
  }

  namespace SubmitSecondQuestion {
    interface Body {
      imgUrlList: any[]; // 提交的图片url
      phone: string;
      questionContent: string; // 二次问题的提交内容
      questionId: number; // 问题ID
      taskId: number; // 任务ID
    }
  }
}

export namespace Index {
  namespace Info {
    interface Body {}
  }

  namespace ExplanationList {
    export interface Data {
      explainContent: string; // 说明内容
      explainTitle: string; // 说明标题
      extInfo: string; // 说明扩展信息
      id: number;
    }
  }
}

export namespace Four {
  export interface Body {
    taskId: number;
  }
  export namespace GetTaskDetail {
    export interface Data {
      taskName: string; // 任务名称
      endTime: string;
      needManualHandle: number; // 是否需要手动调用关闭接口 -- closeOverTimeDetailStep，1：需要手动关闭，-1：不需要
      otherFindEndTime: string; // 对方找结束时间
      roundNum: number; // 处于第几回合
      specialStepId: number; // 需要被关闭的步骤id
      stageNum: number; // 处于第几阶段
      stepDetailId: number; // 步骤内容id
      stepId: number;
      stepNum: number;
      stepType: StageEnumType;
    }
  }

  export namespace GetStep {
    export interface Body extends Four.Body {
      moduleCode: ModuleCode;
    }
    export interface Data {
      stepDetailId: number; // 上个复制的内容步骤id
      stepId: number;
      warehouseType: number; // 0 开始库，1 内容库，2 离开库
    }
  }

  export namespace SubmitQuestion {
    interface Body extends Task.SubmitQuestion.Body {}

    interface Data {
      isScoreFlag: number; // 分数是否满足条件，1：满足，0：不满足
    }
  }

  export namespace GetHint {
    interface Body {
      hintCode: string;
      moduleCode: ModuleCode;
      stageNum: number; // 当前问题重复的次数
    }

    export interface Data {
      hintCode: string;
      hintContent: string;
      hintName: string;
      hintNum: number;
      id: number;
      moduleCode: ModuleCode;
      stageNum: number;
    }
  }

  export namespace SavePoint {
    interface Body {
      stepNum: number; // 步骤数
      stepType: StageEnumType; // 步骤类型
      taskId: number; // 任务id
      stageNum?: number; //  新增：阶段数（可选）
      roundNum?: number; //  新增：回合数（可选）
    }
  }

  export namespace CloseOverTimeDetailStep {
    interface Query {
      specialStepId: number; // 步骤详情id
    }
  }

  // 获取指定内容库
  export namespace GetAppointContent {
    interface Body {
      taskId: number;
      moduleCode: ModuleCode;
      warehouseName: string;
    }

    interface Data {
      stepDetailId: number; // 上个复制的内容步骤id
      stepId: number; // 步骤id
    }
  }

  // 通过指定【内容库】获取【详细内容】
  export namespace GetContentDetail {
    interface Body {
      preStepDetailId: number; // 上个id
      taskId: number;
      stepId: number; // 步骤id
      moduleCode: ModuleCode;
    }

    export interface ContentList {
      content: string;
      stepDetailId: number;
    }

    export interface StatusVo {
      cutDownTime: string; // 回合cd时间
      stepDetailId: number;
      sign: string; // 当前回合的标识 A/AZ/D/AD
    }

    export interface Data {
      contentList: ContentList[];
      statusVo: StatusVo;
    }
  }

  // 获取当前回合分数
  export namespace RoundIntegral {
    namespace Get {
      interface Data {
        integral: number; // 分数
        roundNum: number; // 回合数;
        taskId: number;
      }
    }

    namespace Add {
      interface Body extends Four.Body {
        integralNum: number; // 分数
      }
    }
  }

  // 时间模块列表
  export namespace TimeConfig {
    interface Body {
      moduleCode: ModuleCode;
      intervalTimeName: string; // 时间模块名称
      stageNum: number; // 阶段序号
    }
    export interface Data {
      intervalEndNum: number; // 时间的数值结束
      intervalStNum: number; // 时间的数值开始 (开始和结束数值一样 则时间是一个定额，不一样则是随机一个数)
      intervalTimeName: string; // cd时间名称
      intervalTimeType: string; // 倒计时的枚举(SECONDS:秒/MINUTES:分/HOURS:小时/DAYS:天)
      moduleCode: string; // 模块code
      stageId: number; // 阶段序号
    }
  }

  export namespace SaveTempTime {
    export interface Body {
      time: number; // 具体时间 例如，1天，1小时，1分钟。。。
      intervalTimeType: string; // SECONDS:秒 / MINUTES:分 / HOURS:小时 / DAYS:天
    }

    export interface Data {

    }
  }

  // 复制内容
  export namespace CopyContentDetail {
    export interface Body extends Four.Body {
      moduleCode: ModuleCode;
      stepDetailId: number; // 内容详情的id
      stepId: number; // 步骤id
      sign: string; // 回合标识
    }

    export interface Data {
      isStop: number; // 是否停止，1：停止，0：继续
    }
  }

  // 获取所有内容库列表
  export namespace GetAllContent {
    export interface ContentItem {
      id: number;
      warehouseId: number;
      contentCode: string;
      contentDetail: string;
      contentType: number;
      status: number;
      type: number | null;
      warehouseName: string;
    }

    export type Data = ContentItem[];
  }
}
