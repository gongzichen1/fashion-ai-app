// pages/result/result.js - 搭配推荐结果页
const app = getApp();

Page({
  data: {
    analysisResult: null,
    recommendations: [],
    selectedScene: 'all', // 当前选中的场景
    scenes: [
      { key: 'all', name: '全部', aliases: [] },
      { key: 'date', name: '约会', aliases: ['date', '约会'] },
      { key: 'office', name: '通勤', aliases: ['office', '通勤', '商务', '会议'] },
      { key: 'party', name: '聚会', aliases: ['party', '聚会'] },
      { key: 'casual', name: '休闲', aliases: ['casual', '休闲', '日常'] }
    ],
    loading: true,
    collectStatus: false
  },

  onLoad(options) {
    if (options.data) {
      try {
        const result = this.normalizeResult(JSON.parse(decodeURIComponent(options.data)));
        this.setData({
          analysisResult: result,
          recommendations: result.recommendations || [],
          loading: false,
          collectStatus: this.isCollected(result.id)
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
  async loadFromServer(id) {
    const localResult = app.findHistoryById(id);
    if (localResult) {
      const result = this.normalizeResult(localResult);
      this.setData({
        analysisResult: result,
        recommendations: result.recommendations || [],
        loading: false,
        collectStatus: this.isCollected(result.id)
      });
      return;
    }

    try {
      await app.ensureBackendLogin();
    } catch (error) {
      console.error('服务端登录失败:', error);
      this.showLoadFailed();
      return;
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/result/${id}`,
      header: app.requestHeaders(),
      success: (res) => {
        if (res.data.success) {
          const result = this.normalizeResult(res.data.data);
          this.setData({
            analysisResult: result,
            recommendations: result.recommendations || [],
            loading: false,
            collectStatus: this.isCollected(result.id)
          });
        } else {
          this.showLoadFailed();
        }
      },
      fail: () => {
        this.showLoadFailed();
      }
    });
  },

  normalizeResult(result) {
    const recommendations = (result.recommendations || []).map(item => ({
      ...item,
      image: this.normalizeImageUrl(item.image)
    }));
    const scenesText = Array.isArray(result.scenes) && result.scenes.length
      ? result.scenes.join(' / ')
      : (result.scenesText || '日常 / 通勤');

    return {
      ...result,
      image: this.normalizeImageUrl(result.image),
      serverImage: this.normalizeImageUrl(result.serverImage),
      displayColor: result.primaryColor || '#E8DDD0',
      scenesText,
      recommendations
    };
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

  showLoadFailed() {
    this.setData({ loading: false });
    wx.showToast({
      title: '加载失败',
      icon: 'none'
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
      const selected = this.data.scenes.find(item => item.key === scene);
      const aliases = selected ? selected.aliases : [scene];
      const filtered = (this.data.analysisResult.recommendations || []).filter(
        item => item.scenes && item.scenes.some(itemScene => aliases.includes(itemScene))
      );
      this.setData({ recommendations: filtered });
    }
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      return;
    }
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  // 收藏搭配
  toggleCollect() {
    const result = this.data.analysisResult;
    if (!result) {
      return;
    }

    const collected = app.saveCollect({
      id: result.id,
      image: result.image,
      garmentType: result.garmentType,
      timestamp: result.timestamp || Date.now(),
      result
    });

    this.setData({
      collectStatus: collected
    });

    wx.showToast({
      title: collected ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  isCollected(id) {
    return app.globalData.collectList.some(item => String(item.id) === String(id));
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
    const { url } = e.currentTarget.dataset;
    if (!url) {
      wx.showToast({
        title: '暂无商品链接',
        icon: 'none'
      });
      return;
    }

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
        if (res.authSetting['scope.writePhotosAlbum']) {
          this.saveToAlbum();
          return;
        }

        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许保存图片到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
          return;
        }

        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            this.saveToAlbum();
          },
          fail: () => {
            wx.showToast({
              title: '未获得相册权限',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  saveToAlbum() {
    const imageUrl = this.data.analysisResult?.image;
    if (!imageUrl) {
      wx.showToast({
        title: '暂无可保存图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    wx.getImageInfo({
      src: imageUrl,
      success: (info) => {
        wx.saveImageToPhotosAlbum({
          filePath: info.path,
          success: () => {
            wx.showToast({
              title: '已保存',
              icon: 'success'
            });
          },
          fail: () => {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '图片读取失败',
          icon: 'none'
        });
      }
    });
  },

  // 重新拍摄
  retake() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
