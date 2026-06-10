/**
 * models/Favorite.js
 * Favorite Schema for MongoDB - 用戶收藏
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  images: [{
    type: mongoose.Schema.Types.Mixed,
    required: true
  }]
}, {
  timestamps: true
});

// Create compound index for userId
favoriteSchema.index({ userId: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
