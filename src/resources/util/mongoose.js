module.exports = {
    multipleMongooseToObject: function (mongooses) {
        return mongooses.map(mongoose => mongoose.toObject());
    },
    mongooseToObject:  function (mongoose) {
        return mongoose ? mongoose.toObject() : mongoose;
    },

    multipleHistoryToObject: function (mongooses) {
        return mongooses.map(mongoose => {
            let tmp = mongoose.toObject();

            return { user01: tmp.players[0].username, user02: tmp.players[1].username, winner: tmp.winner.username }
        });
    },
}
