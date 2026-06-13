/**
 * routes/posts.js
 * 時光驛站牆（Station Wall）API 路由
 *
 * ── 第四階段：前後端認證與狀態持久化大整合 ─────────────────────────────────────
 *
 * ✅ 上傳流程：先 Cloudinary → 再 MongoDB
 *    multer-storage-cloudinary 攔截 multipart/form-data，
 *    上傳成功後 req.file.path 即為 Cloudinary 圖片 URL，
 *    再以該 URL + 其他欄位存入 MongoDB，status 預設 'pending'。
 *
 * ✅ 持久化撈取：GET /api/posts/approved
 *    - 無 Token：只回傳 status:'approved' 的明信片
 *    - 有效 Token：同時回傳該用戶自己的 status:'pending' 明信片（解決刷新消失）
 *
 * ✅ 管理員後台：GET /api/posts/pending
 *    - 受 verifyToken + requireAdmin 雙重保護
 *    - 需在 headers 帶上 Authorization: Bearer <token>
 *
 * ✅ 即時審核動作：
 *    - PUT  /:id/approve → 核准（僅 admin）
 *    - DELETE /:id       → 婉拒刪除（僅 admin）
 *
 * ✅ 環境變數安全規範：
 *    - Cloudinary 金鑰全由 process.env 讀取（見 config/cloudinary.js）
 *    - JWT_SECRET 由 process.env.JWT_SECRET 讀取（見 middleware/auth.js）
 */

const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const multer    = require('multer');

const Post                       = require('../models/Post');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');
const { storage }                = require('../config/cloudinary');

// multer 使用 cloudinary storage：收到 multipart 請求後，
// 自動先將圖片上傳至 Cloudinary，再把 URL 掛到 req.file.path
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 上限
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts
// 使用者發布明信片
// ── 執行順序：
//    1. verifyToken   → 確認登入身份
//    2. upload.single → multer 攔截 multipart，先將圖片上傳 Cloudinary
//    3. 取得 req.file.path（Cloudinary URL）
//    4. 建立 Post 物件存入 MongoDB（status: 'pending'）
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;

    // 1. 確認 Cloudinary 上傳成功（req.file 由 multer-storage-cloudinary 填入）
    const imageUrl = req.file?.path; // Cloudinary 回傳的完整 HTTPS 圖片網址
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '圖片上傳失敗，請確認 Cloudinary 設定或重試'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '請填寫故事文字'
      });
    }

    // 2. 存入 MongoDB（status 預設 'pending'，等待管理員審核）
    const newPost = new Post({
      imageUrl,                     // Cloudinary 圖片 URL
      content:  content.trim(),
      username: req.user.username,  // 來自 JWT payload
      userId:   req.user.id,        // 來自 JWT payload（與 User.id 對應）
      status:   'pending'           // 明確設定，雖然 schema 有 default 但明確更安全
    });

    await newPost.save();

    console.log(`[POST /api/posts] 新明信片已建立: ${newPost._id} by ${req.user.username}`);

    return res.status(201).json({
      success: true,
      message: '明信片發布成功，等待管理員審核',
      post:    newPost
    });

  } catch (err) {
    console.error('[POST /api/posts] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤，請稍後再試'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/posts/approved
// 公開端點（無需強制登入），撈取已審核的明信片
//
// ── 「持久化撈取」核心邏輯 ──────────────────────────────────────────────────
// ① 若請求未帶 Token（訪客）：只回傳 status:'approved' 的卡片
// ② 若請求帶有效 Token（登入用戶）：
//    - 同時撈取 status:'approved' 的所有卡片
//    - 以及「屬於當前用戶自己」的 status:'pending' 卡片
//    → 兩者合併回傳，解決普通用戶刷新/重登後自己的 pending 卡片消失的問題
// ─────────────────────────────────────────────────────────────────────────────
router.get('/approved', async (req, res) => {
  try {
    // 撈取所有已審核的明信片（任何人都能看到）
    const approvedPosts = await Post.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(); // .lean() 回傳純 JS 物件，效能較好

    let posts = approvedPosts;

    // 嘗試從請求 headers 解析 Token，追加用戶自己的 pending 卡片
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // 驗證 Token（複用 middleware/auth.js 中匯出的 JWT_SECRET）
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId  = decoded.id;

        // 撈取此用戶自己的待審核卡片
        const userPendingPosts = await Post.find({
          userId:  userId,
          status: 'pending'
        })
          .sort({ createdAt: -1 })
          .lean();

        if (userPendingPosts.length > 0) {
          // pending 卡片排最前面，後面接已審核的
          posts = [
            ...userPendingPosts,
            ...approvedPosts
          ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          console.log(`[GET /api/posts/approved] 用戶 ${decoded.username} 有 ${userPendingPosts.length} 張待審核卡片一併回傳`);
        }
      } catch (tokenErr) {
        // Token 無效或過期 → 靜默忽略，只回傳公開的 approved 卡片
        // 這是設計上允許的行為（此端點為半公開）
        console.log('[GET /api/posts/approved] Token 驗證失敗，回傳僅 approved 卡片');
      }
    }

    return res.json({ success: true, posts });

  } catch (err) {
    console.error('[GET /api/posts/approved] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/posts/pending
// 管理員專用：撈取所有 status:'pending' 的明信片
// ── 雙重守衛：verifyToken（驗證登入）+ requireAdmin（驗證管理員身份）
// ── 前端必須在 headers 帶上 Authorization: Bearer ${token}
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const pendingPosts = await Post.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    console.log(`[GET /api/posts/pending] 管理員 ${req.user.username} 撈取 ${pendingPosts.length} 張待審核卡片`);

    return res.json({
      success: true,
      posts:   pendingPosts
    });

  } catch (err) {
    console.error('[GET /api/posts/pending] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/posts/:id/approve
// 管理員專用：核准明信片，status 改為 'approved'
// ── 前端收到 success 後應即時從 pendingPosts state 移除該卡片（不重新拉取）
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true } // 回傳更新後的文件
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '找不到該明信片，可能已被刪除'
      });
    }

    console.log(`[PUT /api/posts/${id}/approve] 管理員 ${req.user.username} 核准了明信片 by ${post.username}`);

    return res.json({
      success: true,
      message: '明信片已審核通過',
      post    // 回傳完整的已核准 post，前端可直接插入公開牆
    });

  } catch (err) {
    console.error('[PUT /api/posts/:id/approve] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/posts/:id
// 管理員專用：婉拒並刪除明信片
// ── 前端收到 success 後應即時從 pendingPosts state 移除該卡片（不重新拉取）
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '找不到該明信片，可能已被刪除'
      });
    }

    console.log(`[DELETE /api/posts/${id}] 管理員 ${req.user.username} 婉拒刪除了明信片 by ${post.username}`);

    return res.json({
      success: true,
      message: '明信片已婉拒刪除'
    });

  } catch (err) {
    console.error('[DELETE /api/posts/:id] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts/:id/comment
// 使用者對特定明信片新增留言（需登入）
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { id }   = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '請填寫留言內容'
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
      username: req.user.username,
      text:     text.trim(),
      isRead:   false,
      createdAt: new Date()
    });

    await post.save();

    return res.json({
      success: true,
      message: '留言新增成功',
      post
    });

  } catch (err) {
    console.error('[POST /api/posts/:id/comment] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/posts/notifications/unread
// 撈出屬於當前用戶明信片中，isRead === false 且留言者非自己的留言總數
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notifications/unread', verifyToken, async (req, res) => {
  try {
    const userId   = req.user.id;
    const username = req.user.username;

    const userPosts = await Post.find({ userId }).lean();

    let unreadCount = 0;
    userPosts.forEach(post => {
      post.comments.forEach(comment => {
        if (!comment.isRead && comment.username !== username) {
          unreadCount++;
        }
      });
    });

    return res.json({ success: true, unreadCount });

  } catch (err) {
    console.error('[GET /api/posts/notifications/unread] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/posts/notifications/read-all
// 將當前用戶所有明信片的留言一鍵標記為已讀
// ─────────────────────────────────────────────────────────────────────────────
router.put('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await Post.updateMany(
      { userId },
      { $set: { 'comments.$[].isRead': true } }
    );

    return res.json({
      success: true,
      message: '所有留言已標記為已讀'
    });

  } catch (err) {
    console.error('[PUT /api/posts/notifications/read-all] Error:', err);
    return res.status(500).json({
      success: false,
      message: '伺服器發生錯誤'
    });
  }
});

module.exports = router;
