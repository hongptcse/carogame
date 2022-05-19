const Room = require('../../app/models/Room');
const User = require('../../app/models/User');
const { mongooseToObject, multipleMongooseToObject } = require('./mongoose');

function userInfo(socketId, username) {
    const user = { socketId, username};
    return user;
}

// Get play user
async function getPlayers(roomId) {
    var room;
    await Room.findOne({ roomId: roomId }).then(r => { room = mongooseToObject(r)});
    return room.players;
}

// get room by room id
async function getRoomInfo(roomId) {
    var room;
    //await Room.findOne({ roomId: roomId }).then(r => { room = mongooseToObject(r)});
    await Room.findOne({ roomId: roomId }).then(r => { room = r });
    return room;
}

// get room by socket.id of player or viewer
async function getRoomInfoBySocketId(id) {
    var room;
    await Room.findOne( { $or : [ { 'viewers': { $elemMatch: {'socketId' : id } } } 
                                    , { 'players': { $elemMatch: {'socketId' : id } } } ] })
            .then(r => { room = r });
    return room;
}

// Get other player 
function getOtherPlayer(players, socketId) {
    return players.find(player => player.socketId !== socketId);
}

// Get user (username, socketId)
function getCurrentUser(players, socketId) {
    return players.find(player => player.socketId === socketId);
}

// Get user by username
function getExistsUser(users, username) {
    const index = users.findIndex(user => user.username === username);
    return index;
}

function checkUserExists(users, username) {
    const index = users.findIndex(user => user.username === username);
    return index;
}

// Player leaves
function playerLeave(players, id) {
    const index = players.findIndex(player => player.socketId === id);

    if (index !== -1) {
        return players.splice(index, 1)[0];         
    }
}

function playerRemain(players, id) {
    const result = players;
    const index = result.findIndex(player => player.socketId === id);
    if (index !== -1) {
        result.splice(index, 1)[0];    
        return result;
    }
}

// Get room users
function getRoomUsers(users, room) {
    return users.filter(user => user.room === room);
}

function CheckPlayTurn(socketId, turn, players)
{
    const index = players.findIndex(player => player.socketId === socketId);
    if (turn === index) {
        return 1;
    }
    else {
        return 0;
    }
}

function GetUserIndex(users, socketId) {
    return users.findIndex(player => player.socketId === socketId);
}

function CheckPlayersStatus(players) {
    console.log(players);
    var result = 0;
    for (i = 0; i < players.length; i++) {
        console.log(players[i].status);
        result += players[i].status;
    }
    return result;
}

async function UpdateScore(playerName, score) {
    var user;
    await User.findOne({ username: playerName }).then(u => { user = u });
    console.log(user);
    if (user !== null && user !== undefined && user.score > 0) {
        user.score += score;
        if (user.score < 0) {
            user.score = 0;
        }
        user.save();
    }
    return user;
}

module.exports = {
    userInfo,
    getPlayers,
    getRoomInfo,
    getRoomInfoBySocketId,
    getOtherPlayer,
    getCurrentUser,
    getExistsUser,
    checkUserExists,
    playerLeave,
    playerRemain,
    getRoomUsers,
    GetUserIndex,
    CheckPlayTurn,
    CheckPlayersStatus,
    UpdateScore
};
