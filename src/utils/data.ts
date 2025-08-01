export type taskModuleKey =
  | '图文模块'
  | '线下模块'
  | '问诊模块'
  | '定制模块'
  | '陌生模块'
  | '熟悉模块'
  | '不熟模块'
  | '超熟模块'
  | '免费模块';

// 模块
export const taskModule: Record<taskModuleKey, string> = {
  图文模块: 'pic_module',
  线下模块: 'offline_module',
  问诊模块: 'question_module',
  定制模块: 'customized_module',
  陌生模块: 'strange_module',
  熟悉模块: 'familiar_module',
  不熟模块: 'unfamiliar_module',
  超熟模块: 'super_familiar_module',
  免费模块: 'free_module',
};

type PayModuleKey =
  | '图文一阶段付费'
  | '线下一阶段付费'
  | '问诊一阶段付费'
  | '问诊二阶段付费'
  | '定制一阶段付费'
  | '定制二阶段付费';

// 支付模块
export const payModule: Record<PayModuleKey, string> = {
  图文一阶段付费: taskModule['图文模块'],
  线下一阶段付费: taskModule['线下模块'],
  问诊一阶段付费: taskModule['问诊模块'],
  问诊二阶段付费: 'question_module_two_stage',
  定制一阶段付费: taskModule['定制模块'],
  定制二阶段付费: 'customized_module_two_stage',
};

// 路由对应的模块
export const routePathModule: Record<string, string> = {
  custom: taskModule['定制模块'],
  offline: taskModule['线下模块'],
  wenzhen: taskModule['问诊模块'],
  'image-text': taskModule['图文模块'],
};

// 问题的枚举
export const questionTemplete: Record<string, string> = {
  q1: '有对方微信或其他线上可交流方式吗？',
  q2: '需要让对方见不到您20天左右。其中前10天左右什么也不用做，后10天左右请根据之后指引操作，确定可以开始并准备好之后请选“是”（即是否准备好）',
  q3: '请确定完成第一阶段，即倒计时结束前未与对方见面或主动联系，是或否？',
};

// 节点保存枚举
export const stageEnum = {
  familiar_s2: '熟悉0阶段问卷的提示板s2',
  familiar_s4: '熟悉0阶段问卷的提示板s4',
  familiar_s6: '熟悉1阶段，提示板s6',
  familiar_1_cd: '熟悉1阶段，大cd1',
  familiar_1_cd2: '熟悉1阶段，大cd2',
  familiar_1_stage_cd: '熟悉1阶段cd',
  familiar_s10: '熟悉2阶段，提示板s10',
  familiar_s11: '熟悉2阶段，提示板s11',
  familiar_s13: '熟悉2阶段，提示板s13',
  familiar_2_cd: '熟悉2阶段，大cd1',
  familiar_2_cd2: '熟悉2阶段，大cd2',
  familiar_2_stage_cd: '熟悉2阶段cd',
  familiar_s15: '熟悉3阶段，提示板s15',
  familiar_s17: '熟悉3阶段，提示板s17',
  familiar_3_cd: '熟悉3阶段，大cd1',
  familiar_3_cd2: '熟悉3阶段，大cd2',
  familiar_stage_cd: '熟悉3阶段cd',
  super_familiar_w4: '超熟0阶段，提示板w4',
  super_familiar_w6: '超熟0阶段，提示板w6',
  super_familiar_w8: '超熟1阶段，提示板w8',
  stage_round_content: '阶段回合初始化内容',
  stage_round_end_content: '阶段结束内容结束',
};
