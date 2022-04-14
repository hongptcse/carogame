var express = require('express');
var router = express.Router();
const caroGameController = require('../app/controllers/CaroGameController');
// const bodyParser = require('body-parser');

// var urlEncodedParser = bodyParser.urlencoded ({ extended: false });


router.get('/join-game', caroGameController.joinGame);
router.get('/caro', caroGameController.index);
router.post('/caro', caroGameController.newGame);

module.exports = router;
