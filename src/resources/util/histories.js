const History = require('../../app/models/History');

function CreateHistory(room) {
    
    const history = new History();
    history.roomId = room.roomId;
    history.roomName = room.roomName;
    history.note = room.note;
    history.image = room.image;
    history.players = room.players;
    history.viewers = room.viewers;
    history.playStatus = room.playStatus;
    history.playTurn = room.playTurn;
    history.gameMode = room.gameMode;
    history.totalTime = room.totalTime;
    history.winner = room.winner;
    history.boardGame = room.boardGame;
    history.player01Status = room.player01Status;
    history.player02Status = room.player02Status;
    
    history.save();
}

module.exports = {
    CreateHistory
}
