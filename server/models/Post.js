/**
 * models/Post.js
 * Post Schema for MongoDB
 * 時光驛站牆（Station Wall）明信片資料模型
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  username: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  comments: [{
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 300
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// 索引優化查詢
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
