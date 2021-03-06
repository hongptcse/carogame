# CARO GAME
Chương trình chơi cờ Caro được xây dựng có các tính năng cơ bản sau:
* Cho phép người chơi vào theo room: người chơi đầu tiên sẽ tạo room, người chơi thứ 2 sẽ join vào.
* Từ người join 3, 4,... có thể theo dõi trận đấu (không thể đánh cờ).
* Chương trình có tính năng chat để tất cả người trong room có thể nói chuyện với nhau qua chat box.

Các công nghệ được sử dụng để xây dựng chương trình:
* Express js, express-handlebars, moment: framework
* Morgan, node-sass, nodemon: trong quá trình dev
* Socket.io: Xử lý giao tiếp giữa client và server
* D3: Thư viện vẽ bàn cờ, vẽ các nước đi.


# Chương trình:
* Cho phép người dùng đăng ký tài khoản => quản lý dữ liệu trên MongoDB
* Khi người dùng đăng nhập vào hệ thống
- Hiển thị lịch sử 10 trận đấu gần nhất: trạng thái thắng thua của từng ván đấu
	=> có thể view được chi tiết kết quả trận đấu

* Menu hiển thị danh sách các room:
	+ Có các thông tin số lượng người dùng đã join vào room
	+ Click để join vào room.
	+ 02 người join vào đầu tiên thì sẽ là người chơi.
	+ Từ người thứ 3 trở đi => là viewer và chat

* Menu hiển thị leaderboards điểm của người chơi: điểm chơi sẽ tích lũy qua từng ván chơi
	+ Mặc định khi tạo user => điểm sẽ là 100đ
	+ Điểm qua mỗi ván: thắng: +3đ; hòa: +0đ; thua: -2đ
	
* Có 02 chế độ chơi:
	+ Classic: Không giới hạn thời gian
	+ Time limit: Ván đấu diễn ra trong 10 phút
	+ Tại cả 02 chế độ chời thì mỗi lượt đi chỉ kéo dài 01 phút nếu quá thời gian sẽ xử thua
	+ Đối với chế độ time limit thì nếu ai hết thời gian trước mà chưa phân thắng thua => sẽ xử thua
	+ Board giới hạn 15x15: nếu hết nước đi chưa phân thắng thua => xử hòa
	+ Sau mỗi trận => cập nhật lại điểm => leaderboards
	
* Dữ liệu sẽ được lưu trữ trên DB MongoDB.
	+ Users
	+ Rooms
	+ Histories
	+ Leaderboards
	+ Room_Players

# Giao diện trong game:
* Tại màn hình chơi có board chới game
* Cửa sổ chat
* Các button:
	+ Start: Người vào đầu tiên, là chủ phòng thì có quyền start game
	+ Draw: Trong quá trình chới thì cho phép yêu cầu hòa => người còn lại đồng ý thì xử hòa
	+ Resign: Thông báo thắng/thua tương ứng.
	+ New Game: Khi ván đấu kết thúc => có thể tái đấu bằng ván cờ mới.
* Cửa sổ thời gian:
	+ Thời gian còn lại của từng người đối với chế độ time limit.
	+ Thời gian mỗi lượt đi của từng người.

* Các bước xử lý khi chơi game:
	+ Khi người dùng join vào game, nếu là 02 người chơi sẽ hiển thị các nút tương ứng (Start, Draw, Resign và New game), nếu là viewer thì chỉ hiển thị board và cửa sổ chat
	+ Khi người chơi đầu tiên start game thì hiển thị đếm ngược từ 5 => 1 để bắt đầu chơi
	+ Khi một trong 02 người chơi click draw thì cần người còn lại confirm, nếu không confirm thì tiếp tục chơi và xử lý theo chế độ chơi
	+ Khi một trong 02 người chơi click resign => thông báo thắng/thua và tính điểm.
	+ Khi ván cờ kết thúc thì hiển thị button New game để chơi ván đấu mới
	
* Xử lý khi có người thoát khỏi room:
	+ Nếu là một trong 02 người chơi:
		- Nếu ván đấu chưa chơi nước đi nào => người tiếp theo trong danh sách sẽ được thay thế để chơi => thông báo cho người chơi biết
		- Nếu ván đấu đã có nước đi => người thoát sẽ xử thua cuộc => kết thúc ván
	+ Nếu là viewer: Chỉ thông báo trên cửa sổ chat 	
	
* Xử lý khi kết thúc ván cờ:
	+ Điểm qua mỗi ván: thắng: +3đ; hòa: +0đ; thua: -2đ


# Hướng dẫn cách chạy chương trình
* Github: https://github.com/hongptcse/carogame.git
* Chạy chương trình bằng lệnh trên Terminal: npm run start
* Nhập tên và room id => Tạo/join vào game

# Hoặc chơi online:
* Trên Chrome mở đường link: https://carogame-hpt.herokuapp.com/

# Giải thích chương trình 

## Người chơi truy cập vào đường dẫn https://carogame-hpt.herokuapp.com/ và login
![login](src/public/img/login.png)

## Các bước xử lý:

Khi người chơi vào trang chủ nhập thông tin username, room để tạo game thì sẽ được chuyển sang trang /carogame/caro
Tại bước pageload client sẽ gửi thông tin username, room để tạo/join game.

Client:
```javascript
$(document).ready(function () {
    console.log("Data onload " + username + " " + roomId);
    socket.emit("client-send-user", ({ username, roomId }));
});
```

Phía server sẽ lắng nghe sự kiện này và xử lý tạo room và add người chơi:
* Chương trình sẽ tạo ra một mảng để quản lý room (người chơi và chat); 2 người join đầu tiên sẽ là người chơi
* Hệ thống sẽ kiểm tra username đã tồn tại chưa, nếu đã tồn tại => thông báo cho client và redriect về trang đăng nhập
* Nếu join thành công sẽ thông báo tới tất cả người chơi qua cửa sổ chat

Server:
```javascript
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

			let empty = CheckBoardEmpty(arrayBoard, boardSize);
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
		socket.emit("server-send-message", FormatMessage(botName, "Welcome to room " + user.room));
		// broadcast when a user connects
		socket.broadcast
			.to(user.room + "_chatroom")
			.emit(
				"server-send-message",
				FormatMessage(botName, `${user.username} has joined to chat`)
			);
	}
});
```

* Nếu người 2 người chơi chưa thực hiện nước đi => có một người out ra thì người join thứ 3 sẽ thay thế chơi.
* Nếu người chơi đã thực hiện nước đi rồi và có một người chơi thoát ra => thông báo người chơi còn lại thắng cuộc

```javascript
// Server lang nghe khi co nguoi thoat
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
```
* Nếu người thứ 3, 4,... join sau khi 02 người chơi đã chơi cờ => thực hiện vẽ lại bàn cờ hiện tại
```javascript
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
```

* Server lắng nghe sự kiện chat khi có người gửi lên:
	- Server sẽ thực hiện gửi lại message đó đến toàn bộ người trong room bằng cách gọi hàm: io.sockets.emit()
Client:
```javascript
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
```

Server:
```javascript
socket.on("client-send-message", (msg) => {
        const user = getCurrentUser(users, socket.id);
        io.to(user.room + "_chatroom").emit("server-send-message", FormatMessage(user.username, msg));
    });
```

### Caro Game
Xử lý vẽ bàn cờ và các nước đi:

Tại server: tạo mảng 2 chiều để quản lý các nước đi:
```javascript
function createMatrix (n, init) {
    let mat = [];
    for (let i = 0; i < n; i++) {
        a = [];
        for (let j = 0; j < n; j++) {
            a[j] = init;
        }
        mat[i] = a;
    }
    return mat;
}

var arrayBoard = createMatrix(boardSize, 0);
```

Tại client thực hiện vẽ bàn cờ sử dụng D3:
```javascript
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
```
![new game](src/public/img/newgame.png)

* Khi người chơi kích vào 1 ô trong bàn cờ <=> gửi lên server `su-kien-click` với thông tin là toạ độ x, y
* Tại phía server lắng nghe `su-kien-click` và xử lý các bước:
    - Sử dụng mảng turnPlaylist để lưu thông tin lượt đánh của 2 người chơi và không cho 1 người chơi 2 lần liên tiếp.
    - Gửi thông tin về nước đi đến toàn bộ user trong room qua hàm io.sockets.emit(`server-send-data`, {data})
	```javascript
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

                            io.to(usr.room + "_chatroom").emit("server-send-message", FormatMessage(botName, `Congratulation ${usr.username} is WINER!!!`));
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

                            io.to(usr.room + "_chatroom").emit("server-send-message", FormatMessage(botName, `Congratulation ${usr.username} is WINER!!!`));
                        }
                    }
                }
            }
        }
    })
	```
	![play game](src/public/img/playgame.PNG)
	
    - Kiểm tra bàn cờ theo phương thẳng đứng, ngang, đường chéo xem có thoả mãn 5 nước đi liền mạch không: 
		+ Nếu không thì pass qua đến turn của người sau. 
		+ Nếu thoả mãn thì trả kết quả thắng/thua cho người chơi và gửi thông tin chúc mừng lên cửa sổ chat.
	![end game](src/public/img/endgame.PNG)
		
* Tại phía client, sau khi nhận được thông tin về nước đi qua sự kiện `send-play-turn` thì sẽ hiển thị nước đi đó lên giao diện bàn cờ.
```javascript
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
```


# Hạn chế của chương trình
* Chưa tạo được nhiều room chơi cùng lúc.
* Chưa lưu lịch sử các vãn đi, lịch sử chat vào database .


Nguồn tài liệu tham khảo:
* CaroGame: https://github.com/manhlinhhumg89/Game-Caro-use-Socketio-Expressjs.git
* Chat Realtime: https://github.com/bradtraversy/chatcord.git