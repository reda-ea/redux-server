// add lobby and player management to a redux store

var _ = require('lodash');
var immer = require('immer');

var init = function(state) {
    state.players = []; // {id, name}
    state.rooms = []; // {players: [id], game: {} }
    state.invites = []; // {from, to}
    state.messages = []; // {to, type, text}
};

var _msg = function(state, id, text) {
    state.messages.push({
        to: id,
        text,
    });
};

// add player to lobby
var join = function(state, id, name) {
    if(_.includes(_.map(state.players, 'name'), name))
        return _msg(state, id, `The name ${name} is already taken.`);
    state.players.push({id, name});
};

var _busy_players = function(state) {
    return _.concat(
        state.rooms.reduce(function(s, room) {
            return _.concat(s, room.players);
        }, []),
        state.invites.reduce(function(s, invite) {
            return _.concat(s, [invite.from, invite.to]);
        }, [])
    );
};

var invite = function(state, from, to) {
    if(_.isEmpty(_.intersection(_.map(state.players, 'id'), [from, to])))
        return _msg(state, from, 'Player not found.');
    if(!_.isEmpty(_.intersection(_busy_players(state), [from, to])))
        return _msg(state, from, 'Player not available.');
    state.invites.push({from, to});
};

var reject = function(state, id) {
    var removed = _.remove(state.invites, function(invite) {
        return invite.from == id || invite.to == id;
    });
    _.forEach(removed, function(invite) {
        var destid = invite.from == id ? invite.to : invite.from;
        _msg(state, destid, 'Invitation canceled');
    });
};

var accept = function(state, id, game) {
    var invite = _.find(state.invites, function(invite) {
        return invite.to == id;
    });
    if(!invite)
        return _msg(state, id, 'Invitation not found');
    // TODO if player already in a room
    state.rooms.push({
        players: [invite.from, invite.to],
        game,
    });
    reject(state, id);
};

// apply action to the proper game state object
var game = function(state, id, action) {
    var room = _.find(state.rooms, function(room) {
        return _.includes(room.players, id);
    });
    if(!room)
        _.error(state, id, 'Game not found.');
    room.game = action(room.game, room.players);
};

// end game and return to lobby
var over = function(state, id) {
    _.forEach(state.rooms, function(room) {
        _.pull(room.players, id);
    });
    _.remove(state.rooms, function(room) {
        return _.isEmpty(room.players);
        // return room.players.length < 2;
    });
};

var leave = function(state, id) {
    reject(state, id);
    over(state, id);
    _.remove(state.players, function(player) {
        return player.id == id;
    });
};

module.exports = {
    init: state => immer.produce(state || {}, init),
    join: immer.produce(join),
    invite: immer.produce(invite),
    accept: immer.produce(accept),
    reject: immer.produce(reject),
    game: immer.produce(game),
    over: immer.produce(over),
    leave: immer.produce(leave),
    get: {
        playerId: function(state, name) {
            return _.get(_.find(state.players, function(player) {
                return player.name == name;
            }), 'id');
        },
        playerName: function(state, id) {
            return _.get(_.find(state.players, function(player) {
                return player.id == id;
            }), 'name');
        },
    },
};
