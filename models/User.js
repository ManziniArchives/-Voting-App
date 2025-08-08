const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: { type: String, unique: true },
  hash: String
});

module.exports = model('User', userSchema);