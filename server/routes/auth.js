/**
 * routes/auth.js
 * 認證相關路由：登入、取得個人資料
 * 
 * 掛載點（在 server.js 中）：
 *   app.use('/api/auth', require('./routes/auth'));
 * 
 * ── 路由清單 ─────────────────────────────────────
 *   POST /api/auth/login     → 登入（回傳 token + 用戶資料）
 *   GET  /api/auth/me        → 取得目前登入用戶資料（需 JWT）
 * 
 * ── 對接 MongoDB 時的改動點 ──────────────────────
 *   將 readUsersDB() 替換為：
 *     const user = await User.findOne({ email });  （Mongoose）
 * ─────────────────────────────────────────────────
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');

const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── 讀取 JSON 模擬資料庫的工具函式 ───────────────
const USERS_PATH = path.join(__dirname, '../data/users.json');

function readUsersDB() {
    try {
        const raw = fs.readFileSync(USERS_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email: string, password: string }
// ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. 基本欄位驗證
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '請輸入 email 與密碼',
            });
        }

        // 2. 查找用戶（對接 MongoDB：User.findOne({ email })）
        const users = readUsersDB();
        const user  = users.find(u => u.email === email.toLowerCase().trim());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼不正確',
            });
        }

        // 3. 驗證密碼（bcryptjs 非同步比對）
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼不正確',
            });
        }

        // 4. 簽發 JWT（Payload 只放必要欄位，不放敏感資料）
        const payload = {
            id:       user.id,
            username: user.username,
            role:     user.role,
        };
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '7d', // 7 天有效期
        });

        // 5. 回傳 token 與去敏的用戶資料
        //    前端存入 localStorage: { token, user }
        const safeUser = {
            id:          user.id,
            username:    user.username,
            email:       user.email,
            displayName: user.displayName,
            avatarUrl:   user.avatarUrl,
            role:        user.role,
            createdAt:   user.createdAt,
        };

        return res.status(200).json({
            success: true,
            message: '登入成功',
            token,
            user: safeUser,
        });

    } catch (err) {
        console.error('[POST /api/auth/login] Error:', err);
        return res.status(500).json({
            success: false,
            message: '伺服器發生錯誤，請稍後再試',
        });
    }
});

// ─────────────────────────────────────────────────
// GET /api/auth/me   （需要 JWT 保護）
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.get('/me', verifyToken, (req, res) => {
    try {
        // req.user 由 verifyToken 中介層注入
        const users   = readUsersDB();
        const user    = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: '用戶不存在' });
        }

        const safeUser = {
            id:          user.id,
            username:    user.username,
            email:       user.email,
            displayName: user.displayName,
            avatarUrl:   user.avatarUrl,
            role:        user.role,
            createdAt:   user.createdAt,
        };

        return res.status(200).json({ success: true, user: safeUser });

    } catch (err) {
        console.error('[GET /api/auth/me] Error:', err);
        return res.status(500).json({ success: false, message: '伺服器發生錯誤' });
    }
});

module.exports = router;
