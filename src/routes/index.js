const siteRouter = require('./site');
const caroGameRouter = require('./carogame');

function route(app) {
    app.use('/carogame', caroGameRouter);
    app.use('/', siteRouter);
}

module.exports = route;
