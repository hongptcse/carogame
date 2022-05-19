const { status, render } = require('express/lib/response');
const User = require('../models/User');
const { mongooseToObject } = require('../../resources/util/mongoose');

class SiteController {
    index(req, res, next) {
        //res.render('home');
        if (req.session === null || req.session === undefined || !req.session.user) {
            return res.render('login');
        }
        return res.redirect("carogame/room");
    }

    logout(req, res, next) {
        req.session.destroy();
        res.redirect('/');
    }


    // xứ lý login
    async login(req, res, next) {
        // nếu chưa có session đăng nhập thì quay trở lại page home => login
        if (req.method === 'GET') {
            //console.log (req.session);
            if (req.session === null || req.session === undefined || !req.session.user) {
                return res.render('login')
            }
            return res.redirect('carogame/room');
        }

        if (req.method === 'POST') {
            console.log(req.body.username + " " + req.body.username);
            let userLogin = "";

            await User.findOne({ username: req.body.username, password: req.body.password })
                .then(user => userLogin = mongooseToObject(user))
                .catch(next);

            if (userLogin !== null) {
                req.session.user = userLogin;
                //console.log (req.session);
                return res.redirect("carogame/room")

            }
            else {
                //console.log("Not found!!!")
                return res.render("login");
            }
        }
        else {
            return res.redirect("login");
        }
    }

    // xứ lý register
    async register(req, res, next) {
        if (req.method === 'GET') {
            return res.render("register");
        }

        if (req.method === 'POST') {
            let userReg;
            await User.findOne({ username: req.body.username })
                .then(user => userReg = mongooseToObject(user))
                .catch(next);

            if (userReg !== null && userReg !== undefined && userReg.username !== "") {
                return res.json( { mess: 'User đã tồn tại trên hệ thống!!!' });
            }
            else {
                // gán req.body vào biến
                const formData = req.body;
                formData.score = 100
                const user = new User(formData);
                user.save();
                
                return res.json( { mess: 'Thêm mới user thành công!!!' });
            }
        }
    }
}

module.exports = new SiteController();
