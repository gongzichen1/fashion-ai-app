// app.js - 小程序入口文件
App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:5001/api', // 后端API地址，上线时改为正式域名
    uploadHistory: []
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
    // 获取本地存储的历史记录
    this.loadHistory();
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

  saveHistory(item) {
    this.globalData.uploadHistory.unshift(item);
    // 最多保存50条记录
    if (this.globalData.uploadHistory.length > 50) {
      this.globalData.uploadHistory = this.globalData.uploadHistory.slice(0, 50);
    }
    wx.setStorageSync('uploadHistory', this.globalData.uploadHistory);
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
