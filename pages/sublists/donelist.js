import { TodoModel } from '../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    todos: null,
  },
  onShow: function() {
    this.showTodos(app.globalData.todos)
  },
  showTodos: function (rawData) {
    if (arguments[1]) {
      rawData.splice(arguments[1], 1)
      this.setData({
        todos: rawData
      })
    } else {
      let doneTodos = rawData.filter(item => item.status === 'success')
      if (doneTodos.length > 0) {
        this.setData({
          todos: doneTodos,
        })
      } else {
        this.setData({
          todos: null,
        })
      }
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
    if (e.target.dataset.actiontype === 'edit') {
      app.dataBetweenPage.editInfo = target
    } else if (e.target.dataset.actiontype === 'changeStatus') {
      target.status = target.status === 'undone' ? 'success' : 'undone'
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
  undoneAll: function () {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos))
    wx.showModal({
      title: '标记所有未完成',
      content: `确定要标记所有为未完成状态吗？`,
      success: ({ confirm }) => {
        if (confirm) {
          todosCopy.map(todo => {
            todo.status = 'undone'
          })
          TodoModel.updateAll(['status'], todosCopy, () => {
            for (let i = 0; i < app.globalData.todos.length; i++) {
              if (app.globalData.todos[i].status === 'success') {
                app.globalData.todos[i].status = 'undone'
              }
            }
            this.setData({
              todos: null
            })
            setTimeout(wx.navigateBack, 300)
          }, (error) => {
            wx.showToast({
              title: error,
              icon: 'none'
            })
          })
        }
      }
    })
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
      content: `确定要删除【${target.content}】吗？`,
      success: ({ confirm }) => {
        if (confirm) {
          TodoModel.destroy(target.id, () => {
            for (let i = 0; i < app.globalData.todos.length; i++) {
              if (app.globalData.todos[i].id === target.data.id) {
                app.globalData.todos.splice(i, 1)
                break
              }
            }
            this.setData({
              todos: todosCopy,
            })
            this.showTodos(todosCopy, target.index)
          }, (error) => {
            wx.showToast({
              title: error,
              icon: 'none'
            })
          })
        }
      }
    })
  },
  deleteAll: function () {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos))
    wx.showModal({
      title: '删除待办事项',
      content: `确定要删除所有已完成待办吗？`,
      success: ({ confirm }) => {
        if (confirm) {
          TodoModel.deleteAll(todosCopy, () => {
            app.globalData.todos = app.globalData.todos.filter(item => item.status !== 'success')
            this.setData({
              todos: null
            })
            setTimeout(wx.navigateBack, 300)
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