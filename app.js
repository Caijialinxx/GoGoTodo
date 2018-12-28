import { getCurrentUser, TodoModel } from './utils/leancloud.js'

App({
  onLaunch: function() {
    let user = getCurrentUser()
    this.globalData.userInfo = user ? user : wx.getStorageSync('login')
    if (this.globalData.userInfo.id) {
      wx.showLoading({
        title: '加载中...',
      })
      this.fillData()
    } else {
      wx.showToast({
        title: '当前未登录！',
        icon: 'none'
      })
    }
  },
  dataBetweenPage: {},
  globalData: {
    todos: null,
    options: {
      notShowSuccess: false,
      notShowOverdue: true
    },
    userInfo: null
  },
  clearData: function () {
    this.globalData.userInfo = null
    this.globalData.todos = null
    wx.removeStorage({ key: 'login' })
  },
  fillData: function () {
    TodoModel.fetch(items => {
      this.globalData.todos = items
      wx.hideLoading()
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
})