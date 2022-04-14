const { status, render } = require('express/lib/response');

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
        //console.log("Data from post method: " + req.body.username);
        //res.json(req.body);
        res.render('carogame/caro', { data: req.body });
    }

    // [GET] /carogame/join-game
    joinGame(req, res, next) {
        res.render('carogame/join-game')
    }
}

module.exports = new CaroGameController();
