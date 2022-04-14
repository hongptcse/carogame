const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
let username = sessionStorage.getItem("username");
let roomId = sessionStorage.getItem("room");

var socket = io("http://localhost:8080");

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
    socket.emit('client-send-message', msg);
  
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

socket.on("join-game-success", function(data) {
    $("#players").text("");
    data.forEach(element => {
        $("#players").append(element.username + " ");
    });
});

socket.on("server-user-existent", function(user) {
    alert(`Người chơi ${user.username} đã tồn tại!!`)
    window.location = "/";
});

socket.on("server-send-board", function(arrayBoard) {
    // console.log(`>>Mảng dữ liệu đã chơi: ` + arrayBoard);
    drawPlayedBoard(arrayBoard);
});

socket.on("join-chat-success", function (data) {
    $("#userList").text(" " + data + " ");
});

socket.on("server-update-users", function (data) {
    $("#userList").text(" " + data + " ");
});

$(document).ready(function () {
    console.log("Data onload " + username + " " + roomId);
    socket.emit("client-send-user", ({ username, roomId }));
});

// Output message to DOM
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
 const svg = div.append("svg").attr("width", 650).attr("height", 650);
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
                 socket.emit("su-kien-click", {x: selected.attr('x'), y: selected.attr('y')})

             });
         if ((i + j) % 2 === 0) {
             box.attr("fill", "beige");
         } else {
             box.attr("fill", "beige");
         }
     }
}

//----------In len man hinh nguoi choi bi thua va nguoi thang cuoc--------
socket.on("server-send-loser", function (data) {
    const lost = svg
        .append("text")
        .attr("x", 200)
        .attr("y", 275)
        .text(data)
        .style("fill","red")
        .style("font-size", "30px")
        .style("font-weight", "bolder");

    //khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
    $('#content').css('pointer-events', 'none');
})

socket.on("server-send-winer", function (data) {
    console.log('da thang cuoc');
    const lost = svg
        .append("text")
        .attr("x", 150)
        .attr("y", 275)
        .text(data)
        .style("fill","green")
        .style("font-size", "30px")
        .style("font-weight", "bolder");
    
    //khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
    $('#content').css('pointer-events', 'none');
})

//----------------------------
socket.on("server-send-data", function (data) {
    console.log("gia tri ma client nhan tu server:")
    console.log("mang nguoi choi :" + data.ArrId)
    console.log("Id:" + data.name);
    console.log("nguoi cho thu:", data.nguoichoi)
    console.log("Ma tran cac nuoc di:", data.Board)
    console.log("Gia tri cua nguoi choi:" + data.value)
    console.log("x_client:" + data.x);
    console.log("y_client:" + data.y);
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
                return "000066"
            }
            else if (data.nguoichoi === 0) {
                return "FF0000"
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
                            return "000066"
                        }
                        else if (cellValue === 1) {
                            return "FF0000"
                        }
                    })
            }
        }
    }
}