var express = require('express');
var router = express.Router();
const siteController = require('../app/controllers/SiteController');
const middleware = require('../resources/util/middleware');


router.get('/', [middleware.checkLogin, siteController.index]);
router.get('/login', siteController.login);
router.post('/login', siteController.login);
router.get('/logout', siteController.logout);
router.get('/register', siteController.register);
router.post('/register', siteController.register);

module.exports = router;
