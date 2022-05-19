const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;

const History = new Schema(
    {
        roomId: { type: String, maxlength: 5, require: true },
        roomName: { type: String, maxlength: 50, require: true },
        note: { type: String, maxlength: 250 },
        image: { type: String, maxlength: 250 },
        players: { type: Array },
        viewers: { type: Array },
        playStatus: { type: Number },
        player01Status: { type: Number },
        player02Status: { type: Number },
        boardGame: { type: Array },
        playTurn: {type: Number },
        gameMode: {type: String},
        totalTime: {type: Number},
        winner: {type: Object}
    }, 
    // { timestamps: true }, 
    { collection: 'histories' }
);

module.exports = mongoose.model('History', History);
