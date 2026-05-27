Page({
  data: {
    content: '',
    contact: ''
  },

  onInput(e) {
    this.setData({
      [e.currentTarget.dataset.field]: e.detail.value
    });
  },

  submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none'
      });
      return;
    }

    const feedbackList = wx.getStorageSync('feedbackList') || [];
    feedbackList.unshift({
      id: Date.now().toString(),
      content: this.data.content.trim(),
      contact: this.data.contact.trim(),
      createdAt: Date.now()
    });
    wx.setStorageSync('feedbackList', feedbackList);
    this.setData({ content: '', contact: '' });
    wx.showToast({
      title: '已提交',
      icon: 'success'
    });
  }
});
