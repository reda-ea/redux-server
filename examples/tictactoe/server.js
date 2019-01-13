
var http = require('http');
var fs = require('fs');

var _ = require('lodash');
var redux = require('redux');

var reduxServer = require('../..');

var $lobby = require('./lobby');
var $game = require('./game');

var store = redux.createStore(function(state, action) {
    if(action.type == 'join')
        return $lobby.join(state, action.__clientId, action.name);
    if(action.type == 'invite')
        return $lobby.invite(state, action.__clientId, $lobby.get.playerId(state, action.target));
    if(action.type == 'reject')
        return $lobby.reject(state, action.__clientId);
    if(action.type == 'accept')
        return $lobby.accept(state, action.__clientId, $game.init());
    if(action.type == 'play')
        return $lobby.game(state, action.__clientId, function(gameState, players) {
            var self = players[0] == action.__clientId ? 'X' : 'O';
            return $game.play(gameState, self, action.x, action.y);
        });
    if(action.type == 'over')
        return $lobby.over(state, action.__clientId);
    if(action.type == '@@reduxClient/EXIT')
        return $lobby.leave(state, action.__clientId);
    return state;
}, $lobby.init());

var specifier = function(state, clientId) {
    var view = {
        name: $lobby.get.playerName(state, clientId),
        messages: _.map(_.filter(state.messages, function(message) {
            return message.to == clientId;
        }), 'text'),
    };
    if(!view.name)
        return view;
    var room = _.find(state.rooms, function(room) {
        return _.includes(room.players, clientId);
    });
    var invite = _.find(state.invites, function(invite) {
        return invite.from == clientId || invite.to == clientId;
    });
    if(room)
        view.game = _.assign({
            opponent: _.get(_.find(state.players, function(player) {
                return player.id != clientId &&
                    _.includes(room.players, player.id);
            }), 'name'),
            self: room.players[0] == clientId ? 'X' : 'O',
        }, room.game);
    else if(invite && invite.from == clientId)
        view.inviting = $lobby.get.playerName(state, invite.to);
    else if(invite && invite.to == clientId)
        view.invitedby = $lobby.get.playerName(state, invite.from);
    else
        view.players = _.map(_.filter(state.players, function(player) {
            return player.id != clientId;
        }), 'name');
    return view;
};

var client_html = fs.readFileSync(__dirname + '/client.html', 'utf8');
var client_jsx  = fs.readFileSync(__dirname + '/client.jsx' , 'utf8');

var server = http.createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);
    res.setHeader('Content-type', 'text/html' );
    res.end(client_html.replace('/*client.jsx*/', client_jsx));
}).listen(parseInt(process.env.PORT || 9000, 10));

reduxServer(server, store, specifier);
