import moment from 'moment';

// 二次封装uni.showToast()
export const Toast = (title: string) => {
  return new Promise(reslove => {
    uni.showToast({
      title,
      icon: 'none',
    });
    let time = setTimeout(() => {
      clearTimeout(time);
      reslove(time);
    }, 3000);
  });
};

// 本地图片转base64
export const convertToBase64 = (filePath: string): Promise<string> => {
  return new Promise(resolve => {
    uni.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: res => {
        const base64String = `data:image/png;base64,${res.data}`;
        resolve(base64String);
      },
      fail: err => {
        console.error('读取文件失败', err);
      },
    });
  });
};

// 字符串时间转时、分、秒
export const getCountdown = (specificTime: string) => {
  // 当前时间
  const currentTime = moment();
  // ✅ 修复：将 "yyyy-MM-dd HH:mm:ss" 格式转换为 "yyyy/MM/dd HH:mm:ss" 格式
  // iOS 不支持 "yyyy-MM-dd HH:mm:ss" 格式，需要将 "-" 替换为 "/"
  const formattedTime = specificTime ? specificTime.replace(/-/g, '/') : specificTime;
  // 时间节点
  const specificMoment = moment(formattedTime);

  // 计算时间差
  const duration = moment.duration(specificMoment.diff(currentTime));
  // 获取小时、分钟和秒的差值
  // Math.abs() 绝对值
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  // 或者直接输出完整的时间差
  // console.log(`从 ${specificTime} 到现在的时间差: ${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`);
  return { days, hours, minutes, seconds };
};

// 判断目标时间跟当前时间做比较，判断是否超时
export const hasItTimeOut = (targetTime: string, currTime?: string) => {
  // ✅ 修复：将 "yyyy-MM-dd HH:mm:ss" 格式转换为 "yyyy/MM/dd HH:mm:ss" 格式
  // iOS 不支持 "yyyy-MM-dd HH:mm:ss" 格式，需要将 "-" 替换为 "/"
  const formatTime = (time: string) => {
    if (!time) return time;
    return time.replace(/-/g, '/');
  };

  let _targetTime = new Date(formatTime(targetTime)).getTime();
  let _currTime = currTime
    ? new Date(formatTime(currTime)).getTime()
    : new Date().getTime();
  // 如果时间超时，则跳转到有答案页面
  if (_targetTime <= _currTime) {
    return true;
  }
  return false;
};

// 手动拼接查询字符串
// { id: 1, test: 2} => id=1&test=2
export const queryString = (params: Record<string, any>) =>
  Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

/**
 * 根据下标获取二维数组的数据项
 * @param {Object} data 数组存放在数据Map
 * @param {Object} index 下标，用于取二维数组的数据项
 */
export const getDataBy2D = (data: any[], index: number) => {
  if (data?.length <= 0) return [];
  // 避免传入的index超出数组长度，随机一个范围内的下标
  const max = data.length - 1;
  index = index <= max ? index : Math.floor(Math.random() * (max - 0 + 1)) + 0;
  const list = data?.[index]?.questionVoList || [];
  list.forEach((o: { key: any }, i: any) => (o.key = i));
  return list;
};

/**
 * 获取两个数值之前的随机数
 * @param _min 最小值
 * @param _max 最大值
 * @returns
 */
export const getRandomIntInclusive = (_min: number, _max: number) => {
  if (_min == _max) return _min;
  const min = Math.ceil(Math.min(_min, _max));
  const max = Math.floor(Math.max(_min, _max));
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 生成 [min, max] 之间的随机整数
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
