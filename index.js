
var fs = require('fs');
var io = require('socket.io');

var firsthandler = require('firsthandler');

var CLIENT_PATH = '/redux-server/server-store.js';

var REDUX_DIST = 'redux/dist/redux.js';
var SOCKET_DIST = 'socket.io/node_modules/socket.io-client/socket.io.js';

var serveClient = function(req, res, next) {
    if(req.url != CLIENT_PATH)
        return next();

    try {
        var script = fs.readFileSync(require.resolve(SOCKET_DIST));
        script += '\n\n' + fs.readFileSync(require.resolve(REDUX_DIST));
        script += '\n\n' + fs.readFileSync(require.resolve('./client.js'));
        res.writeHead(200, {"Content-Type": "application/javascript"});
        res.end(script);
    } catch(e) {
        res.writeHead(500, {"Content-Type": "application/javascript"});
        return res.end('console.err("js resources not found");');
    }
};

var attachStore = function(ioServer, store, specifier) {
    if(!specifier)
        specifier = function(state, clientId) {
            return Object.assign({}, state, {
                __clientId: clientId
            });
        };

    ioServer.on('connection', function(socket) {
        var unsubscribe = store.subscribe(function() {
            var newstate = specifier(store.getState(), socket.id);
            socket.emit('redux state', newstate);
        });
        socket.on('redux action', function(action) {
            // TODO maintain action order (sequence num?)
            var localaction = Object.assign({}, action, {
                __clientId: socket.id
            });
            if(localaction.type == '@@redux/INIT')
                localaction.type = '@@reduxclient/INIT';
            store.dispatch(localaction);
        });
        socket.on('disconnect', function() {
            unsubscribe();
        });
    });
};

module.exports = function(server, store, specifier) {
    if(!server)
        throw new Error('an http server is required');
    if(!store)
        throw new Error('a redux store is required');

    firsthandler(server, serveClient);
    attachStore(io(server), store, specifier);
};

module.exports.middleware = serveClient;
module.exports.attach = attachStore;
