// 导入 lodash ，判断是否是普通(plain)对象
import isPlainObject from 'lodash/isPlainObject'
//导入 symbol 类型的 observable (symbol类型的属性，是对象的私有属性)
import $$observable from 'symbol-observable'

/**
 *定义 Redux Action 的初始化 type
 * 
 */
export var ActionTypes = {
  INIT: '@@redux/INIT'
}

/**
 * 创建一个Redux store来存放应用所有的 state。应用中有且只有一个store
 *
 * @param {Function} reducer 是一个函数,接收两个参数，分别是当前的 state 树和
 * 要处理的 action，返回新的 state 树
 *
 * @param {any} 初始化时的state ,在应用中，你可以把服务端传来经过处理后的 state
 *传给它。如果你使用 combineReducers 创建 reducer，它必须是一个普通对象，与传入
 *的 keys 保持同样的结构。否则，你可以自由传入任何 reducer 可理解的内容。
 *
 * @param {Function} enhancer 是一个组合的高阶函数，返回一个强化过的 store creator .
 *                  这与 middleware相似，它也允许你通过复合函数改变 store 接口。
 *
 * @returns {Store} 返回一个对象，给外部提供 dispatch, getState, subscribe, replaceReducer, 
 */
export default function createStore(reducer, preloadedState, enhancer) {

  //判断 preloadedState 是一个函数并且 enhancer 是未定义 
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState  // 把 preloadedState 赋值给 enhancer
    preloadedState = undefined // 把 preloadedState 赋值为 undefined
  }

  //判断 enhancer 不是 undefined
  if (typeof enhancer !== 'undefined') {
    //判断 enhancer 不是一个函数
    if (typeof enhancer !== 'function') {
      //抛出一个异常 (enhancer 必须是一个函数)
      throw new Error('Expected the enhancer to be a function.')
    }
    //调用 enhancer ,返回一个新强化过的 store creator
    return enhancer(createStore)(reducer, preloadedState)
  }
  
  //判断 reducer 不是一个函数
  if (typeof reducer !== 'function') {
    //抛出一个异常 (reducer 必须是一个函数)
    throw new Error('Expected the reducer to be a function.')
  }

  
  var currentReducer = reducer        //把 reducer 赋值给 currentReducer
  var currentState = preloadedState   //把 preloadedState 赋值给 currentState
  var currentListeners = []           //初始化 listeners 数组
  var nextListeners = currentListeners//nextListeners 和 currentListeners 指向同一个引用
  var isDispatching = false           //标记正在进行dispatch

  /**
   * 保存一份订阅快照
   * @return {void}
   */
  function ensureCanMutateNextListeners() {
    //判断 nextListeners 和 currentListeners 是同一个引用
    if (nextListeners === currentListeners) {
      
      //通过数组的 slice 方法,复制出一个 listeners ,赋值给 nextListeners
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * 获取 store 里的当前 state tree
   *
   * @returns {any} 返回应用中当前的state tree
   */
  function getState() {

    //当前的state tree
    return currentState
  }

  /**
   *
   * 添加一个 listener . 当 dispatch action 的时候执行，这时 sate 已经发生了一些变化，
   * 你可以在 listener 函数调用 getState() 方法获取当前的 state
   *
   * 你可以在 listener 改变的时候调用 dispatch ，要注意
   *
   * 1. 订阅器（subscriptions） 在每次 dispatch() 调用之前都会保存一份快照。
   *    当你在正在调用监听器（listener）的时候订阅(subscribe)或者去掉订阅（unsubscribe），
   *    对当前的 dispatch() 不会有任何影响。但是对于下一次的 dispatch()，无论嵌套与否，
   *    都会使用订阅列表里最近的一次快照。
   *
   * 2. 订阅器不应该关注所有 state 的变化，在订阅器被调用之前，往往由于嵌套的 dispatch()
   *    导致 state 发生多次的改变，我们应该保证所有的监听都注册在 dispath() 之前。
   *
   * @param {Function} 要监听的函数
   * @returns {Function} 一个可以移除监听的函数
   */
  function subscribe(listener) {
    //判断 listener 不是一个函数
    if (typeof listener !== 'function') {

      //抛出一个异常 (listener 必须是一个函数)
      throw new Error('Expected listener to be a function.')
    }

    //标记有订阅的 listener
    var isSubscribed = true

    //保存一份快照
    ensureCanMutateNextListeners()

    //添加一个订阅函数
    nextListeners.push(listener)
    
    //返回一个取消订阅的函数
    return function unsubscribe() {

      //判断没有订阅一个 listener
      if (!isSubscribed) {

        //调用 unsubscribe 方法的时候，直接 return
        return
      }

      //标记现在没有一个订阅的 listener
      isSubscribed = false
      
      //保存一下订阅快照
      ensureCanMutateNextListeners()
      //找到当前的 listener
      var index = nextListeners.indexOf(listener)
      //移除当前的 listener
      nextListeners.splice(index, 1)
    }
  }

  /**
   * dispath action。这是触发 state 变化的惟一途径。
   * 
   * @param {Object} 一个普通(plain)的对象，对象当中必须有 type 属性
   *
   * @returns {Object} 返回 dispatch 的 action
   *
   * 注意: 如果你要用自定义的中间件， 它可能包装 `dispatch()`
   *       返回一些其它东西，如( Promise )
   */
  function dispatch(action) {
    //判断 action 不是普通对象。也就是说该对象由 Object 构造函数创建
    if (!isPlainObject(action)) {

      //抛出一个异常(actions 必须是一个普通对象. 或者用自定义的中间件来处理异步 actions)
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      )
    }

    // 判断 action 对象的 type 属性等于 undefined 
    if (typeof action.type === 'undefined') {

      //抛出一个异常
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      )
    }
  
    //判断 dispahch 正在运行，Reducer在处理的时候又要执行 dispatch
    if (isDispatching) {
      
      //抛出一个异常(Reducer在处理的时候不能 dispatch action)
      throw new Error('Reducers may not dispatch actions.')
    }

    try {

      //标记 dispatch 正在运行
      isDispatching = true

      //执行当前 Reducer 函数返回新的 state
      currentState = currentReducer(currentState, action)

    } finally { // (try catch) 最终会被执行的地方

      //标记 dispatch 没有在运行 
      isDispatching = false
    }

    //所有的的监听函数赋值给 listeners
    var listeners = currentListeners = nextListeners

    //遍历所有的监听函数
    for (var i = 0; i < listeners.length; i++) {

      // 执行每一个监听函数
      listeners[i]()
    }

    //返回传入的 action 对象
    return action
  }

  /**
   * 替换计算 state 的 reducer。
   *
   * 这是一个高级 API。
   * 只有在你需要实现代码分隔，而且需要立即加载一些 reducer 的时候才可能会用到它。
   * 在实现 Redux 热加载机制的时候也可能会用到。
   *
   * @param {Function} store 要用的下一个 reducer.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {

    //判断 nextReducer 不是一个函数
    if (typeof nextReducer !== 'function') {

      //抛出一个异常 (nextReducer必须是一个函数)
      throw new Error('Expected the nextReducer to be a function.')
    }

    //当前传入的 nextReducer 赋值给 currentReducer
    currentReducer = nextReducer

    //调用 dispatch 函数，传入默认的 action
    dispatch({ type: ActionTypes.INIT })
  }

  /**
   *  在 creatorStore 内部没有看到此方法的调用
   *  (猜想 : 作者可能想用比较强大，活跃的 observable 库替换现在的 publish subscribe)
   *
   * @returns {observable} 状态改变的时候返回最小的 observable.
   * 想要了解跟多关于 observable 库，建议看下 
   * https://github.com/zenparsing/es-observable (标准 es Observable)
   */
  function observable() {
    //订阅方法赋值给变量 outerSubscribe
    var outerSubscribe = subscribe
    return {
      /**
       * 这是一个最小的观察订阅方法
       * 
       * @param {Object}  观察着的任何一个对象都可以作为一个 observer.
       * 观察者应该有 `next` 方法
       */
      subscribe(observer) {

        //判断 observer 是一个对象
        if (typeof observer !== 'object') {
          //抛出异常
          throw new TypeError('Expected the observer to be an object.')
        }

        //获取观察着的状态
        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        //返回一个取消订阅的方法
        var unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },
      //对象的私有属性，暂时不知道有什么用途
      [$$observable]() {
        return this
      }
    }
  }

  //reducer 返回其初始状态 
  //初始化 store 里的 state tree
  dispatch({ type: ActionTypes.INIT })

  //返回 store 暴漏出的接口
  return {
    dispatch, //唯一一个可以改变 state 的哈按时
    subscribe, //订阅一个状态改变后，要触发的监听函数 
    getState,  // 获取 store 里的 state
    replaceReducer, //Redux热加载的时候可以替换 Reducer
    [$$observable]: observable //对象的私有属性，供内部使用
  }
}
