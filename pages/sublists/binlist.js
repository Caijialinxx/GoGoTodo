import { TodoModel } from '../../utils/leancloud.js'
const app = getApp()

Page({
  data: {
    todos: null,
  },
  onShow: function () {
    this.showTodos()
  },
  showTodos: function () {
    TodoModel.fetch(items => {
      let overdueTodos = items.filter(item => {
        if (item.overdue) 
          return item.overdue.value <= Date.now()
      })
      if (overdueTodos.length === 0) {
        overdueTodos = null
      }
      this.setData({
        todos: overdueTodos,
      })
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  updateTodo: function (e) {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos))
    let target = todosCopy.filter(item => item.id === e.currentTarget.id)[0]
    if (e.target.dataset.actiontype === 'edit') {
      app.dataBetweenPage.editInfo = target
    } else if (e.target.dataset.actiontype === 'add') {
      target.overdue = null
      TodoModel.update(['overdue'], target, () => {
        todosCopy = todosCopy.filter(item => item.id !== target.id)
        todosCopy = todosCopy.length === 0 ? null : todosCopy
        this.setData({
          todos: todosCopy
        })
      }, (error) => {
        wx.showToast({
          title: error,
          icon: 'none'
        })
      })
    }
  },
  restoreAll: function () {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos))
    todosCopy.map(todo => todo.overdue = null)
    TodoModel.updateAll(['overdue'], todosCopy, () => {
      this.setData({
        todos: null
      })
    }, (error) => {
      wx.showToast({
        title: error,
        icon: 'none'
      })
    })
  },
  deleteTodo: function ({ currentTarget: { id } }) {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos)),
      target = todosCopy.filter(item => item.id === id)[0]
    wx.showModal({
      title: '删除待办事项',
      content: `确定要删除【${target.content}】吗？`,
      success: ({ confirm }) => {
        if (confirm) {
          TodoModel.destroy(target.id, () => {
            todosCopy = todosCopy.filter(item => item.id !== target.id)
            this.setData({
              todos: todosCopy
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
  },
  deleteAll: function () {
    let todosCopy = JSON.parse(JSON.stringify(this.data.todos))
    wx.showModal({
      title: '删除待办事项',
      content: `确定要删除所有已过期待办吗？`,
      success: ({ confirm }) => {
        if (confirm) {
          TodoModel.deleteAll(todosCopy, () => {
            this.setData({
              todos: null
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