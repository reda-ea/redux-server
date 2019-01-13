// game state management

var _ = require('lodash');
var immer = require('immer');

var init = function(state) {
    state.board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
    ];
    state.turn = 'X';
    state.winner = null;
};

var _move_allowed = function(state, player, x, y) {
    if(state.winner)
        return false;
    if(player != state.turn)
        return false;
    if(y >= state.board.length)
        return false;
    if(x >= state.board[y].length)
        return false;
    if(state.board[y][x] != '')
        return false;
    return true;
};

var _check_winner = function(state) {
    for(var i = 0; i < 3; ++i) {
        if(
            state.board[i][0] == state.board[i][1] &&
            state.board[i][0] == state.board[i][2]
        )
            return state.board[i][0];
        if(
            state.board[0][i] == state.board[1][i] &&
            state.board[0][i] == state.board[2][i]
        )
            return state.board[0][i];
    }
    if(
        state.board[1][1] == state.board[0][0] &&
        state.board[1][1] == state.board[2][2]
    )
        return state.board[1][1];
    if(
        state.board[1][1] == state.board[0][2] &&
        state.board[1][1] == state.board[2][0]
    )
        return state.board[1][1];
    return null;
};

var play = function(state, player, x, y) {
    if(!_move_allowed(state, player, x, y))
        return;
    state.board[y][x] = state.turn;
    state.turn = (state.turn == 'X') ? 'O' : 'X';
    state.winner = _check_winner(state);
};

module.exports = {
    init: state => immer.produce(state || {}, init),
    play: immer.produce(play),
};
