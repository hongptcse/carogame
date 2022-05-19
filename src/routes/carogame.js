var express = require('express');
var router = express.Router();
const caroGameController = require('../app/controllers/CaroGameController');
const middleware = require('../resources/util/middleware');
// const bodyParser = require('body-parser');
// var urlEncodedParser = bodyParser.urlencoded ({ extended: false });

//router.get('/join-game', caroGameController.joinGame);
router.get('/caro', caroGameController.index);
router.post('/caro', caroGameController.newGame);
router.get('/history', [middleware.checkLogin, caroGameController.historyGame]);
router.post('/history', [middleware.checkLogin, caroGameController.historyGame]);
router.get('/leaderboard', [middleware.checkLogin, caroGameController.leaderboard]);
router.get('/room', [middleware.checkLogin, caroGameController.roomList]);
router.get('/:roomId', [middleware.checkLogin, caroGameController.playGame]);

module.exports = router;
