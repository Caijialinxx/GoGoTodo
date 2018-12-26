import { logOut } from '../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    userInfo: null,
    storageSize: undefined
  },
  onShow: function() {
    this.setData({
      userInfo: app.globalData.userInfo,
    })
    wx.getStorageInfo({
      success: (res) => {
        this.setData({
          storageSize: res.currentSize
        })
      }
    })
  },
  clearStorage: function() {
    wx.showModal({
      title: '清理缓存',
      content: '这将会清除本地缓存，其中包含您的登录状态，意味着下次重启小程序时需要重新登录。是否继续？',
      confirmText: '继续',
      confirmColor: '#ff0000',
      success: ({ confirm }) => {
        if (confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清理成功',
              })
            }
          })
        }
      }
    })
  },
  logout: function() {
    this.setData({
      userInfo: logOut()
    })
    app.clearData()
  }
})