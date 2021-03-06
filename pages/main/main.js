import { TodoModel } from '../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    todos: [],
    maxOrder: undefined,
    todoDraft: '',
    needRefresh: false,
    pulldownHeight: 0,
  },
  onLoad: function () {
    TodoModel.fetch(items => {
      app.globalData.todos = items
      this.showTodos(items)
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  onShow: function () {
    this.showTodos(app.globalData.todos)
  },
  onTouchEnd: function (e) {
    if (this.data.pulldownHeight > 50) {
      this.setData({ needRefresh: true })
      TodoModel.fetch(items => {
        app.globalData.todos = items
        this.showTodos(items)
        this.setData({ needRefresh: false })
        wx.showToast({
          title: '更新完成！',
          icon: 'success'
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  },
  onScroll: function ({ detail: { scrollTop, scrollHeight } }) {
    if (scrollTop < 0) {
      this.setData({ pulldownHeight: -scrollTop })
    } else if (scrollTop > 0) {
      this.setData({
        needRefresh: false,
        pulldownHeight: 0,
      })
    }
  },
  changeData: function ({ detail: { value } }) {
    this.setData({
      todoDraft: value
    })
  },
  addTodo: function () {
    if (this.data.todoDraft.trim()) {
      let todosCopy = JSON.parse(JSON.stringify(this.data.todos)),
        newTodo = {
          content: this.data.todoDraft,
          status: 'undone',
          remark: '',
          order: this.data.maxOrder + 1,
          reminder: null,
          overdue: null
        }
      TodoModel.create(newTodo,
        (id) => {
          newTodo.id = id
          todosCopy.push(newTodo)
          app.globalData.todos.push(newTodo)
          this.setData({
            todoDraft: '',
            maxOrder: newTodo.order,
            todos: todosCopy
          })
          setTimeout(() => {
            wx.pageScrollTo({ scrollTop: 9999 })
          }, 150)
        },
        (error) => {
          wx.showToast({
            title: error,
            icon: 'none'
          })
        })
    } else {
      this.setData({
        todoDraft: ''
      })
    }
  },
  showTodos: function (rawData) {
    if (app.globalData.userInfo && rawData && rawData.length > 0) {
      this.setData({ maxOrder: rawData[rawData.length - 1].order })
      let shouldShow, { notShowSuccess, notShowOverdue } = app.globalData.options
      if (notShowSuccess && notShowOverdue) {
        shouldShow = rawData.filter(item => {
          return item.status === 'undone' && (item.overdue === null || item.overdue.value > Date.now())
        })
      } else if (!notShowSuccess && !notShowOverdue) {
        shouldShow = rawData
      } else if (notShowSuccess) {
        // 不显示已完成但显示已过期
        shouldShow = rawData.filter(item => item.status !== 'success')
      } else {
        // 不显示已过期但显示已完成
        shouldShow = rawData.filter(item => (item.overdue === null || item.overdue.value > Date.now()))
      }
      this.setData({
        todos: shouldShow
      })
    } else {
      this.setData({
        todos: []
      })
    }
  },
  updateTodo: function (e) {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos)), target
    for (let i = 0; i < todosCopy.length; i++) {
      if (todosCopy[i].id === e.currentTarget.id) {
        target = todosCopy[i]
        break
      }
    }
    if (e.target.dataset.editable) {
      // 编辑内容
      app.dataBetweenPage.editInfo = target
    } else {
      // 标记完成状态
      if (target.status === 'undone') {
        target.status = 'success'
      } else if (target.status === 'success') {
        target.status = 'undone'
      }
      TodoModel.update(['status'], target, () => {
        for (let i = 0; i < app.globalData.todos.length; i++) {
          if (app.globalData.todos[i].id === target.id) {
            app.globalData.todos[i] = target
            break
          }
        }
        this.setData({
          todos: todosCopy
        })
        this.showTodos(todosCopy)
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  },
  deleteTodo: function ({ currentTarget: { id } }) {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos)), target = {}
    for (let i = 0; i < todosCopy.length; i++) {
      if (todosCopy[i].id === id) {
        target = {
          data: todosCopy[i],
          index: i
        }
        break
      }
    }
    wx.showModal({
      title: '删除待办事项',
      content: `【${target.data.content}】将被永久删除`,
      success: ({ confirm }) => {
        if (confirm) {
          TodoModel.destroy(target.data.id, () => {
            for (let i = 0; i < app.globalData.todos.length; i++) {
              if (app.globalData.todos[i].id === target.data.id) {
                app.globalData.todos.splice(i, 1)
                break
              }
            }
            todosCopy.splice(target.index, 1)
            this.setData({
              todos: todosCopy,
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
  }
})