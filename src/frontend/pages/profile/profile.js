// pages/profile/profile.js - 个人中心页
const app = getApp();
const { formatRelativeTime } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    historyList: [],
    collectList: [],
    wardrobeList: [],
    currentTab: 'history', // history | collect | wardrobe
    menuList: [
      { icon: '/images/icon-style.png', title: '风格偏好', desc: '设置喜欢的穿搭风格', path: '/pages/preference/preference', badge: '已设置' },
      { icon: '/images/icon-body.png', title: '体型档案', desc: '完善身材数据获取更精准推荐', path: '/pages/bodyinfo/bodyinfo' },
      { icon: '/images/icon-feedback.png', title: '反馈建议', desc: '帮助我们做得更好', path: '/pages/feedback/feedback' },
      { icon: '/images/icon-about.png', title: '关于智搭', desc: '版本与服务说明', path: '/pages/about/about' }
    ]
  },

  onLoad() {
    this.checkUserInfo();
    this.loadHistory();
  },

  onShow() {
    this.setTabBarSelected();
    this.loadHistory();
  },

  setTabBarSelected() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
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
    const historyList = (app.globalData.uploadHistory || []).map(item => ({
      ...item,
      image: this.normalizeImageUrl(item.image),
      displayTime: this.formatDisplayTime(item.timestamp)
    }));
    const collectList = (app.globalData.collectList || []).map(item => ({
      ...item,
      image: this.normalizeImageUrl(item.image || item.result?.image),
      garmentType: item.garmentType || item.result?.garmentType || '收藏搭配',
      displayTime: this.formatDisplayTime(item.timestamp)
    }));
    const wardrobeList = this.buildWardrobeList(historyList);

    this.setData({
      historyList,
      collectList,
      wardrobeList
    });
  },

  formatDisplayTime(timestamp) {
    if (!timestamp) {
      return '';
    }
    return typeof timestamp === 'number' ? formatRelativeTime(timestamp) : timestamp;
  },

  normalizeImageUrl(url) {
    if (!url || /^https?:\/\//.test(url) || url.startsWith('wxfile://')) {
      return url;
    }

    if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
      return `${app.globalData.apiBaseUrl.replace(/\/api$/, '')}${url}`;
    }

    return url;
  },

  buildWardrobeList(historyList) {
    return historyList.flatMap(history => {
      const mainItem = {
        id: `${history.id}_main`,
        resultId: history.id,
        name: history.garmentType || '识别单品',
        type: history.category || '已分析服装',
        image: history.image,
        displayTime: history.displayTime
      };
      const recommendItems = (history.recommendations || []).map((item, index) => ({
        id: `${history.id}_rec_${item.id || index}`,
        resultId: history.id,
        name: item.name || item.type || '推荐单品',
        type: item.type || '搭配单品',
        image: this.normalizeImageUrl(item.image) || history.image,
        displayTime: history.displayTime
      }));

      return [mainItem, ...recommendItems];
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

  switchToStat(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  // 查看历史详情
  viewHistory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    });
  },

  viewCollect(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    });
  },

  viewWardrobeItem(e) {
    const { resultId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/result/result?id=${resultId}`
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
    } else {
      wx.showToast({
        title: '暂不可用',
        icon: 'none'
      });
    }
  },

  goToCamera() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.uploadHistory = [];
          app.globalData.collectList = [];
          app.globalData.userInfo = null;
          wx.showToast({
            title: '清除成功',
            icon: 'success'
          });
          this.setData({
            historyList: [],
            collectList: [],
            wardrobeList: [],
            hasUserInfo: false,
            userInfo: null
          });
        }
      }
    });
  }
});
