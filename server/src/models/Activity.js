const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  date: { type: Date, default: Date.now },
  details: { type: Object },
});

module.exports = mongoose.model('Activity', activitySchema); 