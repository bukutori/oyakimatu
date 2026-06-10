/**
 * routes/auth.js
 * 認證相關路由：登入、取得個人資料
 *
 * 掛載點（在 server.js 中）：
 *   app.use('/api/auth', require('./routes/auth'));
 *
 * ── 路由清單 ─────────────────────────────────────
 *   POST /api/auth/register → 註冊（回傳 token + 用戶資料）
 *   POST /api/auth/login     → 登入（回傳 token + 用戶資料）
 *   GET  /api/auth/me        → 取得目前登入用戶資料（需 JWT）
 * ─────────────────────────────────────────────────
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ─────────────────────────────────────────────────
// POST /api/auth/register
// Body: { username: string, email: string, password: string, displayName: string }
// ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // 1. 基本欄位驗證
        if (!username || !email || !password || !displayName) {
            return res.status(400).json({
                success: false,
                message: '請填寫所有欄位',
            });
        }

        // 2. 檢查 email 是否已被註冊
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '此 Email 已被註冊',
            });
        }

        // 3. 檢查 username 是否已被使用
        const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: '此使用者名稱已被使用',
            });
        }

        // 4. 密碼加密
        const passwordHash = await bcrypt.hash(password, 10);

        // 5. 建立新用戶
        const newUser = new User({
            id: `usr_${uuidv4()}`,
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            displayName: displayName.trim(),
            avatarUrl: '',
            role: 'user',
            language: 'zh',
            createdAt: new Date(),
        });

        await newUser.save();

        // 6. 簽發 JWT
        const payload = {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
        };
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '7d',
        });

        // 7. 回傳 token 與用戶資料
        const safeUser = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            displayName: newUser.displayName,
            avatarUrl: newUser.avatarUrl,
            role: newUser.role,
            createdAt: newUser.createdAt,
        };

        return res.status(201).json({
            success: true,
            message: '註冊成功',
            token,
            user: safeUser,
        });

    } catch (err) {
        console.error('[POST /api/auth/register] Error:', err);
        return res.status(500).json({
            success: false,
            message: '伺服器發生錯誤，請稍後再試',
        });
    }
});

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

        // 2. 查找用戶
        const user = await User.findOne({ email: email.toLowerCase().trim() });

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
router.get('/me', verifyToken, async (req, res) => {
    try {
        // req.user 由 verifyToken 中介層注入
        const user = await User.findOne({ id: req.user.id });

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
