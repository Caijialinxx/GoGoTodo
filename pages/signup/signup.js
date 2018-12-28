import { signUp } from '../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    focusSettings: {
      email: true,
      nickname: false,
      password: false,
      password_confirm: false
    },
    values: {
      email: '',
      nickname: '',
      password: '',
      password_confirm: ''
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
  changeData: function ({ currentTarget: { id }, detail: { value } }) {
    let valuesCopy = JSON.parse(JSON.stringify(this.data.values))
    valuesCopy[id] = value
    this.setData({ values: valuesCopy })
  },
  verifyInfo: function({
    detail: { value: { email, nickname, password, password_confirm } }
  }) {
    let index_at = email.indexOf('@'),
      index_point = email.indexOf('.'),
      length_strAfterPoint = email.substr(index_point + 1).length

    if (email.indexOf(' ') > -1 || email === '') {
      wx.showModal({
        title: '邮箱不能为空或含有空格！',
        showCancel: false,
      })
    } else if (nickname.indexOf(' ') > -1 || nickname === '') {
      wx.showModal({
        title: '昵称不能为空或含有空格！',
        showCancel: false,
      })
    } else if (index_at < 1 || index_point < index_at + 2 || length_strAfterPoint < 2) {
      wx.showModal({
        title: '邮箱格式错误！',
        showCancel: false,
      })
    } else if (password.indexOf(' ') > -1 || password === '') {
      wx.showModal({
        title: '密码不能为空或含有空格！',
        showCancel: false,
        success: () => {
          this.setData({
            password: '',
            password_confirm: ''
          })
          console.log(this.data)
        }
      })
    } else if (password !== password_confirm) {
      wx.showModal({
        title: '两次输入的密码不一致！',
        showCancel: false,
        success: () => {
          this.setData({
            password: '',
            password_confirm: ''
          })
        }
      })
    } else {
      signUp(email, nickname, password, (user) => {
        wx.showModal({
          title: '验证邮件已发送',
          content: `已向你的邮箱【${email.trim()}】发送验证邮件，请转至邮箱查收并进行验证！`,
          showCancel: false,
          success: () => {
            wx.navigateBack({
              delta: 1
            })
          }
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  }
})