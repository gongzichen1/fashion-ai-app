// utils/api.js - API请求封装
const app = getApp();

/**
 * 封装请求方法
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        } else {
          reject(new Error(`请求错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 上传图片
 */
const uploadImage = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${app.globalData.apiBaseUrl}/analyze`,
      filePath: filePath,
      name: 'image',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } catch (e) {
          reject(e);
        }
      },
      fail: reject
    });
  });
};

/**
 * 获取搭配推荐
 */
const getRecommendations = (garmentId, scene = 'all') => {
  return request({
    url: '/recommend',
    method: 'POST',
    data: { garmentId, scene }
  });
};

/**
 * 获取历史记录
 */
const getHistory = (page = 1, pageSize = 10) => {
  return request({
    url: '/history',
    data: { page, pageSize }
  });
};

module.exports = {
  request,
  uploadImage,
  getRecommendations,
  getHistory
};
