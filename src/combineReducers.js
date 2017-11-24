import { ActionTypes } from './createStore'
import isPlainObject from 'lodash/isPlainObject'
import warning from './utils/warning'

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type
  var actionName = actionType && `"${actionType.toString()}"` || 'an action'

  return (
    `Given action ${actionName}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state.`
  )
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers)
  var argumentName = action && action.type === ActionTypes.INIT ?
    'preloadedState argument passed to createStore' :
    'previous state received by the reducer'

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  var unexpectedKeys = Object.keys(inputState).filter(key =>
    !reducers.hasOwnProperty(key) &&
    !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(key => {
    var reducer = reducers[key]
    var initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
        `If the state passed to the reducer is undefined, you must ` +
        `explicitly return the initial state. The initial state may ` +
        `not be undefined.`
      )
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.')
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
        `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
        `namespace. They are considered private. Instead, you must return the ` +
        `current state for any unknown actions, unless it is undefined, ` +
        `in which case you must return the initial state, regardless of the ` +
        `action type. The initial state may not be undefined.`
      )
    }
  })
}

/**
 *随着应用变得复杂，需要对 reducer 函数 进行拆分，拆分后的每一块独立负责管理 state 的一部分。
 *combineReducers 辅助函数的作用是，把一个由多个不同 reducer 函数作为 value 的 object，合并
 *成一个最终的 reducer 函数，然后就可以对这个 reducer   *调用 createStore。
 *合并后的 reducer 可以调用各个子 reducer，并把它们的结果合并成一个 state 对象。state 对象的
 *结构由传入的多个 reducer 的 key 决定 
 */
export default function combineReducers(reducers) {
  //把 reducers 对象中可以枚举的属性转换成一个数组
  var reducerKeys = Object.keys(reducers)
  //声明接受最终 reducers 对象 
  var finalReducers = {}
  //循环遍历 reducers key
  for (var i = 0; i < reducerKeys.length; i++) {
    //接受当前的 key
    var key = reducerKeys[i]
    
    //判断当前不是生产模式
    if (process.env.NODE_ENV !== 'production') {
      //判断当前的 reducer 是 undefinded
      if (typeof reducers[key] === 'undefined') {
        //抛出异常
        warning(`No reducer provided for key "${key}"`)
      }
    }
    //判断当前 reducer 是一个函数
    if (typeof reducers[key] === 'function') {
      //赋值给 finalReducers 对象
      finalReducers[key] = reducers[key]
    }
  }

  //把 finalReducers 对象中可枚举的属性转换成一个数组
  var finalReducerKeys = Object.keys(finalReducers)

  //判断当前环境不是生产模式
  if (process.env.NODE_ENV !== 'production') {
    var unexpectedKeyCache = {}
  }

  var sanityError
  try {
    //判断 Reducer 是否符合规范
    assertReducerSanity(finalReducers)
  } catch (e) {
    sanityError = e
  }

  //返回结合起来的 Reducer
  return function combination(state = {}, action) {
    if (sanityError) {
      throw sanityError
    }

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache)
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    var hasChanged = false
    var nextState = {}
    //循环遍历 finalReducerKeys ,执行所有的 reducer, 所以大家一定不要有相同的 action.type ,否则你的状态一定会混乱的
    for (var i = 0; i < finalReducerKeys.length; i++) {
      //获取当前的 key
      var key = finalReducerKeys[i]
      //获取当前 reducer
      var reducer = finalReducers[key]
      //获取当前 key 的 state
      var previousStateForKey = state[key]
      //执行 reducer ，获取 state
      var nextStateForKey = reducer(previousStateForKey, action)
      //判断执行完Reducer后, 返回回来的 nextStateForKey 是 undefined
      if (typeof nextStateForKey === 'undefined') {
        //得到 Undefined 状态的错误消息  
        var errorMessage = getUndefinedStateErrorMessage(key, action)
        //抛出异常
        throw new Error(errorMessage)
      }
      //赋值给 nextState
      nextState[key] = nextStateForKey
      //判断 state 是否经过 Reducer 改变了
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    //返回state
    return hasChanged ? nextState : state
  }
}
