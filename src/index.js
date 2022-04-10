const express = require('express');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const path = require('path');
const route = require('./routes');
//const io = require("socket.io")

const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// http log
// app.use(morgan('common'));

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


io.on("connection", function(socket){
    console.log("Co nguoi ket noi vao server: " + socket.id);

    socket.on("disconnect", function() {
        console.log(socket.id + " ngat ket noi!");
    })
});

