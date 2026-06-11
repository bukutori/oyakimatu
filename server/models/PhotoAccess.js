/**
 * models/PhotoAccess.js
 * Photo Access Schema for MongoDB
 * 追蹤使用者存取照片的記錄
 */

const mongoose = require('mongoose');

const photoAccessSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  photoId: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String
  },
  photoCategory: {
    type: String
  },
  accessType: {
    type: String,
    enum: ['view', 'favorite', 'download'],
    default: 'view'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引優化查詢
photoAccessSchema.index({ userId: 1, timestamp: -1 });
photoAccessSchema.index({ photoId: 1, timestamp: -1 });

module.exports = mongoose.model('PhotoAccess', photoAccessSchema);
