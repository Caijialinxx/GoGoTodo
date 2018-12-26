import WeCropper from './we-cropper.js'

const device = wx.getSystemInfoSync()
const width = device.windowWidth
const height = device.windowHeight

Page({
  data: {
    id: 'cropper',
    width,
    height,
    scale: 2.5,
    zoom: 8,
    cut: {
      x: (width - 300) / 2,
      y: (height - 300) / 2,
      width: 300,
      height: 300
    }
  },
  touchStart(e) {
    this.wecropper.touchStart(e)
  },
  touchMove(e) {
    this.wecropper.touchMove(e)
  },
  touchEnd(e) {
    this.wecropper.touchEnd(e)
  },
  getCropperImage() {
    this.wecropper.getCropperImage((url) => {
      if (url) {
        //  获取到裁剪后的图片
        wx.redirectTo({
          url: `../profile-edit?avatarUrl=${url}`
        })
      } else {
        console.log('获取图片失败，请稍后重试')
      }
    })
  },
  reChoose() {
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: (res) => {
          this.wecropper.pushOrign(res.tempFilePaths[0])
      }
    })
  },
  onLoad(option) {
    if (option.src) {
      this.data.src = option.src
      new WeCropper(this.data)
        .on('ready', (ctx) => {
          console.log(`wecropper is ready for work!`)
        })
        .on('beforeImageLoad', (ctx) => {
          console.log(`before picture loaded, i can do something`)
          console.log(`current canvas context:`, ctx)
          wx.showToast({
            title: '上传中',
            icon: 'loading',
            duration: 20000
          })
        })
        .on('imageLoad', (ctx) => {
          console.log(`picture loaded`)
          console.log(`current canvas context:`, ctx)
          wx.hideToast()
        })
        .on('beforeDraw', (ctx, instance) => {
          console.log(`before canvas draw,i can do something`)
          console.log(`current canvas context:`, ctx)
        })
        .updateCanvas()
    }
  }
})