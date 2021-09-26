const mongoose = require('mongoose')

const exerciseSchema = mongoose.Schema({
userId: mongoose.Schema.Types.ObjectId,
  description: String,
  duration: Number,
  date: Date,
  });

  module.exports = mongoose.model('Exercise', exerciseSchema);
