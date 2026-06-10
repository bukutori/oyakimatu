/**
 * middleware/auth.js
 * JWT 驗證中介層
 *
 * 使用方式：在需要登入保護的路由上加入 verifyToken 中介層
 *   router.get('/protected', verifyToken, (req, res) => { ... });
 *
 * 使用方式：在需要管理員權限的路由上加入 requireAdmin 中介層
 *   router.get('/admin', verifyToken, requireAdmin, (req, res) => { ... });
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'art-tools-dev-secret-2025';

/**
 * verifyToken
 * 從 Authorization: Bearer <token> 標頭中取出並驗證 JWT
 * 驗證成功後，將解碼的 user 資料掛載到 req.user 供後續路由使用
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供認證 Token，請先登入',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username, role, iat, exp }
        next();
    } catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Token 已過期，請重新登入'
            : 'Token 無效，請重新登入';

        return res.status(403).json({ success: false, message });
    }
}

/**
 * requireAdmin
 * 檢查用戶是否為管理員（role = 'admin'）
 * 必須在 verifyToken 之後使用
 */
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理員權限',
        });
    }
    next();
}

module.exports = { verifyToken, requireAdmin, JWT_SECRET };
