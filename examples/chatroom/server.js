
var http = require('http');
var fs = require('fs');

var redux = require('redux');

var reduxServer = require('../..');

var store = redux.createStore(function(state, action) {
    if(!state)
        return {
            messages: [],
        };
    if(action.type == 'message' && action.user && action.message)
        return Object.assign(state, {
            messages: state.messages.concat([{
                user: action.user,
                message: action.message,
            }]),
        });
    return state;
});

var server = http.createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);

    fs.readFile(__dirname + '/client.html', function(err, data) {
        if(err){
            res.statusCode = 500;
            return res.end('Error getting the client file');
        }
        res.setHeader('Content-type', 'text/html' );
        res.end(data);
    });
}).listen(parseInt(process.env.PORT || 9000, 10));

reduxServer(server, store);
