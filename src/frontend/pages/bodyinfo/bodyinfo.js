Page({
  data: {
    height: '',
    weight: '',
    bodyType: '',
    bodyTypeOptions: []
  },

  onLoad() {
    const bodyInfo = wx.getStorageSync('bodyInfo');
    if (bodyInfo) {
      this.setData(bodyInfo);
    }
    this.refreshBodyTypes(bodyInfo ? bodyInfo.bodyType : '');
  },

  onInput(e) {
    this.setData({
      [e.currentTarget.dataset.field]: e.detail.value
    });
  },

  chooseBodyType(e) {
    const bodyType = e.currentTarget.dataset.value;
    this.setData({ bodyType });
    this.refreshBodyTypes(bodyType);
  },

  refreshBodyTypes(selectedType) {
    const bodyTypes = ['梨形', '苹果形', '沙漏形', 'H形', '倒三角'];
    this.setData({
      bodyTypeOptions: bodyTypes.map(name => ({ name, selected: name === selectedType }))
    });
  },

  saveBodyInfo() {
    const bodyInfo = {
      height: this.data.height,
      weight: this.data.weight,
      bodyType: this.data.bodyType
    };
    wx.setStorageSync('bodyInfo', bodyInfo);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  }
});
