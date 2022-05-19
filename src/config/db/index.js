const mongoose = require('mongoose');

async function connect() {
    try {
        // 'mongodb://localhost:27017/carogame'
        await mongoose.connect('mongodb+srv://hongptcse:DiepChi2810@hongptcse.i0w8w.mongodb.net/?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connect successfully!!!");
    } catch (error) {
        console.log("Connect failure!!!");
    }
};


module.exports = { connect };
