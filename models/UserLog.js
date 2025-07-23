const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  logId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  logTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  log: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserLog', UserLogSchema);
