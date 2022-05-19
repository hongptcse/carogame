const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;

const Room = new Schema(
    {
        roomId: { type: String, maxlength: 5, require: true },
        roomName: { type: String, maxlength: 50, require: true },
        note: { type: String, maxlength: 250 },
        image: { type: String, maxlength: 250 },
        players: { type: Array, default: []},
        viewers: { type: Array, default: [] },
        playStatus: { type: Number },
        player01Status: { type: Number },
        player02Status: { type: Number },
        boardGame: { type: Array, default: [] },
        playTurn: { type: Number },
        gameMode: { type: String },
        totalTime: { type: Number },
        winner: { type: Object }
    }, 
    // { timestamps: true }, 
    { collection: 'rooms' }
);

module.exports = mongoose.model('Room', Room);
