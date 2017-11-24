'use strict';

exports.__esModule = true;
// 导出默认模块 bindActionCreators
exports['default'] = bindActionCreators;

/**
 * dispath 绑定到 action 上
 * @param {*} actionCreator  action 函数 
 * @param {*} dispatch dispath 函数
 * @returns {Function|Object} 返回一个可以直接调用 dispath 的函数
 */
function bindActionCreator(actionCreator, dispatch) {
  // 返回一个可以直接调用的 dispath 函数
  return function () {
    // 调用 dispath 函数，执行 actionCreator
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * 把 action creators 转成拥有同名 keys 的对象，但使用 dispatch 把每个 action creator 
 * 包围起来，这样可以直接调用它们。
 * 
 * 一般情况下你可以直接在 Store 实例上调用 dispatch。如果你在 React 中使用 Redux，
 * react-redux 会提供 dispatch 函数让你直接调用它 。
 * 
 * 惟一使用 bindActionCreators 的场景是当你需要把 action creator 往下传到一个组件上，却
 * 不想让这个组件觉察到 Redux 的存在，而且不希望把 Redux store 或 dispatch 传给它
 * 
 * 改方法支持你可以传入一个函数作为第一个参数，它会返回一个函数。
 * 
 * 
 * @param {Function|Object} actionCreators  一个action creator 函数,或者键值是 action creatores 的对象
 *
 * @param {Function} dispatch dipath 函数 ，由 Redux 提供
 * store.
 *
 * @returns {Function|Object} 一个与原对象类似的对象，只不过这个对象中的的每个函数值都可以直
 * 接 dispatch action。如果传入的是一个函数作为 actionCreators，返回的也是一个函数。
 */

function bindActionCreators(actionCreators, dispatch) {
  // 判断 actionCreators 是一个函数
  if (typeof actionCreators === 'function') {
    // 调用 bindActionCreator ， 返回包装后的 actionCreators , 包装后 actionCreators 可以直接 dispath
    return bindActionCreator(actionCreators, dispatch);
  }

  //  如果 actionCreators 传入的不是 Object 或者 Function 抛出异常
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  // 获取 actionCreators 所有的 key
  var keys = Object.keys(actionCreators);
  // 用来保存新 转换后的 actionCreators
  var boundActionCreators = {};

  // 遍历 所有的 actionCreators keys
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    // 获取当前的 actionCreator
    var actionCreator = actionCreators[key];
    // 当前的 actionCreator 是一个函数
    if (typeof actionCreator === 'function') {
      // 调用 bindActionCreator ， 返回包装后的 actionCreators , 包装后 actionCreators 可以直接 dispath
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }

  // 返回经过 dispath 包装过后的 actionCreators
  return boundActionCreators;
}