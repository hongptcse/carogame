const { status, render } = require('express/lib/response');

class SiteController {
    index(req, res, next) {
        res.render('home');
        //res.send("hongptcse");
    }
}

module.exports = new SiteController();
