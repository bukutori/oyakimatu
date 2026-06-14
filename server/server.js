/**
 * server.js
 * 畫師工具箱後端 API Server (Express + MongoDB Atlas)
 */
const path = require('path');
// 確保優先讀取本地 .env，如果沒有（如 Render 環境），則直接使用系統注入的環境變數
require('dotenv').config({ path: path.join(__dirname, '.env') }); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// ── MongoDB Connection ─────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB Atlas 連接成功');
})
.catch((err) => {
  console.error('❌ MongoDB Atlas 連接失敗:', err.message);
  process.exit(1);
});

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
app.use('/api/posts', require('./routes/posts'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Favorites API (MongoDB) ─────────────────────
const Favorite = require('./models/Favorite');
const Message = require('./models/Message');
const User = require('./models/User');
const { verifyToken, requireAdmin } = require('./middleware/auth');

// GET /api/favorites - 取得用戶收藏列表
app.get('/api/favorites', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let favorite = await Favorite.findOne({ userId });

    if (!favorite) {
      // 如果用戶沒有收藏記錄，建立一個空的
      favorite = new Favorite({ userId, images: [] });
      await favorite.save();
    }

    res.json({ success: true, images: favorite.images });
  } catch (err) {
    console.error('[GET /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// POST /api/favorites - 新增收藏
app.post('/api/favorites', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: '請提供圖片資料' });
    }

    let favorite = await Favorite.findOne({ userId });

    if (!favorite) {
      favorite = new Favorite({ userId, images: [] });
    }

    // 檢查是否已經收藏
    const exists = favorite.images.some(img => img.id === image.id);
    if (exists) {
      return res.status(409).json({ success: false, message: '此圖片已收藏' });
    }

    favorite.images.push(image);
    await favorite.save();

    res.json({ success: true, images: favorite.images });
  } catch (err) {
    console.error('[POST /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// DELETE /api/favorites/:imageId - 刪除收藏
app.delete('/api/favorites/:imageId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    let favorite = await Favorite.findOne({ userId });

    if (!favorite) {
      return res.status(404).json({ success: false, message: '找不到收藏記錄' });
    }

    favorite.images = favorite.images.filter(img => img.id !== imageId);
    await favorite.save();

    res.json({ success: true, images: favorite.images });
  } catch (err) {
    console.error('[DELETE /api/favorites] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ── Messages API (討論版) ─────────────────────
// GET /api/messages - 取得所有留言
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('[GET /api/messages] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// POST /api/messages - 新增留言
app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { artistNickname, content } = req.body;
    const userId = req.user.id;

    if (!artistNickname || !content) {
      return res.status(400).json({ success: false, message: '請填寫所有欄位' });
    }

    const newMessage = new Message({
      artistNickname,
      content,
      userId,
      createdAt: new Date()
    });

    await newMessage.save();

    res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error('[POST /api/messages] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ── Admin API (管理員專用) ─────────────────────
// GET /api/admin/users - 取得所有用戶列表（僅管理員）
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error('[GET /api/admin/users] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// GET /api/admin/photo-access - 取得照片存取統計（僅管理員）
app.get('/api/admin/photo-access', verifyToken, requireAdmin, async (req, res) => {
  try {
    const PhotoAccess = require('./models/PhotoAccess');
    const accessLogs = await PhotoAccess.find().sort({ timestamp: -1 }).limit(100);
    const totalAccess = await PhotoAccess.countDocuments();
    
    // 統計各類別存取次數
    const categoryStats = await PhotoAccess.aggregate([
      { $group: { _id: '$photoCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 統計使用者存取次數
    const userStats = await PhotoAccess.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ 
      success: true, 
      accessLogs,
      totalAccess,
      categoryStats,
      userStats
    });
  } catch (err) {
    console.error('[GET /api/admin/photo-access] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// PUT /api/admin/users/:userId/role - 修改用戶角色（僅管理員）
app.put('/api/admin/users/:userId/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: '無效的角色' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: '用戶不存在' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('[PUT /api/admin/users/:userId/role] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// DELETE /api/admin/messages/:messageId - 刪除留言（僅管理員）
app.delete('/api/admin/messages/:messageId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    res.json({ success: true, message: '留言已刪除' });
  } catch (err) {
    console.error('[DELETE /api/admin/messages/:messageId] Error:', err);
    res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ── Health Check + 秘密管理員後台 ────────────────────────────────────
app.get('/', async (req, res) => {
  const User = require('./models/User');
  const PhotoAccess = require('./models/PhotoAccess');

  let userRowsHtml = '';
  let totalUsers = 0;
  let photoAccessHtml = '';
  let totalPhotoAccess = 0;
  let categoryStatsHtml = '';

  try {
    const users = await User.find().select('username language').sort({ createdAt: -1 });
    totalUsers = users.length;

    if (totalUsers === 0) {
      userRowsHtml = `<tr><td colSpan="2" style="padding: 15px; text-align: center; color: #6272a4;">目前尚無註冊使用者</td></tr>`;
    } else {
      userRowsHtml = users.map(user => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px; font-weight: bold; color: #fff;">${user.username}</td>
          <td style="padding: 10px; color: #f1fa8c; text-align: right;">${user.language || 'zh'}</td>
        </tr>
      `).join('');
    }

    // 照片存取統計
    const accessLogs = await PhotoAccess.find().sort({ timestamp: -1 }).limit(10);
    totalPhotoAccess = await PhotoAccess.countDocuments();

    if (totalPhotoAccess === 0) {
      photoAccessHtml = `<tr><td colSpan="3" style="padding: 15px; text-align: center; color: #6272a4;">目前尚無照片存取記錄</td></tr>`;
    } else {
      photoAccessHtml = accessLogs.map(log => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px; color: #fff;">${log.username}</td>
          <td style="padding: 10px; color: #8be9fd;">${log.photoCategory || '未知'}</td>
          <td style="padding: 10px; color: #6272a4; text-align: right; font-size: 12px;">${new Date(log.timestamp).toLocaleString('zh-TW')}</td>
        </tr>
      `).join('');
    }

    // 分類統計
    const categoryStats = await PhotoAccess.aggregate([
      { $group: { _id: '$photoCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    if (categoryStats.length === 0) {
      categoryStatsHtml = `<tr><td colSpan="2" style="padding: 15px; text-align: center; color: #6272a4;">目前尚無統計資料</td></tr>`;
    } else {
      categoryStatsHtml = categoryStats.map(stat => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px; color: #fff;">${stat._id || '未知'}</td>
          <td style="padding: 10px; color: #50fa7b; text-align: right; font-weight: bold;">${stat.count}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    userRowsHtml = `<tr><td colSpan="2" style="padding: 15px; text-align: center; color: #ff5555;">讀取發生錯誤：${err.message}</td></tr>`;
    photoAccessHtml = `<tr><td colSpan="3" style="padding: 15px; text-align: center; color: #ff5555;">讀取發生錯誤：${err.message}</td></tr>`;
  }

  // 3. 把資料直接注入到原本漂亮的網頁畫面中！
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
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
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
                width: 100%;
                margin-bottom: 20px;
            }
            .admin-box {
                background: rgba(0, 0, 0, 0.3);
                padding: 20px;
                border-radius: 12px;
                text-align: left;
                border: 1px solid rgba(255,255,255,0.05);
                width: 100%;
                max-width: 450px;
                box-sizing: border-box;
            }
            h1 { color: #ff79c6; margin-bottom: 10px; font-size: 24px; }
            h2 { color: #8be9fd; margin: 0 0 15px 0; font-size: 16px; display: flex; justify-content: space-between; }
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
                margin-top: 15px;
            }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th { border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; color: #ffb86c; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🎨 畫師工具箱 API</h1>
            <div class="status">● SERVER RUNNING</div>
            <p>後端伺服器已成功部署至 Render！目前正穩定提供靈感抽籤與真人動作圖庫數據支援。</p>
            <div class="endpoint-box">
                📡 核心節點：<br>
                • 圖片 API: /api/images<br>
                • 收藏庫: /api/favorites
            </div>
        </div>

        <div class="admin-box">
            <h2>
              <span>🎖️ 雲端註冊名單 (Admin)</span>
              <span style="color: #ff79c6;">共 ${totalUsers} 人</span>
            </h2>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">帳號名稱 (Username)</th>
                        <th style="text-align: right;">偏好語系</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRowsHtml}
                </tbody>
            </table>
        </div>

        <div class="admin-box">
            <h2>
              <span>📸 照片存取記錄 (Photo Access)</span>
              <span style="color: #50fa7b;">共 ${totalPhotoAccess} 次</span>
            </h2>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">使用者</th>
                        <th style="text-align: left;">分類</th>
                        <th style="text-align: right;">時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${photoAccessHtml}
                </tbody>
            </table>
        </div>

        <div class="admin-box">
            <h2>
              <span>📊 分類統計 (Category Stats)</span>
            </h2>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">分類名稱</th>
                        <th style="text-align: right;">存取次數</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryStatsHtml}
                </tbody>
            </table>
        </div>
    </body>
    </html>
  `);
});
// ── Start Server ───────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server 運行在端口 ${PORT}`);
});