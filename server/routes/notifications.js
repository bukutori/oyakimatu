/**
 * routes/notifications.js
 * 通知系統 API 路由
 *
 * ── 端點清單 ───────────────────────────────────────────────────────────────
 *
 * GET    /api/notifications             取得當前用戶的通知列表（最新 50 筆）
 * GET    /api/notifications/unread-count 取得未讀通知數量
 * PUT    /api/notifications/:id/read    將單筆通知標記為已讀
 * PUT    /api/notifications/read-all    一鍵全部已讀
 */

const express = require('express');
const router = express.Router();

const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// 取得當前用戶的通知列表（最新 50 筆）
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, notifications });
  } catch (err) {
    console.error('[GET /api/notifications] Error:', err);
    return res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// 取得未讀通知數量（輕量端點，供前端輪詢）
// ─────────────────────────────────────────────────────────────────────────────
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    return res.json({ success: true, count });
  } catch (err) {
    console.error('[GET /api/notifications/unread-count] Error:', err);
    return res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notifications/:id/read
// 將單筆通知標記為已讀
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '找不到該通知'
      });
    }

    return res.json({ success: true, notification });
  } catch (err) {
    console.error('[PUT /api/notifications/:id/read] Error:', err);
    return res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notifications/read-all
// 一鍵將當前用戶所有通知標記為已讀
// ─────────────────────────────────────────────────────────────────────────────
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    return res.json({ success: true, message: '所有通知已標記為已讀' });
  } catch (err) {
    console.error('[PUT /api/notifications/read-all] Error:', err);
    return res.status(500).json({ success: false, message: '伺服器發生錯誤' });
  }
});

module.exports = router;
