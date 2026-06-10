/**
 * models/Message.js
 * Message Schema for MongoDB - 討論版留言
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  artistNickname: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
messageSchema.index({ createdAt: -1 });
messageSchema.index({ userId: 1 });

module.exports = mongoose.model('Message', messageSchema);
