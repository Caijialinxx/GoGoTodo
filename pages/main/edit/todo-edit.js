import { TodoModel } from '../../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    todo: null,
    timeOutArr: {
      reminder: [],
      overdue: []
    },
  },
  onLoad: function() {
    this.setData({
      todo: app.dataBetweenPage.editInfo,
    })
  },
  playAudio: function(successFn, errorFn) {
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.autoplay = true
    innerAudioContext.src = '/pages/tones/cute_tone.wav'
    innerAudioContext.onPlay(() => {
      successFn.call(undefined)
    })
    innerAudioContext.onError((res) => {
      errorFn.call(undefined, res.errMsg)
    })
  },
  changeData: function(e) {
    let todoCopy = JSON.parse(JSON.stringify(this.data.todo))
    if (e.currentTarget.id === 'setReminder') {
      if (todoCopy.reminder) {
        todoCopy.reminder = null
      } else {
        let clock = new Date(Date.now() + 10800000) // 当天三小时后提醒
        todoCopy.reminder = {
          value: clock.valueOf(),
          date: clock.toLocaleDateString().replace(/\//g, '-'),
          time: clock.toTimeString().substr(0, 5)
        }
      }
    } else if (e.currentTarget.id === 'setOverdue') {
      if (todoCopy.overdue) {
        todoCopy.overdue = null
      } else {
        let now = new Date()
        let clock = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) // 一天后过期
        todoCopy.overdue = {
          value: clock.valueOf(),
          date: clock.toLocaleDateString().replace(/\//g, '-')
        }
      }
    } else if (e.currentTarget.id === 'reminder-date') {
      todoCopy.reminder.date = e.detail.value
      todoCopy.reminder.value = new Date(`${todoCopy.reminder.date}T${todoCopy.reminder.time}`).valueOf()
    } else if (e.currentTarget.id === 'reminder-time') {
      todoCopy.reminder.time = e.detail.value
      todoCopy.reminder.value = new Date(`${todoCopy.reminder.date}T${todoCopy.reminder.time}`).valueOf()
    } else if (e.currentTarget.id === 'overdue') {
      todoCopy.overdue.date = e.detail.value
      todoCopy.overdue.value = new Date(todoCopy.overdue.date).valueOf()
    } else if (e.currentTarget.id === 'status') {
      if (todoCopy.status === 'undone') {
        todoCopy.status = 'success'
      } else if (todoCopy.status === 'success') {
        todoCopy.status = 'undone'
      }
    } else {
      // content remark
      todoCopy[e.currentTarget.id] = e.detail.value
    }
    this.setData({
      todo: todoCopy
    })
  },
  save: function() {
    let todoCopy = JSON.parse(JSON.stringify(this.data.todo))
    if (todoCopy.content.trim() === '') {
      todoCopy.content = app.dataBetweenPage.editInfo.content
    }
    let keys = ['content', 'status', 'remark', 'reminder', 'overdue']
    TodoModel.update(keys, todoCopy, () => {
      this.setData({
        todo: todoCopy
      })
      app.dataBetweenPage.editInfo = todoCopy
      for (let i = 0; i < app.globalData.todos.length; i++) {
        if (app.globalData.todos[i].id === todoCopy.id) {
          app.globalData.todos[i] = todoCopy
          break
        }
      }
      this.setClock()
      wx.showToast({
        title: '保存成功',
        complete: () => {
          setTimeout(wx.navigateBack, 300)
        }
      })
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  setClock: function() {
    let timeOutArrCopy = JSON.parse(JSON.stringify(this.data.timeOutArr)),
      todoCopy = this.data.todo,
      { reminder, overdue } = this.data.todo
    if (reminder) {
      let duration = reminder.value - Date.now()
      let reminderClockID = setTimeout(this.playAudio.bind(undefined, () => {
        wx.showModal({
          title: '勾勾TODO',
          content: todoCopy.content,
          showCancel: false,
          confirmText: '知道了'
        })
        clearTimeout(reminderClockID)
        timeOutArrCopy.reminder = []
        this.setData({
          timeOutArr: timeOutArrCopy
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      }), duration)

      timeOutArrCopy.reminder.push(reminderClockID)
      // 清除多余设置的闹钟
      if (timeOutArrCopy.reminder.length > 1) {
        clearTimeout(timeOutArrCopy.reminder[0])
        timeOutArrCopy.reminder.shift(timeOutArrCopy.reminder[0])
      }
    } else {
      clearTimeout(timeOutArrCopy.reminder[0])
      timeOutArrCopy.reminder = []
    }
    if (overdue) {
      let duration = overdue.value - Date.now()
      let overdueClockID = setTimeout(() => {
        timeOutArrCopy.overdue = []
        this.setData({
          timeOutArr: timeOutArrCopy
        })
      }, duration)

      timeOutArrCopy.overdue.push(overdueClockID)
      if (timeOutArrCopy.overdue.length > 1) {
        clearTimeout(timeOutArrCopy.overdue[0])
        timeOutArrCopy.overdue = []
      }
    } else {
      clearTimeout(timeOutArrCopy.overdue[0])
      timeOutArrCopy.overdue = []
    }
    this.setData({
      timeOutArr: timeOutArrCopy
    })
  }
})