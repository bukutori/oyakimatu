/**
 * server.js
 * 畫師工具箱後端 API Server (Express + JSON 模擬資料庫)
 */
const path = require('path');
// 確保優先讀取本地 .env，如果沒有（如 Render 環境），則直接使用系統注入的環境變數
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────
app.use(cors({
  // ⚡ 這裡把所有可能的來源都加上，允許任何前端連進來
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  // 確保 data 資料夾存在
  const dir = path.dirname(FAVORITES_PATH);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
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
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>畫師工具箱 API 🚀</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e1e2f 0%, #252542 100%);
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                    max-width: 450px;
                    width: 90%;
                }
                h1 { color: #ff79c6; margin-bottom: 10px; font-size: 24px; }
                p { color: #a9a9b3; font-size: 14px; line-height: 1.6; }
                .status {
                    display: inline-block;
                    background: #50fa7b;
                    color: #1e1e2f;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 12px;
                    margin: 15px 0;
                }
                .endpoint-box {
                    background: rgba(0,0,0,0.2);
                    padding: 12px;
                    border-radius: 8px;
                    text-align: left;
                    font-family: monospace;
                    font-size: 13px;
                    color: #f1fa8c;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎨 畫師工具箱 API</h1>
                <div class="status">● SERVER RUNNING</div>
                <p>後端伺服器已成功部署至 Render！目前正穩定提供靈感抽籤與真人動作圖庫數據支援。</p>
                <hr style="border: 0.5px solid rgba(255,255,255,0.1); margin: 20px 0;">
                <div class="endpoint-box">
                    📡 核心節點：<br>
                    • 圖片 API: /api/images<br>
                    • 收藏庫: /api/favorites
                </div>
            </div>
        </body>
        </html>
    `);
});

// ── Start Server ───────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server 運行在端口 ${PORT}`);
});