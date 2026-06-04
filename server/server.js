/**
 * server.js
 * 畫師工具箱後端 API Server (Express + JSON 模擬資料庫)
 * 
 * 啟動方式：
 *   npm install
 *   npm start
 * 
 * 預設運行在 http://localhost:5000
 */
require('dotenv').config(); // 👈 這行一定要在最上面！
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/images', require('./routes/images'));

// ── Favorites API (模擬資料庫) ─────────────────────
const FAVORITES_PATH = path.join(__dirname, 'data/favorites.json');

function readFavoritesDB() {
  try {
    const raw = fs.readFileSync(FAVORITES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeFavoritesDB(data) {
  fs.writeFileSync(FAVORITES_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/favorites - 取得用戶收藏列表
app.get('/api/favorites', (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: '需要 userId 參數' });
    }

    const db = readFavoritesDB();
    const userFavorites = db[userId] || [];

    res.json({ success: true, favorites: userFavorites });
  } catch (err) {
    console.error('[GET /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// POST /api/favorites - 新增收藏
app.post('/api/favorites', (req, res) => {
  try {
    const { userId, image } = req.body;
    if (!userId || !image) {
      return res.status(400).json({ success: false, message: '需要 userId 和 image' });
    }

    const db = readFavoritesDB();
    if (!db[userId]) {
      db[userId] = [];
    }

    // 檢查是否已收藏
    const alreadySaved = db[userId].some(item => String(item.id) === String(image.id));
    if (alreadySaved) {
      return res.json({ success: true, message: '已收藏', favorites: db[userId] });
    }

    // 新增收藏
    db[userId].push({
      id: image.id,
      author: image.author || '未知作者',
      url: image.url || `https://picsum.photos/id/${image.id}/600/450`,
      isCustom: image.isCustom || false,
      savedAt: Date.now(),
    });

    writeFavoritesDB(db);
    res.json({ success: true, message: '收藏成功', favorites: db[userId] });
  } catch (err) {
    console.error('[POST /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// DELETE /api/favorites/:id - 移除收藏
app.delete('/api/favorites/:id', (req, res) => {
  try {
    const { userId } = req.body;
    const imageId = req.params.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: '需要 userId' });
    }

    const db = readFavoritesDB();
    if (!db[userId]) {
      return res.json({ success: true, favorites: [] });
    }

    db[userId] = db[userId].filter(item => String(item.id) !== String(imageId));
    writeFavoritesDB(db);

    res.json({ success: true, message: '移除成功', favorites: db[userId] });
  } catch (err) {
    console.error('[DELETE /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// ── Health Check ────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    message: '畫師工具箱 API Server 運行中',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login, /api/auth/me',
      favorites: '/api/favorites'
    }
  });
});

// ── Start Server ───────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server 運行在 http://localhost:${PORT}`);
  console.log(`📚 API 端點:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/favorites`);
  console.log(`   POST /api/favorites`);
  console.log(`   DELETE /api/favorites/:id`);
});
