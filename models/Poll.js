const { Schema, model } = require('mongoose');
const OptionSchema = new Schema({
  text: String,
  votes: { type:Number, default:0 }
});
module.exports = model('Poll', new Schema({
  title: String,
  options: [OptionSchema],
  author: { type:Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true }));