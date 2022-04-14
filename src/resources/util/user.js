// const users = [];

// user info socket.id, username, room
function userJoin(id, username, room, player) {
    const user = { id, username, room, player };
    return user;
}

// Get play user
function getPlayers(users) {
    return users.filter(user => user.player === 1)
}

function getOtherPlayer(users, id) {
    return users.filter(user => user.player === 1 && user.id !== id);
}

// Get current user
function getCurrentUser(users, id) {
    return users.find(user => user.id === id);
}

// Get user by username
function getExistsUser(users, username) {
    const index = users.findIndex(user => user.username === username);
    return index;
}

// User leaves chat
function userLeave(users, id) {
    const index = users.findIndex(user => user.id === id && user.player === 0);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Player leaves
function playerLeave(users, id) {
    const index = users.findIndex(user => user.id === id && user.player === 1);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get room users
function getRoomUsers(users, room) {
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getPlayers,
    getOtherPlayer,
    getCurrentUser,
    getExistsUser,
    userLeave,
    playerLeave,
    getRoomUsers
};
