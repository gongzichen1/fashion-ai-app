// utils/util.js - 工具函数

/**
 * 格式化时间
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hour)}:${padZero(minute)}`;
};

/**
 * 补零
 */
const padZero = (num) => {
  return num < 10 ? `0${num}` : num;
};

/**
 * 格式化相对时间
 */
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return formatTime(timestamp);
  }
};

/**
 * 颜色名称映射
 */
const colorNameMap = {
  '#FF0000': '红色',
  '#FF6B6B': '珊瑚红',
  '#FF6B9D': '粉红色',
  '#FFB6C1': '浅粉色',
  '#FFA500': '橙色',
  '#FFFF00': '黄色',
  '#FFD700': '金色',
  '#00FF00': '绿色',
  '#90EE90': '浅绿色',
  '#008000': '深绿色',
  '#00FFFF': '青色',
  '#0000FF': '蓝色',
  '#4169E1': '皇家蓝',
  '#87CEEB': '天蓝色',
  '#800080': '紫色',
  '#EE82EE': '紫罗兰',
  '#FFFFFF': '白色',
  '#000000': '黑色',
  '#808080': '灰色',
  '#C0C0C0': '银色',
  '#8B4513': '棕色',
  '#F5DEB3': '米色',
  '#FFE4C4': '杏色',
  '#FFC0CB': '桃粉色'
};

/**
 * 获取颜色名称
 */
const getColorName = (hexColor) => {
  return colorNameMap[hexColor.toUpperCase()] || '未知颜色';
};

/**
 * 风格名称映射
 */
const styleNameMap = {
  'casual': '休闲风',
  'formal': '正式风',
  'elegant': '优雅风',
  'sporty': '运动风',
  'sweet': '甜美风',
  'cool': '酷帅风',
  'vintage': '复古风',
  'minimalist': '极简风',
  'bohemian': '波西米亚风',
  'streetwear': '街头风'
};

/**
 * 获取风格名称
 */
const getStyleName = (style) => {
  return styleNameMap[style] || style;
};

/**
 * 场景名称映射
 */
const sceneNameMap = {
  'date': '约会',
  'office': '通勤',
  'party': '聚会',
  'casual': '休闲',
  'travel': '旅行',
  'wedding': '婚礼',
  'interview': '面试',
  'meeting': '会议'
};

/**
 * 获取场景名称
 */
const getSceneName = (scene) => {
  return sceneNameMap[scene] || scene;
};

module.exports = {
  formatTime,
  formatRelativeTime,
  padZero,
  getColorName,
  getStyleName,
  getSceneName,
  colorNameMap,
  styleNameMap,
  sceneNameMap
};
