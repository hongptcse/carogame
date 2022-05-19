const express = require('express');
//const morgan = require('morgan');
const { engine } = require('express-handlebars');
const path = require('path');
const route = require('./routes');
//const io = require("socket.io")
const session = require('express-session');

const {
    userInfo,
    getRoomInfo,
    getRoomInfoBySocketId,
    getOtherPlayer,
    getCurrentUser,
    checkUserExists,
    playerRemain,
    GetUserIndex,
    CheckPlayTurn,
    UpdateScore
  } = require('./resources/util/user');

const { CreateHistory } = require('./resources/util/histories');

const { 
    CreateMatrix,
    BoardGameToObject,
    ObjectToBoardGame,
    CheckBoardEmpty,
    Horizontal,
    Vertically,
    Diagonal,
    Diagonal_main } = require('./resources/util/game');
const FormatMessage = require('./resources/util/message');
const db = require('./config/db');


//connect to DB
db.connect();


const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    resave: true, 
    saveUninitialized: true, 
    secret: 'hongptcse', 
    cookie: { maxAge: 3600000*24, secure: false } // 01 hour
}))

// http log
//app.use(morgan('common'));

// template
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

// Routes initialize
route(app);
const server = require('http').createServer(app); 
const io = require('socket.io')(server);
server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

function arrayRemove(arr, value) { 
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}

const botName = 'Caro bot ';
const boardSize = 15;

io.on("connection", function(socket){
    console.log("Co nguoi ket noi vao server: " + socket.id);
    // client join to room
    socket.on("client-send-user", async function( { username, roomId } ) {
        const arrayBoard = CreateMatrix(boardSize, 0);
        const user = userInfo(socket.id, username);
        let room = await getRoomInfo(roomId);
        if (room.players.length === 0)
        {
            // push user into player list
            room.players.push(user);
            room.playStatus = 0;
            room.playTurn = 0;
            room.player01Status = 0;
            room.player02Status = 0;
            room.boardGame = BoardGameToObject(arrayBoard, boardSize);

            // join user to play room
            socket.join(roomId);
            io.to(roomId).emit("join-game-success", room.players);

        }
        else if (room.players.length === 1)
        {
            let idx = checkUserExists(room.players, username);
            if (idx === -1) {
                // chưa tồn tại => push
                room.players.push(user);
            }
            else {
                // đã tồn tại => kiểm tra cập nhật socket.id
                room.players[idx].socketId = socket.id;
            }
            room.playStatus = 0;
            room.playTurn = 0;
            room.player01Status = 0;
            room.player02Status = 0;
            room.boardGame = BoardGameToObject(arrayBoard, boardSize);

            // join user to play room
            socket.join(roomId);
            io.to(roomId).emit("join-game-success", room.players);
            //socket.broadcast.to(roomId).emit("join-game-success", room.players);
        }
        else {
            let empty = CheckBoardEmpty(ObjectToBoardGame(room.boardGame, boardSize), boardSize);
            if(empty > 0) {
                // đã có nước đi => cần vẽ lại nước đi
                let board = { arrayBoard: ObjectToBoardGame(room.boardGame, boardSize), boardSize };
                socket.emit("server-send-board", board);
            }
        }

        // join user to chat room = room id + _chatroom
        socket.join(roomId + "_chatroom");

        // TODO: check viewer exists
        let idxViewer = checkUserExists(room.viewers, username);
        if (idxViewer === -1) {
            room.viewers.push(user);

            // broadcast when a user connects
            socket.broadcast
            .to(roomId + "_chatroom")
            .emit("server-send-message",
                FormatMessage(botName, `${username} has joined to chat`)
            );
        }

        // send message welcome to current user
        socket.emit("server-send-message", FormatMessage(botName, `Welcome to room ${room.roomName} - ${roomId}`));

        //console.log(room);
        room.save();
        
    });

    // client disconnect
    socket.on("disconnect", async function() {
        console.log(socket.id + " ngat ket noi!");
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            // leave room
            socket.leave(room.roomId);
            socket.leave(room.roomId + "_chatroom");

            let player = getCurrentUser(room.players, socket.id)
            console.log(">>> curent player disconnect: ")
            console.log(player);
            if (player !== undefined && player !== null && player.username !== '') {
                // trường hợp nếu người disconnect là người chơi => thông báo cho đối thủ thắng do người chơi bỏ cuộc
                let empty = CheckBoardEmpty(ObjectToBoardGame(room.boardGame, boardSize), boardSize);
                console.log('>>> board value:' + empty);
                if (empty > 0) {
                    // Ván đấu đã bắt đầu nếu 1 trong 2 người chơi thoát ra => thông báo người kia thắng cuộc
                    let otherPlayer = getOtherPlayer(room.players, socket.id);
                    console.log('>>> other player:');
                    console.log(otherPlayer);
                    if (otherPlayer !== undefined && otherPlayer !== null && otherPlayer.username !== "") {
                        if (room.playStatus === 2) {
                            
                            stringWiner = "~ WINER ~";
                            io.to(room.roomId).emit("server-send-winer", stringWiner);

                            // cập nhật trạng thái kết thúc ván đấu
                            room.playStatus = 3;
                            // cập nhật người thắng cuộc
                            room.winner = otherPlayer;

                            // lưu ván đấu vào histories
                            CreateHistory(room);
                            UpdateScore(otherPlayer.username, 3);
                            UpdateScore(player.username, -2);
                        }
                    }
                    // xóa user khỏi danh sách players
                    room.players = playerRemain(room.players, socket.id);
                }
                else {
                    // xóa user khỏi danh sách players; Có thể đợi người khác vào chơi nếu ván đấu chưa bắt đầu
                    room.players = playerRemain(room.players, socket.id);
                }

                // xóa user khỏi danh sách viewers
                room.viewers = playerRemain(room.viewers, socket.id);
            }
            else {
                // xóa user khỏi danh sách viewers
                room.viewers = playerRemain(room.viewers, socket.id);
            }

            room.save();
            socket.leave(room.roomId);
        }
    });

    // send message to other users in room
    socket.on("client-send-message", ({ msg, username, roomId }) => {
        io.to(roomId + "_chatroom").emit("server-send-message", FormatMessage(username, msg));
    });

    socket.on("client-send-ready", async function( { username, roomId } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            let status = room.player01Status + room.player02Status;
            console.log(`Play Status: ${status}`);
            if (status < 2) {
                let idxPlayer = GetUserIndex(room.players, socket.id);
                console.log(`Play index: ${idxPlayer}`);
                if (idxPlayer !== -1) {
                    // player status
                    console.log(`index player: ${idxPlayer}`)
                    if (idxPlayer === 0) {
                        room.player01Status = 1;
                    }
                    else {
                        room.player02Status = 1;
                    }

                    status = room.player01Status + room.player02Status;
                    console.log(`Play Status 2: ${status}`);
                    if (status === 2) {
                        room.playStatus = 1;
                        // ca 2 nguoi choi da san sang => start game
                        io.to(roomId + "_chatroom").emit("server-send-ready", room.players[room.playTurn]);
                    }
                    else {
                        // nothing
                    }
                    room.save();
                    console.log(room)
                }
            }
        }
    });

    //#region draw
    socket.on("client-send-draw", async function( { username, roomId } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            if (room.playStatus === 1 || room.playStatus === 2) {
                socket.broadcast.to(room.roomId).emit("server-confirm-draw");
            }
        }
    });

    socket.on("client-confirm-draw", async function( { username, roomId, flag } ) {
        console.log(">>> client-confirm-draw")
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            if (room.playStatus === 1 || room.playStatus === 2) {
                // ván đấu đang diễn ra
                if (flag === 1) {
                    io.to(room.roomId).emit("server-send-draw", (room.players[0]));

                    io.to(room.roomId + "_chatroom")
                        .emit("server-send-message", FormatMessage(botName, `Chess game ends in a draw!`));
                
                    // TODO: hiển thị newgame để chơi ván mới
                    // todo: thực hiện insert vào history
                    room.playStatus = 3;
                    room.winner = { socketId: "", username: "" };

                    CreateHistory(room);
                    room.save();
                }
            }
        }
    });

    //#endregion

    //#region new game

    socket.on("client-send-newgame", async function( { username, roomId } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            if (room.playStatus === 3) {
                // đã kết thúc ván đấu
                socket.broadcast.to(room.roomId).emit("server-confirm-newgame");
            }
        }
    });

    socket.on("client-confirm-newgame", async function( { username, roomId, flag } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            if (room.playStatus === 3) {
                // đã kết thúc ván đấu
                if (flag === 1) {
                    io.to(room.roomId + "_chatroom").emit("server-send-newgame", (room.players));
                }
                else 
                {
                    // remove player ra khỏi danh sách => thêm người tiếp theo viewer 
                }

                // reset
                room.playStatus = 0;
                room.playTurn = 0;
                room.player01Status = 0;
                room.player02Status = 0;
                room.winner = { socketId: "", username: "" }
                let arrayBoard = CreateMatrix(boardSize, 0);
                room.boardGame = BoardGameToObject(arrayBoard, boardSize);

                room.save();
            }
        }
    });

    //#endregion

    // client-send-resign
    socket.on("client-send-resign", async function( { username, roomId } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if (room !== null && room !== undefined) {
            if (room.playStatus === 1 || room.playStatus === 2) {
                // set status is finish
                room.playStatus = 3;
                let winner = getOtherPlayer(room.players, socket.id);
                room.winner = winner;

                stringLoser = "YOU'RE LOSER! RESIGN";
                socket.emit("server-send-loser", { message: stringLoser, leader: room.players[0] });

                stringWiner = "~ WINER ~";
                socket.broadcast.to(room.roomId).emit("server-send-winer", { message: stringWiner, leader: room.players[0] });

                // show message
                io.to(room.roomId + "_chatroom")
                    .emit("server-send-message", FormatMessage(botName, `Congratulation ${winner.username} is WINER!!!`));

                // lưu kết quả vào bảng histories
                CreateHistory(room);
                // Cập nhật score
                UpdateScore(winner.username, 3);
                let curPlayer = getCurrentUser(room.players, socket.id);
                UpdateScore(curPlayer.username, -2);

                // lưu lại trạng thái ván đấu
                room.save();
            }
        }
    });

    socket.on("client-send-loser", async function( { username, roomId } ) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            // set status is finish
            room.playStatus = 3;
            let winner = getOtherPlayer(room.players, socket.id);
            room.winner = winner;

            stringLoser = "YOU'RE LOSER! TIMEOUT";
            socket.emit("server-send-loser", { message: stringLoser, leader: room.players[0] } );

            stringWiner = "~ WINER ~";
            socket.broadcast.to(room.roomId).emit("server-send-winer", { message: stringWiner, leader: room.players[0] });
            
            // show message
            io.to(room.roomId + "_chatroom")
                .emit("server-send-message", FormatMessage(botName, `Congratulation ${winner.username} is WINER!!!`));

            // lưu kết quả vào bảng histories
            CreateHistory(room);
            // Cập nhật score
            UpdateScore(winner.username, 3);
            let curPlayer = getCurrentUser(room.players, socket.id);
            UpdateScore(curPlayer.username, -2);
            // lưu lại trạng thái ván đấu
            room.save();
        }
    });

    // click choi game
    socket.on("su-kien-click", async function (data) {
        let room = await getRoomInfoBySocketId(socket.id);
        if ( room !== null && room !== undefined ) {
            let boardGame = ObjectToBoardGame(room.boardGame, boardSize);
            let player = getCurrentUser(room.players, socket.id);
            //console.log(player);
            if (player !== undefined && player !== null && player.username !== '') {
                if (CheckPlayTurn(socket.id, room.playTurn, room.players) === 1) {
                    console.log(`Player turn: ${room.playTurn} - ${player.username}.`);
                    let col = data.x / 40;
                    let row = data.y / 40;
                    console.log('Point: ' + col + " - " + row);
                    if (room.playStatus === 0 || room.playStatus === 3) {
                        return;
                    }
                    else if (room.playStatus === 1) {
                        room.playStatus = 2;
                    }
                    else if (room.playStatus === 2) {
                        // continous
                    }
                    else { return; }
                    
                    // timer play
                    io.to(room.roomId).emit("server-send-timer", player);

                    // cap nhat turn cho nguoi khac truoc khi xu ly
                    room.playTurn = Math.abs(room.playTurn - 1);
                    let idxPlayer = GetUserIndex(room.players, socket.id);
                    if (idxPlayer === 0) {
                        if (boardGame[row][col] === 0) {
                            boardGame[row][col] = 1;
                            io.to(room.roomId + '_chatroom').emit("server-send-data", {
                                name: player.username,
                                x: data.x,
                                y: data.y,
                                nguoichoi: idxPlayer,
                                ArrId: idxPlayer,
                                Board: boardGame,
                                value: 1
                            })
                            if (Horizontal(boardGame, row, col, 1)
                                || Vertically(boardGame, row, col, 1)
                                || Diagonal(boardGame, row, col, 1)
                                || Diagonal_main(boardGame, row, col, 1)) {
                                stringLoser = "YOU'RE LOSER!";
                                stringWiner = "~ WINER ~";
                                socket.broadcast.to(room.roomId).emit("server-send-loser", { message: stringLoser, leader: room.players[0] });
                                socket.emit("server-send-winer", { message: stringWiner, leader: room.players[0] });

                                io.to(room.roomId + "_chatroom")
                                    .emit("server-send-message", FormatMessage(botName, `Congratulation ${player.username} is WINER!!!`));
                                
                                // set status is finish
                                room.playStatus = 3;
                                room.winner = player;
                                CreateHistory(room);

                                // Cập nhật score
                                UpdateScore(player.username, 3);
                                let otherPlayer = getOtherPlayer(room.players, socket.id);
                                UpdateScore(otherPlayer.username, -2);
                            }
                        }
                    }
                    else {
                        if (boardGame[row][col] === 0) {
                            boardGame[row][col] = 2;
                            io.to(room.roomId + '_chatroom').emit("server-send-data", {
                                name: player.username,
                                x: data.x,
                                y: data.y,
                                nguoichoi: idxPlayer,
                                ArrId: idxPlayer,
                                Board: boardGame,
                                value: 2
                            })
                            if (Horizontal(boardGame, row, col, 2)
                                || Vertically(boardGame, row, col, 2)
                                || Diagonal(boardGame, row, col, 2)
                                || Diagonal_main(boardGame, row, col, 2)) {
                                stringLoser = "YOU'RE LOSER!";
                                stringWiner = "~ WINER ~";
                                socket.broadcast.to(room.roomId).emit("server-send-loser", { message: stringLoser, leader: room.players[0] });
                                socket.emit("server-send-winer", { message: stringWiner, leader: room.players[0] });

                                io.to(room.roomId + "_chatroom")
                                    .emit("server-send-message", FormatMessage(botName, `Congratulation ${player.username} is WINER!!!`));
                                
                                // set status is finish
                                room.playStatus = 3;
                                room.winner = player;
                                CreateHistory(room);

                                // Cập nhật score
                                UpdateScore(player.username, 3);
                                let otherPlayer = getOtherPlayer(room.players, socket.id);
                                UpdateScore(otherPlayer.username, -2);
                            }
                        }
                    }
                }
                else {
                    // khong phai luot choi
                    console.log(`Khong phai luot choi: ${player.username}`)
                }
                room.boardGame = BoardGameToObject(boardGame, boardSize); 
            }
            
            room.save();
        }
    })

});

