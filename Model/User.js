const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    // log: [exerciseSchema],
    log:[ { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
  });

  module.exports = mongoose.model('User', userSchema);
