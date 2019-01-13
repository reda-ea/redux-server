
!(function(io, Redux) {

    var socket = io();

    // TODO allow custom local reducer
    var store = Redux.createStore(function(s){return s;});

    // TODO use a middleware instead
    store.replaceReducer(function(state, action) {
        if(action.type == '__internal__sync_store__') {
            store.__synchronized = true;
            delete store.__lastAction;
            return action.state;
        }
        socket.emit('redux action', action);
        store.__synchronized = false;
        store.__lastAction = action;
        return state;
    });

    socket.on('redux state', function(state) {
        // TODO make sure this is a newer state (timestamp?)
        store.dispatch({
            type: '__internal__sync_store__',
            state: state
        });
    });

    store.__synchronized = false;

    window.serverStore = store;

})(window.io, window.Redux);
