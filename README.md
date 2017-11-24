# Redux-source-analyze
Redux 源码分析

### 介绍
我分析的是用 es6 语法的源码，大家看目录结构，一共有 6 个文件。各个文件功能,想要查看更细节的东西，直接看 src文件件下的源码

* `applyMiddlewar.js`  使用自定义的 middleware 来扩展 Redux, 比如异步 Action
* `bindActionCreators.js` 把 action creators 转成拥有同名 keys 的对象, 使用 dispatch 把每个 action creator 包围起来，使用时可以直接调用
* `combineReducers.js`  一个比较大的应用，需要对 reducer 函数 进行拆分，拆分后的每一块独立负责管理 state 的一部分
* `compose.js` 从右到左来组合多个函数，函数编程中常用到
* `createStore.js` 创建一个 Redux Store 来放所有的state
* `utils/warnimng.js`  控制台输出一个警告，我们可以不用看



### 参考
[Redux Api](http://cn.redux.js.org/docs/api/index.html)