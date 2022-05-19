const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;

const User = new Schema(
  {
    username: { type: String, maxlength: 50, require: true },
    password: { type: String, maxlength: 50, require: true },
    email: { type: String, maxlength: 150 },
    score: { type: Number, default: 100 },
  }, 
  { timestamps: true }, 
  { collection: 'users' }
);

module.exports = mongoose.model('users', User);
