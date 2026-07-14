Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页'
      },
      {
        pagePath: '/pages/camera/camera',
        text: '拍照'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const { path } = e.currentTarget.dataset;
      if (!path) {
        return;
      }
      wx.switchTab({ url: path });
    }
  }
});
