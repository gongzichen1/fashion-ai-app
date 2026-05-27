const app = getApp();

Page({
  data: {
    styleOptions: [],
    sceneOptions: [],
    budgets: ['实惠', '中等', '高端'],
    selectedStyles: [],
    selectedScenes: [],
    budget: '中等'
  },

  onLoad() {
    const preference = wx.getStorageSync('stylePreference');
    const selectedStyles = preference ? preference.preferred_styles || [] : [];
    const selectedScenes = preference ? preference.common_scenes || [] : [];
    if (preference) {
      this.setData({
        selectedStyles,
        selectedScenes,
        budget: preference.budget || '中等'
      });
    }
    this.refreshOptions(selectedStyles, selectedScenes);
  },

  toggleStyle(e) {
    const selectedStyles = this.toggleItem(this.data.selectedStyles, e.currentTarget.dataset.value);
    this.setData({ selectedStyles });
    this.refreshOptions(selectedStyles, this.data.selectedScenes);
  },

  toggleScene(e) {
    const selectedScenes = this.toggleItem(this.data.selectedScenes, e.currentTarget.dataset.value);
    this.setData({ selectedScenes });
    this.refreshOptions(this.data.selectedStyles, selectedScenes);
  },

  toggleItem(source, value) {
    const list = [...source];
    const index = list.indexOf(value);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
    return list;
  },

  refreshOptions(selectedStyles, selectedScenes) {
    const styles = ['优雅', '简约', '甜美', '休闲', '通勤', '复古', '运动', '街头'];
    const scenes = ['日常', '通勤', '约会', '聚会', '运动', '旅行'];
    this.setData({
      styleOptions: styles.map(name => ({ name, selected: selectedStyles.includes(name) })),
      sceneOptions: scenes.map(name => ({ name, selected: selectedScenes.includes(name) }))
    });
  },

  chooseBudget(e) {
    this.setData({ budget: e.currentTarget.dataset.value });
  },

  savePreference() {
    const preference = {
      preferred_styles: this.data.selectedStyles,
      common_scenes: this.data.selectedScenes,
      budget: this.data.budget
    };
    app.globalData.selectedStyle = {
      id: 'custom',
      name: '我的偏好',
      preference
    };
    wx.setStorageSync('stylePreference', preference);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  }
});
