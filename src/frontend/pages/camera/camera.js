// pages/camera/camera.js - 拍照页
const app = getApp();

Page({
  data: {
    devicePosition: 'back', // 摄像头方向
    flash: 'off', // 闪光灯
    showGuide: true, // 显示拍摄引导
    analyzing: false, // 分析中
    previewImage: null, // 预览图片
    tempImagePath: null // 临时图片路径
  },

  onLoad() {
    this.checkCameraAuth();
  },

  onShow() {
    // 检查是否有选择的风格
    if (app.globalData.selectedStyle) {
      this.setData({
        selectedStyle: app.globalData.selectedStyle
      });
      wx.showToast({
        title: `已选择风格: ${app.globalData.selectedStyle.name}`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 检查相机权限
  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          wx.authorize({
            scope: 'scope.camera',
            fail: () => {
              wx.showModal({
                title: '需要相机权限',
                content: '请在设置中开启相机权限',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        }
      }
    });
  },

  // 切换摄像头
  switchCamera() {
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    });
  },

  // 切换闪光灯
  toggleFlash() {
    const flashModes = ['off', 'on', 'auto'];
    const currentIndex = flashModes.indexOf(this.data.flash);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    this.setData({
      flash: flashModes[nextIndex]
    });
    wx.showToast({
      title: `闪光灯: ${flashModes[nextIndex]}`,
      icon: 'none'
    });
  },

  // 拍照
  takePhoto() {
    const ctx = wx.createCameraContext();

    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          previewImage: res.tempImagePath,
          tempImagePath: res.tempImagePath,
          showGuide: false
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          previewImage: tempFilePath,
          tempImagePath: tempFilePath,
          showGuide: false
        });
      }
    });
  },

  // 重新拍摄
  retake() {
    this.setData({
      previewImage: null,
      tempImagePath: null,
      showGuide: true
    });
  },

  // 确认并分析
  async confirmAndAnalyze() {
    if (!this.data.tempImagePath) {
      wx.showToast({
        title: '请先拍摄或选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ analyzing: true });

    try {
      // 上传图片到服务器进行分析
      const result = await this.uploadAndAnalyze(this.data.tempImagePath);

      // 保存到历史记录
      const historyItem = {
        id: result.id || Date.now().toString(),
        image: this.data.tempImagePath,
        garmentType: result.garmentType,
        timestamp: Date.now()
      };
      app.saveHistory(historyItem);

      // 跳转到结果页
      wx.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(result))}`
      });
    } catch (error) {
      console.error('分析失败:', error);
      wx.showToast({
        title: '分析失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ analyzing: false });
    }
  },

  // 上传并分析图片
  uploadAndAnalyze(imagePath) {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: 'AI分析中...' });

      const formData = {};
      // 如果有选择的风格，添加到请求中
      if (app.globalData.selectedStyle) {
        formData.style_preference = JSON.stringify(app.globalData.selectedStyle.preference);
      }

      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/analyze`,
        filePath: imagePath,
        name: 'image',
        formData: formData,
        success: (res) => {
          wx.hideLoading();
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '分析失败'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: (err) => {
          wx.hideLoading();
          reject(err);
        }
      });
    });
  },

  // 错误处理
  onError(e) {
    console.error('相机错误:', e.detail);
    wx.showToast({
      title: '相机启动失败',
      icon: 'none'
    });
  }
});
