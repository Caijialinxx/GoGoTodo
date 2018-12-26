let app = getApp()

Page({
  data: {
    notShowSuccess: undefined,
    notShowOverdue: undefined  
  },
  onLoad: function () {
    this.setData({
      ...app.globalData.options
    })
  },
  switchSuccess: function ({ detail: { value } }) {
    this.setData({
      notShowSuccess: value
    })
    app.globalData.options.notShowSuccess = value
  },
  switchOverdue: function ({ detail: { value } }) {
    this.setData({
      notShowOverdue: value
    })
    app.globalData.options.notShowOverdue = value
  }
})