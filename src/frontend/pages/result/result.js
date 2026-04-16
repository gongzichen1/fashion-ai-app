// pages/result/result.js - 搭配推荐结果页
const app = getApp();

Page({
  data: {
    analysisResult: null,
    recommendations: [],
    selectedScene: 'all', // 当前选中的场景
    scenes: [
      { key: 'all', name: '全部' },
      { key: 'date', name: '约会' },
      { key: 'office', name: '通勤' },
      { key: 'party', name: '聚会' },
      { key: 'casual', name: '休闲' }
    ],
    loading: true,
    collectStatus: false
  },

  onLoad(options) {
    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          analysisResult: result,
          recommendations: result.recommendations || [],
          loading: false
        });
      } catch (e) {
        console.error('解析数据失败:', e);
        this.loadFromServer(options.id);
      }
    } else if (options.id) {
      this.loadFromServer(options.id);
    } else {
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 从服务器加载数据
  loadFromServer(id) {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/result/${id}`,
      success: (res) => {
        if (res.data.success) {
          this.setData({
            analysisResult: res.data.data,
            recommendations: res.data.data.recommendations || [],
            loading: false
          });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 切换场景
  switchScene(e) {
    const scene = e.currentTarget.dataset.scene;
    this.setData({ selectedScene: scene });

    // 根据场景筛选推荐
    if (scene === 'all') {
      this.setData({
        recommendations: this.data.analysisResult.recommendations || []
      });
    } else {
      const filtered = (this.data.analysisResult.recommendations || []).filter(
        item => item.scenes && item.scenes.includes(scene)
      );
      this.setData({ recommendations: filtered });
    }
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  // 收藏搭配
  toggleCollect() {
    this.setData({
      collectStatus: !this.data.collectStatus
    });

    wx.showToast({
      title: this.data.collectStatus ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  // 复制链接
  copyLink(e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  // 跳转到商品详情
  goToProduct(e) {
    const { url, platform } = e.currentTarget.dataset;
    if (platform === 'taobao') {
      wx.navigateToMiniProgram({
        appId: '淘宝小程序appId',
        path: url
      });
    } else {
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({
            title: '链接已复制，请在浏览器打开',
            icon: 'none'
          });
        }
      });
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '来看看我的AI穿搭推荐',
      path: '/pages/index/index',
      imageUrl: this.data.analysisResult?.image
    };
  },

  // 保存图片
  saveImage() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum'
          });
        }
        this.saveToAlbum();
      }
    });
  },

  saveToAlbum() {
    // 生成分享图片并保存
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 重新拍摄
  retake() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  }
});
