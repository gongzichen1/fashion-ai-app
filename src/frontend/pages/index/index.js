// pages/index/index.js - 首页
const app = getApp();
const apiHost = app.globalData.apiBaseUrl.replace(/\/api$/, '');

Page({
  data: {
    bannerList: [
      { id: 1, image: '/images/banner1.png', title: 'AI智能搭配' },
      { id: 2, image: '/images/banner2.png', title: '一键拍照推荐' },
      { id: 3, image: '/images/banner3.png', title: '个性化推荐' }
    ],
    features: [
      { icon: '/images/icon-camera.png', title: '拍照识别', desc: '拍照即可获得搭配建议', action: 'camera' },
      { icon: '/images/icon-ai.png', title: 'AI分析', desc: '智能分析服装特征', action: 'camera' },
      { icon: '/images/icon-match.png', title: '搭配推荐', desc: '查看历史搭配方案', action: 'profile' },
      { icon: '/images/icon-shop.png', title: '天气穿搭', desc: '根据天气给出建议', action: 'weather' }
    ],
    hotStyles: [
      { id: 1, name: '优雅通勤风', image: `${apiHost}/static/images/style-1.png`, count: '2.3万人使用' },
      { id: 2, name: '甜美约会风', image: `${apiHost}/static/images/style-2.png`, count: '1.8万人使用' },
      { id: 3, name: '休闲日常风', image: `${apiHost}/static/images/style-3.png`, count: '1.5万人使用' }
    ],
    recentHistory: [],
    weather: null,
    weatherLoading: false,
    weatherError: ''
  },

  onLoad() {
    this.loadRecentHistory();
  },

  onShow() {
    this.loadRecentHistory();
  },

  loadRecentHistory() {
    const history = app.globalData.uploadHistory.slice(0, 3).map(item => ({
      ...item,
      image: this.normalizeImageUrl(item.image)
    }));
    this.setData({ recentHistory: history });
  },

  normalizeImageUrl(url) {
    if (!url || /^https?:\/\//.test(url) || url.startsWith('wxfile://')) {
      return url;
    }

    if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
      return `${apiHost}${url}`;
    }

    return url;
  },

  // 获取当前位置天气
  loadWeather() {
    if (this.data.weatherLoading) {
      return;
    }

    this.setData({
      weatherLoading: true,
      weatherError: ''
    });

    wx.getLocation({
      type: 'wgs84',
      success: (location) => {
        wx.request({
          url: `${app.globalData.apiBaseUrl}/weather`,
          method: 'GET',
          data: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          success: (res) => {
            if (res.data && res.data.success) {
              this.setData({
                weather: res.data.data,
                weatherError: ''
              });
            } else {
              this.setData({
                weatherError: res.data?.message || '天气获取失败'
              });
            }
          },
          fail: () => {
            this.setData({
              weatherError: '天气服务暂不可用'
            });
          },
          complete: () => {
            this.setData({ weatherLoading: false });
          }
        });
      },
      fail: () => {
        this.setData({
          weatherLoading: false,
          weatherError: '请允许定位后获取天气'
        });
        wx.showToast({
          title: '请允许定位后获取天气',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到拍照页
  goToCamera() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  },

  onFeatureTap(e) {
    const { action } = e.currentTarget.dataset;
    if (action === 'camera') {
      this.goToCamera();
    } else if (action === 'profile') {
      this.goToProfile();
    } else if (action === 'weather') {
      this.loadWeather();
    }
  },

  // 跳转到结果页
  goToResult(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    });
  },

  // 跳转到风格详情
  goToStyleDetail(e) {
    const { id } = e.currentTarget.dataset;
    const style = this.data.hotStyles.find(s => String(s.id) === String(id));
    
    if (style) {
      // 将选择的风格保存到全局数据
      app.globalData.selectedStyle = {
        id: style.id,
        name: style.name,
        preference: this.getStylePreference(style.name)
      };
      
      // 跳转到拍照页面
      wx.switchTab({
        url: '/pages/camera/camera'
      });
    }
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  // 根据风格名称获取偏好设置
  getStylePreference(styleName) {
    const preferences = {
      '优雅通勤风': {
        preferred_styles: ['优雅', '简约', '职业'],
        common_scenes: ['通勤', '会议', '商务'],
        budget: '中等'
      },
      '甜美约会风': {
        preferred_styles: ['甜美', '可爱', '浪漫'],
        common_scenes: ['约会', '聚会', '周末'],
        budget: '中等'
      },
      '休闲日常风': {
        preferred_styles: ['休闲', '舒适', '自然'],
        common_scenes: ['日常', '购物', '运动'],
        budget: '实惠'
      }
    };
    
    return preferences[styleName] || {};
  }
});
