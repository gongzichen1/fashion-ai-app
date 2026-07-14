// app.js - 小程序入口文件
const { API_BASE_URL } = require('./config/index');

App({
  globalData: {
    userInfo: null,
    apiBaseUrl: API_BASE_URL,
    uploadHistory: [],
    collectList: [],
    backendUser: null,
    sessionCookie: '',
    authReady: null
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
    // 获取本地存储的历史记录
    this.loadHistory();
    this.loadCollects();
    this.globalData.sessionCookie = wx.getStorageSync('backendSessionCookie') || '';
    this.ensureBackendLogin().catch((error) => {
      console.warn('后端会话初始化失败，将在使用核心功能时重试:', error);
    });
  },

  loginBackend() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginResult) => {
          if (!loginResult.code) {
            reject(new Error('微信登录未返回授权码'));
            return;
          }
          wx.request({
            url: `${this.globalData.apiBaseUrl}/auth/wechat/login`,
            method: 'POST',
            data: { code: loginResult.code },
            header: { 'Content-Type': 'application/json' },
            success: (res) => {
              if (res.statusCode !== 200 || !res.data || !res.data.success) {
                reject(new Error((res.data && res.data.message) || '服务端登录失败'));
                return;
              }
              const sessionCookie = this.extractSessionCookie(res);
              if (!sessionCookie) {
                reject(new Error('服务端未返回会话 Cookie'));
                return;
              }
              this.globalData.sessionCookie = sessionCookie;
              this.globalData.backendUser = res.data.data;
              wx.setStorageSync('backendSessionCookie', sessionCookie);
              resolve(res.data.data);
            },
            fail: reject
          });
        },
        fail: reject
      });
    });
  },

  extractSessionCookie(response) {
    const responseCookies = Array.isArray(response.cookies) ? response.cookies : [];
    const headers = response.header || {};
    const setCookie = headers['Set-Cookie'] || headers['set-cookie'];
    const rawCookies = responseCookies.length
      ? responseCookies
      : (Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []));
    return rawCookies.map(cookie => String(cookie).split(';')[0]).filter(Boolean).join('; ');
  },

  ensureBackendLogin() {
    if (this.globalData.authReady) {
      return this.globalData.authReady;
    }
    this.globalData.authReady = this.loginBackend().catch((error) => {
      this.globalData.authReady = null;
      throw error;
    });
    return this.globalData.authReady;
  },

  requestHeaders(extra = {}) {
    return {
      ...extra,
      Cookie: this.globalData.sessionCookie
    };
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
