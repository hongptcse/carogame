const express = require('express');
//const morgan = require('morgan');
const { engine } = require('express-handlebars');
const path = require('path');
const route = require('./routes');
//const io = require("socket.io")

const {
    userJoin,
    getPlayers,
    getOtherPlayer,
    getCurrentUser,
    getExistsUser,
    userLeave,
    playerLeave,
    getRoomUsers
  } = require('./resources/util/user');

const { 
    createMatrix,
    checkBoardEmpty,
    Horizontal,
    Vertically,
    Diagonal,
    Diagonal_main } = require('./resources/util/game');
const formatMessage = require('./resources/util/message');


const app = express();
const port = 443;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

const botName = 'Bot ';
const boardSize = 15;

var users = [];
var turnPlaylist = [];
var arrayBoard = createMatrix(boardSize, 0);


io.on("connection", function(socket){
    console.log("Co nguoi ket noi vao server: " + socket.id);

    socket.on("disconnect", function() {
        console.log(socket.id + " ngat ket noi!");
        //chatUserList = arrayRemove(chatUserList, socket.username)
        io.sockets.emit("server-update-users", users);

        let disconnectedUser = getCurrentUser(users, socket.id);
        
        if (disconnectedUser !== undefined && disconnectedUser !== null && disconnectedUser.player === 1) {
            // trường hợp nếu người disconnect là người chơi => thông báo cho đối thủ thắng do người chơi bỏ cuộc
            let empty = checkBoardEmpty(arrayBoard, boardSize);
            if (empty > 0) {
                // Ván đấu đã bắt đầu nếu 1 trong 2 người chơi thoát ra => thông báo người kia thắng cuộc
                let otherPlayer = getOtherPlayer(users, socket.id);
                if (otherPlayer.length > 0) {
                    otherPlayer = otherPlayer[0];
                }
                console.log(otherPlayer);
                stringWiner = "~ WINER ~";
                io.to(otherPlayer.room).emit("server-send-winer", stringWiner);

                playerLeave(users, socket.id);
            }
            else {
                // có thể đợi người khác vào chơi nếu ván đấu chưa bắt đầu
                playerLeave(users, socket.id);
            }
        }
        else if (disconnectedUser !== undefined && disconnectedUser !== null && disconnectedUser.player === 0){
            userLeave(users, socket.id);
        }
    });

    socket.on("client-send-message", (msg) => {
        const user = getCurrentUser(users, socket.id);
        io.to(user.room + "_chatroom").emit("server-send-message", formatMessage(user.username, msg));
    });

    // Server lang nghe khi co nguoi moi join vao Room
    socket.on("client-send-user", function( { username, roomId} ) {
        const user = userJoin(socket.id, username, roomId, 0);
        //console.log("Socket Id: " + user.id + ", Username: " + user.username  + ", Room Id: " + user.room);

        // kiểm tra người chới theo user đã có trong list chưa => thông báo
        let exists = getExistsUser(users, user.username);
        if(exists !== -1) {
            socket.emit("server-user-existent", user);
        }

        else {
            if (users.length < 2) {
                // Nếu số người chơi < 2 => thêm mới người chơi: player flag = 1
                user.player = 1;
                // add user to list
                users.push(user);
                // join user to play room
                socket.join(user.room);
                io.sockets.emit("join-game-success", getPlayers(users));
            } else {
                // Nếu số người chơi >= 2 => thêm mới người vào room chat: player flag = 0
                user.player = 0;
                // add user to list
                users.push(user);

                let empty = checkBoardEmpty(arrayBoard, boardSize);
                if(empty > 0) {
                    // đã có nước đi => cần vẽ lại nước đi
                    let board = { arrayBoard, boardSize };
                    socket.emit("server-send-board", board);
                }
                else {
                    //  không cần vẽ lại nước đi
                }
            }
            // join user to chat room = room id + _chatroom
            socket.join(user.room + "_chatroom");

            // send message welcome to current user
            socket.emit("server-send-message", formatMessage(botName, "Welcome to room " + user.room));
            // broadcast when a user connects
            socket.broadcast
                .to(user.room + "_chatroom")
                .emit(
                    "server-send-message",
                    formatMessage(botName, `${user.username} has joined to chat`)
                );
        }
    });

    socket.on("su-kien-click", function (data) {
        let usr = getCurrentUser(users, socket.id);
        if (usr.player === 1) {
            let vitri = users.indexOf(usr);
            console.log(`Player turn: ${vitri} - ${usr.username}.`);
            let col = data.x / 40;
            let row = data.y / 40;
            //Kiem tra khong cho nguoi choi gui du lieu 2 lan lien tuc len server
            if (usr !== turnPlaylist[0]) {
                turnPlaylist.unshift(usr);
                if (vitri === 0) {
                    if (arrayBoard[row][col] === 0) {
                        arrayBoard[row][col] = 1;
                        io.sockets.emit("server-send-data", {
                            name: usr,
                            x: data.x,
                            y: data.y,
                            nguoichoi: vitri,
                            ArrId: turnPlaylist,
                            Board: arrayBoard,
                            value: 1
                        })
                        if (Horizontal(arrayBoard, row, col, 1)
                            || Vertically(arrayBoard, row, col, 1)
                            || Diagonal(arrayBoard, row, col, 1)
                            || Diagonal_main(arrayBoard, row, col, 1)) {
                            stringLoser = "YOU'RE LOSER!";
                            stringWiner = "~ WINER ~";
                            socket.broadcast.emit("server-send-loser", stringLoser);
                            socket.emit("server-send-winer", stringWiner);

                            io.to(usr.room + "_chatroom").emit("server-send-message", formatMessage(botName, `Congratulation ${usr.username} is WINER!!!`));
                        }
                    }
                }
                else {
                    if (arrayBoard[row][col] === 0) {
                        arrayBoard[row][col] = 2;
                        io.sockets.emit("server-send-data", {
                            name: usr,
                            x: data.x,
                            y: data.y,
                            nguoichoi: vitri,
                            ArrId: turnPlaylist,
                            Board: arrayBoard,
                            value: 2
                        })
                        if (Horizontal(arrayBoard, row, col, 2)
                            || Vertically(arrayBoard, row, col, 2)
                            || Diagonal(arrayBoard, row, col, 2)
                            || Diagonal_main(arrayBoard, row, col, 2)) {
                            stringLoser = "YOU'RE LOSER!";
                            stringWiner = "~ WINER ~";
                            socket.broadcast.emit("server-send-loser", stringLoser);
                            socket.emit("server-send-winer", stringWiner);

                            io.to(usr.room + "_chatroom").emit("server-send-message", formatMessage(botName, `Congratulation ${usr.username} is WINER!!!`));
                        }
                    }
                }
            }
        }
    })

});

