// lưu lại thông tin username và room tại homepage vào session storage
function onSubmitNewGame() {
    let username = $("#username").val();
    let room = $("#room").val();
    //alert('Username: ' + username + ', room: ' + room);
    
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("room", room);
};