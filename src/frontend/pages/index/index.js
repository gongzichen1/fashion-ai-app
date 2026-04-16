// pages/index/index.js - 首页
const app = getApp();

Page({
  data: {
    bannerList: [
      { id: 1, image: '/images/banner1.png', title: 'AI智能搭配' },
      { id: 2, image: '/images/banner2.png', title: '一键拍照推荐' },
      { id: 3, image: '/images/banner3.png', title: '个性化推荐' }
    ],
    features: [
      { icon: '/images/icon-camera.png', title: '拍照识别', desc: '拍照即可获得搭配建议' },
      { icon: '/images/icon-ai.png', title: 'AI分析', desc: '智能分析服装特征' },
      { icon: '/images/icon-match.png', title: '搭配推荐', desc: '专业穿搭方案推荐' },
      { icon: '/images/icon-shop.png', title: '商品链接', desc: '一键购买推荐商品' }
    ],
    hotStyles: [
      { id: 1, name: '优雅通勤风', image: '/images/style-1.png', count: '2.3万人使用' },
      { id: 2, name: '甜美约会风', image: '/images/style-2.png', count: '1.8万人使用' },
      { id: 3, name: '休闲日常风', image: '/images/style-3.png', count: '1.5万人使用' }
    ],
    recentHistory: []
  },

  onLoad() {
    this.loadRecentHistory();
  },

  onShow() {
    this.loadRecentHistory();
  },

  loadRecentHistory() {
    const history = app.globalData.uploadHistory.slice(0, 3);
    this.setData({ recentHistory: history });
  },

  // 跳转到拍照页
  goToCamera() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
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
    const style = this.data.hotStyles.find(s => s.id === id);
    
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
