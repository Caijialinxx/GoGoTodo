const app = getApp()
import { logIn, reset, UserModel } from '../../utils/leancloud.js'

Page({
  data: {
    focusSettings: {
      email: true,
      password: false
    },
    values: {
      email: '',
      password: ''
    }
  },
  onShow: function () {
    if (app.globalData.userInfo) {
      this.setData({ email: app.globalData.userInfo.email })
    }
  },
  toNext: function ({ currentTarget: { dataset: { nextinput } } }) {
    let focusSettingsCopy = JSON.parse(JSON.stringify(this.data.focusSettings))
    for (let key in focusSettingsCopy) {
      focusSettingsCopy[key] = key === nextinput ? true : false
    }
    this.setData({ focusSettings: focusSettingsCopy })
  },
  toSubmit: function () {
    let values = wx.createSelectorQuery().select('form')._selectorQuery._defaultComponent.data.values
    let data = { detail: { value: values } }
    this.verifyInfo(data)
  },
  loginWithWeChat: function ({ detail: { userInfo } }) {
    UserModel.loginWithWeChat(userInfo, (user) => {
      app.globalData.userInfo = user
      app.fillData()
      wx.setStorage({
        key: 'login',
        data: user,
      })
      wx.navigateBack({
        delta: 1
      })
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  changeData: function ({ currentTarget: { id }, detail: { value } }) {
    let valuesCopy = JSON.parse(JSON.stringify(this.data.values))
    valuesCopy[id] = value
    this.setData({ values: valuesCopy })
  },
  verifyInfo: function ({ detail: { value: { email, password } } }) {
    let index_at = email.indexOf('@'),
      index_point = email.indexOf('.'),
      length_strAfterPoint = email.substr(index_point + 1).length

    if (email.trim() === '') {
      wx.showModal({
        title: '邮箱不能为空',
        content: '请输入您注册的邮箱，如未注册，请先注册或使用微信快捷登录。',
        showCancel: false,
      })
    } else if (password.trim() === '') {
      wx.showModal({
        title: '密码不能为空',
        content: '',
        showCancel: false,
      })
    } else if (index_at < 1 || index_point < index_at + 2 || length_strAfterPoint < 2) {
      wx.showModal({
        title: '电子邮箱无效',
        content: '请输入正确的电子邮箱地址！',
        showCancel: false,
      })
    } else {
      logIn(email, password, (user) => {
        app.globalData.userInfo = user
        app.fillData()
        wx.navigateBack({
          delta: 1
        })
        wx.setStorage({
          key: 'login',
          data: user,
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  },
  resetPassword: function () {
    let email = this.data.values.email
    if (email) {
      wx.showModal({
        title: '重置密码',
        content: `我们将会向您的邮箱【${email}】发送重置密码的邮件，一旦设置成功，旧密码就会失效，您需要通过新密码重新登录。`,
        success: ({ confirm }) => {
          if (confirm) {
            let success = () => {
              wx.showToast({
                title: '重置密码邮件已发送，请转至邮箱查收！',
                icon: 'none'
              })
            },
              error = (error) => {
                wx.showToast({
                  title: error,
                  icon: 'none'
                })
              }
            reset(email, success, error)
          }
        }
      })
    } else {
      wx.showModal({
        title: '请输入电子邮箱地址',
        content: '请在登录页面的电子邮箱输入框中输入电子邮箱地址，然后再点击忘记密码。',
        showCancel: false
      })
    }
  }
})