// pages/profile/profile.js - 个人中心页
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    historyList: [],
    collectList: [],
    currentTab: 'history', // history | collect
    menuList: [
      { icon: '/images/icon-style.png', title: '我的风格偏好', desc: '设置喜欢的穿搭风格', path: '/pages/preference/preference' },
      { icon: '/images/icon-body.png', title: '身材信息', desc: '完善身材数据获取更精准推荐', path: '/pages/bodyinfo/bodyinfo' },
      { icon: '/images/icon-feedback.png', title: '意见反馈', desc: '帮助我们做得更好', path: '/pages/feedback/feedback' },
      { icon: '/images/icon-about.png', title: '关于我们', desc: '了解更多', path: '/pages/about/about' }
    ]
  },

  onLoad() {
    this.checkUserInfo();
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  checkUserInfo() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    }
  },

  loadHistory() {
    this.setData({
      historyList: app.globalData.uploadHistory || []
    });
  },

  // 获取用户信息
  getUserProfile() {
    app.getUserProfile()
      .then(userInfo => {
        this.setData({
          userInfo,
          hasUserInfo: true
        });
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
      });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 查看历史详情
  viewHistory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    });
  },

  // 删除历史记录
  deleteHistory(e) {
    const { id, index } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const historyList = this.data.historyList.filter((item, i) => i !== index);
          this.setData({ historyList });
          app.globalData.uploadHistory = historyList;
          wx.setStorageSync('uploadHistory', historyList);
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ historyList: [] });
          app.globalData.uploadHistory = [];
          wx.setStorageSync('uploadHistory', []);
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 菜单点击
  onMenuTap(e) {
    const { path } = e.currentTarget.dataset;
    if (path) {
      wx.navigateTo({ url: path });
    }
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '清除成功',
            icon: 'success'
          });
          this.setData({
            historyList: [],
            collectList: []
          });
        }
      }
    });
  }
});
