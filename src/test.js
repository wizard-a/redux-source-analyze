 let redux = require('redux');

function Test (state, action) {
    switch (action.type) {
        case 'aa':
            return state;
            break;
    
        default:
            break;
    }
    return state;
}
let store = redux.createStore(Test, {name: 'aa'});
console.log(store);

store.subscribe((a) => {
    // store.getState();
    // console.log(store);
    console.log(store.getState());
})
store.dispatch({type: 'aa', data: {}});