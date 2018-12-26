import { linkWeChat, UserModel, AV } from '../../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    userInfo: null,
    linkEmailNeeded: false,
    mosaicedEmail: undefined,
    emailDraft: undefined
  },
  onLoad: function (option) {
    let userInfo = app.globalData.userInfo,
      mosaicedEmail = userInfo.email || ''
    if (mosaicedEmail) {
      mosaicedEmail = mosaicedEmail.replace(mosaicedEmail.substring(2, mosaicedEmail.indexOf('@')), '***')
    }
    if (option.avatarUrl) {
      userInfo.avatarUrl = option.avatarUrl
      new AV.File(userInfo.id, {
        blob: { uri: option.avatarUrl, },
      }).save().then(file => {
        userInfo.avatarUrl = file.url()
        UserModel.update(['avatarUrl'], userInfo, () => {
          this.setData({
            userInfo: userInfo
          })
        }, (error) => {
          wx.showToast({
            title: error,
            icon: 'none'
          })
        })
      }).catch(console.error)
    }
    this.setData({
      userInfo: userInfo,
      mosaicedEmail: mosaicedEmail
    })
  },
  changeAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.redirectTo({
          url: `./cropper/cropper?src=${res.tempFilePaths[0]}`
        })
      }
    })
  },
  changeData: function ({ currentTarget: { id }, detail: { value }}) {
    if (id === 'username') {
      let userCopy = JSON.parse(JSON.stringify(this.data.userInfo))
      userCopy.username = value
      if (userCopy.username) {
        this.setData({
          userInfo: userCopy,
        })
      }
    } else if (id === 'email') {
      this.setData({
        emailDraft: value
      })
    }
  },
  changeName: function ({ detail: { value } }) {
    let userCopy = JSON.parse(JSON.stringify(this.data.userInfo))
    if (value.trim() === '') {
      userCopy.username = '勾勾用户'
      this.setData({
        userInfo: userCopy,
      })
    }
    UserModel.update(['username'], this.data.userInfo, () => {
      app.globalData.userInfo = this.data.userInfo
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  unbindWeApp: function () {
    if (this.data.userInfo.emailVerified) {
      wx.showModal({
        title: '解绑微信',
        content: '确定要解绑微信吗？这将使你无法使用微信登录。',
        success: ({ confirm }) => {
          if (confirm) {
            let userCopy = JSON.parse(JSON.stringify(this.data.userInfo))
            userCopy.weAppLinked = false
            userCopy.weAppName = ''
            UserModel.update(['authData', 'weAppLinked', 'weAppName'], {
              ...userCopy,
              authData: null
            }, () => {
              this.setData({
                userInfo: userCopy
              })
              app.globalData.userInfo = userCopy
            }, (error) => {
              console.log(error)
            })
          }
        }
      })
    } else {
      wx.showModal({
        title: '不可解绑微信',
        content: '您当前无法解绑微信。请先关联邮箱并通过验证！',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },
  showEmailSettingWindow: function () {
    this.setData({ linkEmailNeeded: true })
  },
  cancelLinkEmail: function () {
    this.setData({ linkEmailNeeded: false })
  },
  linkEmail: function () {
    let email = this.data.emailDraft,
      index_at = email.indexOf('@'),
      index_point = email.indexOf('.'),
      length_strAfterPoint = email.substr(index_point + 1).length

    if (email.indexOf(' ') > -1 || email === '') {
      wx.showModal({
        title: '邮箱不能为空或含有空格！',
        showCancel: false,
      })
    } else if (index_at < 1 || index_point < index_at + 2 || length_strAfterPoint < 2) {
      wx.showModal({
        title: '邮箱格式错误！',
        showCancel: false,
      })
    } else {
      UserModel.linkEmail(email, () => {
        let userInfoCopy = JSON.parse(JSON.stringify(this.data.userInfo))
        userInfoCopy.emailDraft = email
        this.setData({
          userInfo: userInfoCopy,
          linkEmailNeeded: false,
          emailDraft: ''
        })
        app.globalData.userInfo = userInfoCopy
        wx.showModal({
          title: '验证邮件已发送',
          content: `验证邮件已发送至您的邮箱【${email}】，转至邮箱通过验证后方可生效！设置密码请到主页的【设置】中。`,
          showCancel: false,
          confirmText: '知道了'
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  },
  linkWeChat: function ({ detail }) {
    if (detail.errMsg === 'getUserInfo:ok') {
      linkWeChat(() => {
        app.globalData.userInfo.weAppName = detail.userInfo.nickName
        app.globalData.userInfo.weAppLinked = true
        UserModel.update(['weAppName', 'weAppLinked'], app.globalData.userInfo, () => {
          this.setData({
            userInfo: app.globalData.userInfo,
          })
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