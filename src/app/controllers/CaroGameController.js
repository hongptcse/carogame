const { status, render } = require('express/lib/response');
const Room = require('../models/Room');
const { multipleHistoryToObject, multipleMongooseToObject } = require('../../resources/util/mongoose');
const { checkUserExists } = require('../../resources/util/user');
const User = require('../models/User');
const History = require('../models/History');

class CaroGameController {

    // [GET] /carogame/caro
    // index(req, res, next) {
    //     res.redirect('/');
    //     return;
    //     next();
    // }

    index(req, res, next)
    {
        //res.render('carogame/caro');
        return;
    }

    // [POST] /carogame/caro
    newGame(req, res, next) {
        res.render('carogame/caro', { data: req.body });
    }

    // [GET] /carogame/join-game
    joinGame(req, res, next) {
        res.render('carogame/join-game')
    }

    // [GET] /carogame/history
    historyGame(req, res, next) {
        if(req.method === 'GET')
        {
            let uname = req.session.user.username;
            History.find({ 'players': { $elemMatch: {'username' : uname } } }  )
                .limit(25)
                .then(histories => {
                    res.render('carogame/history', {
                        histories: multipleHistoryToObject(histories)
                    })
                })
                .catch(next);
        }
        else if (req.method === 'POST')
        {
            res.json("history")
        }
    }

    // [GET] /carogame/room
    roomList(req, res, next) {
        Room.find({})
            .then(rooms => {
                res.render('carogame/room', {     
                    rooms: multipleMongooseToObject(rooms)
                })
            })
            .catch(next);
    }

    // [GET] /carogame/:roomId
    playGame(req, res, next) {
        //console.log(req.params.roomId);
        // console.log('>>> User:')
        // console.log(req.session.user.username);
        // console.log('>>> room ID:');
        // console.log(req.params.roomId);
        req.session.room = req.params.roomId;
        res.cookie('username', req.session.user.username);
        res.cookie('room', req.params.roomId);
        res.render('carogame/caro');

        // Room.findOne({ roomId: req.params.roomId })
        //     .then(room => {
        //         if(room.players.length === 0 || room.players.length === 1) {
        //             // chua co nguoi choi nao
        //             // TODO: check player exists
        //             if(checkUserExists(room.players, req.session.user.username) === -1) {
        //                 room.players.push( { username : req.session.user.username, id : ''} );
        //             }
        //         }

        //         // TODO: check viewer exists
        //         if(checkUserExists(room.viewers, req.session.user.username) === -1) {
        //             room.viewers.push({ username : req.session.user.username, id : '' });
        //         }
        //         room.save();

        //         // set cookie values
        //         res.cookie('username', req.session.user.username);
        //         res.cookie('room', room.roomId);
        //         res.render('carogame/caro', { room : mongooseToObject(room)})
        //     })
        //     .catch(next);
    }

    // [GET] /carogame/leaderboard
    leaderboard(req, res, next) {
        User.find({})
            .sort({ score: -1 })
            .limit(10)
            .then(users => {
                res.render('carogame/leaderboard', {     
                    users: multipleMongooseToObject(users)
                })
            })
            .catch(next);
    }

}

module.exports = new CaroGameController();
