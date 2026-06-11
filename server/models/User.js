/**
 * models/User.js
 * User Schema for MongoDB
 * 對應原本的 users.json 結構
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  language: {
    type: String,
    default: 'zh'
  },
  favorites: [{
    id: String,
    author: String,
    url: String,
    isCustom: { type: Boolean, default: false }
  }],
  themeSettings: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
