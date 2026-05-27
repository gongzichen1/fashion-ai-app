// app.js - 小程序入口文件
const { API_BASE_URL } = require('./config/index');

App({
  globalData: {
    userInfo: null,
    apiBaseUrl: API_BASE_URL,
    uploadHistory: [],
    collectList: []
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
    // 获取本地存储的历史记录
    this.loadHistory();
    this.loadCollects();
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  loadHistory() {
    const history = wx.getStorageSync('uploadHistory');
    if (history) {
      this.globalData.uploadHistory = history;
    }
  },

  loadCollects() {
    const collects = wx.getStorageSync('collectList');
    if (collects) {
      this.globalData.collectList = collects;
    }
  },

  saveHistory(item) {
    const index = this.globalData.uploadHistory.findIndex(history => history.id === item.id);
    if (index >= 0) {
      this.globalData.uploadHistory.splice(index, 1);
    }

    this.globalData.uploadHistory.unshift(item);
    // 最多保存50条记录
    if (this.globalData.uploadHistory.length > 50) {
      this.globalData.uploadHistory = this.globalData.uploadHistory.slice(0, 50);
    }
    wx.setStorageSync('uploadHistory', this.globalData.uploadHistory);
  },

  findHistoryById(id) {
    return this.globalData.uploadHistory.find(item => String(item.id) === String(id));
  },

  saveCollect(item) {
    const index = this.globalData.collectList.findIndex(collect => collect.id === item.id);
    if (index >= 0) {
      this.globalData.collectList.splice(index, 1);
    } else {
      this.globalData.collectList.unshift(item);
    }
    wx.setStorageSync('collectList', this.globalData.collectList);
    return index < 0;
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo;
          wx.setStorageSync('userInfo', res.userInfo);
          resolve(res.userInfo);
        },
        fail: reject
      });
    });
  }
});
