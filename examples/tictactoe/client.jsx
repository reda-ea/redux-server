(function(serverStore, ReactDOM) {

    var displayedmessages = 0;
    var displayNextMessage = function(messageList) {
        if(!messageList[displayedmessages])
            return;
        alert(messageList[displayedmessages]);
        ++displayedmessages;
    };

    var join = function() {
        serverStore.dispatch({ type: 'join', name: prompt('join as:')});
    };

    var Action = function(props) {
        return <button onClick={function() {
            // dispatches props.children but that's okay
            serverStore.dispatch(props);
        }}>{props.children || props.type}</button>;
    };

    var StorePreview = function(state) {
        return <pre className="debug-panel">
            {JSON.stringify(state, null, 2)}
        </pre>;
    };

    var JoinButton = function(state) {
        if(state.name)
            return <p>connected as {state.name}</p>;
        return <div>
            <button onClick={join}>join</button>
        </div>;
    };

    var PlayerList = function(state) {
        if(!state.name || state.game || state.inviting || state.invitedby)
            return null;
        var players = state.players || [];
        if(!players.length)
            return <p>no other players are currently connected</p>;
        return <div>
            <p>list of players. click to invite</p>
            <ul>
                {players.map(name => <li key={name}>
                    <Action type="invite" target={name}>{name}</Action>
                </li>)}
            </ul>
        </div>;
    };

    var Invitation = function(state) {
        if(state.inviting)
            return <p>
                inviting {state.inviting}
                <Action type="reject">cancel</Action>
            </p>;
        if(state.invitedby)
            return <p>
                invited by {state.invitedby}
                <Action type="accept" />
                <Action type="reject" />
            </p>;
        return null;
    };

    var Game = function(state) {
        if(!state.game)
            return null;
        var game = state.game;
        if(game.winner)
            return <p>
                {game.winner == game.self ? "you" : game.opponent} won
                <Action type="over">close</Action>
            </p>;
        if(!game.opponent)
            return <p>
                your opponent left
                <Action type="over">close</Action>
            </p>;
        var yourturn = game.turn == game.self;
        return <div>
            <p>
                playing against {game.opponent}
                <Action type="over">leave</Action>
            </p>
            <p>{yourturn ? "your" : (game.opponent + '\'s')} turn</p>
            <table><tbody>
                {game.board.map((line, y) => <tr key={y}>
                    {line.map((cell, x) => <td key={x}>
                        <Action type="play" x={x} y={y}>{cell || ' '}</Action>
                    </td>)}
                </tr>)}
            </tbody></table>
        </div>;
    };

    var App = function(state) {
        return <div>
            <StorePreview {...state} />
            <JoinButton {...state} />
            <PlayerList {...state} />
            <Invitation {...state} />
            <Game {...state} />
        </div>;
    };

    serverStore.subscribe(function() {
        displayNextMessage(serverStore.getState().messages);
        ReactDOM.render(
            <App {...serverStore.getState()} />,
            document.getElementById('root')
        );
    });

})(window.serverStore, window.ReactDOM);
