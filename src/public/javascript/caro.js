const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const username = getCookie(document.cookie, "username");
const roomId = getCookie(document.cookie, "room");
const player01 = document.getElementById("player_1");
const player02 = document.getElementById("player_2");

const btnReady = document.getElementById("btnReady");
const btnDraw = document.getElementById("btnDraw");
const btnResign = document.getElementById("btnResign");
const btnNewGame = document.getElementById("btnNewGame");

var socket = io("http://localhost:8080");
//var socket = io("https://carogame-hpt.herokuapp.com/");

const sec = 60;
const min = 10;
var timer;
var c = 60;
var t = 60;
var totalTime = 10;

function start() {
    c = sec;
    clearInterval(timer);
    timer = setInterval(() => {
        updateTurn();
        updateTotalTime();
    }, 1000);
}

function pause() {
    clearInterval(timer);
}

function updateTurn() {
    let turnTime = document.getElementById('turnTime');
    turnTime.innerHTML = --c;
    
    if(c === 0) {
        // thua cuoc do het luot di
        console.log("Bạn đã thua cuộc do hết thời gian lượt chơi");
        pause();
        c = sec;

        socket.emit("client-send-loser",  ({ username, roomId }));
    }
}

function updateTotalTime() {
    let totalTimeMinute = document.getElementById('totalTimeMinute');
    let totalTimeSecond = document.getElementById('totalTimeSecond');
    totalTimeSecond.innerHTML = --t;
    if(totalTime === min) {
        totalTimeMinute.innerHTML = --totalTime;
    }

    if(t === 0) {
        totalTimeMinute.innerHTML = --totalTime;
        if (totalTime === -1) {
            // totalTime = 0:00 => thua cuoc
            console.log("Bạn đã thua cuộc do hết thời gian lượt chơi");
            pause();
            
            socket.emit("client-send-loser",  ({ username, roomId }));
            totalTime = min;
        }
        t = sec;
    }
}

socket.on("server-send-timer", function(player){
    if (player.username === username) {
        /** người vừa chơi
         * stop timer
         * - pause total time
         * - reset turn time
         * */ 
        pause();
    }
    else {
        start();
    }
});

// get cookie value
function getCookie(cookie, name) {
    const q = {}
    cookie?.replace(/\s/g, '')
      .split(';')
      .map(i => i.split('='))
      .forEach(([key, value]) => {
        q[key] = value
      })
    return q[name] ?? null;
}

btnReady.addEventListener('click', function(e){
    console.log('>>> Ready!!!')
    let pop = confirm('Bạn đã sẵn sàng chơi game?')
    if(pop) {
        btnReady.style = "display: none;";

        btnDraw.style = "display: inline;";
        btnResign.style = "display: inline;";
        socket.emit("client-send-ready", ({ username, roomId }));
    }
});

//#region draw
btnDraw.addEventListener('click', function(e){
    let pop = confirm('Bạn có chắc chắn muốn hòa cờ?');
    if(pop) {
        socket.emit("client-send-draw", ({ username, roomId }));
    }
});

socket.on("server-confirm-draw", function() {
    window.focus();
    let pop = confirm("Bạn có đồng ý hòa ván này không?");
    if(pop) {
        socket.emit("client-confirm-draw", ({ username, roomId, flag: 1 }));
    } else {
        socket.emit("client-confirm-draw", ({ username, roomId, flag: 0 }));
    }
});

socket.on("server-send-draw", function(player) {
    console.log(">>> server-send-draw: ")
    console.log(player)
    // xóa ván cờ trước
    // ClearUI();
    // reset timer
    pause();

    // set giá trị thời gian
    c = sec;
    t = sec;

    let totalTimeMinute = document.getElementById('totalTimeMinute');
    let totalTimeSecond = document.getElementById('totalTimeSecond');
    let turnTime = document.getElementById('turnTime');
    totalTimeMinute.innerHTML = min;
    totalTimeSecond.innerHTML = "00";
    turnTime.innerHTML = "00";

    if (player.username === username) {
        // hiển thị button newgame đối với chủ phòng
        btnNewGame.style = "display: inline;";

        btnReady.style = "display: none;";
        btnDraw.style = "display: none;";
        btnResign.style = "display: none;";
    }
    else {
        btnNewGame.style = "display: none;";
        btnReady.style = "display: none;";
        btnDraw.style = "display: none;";
        btnResign.style = "display: none;";
    }
});

//#endregion

btnResign.addEventListener('click', function(e){
    let pop = confirm('Bạn có chắc chắn muốn đầu hàng?')
    if(pop) {
        socket.emit("client-send-resign", ({ username, roomId }));
    }
});

//#region new game
btnNewGame.addEventListener('click', function(e){
    //console.log('>>> New game!!!')
    let pop = confirm('Bạn có muốn chơi ván game mới?');
    if(pop) {
        socket.emit("client-send-newgame", ({ username, roomId }));
    }
});

socket.on("server-confirm-newgame", function() {
    window.focus();
    let pop = confirm("Bạn có đồng ý chơi ván game mới không?");
    if(pop) {
        socket.emit("client-confirm-newgame", ({ username, roomId, flag: 1 }));
    } else {
        socket.emit("client-confirm-newgame", ({ username, roomId, flag: 0 }));
    }
});

socket.on("server-send-newgame", function(player) {
    ClearUI();
    pause();

    c = sec;
    t = sec;

    let totalTimeMinute = document.getElementById('totalTimeMinute');
    let totalTimeSecond = document.getElementById('totalTimeSecond');
    let turnTime = document.getElementById('turnTime');
    totalTimeMinute.innerHTML = min;
    totalTimeSecond.innerHTML = "00";
    turnTime.innerHTML = "00";

    if (player[0].username === username || player[1].username === username) {
        // nothing
        // show/hide button
        btnReady.style = "display: inline;";
        btnDraw.style = "display: none;";
        btnResign.style = "display: none;";
        btnNewGame.style = "display: none;";
    }    
});
//#endregion

// Send message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();
    if (!msg) {
      return false;
    }
    console.log(msg);
    // Emit message to server
    socket.emit('client-send-message', { msg, username, roomId } );
  
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });

// Message from server
socket.on('server-send-message', (message) => {
    console.log(message);
    outputMessage(message);
  
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

$(document).ready(function () {
    console.log(">>> Data on loading page " + username + " " + roomId);
    socket.emit("client-send-user", ({ username, roomId }));
});

socket.on("join-game-success", function(data) {
    player01.innerHTML = data[0].username;
    if (data.length > 1) {
        player02.innerHTML = data[1].username;
    }
});

socket.on("server-send-ready", function(player) {
    console.log(player);
    if (player.username === username) {
        start();
    }
});

socket.on("server-send-board", function(arrayBoard) {
    drawPlayedBoard(arrayBoard);
});

socket.on("join-chat-success", function (data) {
    $("#userList").text(" " + data + " ");
});


// Output message
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username;
    p.innerHTML += `<span> ${message.time}</span>`;
    div.appendChild(p);
    const para = document.createElement('p');
    para.classList.add('message-content');
    para.innerText = message.msg;
    div.appendChild(para);
    document.querySelector('.chat-messages').appendChild(div);
}

/**
 * Ve ban co caro
 * */
 const div = d3.select("#caro-board").append("div").attr("id", "content").style("text-align","center");

 // create <svg>
 var svg = div.append("svg").attr("width", 600).attr("height", 600);
 //-------------------------------------------------------
 let boxsize = 40 // kich thuoc cua moi o vuong
 let n= 15 // so luong o vuong tren 1 hang
 for (let i = 0; i < n; i++) {
     for (let j = 0; j < n; j++) {
         // draw each chess field
         const box = svg.append("rect")
             .attr("x", i * boxsize)
             .attr("y", j * boxsize)
             .attr("width", boxsize)
             .attr("height", boxsize)
             .attr("id", "b" + i + j)
             .style("stroke","black")
             .on("click", function () {
                 let selected = d3.select(this);
                 socket.emit("su-kien-click", {x: selected.attr('x'), y: selected.attr('y'), username, roomId })

             });
         if ((i + j) % 2 === 0) {
             box.attr("fill", "beige");
         } else {
             box.attr("fill", "beige");
         }
     }
}

function ClearUI() {
    div.select("svg").remove();
    svg = div.append("svg").attr("width", 600).attr("height", 600);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            // draw each chess field
            const box = svg.append("rect")
                .attr("x", i * boxsize)
                .attr("y", j * boxsize)
                .attr("width", boxsize)
                .attr("height", boxsize)
                .attr("id", "b" + i + j)
                .style("stroke","black")
                .on("click", function () {
                    let selected = d3.select(this);
                    socket.emit("su-kien-click", {x: selected.attr('x'), y: selected.attr('y'), username, roomId })
   
                });
            if ((i + j) % 2 === 0) {
                box.attr("fill", "beige");
            } else {
                box.attr("fill", "beige");
            }
        }
   }

   $('#content').css('pointer-events', 'auto');
}

//----------In len man hinh nguoi choi bi thua va nguoi thang cuoc--------
socket.on("server-send-loser", function ( { message, leader }) {
    console.log(`${username} đã thua cuộc`);

    if(leader.username === username) {
        btnNewGame.style = "display: inline;";
    }
    btnDraw.style = "display: none;";
    btnResign.style = "display: none;";
    const lost = svg
        .append("text")
        .attr("x", 150)
        .attr("y", 275)
        .text(message)
        .style("fill","red")
        .style("font-size", "30px")
        .style("font-weight", "bolder");

    //khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
    $('#content').css('pointer-events', 'none');
    pause();
})

socket.on("server-send-winer", function ({ message, leader }) {
    console.log(`${username} đã thắng cuộc`);

    if(leader.username === username) {
        // hiển thị button NewGame
        btnNewGame.style = "display: inline;";
    }
    btnDraw.style = "display: none;";
    btnResign.style = "display: none;";

    const lost = svg
        .append("text")
        .attr("x", 200)
        .attr("y", 275)
        .text(message)
        .style("fill","green")
        .style("font-size", "30px")
        .style("font-weight", "bolder");
    
    //khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
    $('#content').css('pointer-events', 'none');
    pause();
})

//----------------------------
socket.on("server-send-data", function (data) {
    console.log(">>> Client receive data from server <<<")
    console.log("Player turn: ");
    console.log(data.ArrId);
    console.log("Id: " + data.name.username);
    console.log("Player index: ", data.nguoichoi);
    console.log("Board game values:", data.Board);
    console.log("Cell value:" + data.value)
    console.log("x_client:" + data.x);
    console.log("y_client:" + data.y);
    console.log(">>> end <<<")
    let matrix = data.Board;
    let Cur_Row = parseInt(data.x);
    let Cur_Col = parseInt(data.y);
    let Value = parseInt(data.value);
    const tick = svg
        .append("text")
        .attr("x", parseInt(data.x))
        .attr("y", parseInt(data.y))
        .attr("text-anchor", "middle")
        .attr("dx", boxsize / 2)
        .attr("dy", boxsize / 2 + 8)
        .text(function () {
            if (data.nguoichoi === 1) {
                return "X"
            }
            else if (data.nguoichoi === 0) {
                return "O"
            }
        })
        .style("font-weight", "bold")
        .style("font-size", "30px")
        .style("fill", function () {
            if (data.nguoichoi === 1) {
                return "#000066"
            }
            else if (data.nguoichoi === 0) {
                return "#FF0000"
            }
        })
})

// Hàm vẽ lại bàn cờ khi đã có nước đi
function drawPlayedBoard(board) {
    let matrix = board.arrayBoard;
    let boardSize = board.boardSize;
    console.log(`>>Mảng dữ liệu đã chơi: `);
    console.log(matrix);
    console.log(boardSize);

    for (let i = 0; i < boardSize; i++) {
        let tmp = matrix[i];
        for (let j = 0; j < boardSize; j++) {
            let cellValue = tmp[j];
            console.log(`Vị trí: ${j} ${i} : ${cellValue}`);
            if (cellValue > 0) {
                const tick = svg
                    .append("text")
                    .attr("x", parseInt(j * boxsize))
                    .attr("y", parseInt(i * boxsize))
                    .attr("text-anchor", "middle")
                    .attr("dx", boxsize / 2)
                    .attr("dy", boxsize / 2 + 8)
                    .text(function () {
                        if (cellValue === 2) {
                            return "X"
                        }
                        else if (cellValue === 1) {
                            return "O"
                        }
                    })
                    .style("font-weight", "bold")
                    .style("font-size", "30px")
                    .style("fill", function () {
                        if (cellValue === 2) {
                            return "#000066"
                        }
                        else if (cellValue === 1) {
                            return "#FF0000"
                        }
                    })
            }
        }
    }
}