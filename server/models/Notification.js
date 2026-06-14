/**
 * models/Notification.js
 * Notification Schema for MongoDB
 * 通知系統資料模型
 *
 * 觸發場景：
 *   - apply:    一般用戶發文 → 通知所有管理員
 *   - approved: 管理員核准貼文 → 通知貼文作者
 *   - comment:  有人在明信片留言 → 通知明信片作者（自己留言不通知）
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['apply', 'approved', 'comment'],
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  message: {
    type: String,
    required: true,
    maxlength: 200
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// 複合索引：加速「某用戶未讀通知」查詢
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
