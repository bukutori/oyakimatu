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

// ── Health Check + 秘密管理員後台 ────────────────────────────────────
app.get('/', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const usersFilePath = path.join(__dirname, 'data/users.json');

  let userRowsHtml = '';
  let totalUsers = 0;

  try {
    // 🛡️ 防禦性改進：不管檔案在不在，都用 try...catch 包死它，絕對不讓伺服器崩潰！
    if (fs.existsSync(usersFilePath)) {
      const rawData = fs.readFileSync(usersFilePath, 'utf-8');
      const users = JSON.parse(rawData || '[]');
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
    } else {
      // 💡 如果雲端沒有 users.json，就溫柔地顯示這行，而不是直接當機！
      userRowsHtml = `<tr><td colSpan="2" style="padding: 15px; text-align: center; color: #6272a4;">雲端尚未建立 users.json 檔案 (目前 0 人)</td></tr>`;
    }
  } catch (err) {
    userRowsHtml = `<tr><td colSpan="2" style="padding: 15px; text-align: center; color: #ff5555;">讀取發生錯誤：${err.message}</td></tr>`;
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
    </body>
    </html>
  `);
});
// ── Start Server ───────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server 運行在端口 ${PORT}`);
});