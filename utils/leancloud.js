const AV = require('../libs/av-weapp-min.js')
const {
  appId,
  appKey
} = require('../private.js')
AV.init({
  appId: appId,
  appKey: appKey
})

const TodoModel = {
  fetch(successFn, errorFn) {
    let query = new AV.Query('Todo');
    query.addAscending('order').find().then((todos) => {
      let items = todos.map((todo) => {
        return {
          id: todo.id,
          ...todo.attributes
        }
      })
      successFn.call(undefined, items)
    }, (error) => {
      errorFn.call(undefined, `错误消息：请求被终止，请检查网络是否正确连接！`)
    })
  },
  create(item, successFn, errorFn) {
    if (AV.User.current()) {
      let Todo = AV.Object.extend('Todo')
      let todo = new Todo()
      for (let key in item) {
        todo.set(key, item[key])
      }
      let acl = new AV.ACL()
      acl.setPublicReadAccess(false)
      acl.setReadAccess(AV.User.current(), true)
      acl.setWriteAccess(AV.User.current(), true)
      todo.setACL(acl)

      todo.save().then(function(todo) {
        successFn.call(undefined, todo.id)
      }, function(error) {
        errorFn.call(undefined, error)
      })
    } else {
      errorFn.call(undefined, '当前未登录！无法使用！')
    }
  },
  update(types, item, successFn, errorFn) {
    let todo = AV.Object.createWithoutData('Todo', item.id)
    types.map(key => {
      todo.set(key, item[key])
    })
    todo.save().then((result) => {
      successFn.call(undefined, result)
    }, (error) => {
      errorFn.call(undefined, error)
    })
  },
  updateAll(types, items, successFn, errorFn) {
    let todos = items.map(item => {
      let todo = AV.Object.createWithoutData('Todo', item.id)
      types.map(key => todo.set(key, item[key]))
      return todo
    })
    AV.Object.saveAll(todos).then(() => {
      successFn.call(undefined)
    }, (error) => {
      errorFn.call(undefined)
    })
  },
  destroy(id, successFn, errorFn) {
    let todo = AV.Object.createWithoutData('Todo', id);
    todo.destroy().then(() => {
      successFn.call(undefined)
    }, (error) => {
      errorFn.call(undefined, error)
    });
  },
  deleteAll(items, successFn, errorFn) {
    let todos = items.map(item => {
      let todo = AV.Object.createWithoutData('Todo', item.id)
      return todo
    })
    AV.Object.destroyAll(todos).then(() => {
      successFn.call(undefined)
    }, (error) => {
      errorFn.call(undefined)
    })
  }
}

function logIn(email, password, successFn, errorFn) {
  AV.User.logIn(email, password).then((loggedInUser) => {
    let user = getUserInfo(loggedInUser)
    successFn.call(undefined, user)
  }, (error) => {
    switch (error.code) {
      case -1:
        errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
        return;
      case 210:
        errorFn.call(undefined, `账号或密码错误！请检查！`)
        return;
      case 211:
        errorFn.call(undefined, `账号不存在！如果未注册请先注册。`)
        return;
      case 216:
        errorFn.call(undefined, `电子邮箱未通过验证，请先验证再登录！验证邮件已发送至您的邮箱（${email}），请转至邮箱查收并进行验证！`)
        sendVerifyEmail(email)
        return;
      case 219:
        errorFn.call(undefined, `登录失败次数超过限制，请稍候再试！或者通过忘记密码重设密码。`)
        return;
      default:
        errorFn.call(undefined, `${error.message}`)
        return;
    }
  })
}

function signUp(email, nickname, password, successFn, errorFn) {
  let user = new AV.User()
  user.setEmail(email)
  user.setUsername(nickname)
  user.setPassword(password)
  user.signUp().then((loggedInUser) => {
    let user = getUserInfo(loggedInUser)
    successFn.call(undefined, user)
  }, (error) => {
    switch (error.code) {
      case -1:
        errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
        return;
      case 125:
        errorFn.call(undefined, `电子邮箱地址无效，请检查！`)
        return;
      case 203:
        errorFn.call(undefined, `电子邮箱地址已被占用，请更换！`)
        return;
      case 218:
        errorFn.call(undefined, `密码无效（不允许含空格），请重设！`)
        return;
      default:
        errorFn.call(undefined, `${error.message}`)
        return;
    }
  })
}

function reset(email, successFn, errorFn) {
  AV.User.requestPasswordReset(email).then(() => {
    successFn.call(undefined)
  }, (error) => {
    switch (error.code) {
      case -1:
        errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
        return;
      case 204:
        errorFn.call(undefined, `请提供注册时的电子邮箱！`)
        return;
      case 205:
        errorFn.call(undefined, `该邮箱未注册，请检查或注册！`)
        return;
      default:
        errorFn.call(undefined, `错误：${error.message}`)
        return;
    }
  })
}

function getCurrentUser() {
  let user = AV.User.current()
  if (user) {
    if (user.attributes.emailVerified) {
      return getUserInfo(user)
    }
  } else {
    return null
  }
}

function logOut() {
  AV.User.logOut()
  return null
}

const UserModel = {
  update(keys, targetUser, successFn, errorFn) {
    let user = AV.Object.createWithoutData('_User', targetUser.id)
    keys.map(key => {
      user.set(key, targetUser[key])
    })
    user.save().then((user) => {
      successFn.call(undefined, user)
    }, (error) => {
      errorFn.call(undefined, error)
    })
  },
  linkEmail(email, successFn, errorFn) {
    let user = AV.User.current()
    user.setEmail(email).save().then((user) => {
      successFn.call(undefined, getUserInfo(user))
    }, (error) => {
      switch (error.code) {
        case -1:
          errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
          return;
        case 125:
          errorFn.call(undefined, `电子邮箱地址无效，请检查！`)
          return;
        case 203:
          errorFn.call(undefined, `电子邮箱地址已被占用，请更换！`)
          return;
        case 218:
          errorFn.call(undefined, `密码无效（不允许含空格），请重设！`)
          return;
        default:
          errorFn.call(undefined, `${error.message}`)
          return;
      }
    })
  },
  loginWithWeChat(weChatUserInfo, successFn, errorFn) {
    return AV.User.loginWithWeapp().then(user => {
      user.set('weAppLinked', true)
      user.set('weAppName', weChatUserInfo.nickName)
      user.save().then((user) => {
        successFn.call(undefined, getUserInfo(user))
      }, (error) => {
        errorFn.call(undefined, error.message)
      })
    }, error => {
      errorFn.call(undefined, error)
    })
  }
}

function linkWeChat(successFn, errorFn) {
  let user = AV.User.current()
  return user.linkWithWeapp().then(() => {
    successFn.call(undefined)
  }, (error) => {
    switch (error.code) {
      case -1:
        errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
        return;
      case 137:
        errorFn.call(undefined, `该微信号已被其它账号关联或注册！`)
        return;
      default:
        errorFn.call(undefined, `错误消息：${error.message}`)
        return;
    }
  })
}

module.exports = {
  TodoModel,
  logIn,
  signUp,
  reset,
  getCurrentUser,
  logOut,
  linkWeChat,
  UserModel,
  AV
}

function sendVerifyEmail(email) {
  AV.User.requestEmailVerify(email).then(() => {}, (error) => {
    switch (error.code) {
      case -1:
        errorFn.call(undefined, `请求被终止，请检查网络是否正确连接！`)
        return;
      default:
        errorFn.call(undefined, `错误消息：${error.message}`)
        return;
    }
  })
}

function getUserInfo(AVUser) {
  return {
    id: AVUser.id,
    email: AVUser.attributes.email,
    username: AVUser.attributes.username,
    emailVerified: AVUser.attributes.emailVerified,
    avatarUrl: AVUser.attributes.avatarUrl,
    mobilePhoneVerified: AVUser.attributes.mobilePhoneVerified,
    mobilePhoneNumber: AVUser.attributes.mobilePhoneNumber,
    weAppLinked: AVUser.attributes.weAppLinked,
    weAppName: AVUser.attributes.weAppName,
  }
}