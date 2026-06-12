/**
 * routes/posts.js
 * 時光驛站牆（Station Wall）API 路由
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });

// ─────────────────────────────────────────────────
// POST /api/posts
// 使用者發布明信片，狀態預設為 pending
// Header: Authorization: Bearer <token>
// Body: multipart/form-data (image file + content text)
// ─────────────────────────────────────────────────
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const imageUrl = req.file?.path; // Cloudinary 回傳的圖片網址
    const userId = req.user.id;
    const username = req.user.username;

    if (!imageUrl || !content) {
      return res.status(400).json({
        success: false,
        message: '請提供圖片和內容'
      });
    }

    const newPost = new Post({
      imageUrl,
      content,
      username,
      userId,
      status: 'pending'
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      message: '明信片發布成功，等待審核',
      post: newPost
    });

  } catch (err) {
    console.error('[POST /api/posts] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// GET /api/posts/approved
// 公開端點，撈出所有 status: "approved" 的明信片
// 如果有 Token，額外撈取該用戶自己的 pending 明信片
// 依時間由新到舊排序
// ─────────────────────────────────────────────────
router.get('/approved', async (req, res) => {
  try {
    // 撈取所有已審核的明信片
    const approvedPosts = await Post.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(100);

    let posts = approvedPosts;

    // 如果有 Token，額外撈取該用戶自己的待審核明信片
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // 撈取該用戶自己的待審核明信片
        const userPendingPosts = await Post.find({ 
          userId: userId, 
          status: 'pending' 
        }).sort({ createdAt: -1 });

        // 將用戶的待審核明信片加入結果
        posts = [...userPendingPosts, ...approvedPosts].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      } catch (err) {
        // Token 無效，忽略錯誤，只返回已審核的明信片
        console.log('[GET /api/posts/approved] Token verification failed, returning approved posts only');
      }
    }

    res.json({
      success: true,
      posts
    });

  } catch (err) {
    console.error('[GET /api/posts/approved] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// GET /api/posts/pending
// 管理員專用，撈出所有 status: "pending" 的明信片
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.get('/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const pendingPosts = await Post.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      posts: pendingPosts
    });

  } catch (err) {
    console.error('[GET /api/posts/pending] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// PUT /api/posts/:id/approve
// 管理員專用，將明信片狀態改為 approved
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '明信片不存在'
      });
    }

    res.json({
      success: true,
      message: '明信片已審核通過',
      post
    });

  } catch (err) {
    console.error('[PUT /api/posts/:id/approve] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/posts/:id
// 管理員專用，刪除明信片
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '明信片不存在'
      });
    }

    res.json({
      success: true,
      message: '明信片已刪除'
    });

  } catch (err) {
    console.error('[DELETE /api/posts/:id] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// POST /api/posts/:id/comment
// 使用者對特定明信片新增留言
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const username = req.user.username;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '請提供留言內容'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '明信片不存在'
      });
    }

    post.comments.push({
      username,
      text,
      isRead: false,
      createdAt: new Date()
    });

    await post.save();

    res.json({
      success: true,
      message: '留言新增成功',
      post
    });

  } catch (err) {
    console.error('[POST /api/posts/:id/comment] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// GET /api/notifications/unread
// 撈出屬於當前用戶發布的 posts 中，isRead === false 且留言者不是發文者自己的留言總數
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.get('/notifications/unread', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 撈出該用戶的所有明信片
    const userPosts = await Post.find({ userId });

    // 計算未讀留言總數（排除發文者自己的留言）
    let unreadCount = 0;
    userPosts.forEach(post => {
      post.comments.forEach(comment => {
        if (!comment.isRead && comment.username !== req.user.username) {
          unreadCount++;
        }
      });
    });

    res.json({
      success: true,
      unreadCount
    });

  } catch (err) {
    console.error('[GET /api/notifications/unread] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────
// PUT /api/notifications/read-all
// 將當前用戶所有明信片下的留言一鍵更新為 isRead: true
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────
router.put('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 更新該用戶所有明信片的所有留言為已讀
    await Post.updateMany(
      { userId },
      { $set: { 'comments.$[].isRead': true } }
    );

    res.json({
      success: true,
      message: '所有留言已標記為已讀'
    });

  } catch (err) {
    console.error('[PUT /api/notifications/read-all] Error:', err);
    res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

module.exports = router;
