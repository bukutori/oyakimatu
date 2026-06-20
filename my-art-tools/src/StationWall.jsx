/**
 * StationWall.jsx
 * 時光驛站牆（Station Wall）元件
 *
 * ── 第四階段：前後端認證與狀態持久化大整合 ─────────────────────────────────────
 *
 *  普通使用者持久化：
 *    - fetchApprovedPosts 帶上 token，後端同時回傳該用戶的 pending 卡片
 *    - pending 卡片顯示「明信片已送出，等待管理員審核！」醒目橫幅
 *    - 發文成功後樂觀插入卡片到本地 state，不需重新整理
 *
 *  管理員審核後台：
 *    - admin 解鎖「旅人明信片」/「待審核驛站」切換 Tabs
 *    - fetchPendingPosts 攜帶 Authorization: Bearer ${token}
 *    - 核准/婉拒後即時從 pendingPosts state 移除（不重新拉取）
 *
 *  審核牆毛玻璃特效：
 *    - pending tab 的圖片套用 blur-md hover:blur-none transition duration-300
 *
 *  環境變數安全規範：
 *    - 所有 API Base URL 透過 import.meta.env.VITE_API_URL 讀取
 */

import React, { useState, useEffect, useCallback } from 'react';
import heartGrayIcon from './img/like2.png';
import heartRedIcon from './img/like3.png';
import gomibakoIcon from './img/gomibako.png';
import TRANSLATIONS from './translations';

const StationWall = ({ token, user, theme = 'dark', language = 'zh' }) => {
  // 多國語言翻譯
  const t = (key) => TRANSLATIONS[language][key] || key;
  // ── State ────────────────────────────────────────────────────────────────────
  const [posts, setPosts]                   = useState([]);           // approved + 自己的 pending（普通用戶）
  const [pendingPosts, setPendingPosts]     = useState([]);           // 全部 pending（管理員專用）
  const [activeTab, setActiveTab]           = useState(() => {
    const saved = window.__stationWallInitialTab;
    if (saved) {
      window.__stationWallInitialTab = null;
      return saved;
    }
    return 'public';
  });
  const [showPostForm, setShowPostForm]     = useState(false);
  const [formData, setFormData]             = useState({ image: null, content: '' });
  const [imagePreview, setImagePreview]     = useState(null);
  const [imageTransform, setImageTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [message, setMessage]               = useState('');
  const [messageType, setMessageType]       = useState('info');       // 'info' | 'success' | 'error'
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [approvingId, setApprovingId]       = useState(null);         // 防止重複點擊
  const [rejectingId, setRejectingId]       = useState(null);

  // 新增狀態：留言與燈箱
  const [lightboxPost, setLightboxPost]     = useState(null);
  const [commentInputs, setCommentInputs]   = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [submittingCommentId, setSubmittingCommentId] = useState(null);
  const [hoveredPostId, setHoveredPostId]   = useState(null);

  // ── 顯示訊息工具函式 ─────────────────────────────────────────────────────────
  const showMessage = (text, type = 'info', duration = 4000) => {
    setMessage(text);
    setMessageType(type);
    if (duration > 0) {
      setTimeout(() => setMessage(''), duration);
    }
  };

  // ── 1. 普通使用者持久化撈取 ──────────────────────────────────────────────────
  //    帶上 Token → 後端同時回傳 approved 及「此用戶自己的 pending」卡片
  //    依賴 token 變動重新撈取（解決登入後/跨裝置資料消失問題）
  const fetchApprovedPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/posts/approved`, { headers });
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      } else {
        console.error('[fetchApprovedPosts] 回傳失敗:', data.message);
      }
    } catch (error) {
      console.error('[fetchApprovedPosts] 網路錯誤:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [API_BASE, token]);

  // ── 2. 管理員專用：撈取所有 pending 卡片 ─────────────────────────────────────
  //    Authorization: Bearer ${token} 必須帶上，否則後端 protect 中間件會攔截
  const fetchPendingPosts = useCallback(async () => {
    if (!token || !user || user.role !== 'admin') return;
    try {
      const response = await fetch(`${API_BASE}/api/posts/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingPosts(data.posts);
      } else {
        console.error('[fetchPendingPosts] 回傳失敗:', data.message);
      }
    } catch (error) {
      console.error('[fetchPendingPosts] 網路錯誤:', error);
    }
  }, [API_BASE, token, user]);

  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('switch-station-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-station-tab', handleSwitchTab);
  }, []);

  // ── useEffect 初始化 ─────────────────────────────────────────────────────────
  //    每次 token 變動（登入/登出/跨裝置）都重新撈取，解決資料消失問題
  useEffect(() => {
    fetchApprovedPosts();
  }, [fetchApprovedPosts]); // fetchApprovedPosts 依賴 token，token 變動時自動重撈

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingPosts();
    } else {
      setPendingPosts([]); // 非管理員清空
    }
  }, [fetchPendingPosts, user]);

  // ── 圖片選擇 ─────────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 檔案大小限制 10MB
      if (file.size > 10 * 1024 * 1024) {
        showMessage(t('alertSizeLimit'), 'error');
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setImageTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    }
  };

  // ── 3. 發布明信片：先上傳 Cloudinary（透過後端），再存 MongoDB ────────────────
  //    送出成功後「樂觀插入」到本地 posts state，立即顯示 pending 卡片
  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!token) {
      showMessage(t('alertLoginRequiredPost'), 'error');
      return;
    }

    const hasImage = !!formData.image;
    const hasContent = !!formData.content.trim();

    if (!hasImage && !hasContent) {
      showMessage(t('alertTextOrImageRequired'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // multipart/form-data：圖片由後端先傳 Cloudinary，取回 URL 後存 MongoDB
      const formDataToSend = new FormData();
      formDataToSend.append('image', formData.image);
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('imageScale', imageTransform.scale.toString());
      formDataToSend.append('imageOffsetX', imageTransform.offsetX.toString());
      formDataToSend.append('imageOffsetY', imageTransform.offsetY.toString());

      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          //  不要手動設定 Content-Type，讓瀏覽器自動設定 multipart boundary
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        //  樂觀插入：立即把新卡片（pending 狀態）加到畫面最前面
        const newPost = data.post;
        setPosts(prev => [newPost, ...prev]);

        showMessage(user && user.role === 'admin' ? t('alertUploadSuccessAdmin') : t('alertUploadSuccess'), 'success', 5000);

        // 重置表單
        setFormData({ image: null, content: '' });
        setImagePreview(null);
        setShowPostForm(false);

        // 如果是管理員，也同步更新待審核清單
        if (user && user.role === 'admin') {
          setPendingPosts(prev => [newPost, ...prev]);
        }
      } else {
        showMessage(data.message || t('alertUploadFailed'), 'error');
      }
    } catch (error) {
      console.error('[handleSubmitPost] Error:', error);
      showMessage(t('alertNetworkFailed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 4. 管理員核准：PUT /:id/approve ─────────────────────────────────────────
  //    成功後「即時」從 pendingPosts state filter 掉，不重新拉取整列
  const handleApprove = async (postId) => {
    if (approvingId) return; // 防止重複點擊
    setApprovingId(postId);

    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        // 即時從待審核清單移除
        setPendingPosts(prev => prev.filter(p => p._id !== postId));
        // 把已核准的卡片加入公開牆（從後端回傳的完整 post 物件）
        if (data.post) {
          setPosts(prev => [data.post, ...prev.filter(p => p._id !== postId)]);
        }
        showMessage(t('alertApproveSuccess'), 'success');
      } else {
        showMessage(data.message || t('alertApproveFailed'), 'error');
      }
    } catch (error) {
      console.error('[handleApprove] Error:', error);
      showMessage(t('alertApproveFailed'), 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // ── 4. 管理員婉拒 / 刪除：DELETE /:id ───────────────────────────────────────────────
  //    成功後即時從 pendingPosts state filter 掉
  const handleDelete = async (postId, requireConfirm = false) => {
    if (requireConfirm) {
      if (!window.confirm(t('confirmDelete'))) return;
    }

    if (rejectingId) return; // 防止重複點擊
    setRejectingId(postId);

    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        // 即時從待審核清單移除
        setPendingPosts(prev => prev.filter(p => p._id !== postId));
        // 也從公開牆移除（以防萬一）
        setPosts(prev => prev.filter(p => p._id !== postId));
        
        // 如果燈箱剛好開著被刪除的那張，同步關閉
        setLightboxPost(prev => (prev && prev._id === postId) ? null : prev);
        
        showMessage(t('alertDeleteSuccess'), 'info');
      } else {
        showMessage(data.message || t('alertDeleteFailed'), 'error');
      }
    } catch (error) {
      console.error('[handleDelete] Error:', error);
      showMessage(t('alertDeleteFailed'), 'error');
    } finally {
      setRejectingId(null);
    }
  };

  // ── 5. 留言功能：提交留言 ────────────────────────────────────────────────────
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!token) {
      showMessage(t('alertLoginRequiredComment'), 'error');
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingCommentId(postId);
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await response.json();

      if (data.success) {
        // 即時更新 posts 陣列中該張明信片的內容
        setPosts(prev => prev.map(p => p._id === postId ? data.post : p));
        // 如果是在待審核牆，也一併更新
        setPendingPosts(prev => prev.map(p => p._id === postId ? data.post : p));
        
        // 清空輸入框
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // 展開留言區以顯示最新留言
        setExpandedComments(prev => ({ ...prev, [postId]: true }));
        
        // 如果燈箱剛好開著，也同步更新燈箱內的資料
        setLightboxPost(prev => (prev && prev._id === postId) ? data.post : prev);
        
        showMessage(t('alertCommentSuccess'), 'success', 2000);
      } else {
        showMessage(data.message || t('alertCommentFailed'), 'error');
      }
    } catch (error) {
      console.error('[handleCommentSubmit] Error:', error);
      showMessage(t('alertNetworkError'), 'error');
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const hasLiked = (post) => {
    if (!user || !post.likes) return false;
    return post.likes.includes(user.id);
  };

  const handleLikeToggle = async (postId) => {
    if (!token || !user) {
      showMessage(t('alertLoginRequiredLike'), 'error');
      return;
    }

    let originalPost = null;
    let originalPendingPost = null;

    const findAndToggle = (list, isPendingList) => {
      return list.map(p => {
        if (p._id === postId) {
          if (isPendingList) originalPendingPost = { ...p };
          else originalPost = { ...p };

          const likes = p.likes ? [...p.likes] : [];
          const index = likes.indexOf(user.id);
          if (index > -1) {
            likes.splice(index, 1);
          } else {
            likes.push(user.id);
          }
          const updated = { ...p, likes };
          if (lightboxPost && lightboxPost._id === postId) {
            setLightboxPost(updated);
          }
          return updated;
        }
        return p;
      });
    };

    setPosts(prev => findAndToggle(prev, false));
    setPendingPosts(prev => findAndToggle(prev, true));

    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '按讚失敗');
      }

      const updateFromApi = (list) => {
        return list.map(p => {
          if (p._id === postId) {
            const updated = { ...p, likes: data.likes };
            if (lightboxPost && lightboxPost._id === postId) {
              setLightboxPost(updated);
            }
            return updated;
          }
          return p;
        });
      };
      setPosts(prev => updateFromApi(prev));
      setPendingPosts(prev => updateFromApi(prev));

    } catch (err) {
      console.error('[handleLikeToggle] 發生錯誤:', err);
      const rollback = (list, original) => {
        if (!original) return list;
        return list.map(p => p._id === postId ? original : p);
      };
      setPosts(prev => rollback(prev, originalPost));
      setPendingPosts(prev => rollback(prev, originalPendingPost));
      if (lightboxPost && lightboxPost._id === postId) {
        setLightboxPost(originalPost || originalPendingPost);
      }
      showMessage(t('alertNetworkError'), 'error');
    }
  };

  // ── 主題配色 ─────────────────────────────────────────────────────────────────
  const currentTheme = theme === 'dark' ? {
    bg:            '#0d0d0d',
    cardBg:        '#1a1a1a',
    cardBgPending: '#1f1a0a',
    text:          '#f0f0f0',
    textSecondary: '#888888',
    border:        '#2a2a2a',
    borderPending: '#c9860a',
    accent:        '#ff6b6b',
    accentHover:   '#ff4444',
    success:       '#22c55e',
    danger:        '#ef4444',
    tabActiveBg:   'linear-gradient(135deg, #ff6b6b, #ff4444)',
    tabInactiveBg: '#2a2a2a',
    messageColors: {
      success: { bg: '#14532d', border: '#22c55e', text: '#86efac' },
      error:   { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
      info:    { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
    }
  } : {
    bg:            '#f0f0f0',
    cardBg:        '#ffffff',
    cardBgPending: '#fffbeb',
    text:          '#1a1a1a',
    textSecondary: '#666666',
    border:        '#e0e0e0',
    borderPending: '#f59e0b',
    accent:        '#ff6b6b',
    accentHover:   '#ff4444',
    success:       '#16a34a',
    danger:        '#dc2626',
    tabActiveBg:   'linear-gradient(135deg, #ff6b6b, #ff4444)',
    tabInactiveBg: '#e0e0e0',
    messageColors: {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
      error:   { bg: '#fff1f2', border: '#f43f5e', text: '#be123c' },
      info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
    }
  };

  // ── 顯示資料集：切換 Tab 決定顯示哪組 ─────────────────────────────────────────
  const displayPosts = activeTab === 'public' ? posts : pendingPosts;
  const isAdminPendingTab = activeTab === 'pending' && user && user.role === 'admin';

  // ── 管理員切換到待審核 Tab 時自動更新 ────────────────────────────────────────
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'pending' && user && user.role === 'admin') {
      fetchPendingPosts(); // 切換時重新拉取，確保資料最新
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      padding: '24px 16px',
      fontFamily: "'Segoe UI', 'Noto Sans TC', Tahoma, Geneva, Verdana, sans-serif"
    }}>

      {/* ── 頁面標題 ───────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '32px', padding: '20px 0' }}>
        <h1 style={{
          color: currentTheme.text,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: '900',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          {t('stationTitle')}
        </h1>
        <p style={{
          color: currentTheme.textSecondary,
          fontSize: '15px',
          margin: 0
        }}>
          {t('stationDesc')}
        </p>
      </div>

      {/* ── 管理員標籤頁（Tab 切換）─────────────────────────────────────────── */}
      {user && user.role === 'admin' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {/* 旅人明信片 Tab */}
          <button
            id="tab-public"
            onClick={() => handleTabSwitch('public')}
            style={{
              padding: '11px 28px',
              background: activeTab === 'public'
                ? currentTheme.tabActiveBg
                : currentTheme.tabInactiveBg,
              color: activeTab === 'public' ? '#fff' : currentTheme.text,
              border: activeTab === 'public'
                ? 'none'
                : `2px solid ${currentTheme.border}`,
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'public'
                ? '0 4px 15px rgba(255,107,107,0.35)'
                : 'none',
              letterSpacing: '0.02em'
            }}
          >
            {t('tabPublic')}
          </button>

          {/* 待審核驛站 Tab */}
          <button
            id="tab-pending"
            onClick={() => handleTabSwitch('pending')}
            style={{
              padding: '11px 28px',
              background: activeTab === 'pending'
                ? currentTheme.tabActiveBg
                : currentTheme.tabInactiveBg,
              color: activeTab === 'pending' ? '#fff' : currentTheme.text,
              border: activeTab === 'pending'
                ? 'none'
                : `2px solid ${currentTheme.border}`,
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'pending'
                ? '0 4px 15px rgba(255,107,107,0.35)'
                : 'none',
              letterSpacing: '0.02em',
              position: 'relative'
            }}
          >
            {t('tabPending')}
            {pendingPosts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: '#f59e0b',
                color: '#1a1a1a',
                fontSize: '11px',
                fontWeight: '900',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid ' + currentTheme.bg
              }}>
                {pendingPosts.length > 9 ? '9+' : pendingPosts.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── 發文表單 ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '600px', margin: '0 auto 32px', textAlign: 'center' }}>
        {!showPostForm ? (
          <button
            id="btn-open-post-form"
            onClick={() => {
              if (!token) {
                showMessage(t('alertLoginRequiredPost'), 'error');
                return;
              }
              setShowPostForm(true);
            }}
            style={{
              padding: '14px 44px',
              background: 'linear-gradient(135deg, #ff6b6b, #ff4444)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '800',
              boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.03em'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(255, 107, 107, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
          >
            {t('btnOpenPostForm')}
          </button>
        ) : (
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '32px',
            borderRadius: '20px',
            boxShadow: theme === 'dark'
              ? '0 12px 40px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${currentTheme.border}`,
            textAlign: 'left'
          }}>
            <h3 style={{
              color: currentTheme.text,
              marginBottom: '24px',
              fontSize: '18px',
              fontWeight: '800',
              textAlign: 'center'
            }}>
              {t('createPostcard')}
            </h3>

            <form onSubmit={handleSubmitPost}>
              {/* 圖片上傳 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: currentTheme.textSecondary,
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  {t('uploadImage')}
                </label>
                <div
                  id="image-upload-zone"
                  style={{
                    position: 'relative',
                    border: `2px dashed ${imagePreview ? currentTheme.accent : currentTheme.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: theme === 'dark' ? '#111' : '#fafafa',
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%', height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  {imagePreview ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '240px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: theme === 'dark' ? '#111' : '#f0f0f0'
                    }}>
                      <img
                        src={imagePreview}
                        alt="預覽"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          transform: `translate(calc(-50% + ${imageTransform.offsetX}%), calc(-50% + ${imageTransform.offsetY}%)) scale(${imageTransform.scale})`,
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}></div>
                      <p style={{ color: currentTheme.textSecondary, fontSize: '14px', margin: 0 }}>
                        {t('uploadHint')}<br />
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>
                          {t('uploadSupport')}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                {imagePreview && (
                  <div style={{ marginTop: '18px', padding: '16px', borderRadius: '14px', backgroundColor: theme === 'dark' ? '#111' : '#f8f8f8' }}>
                    <div style={{ color: currentTheme.textSecondary, fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                      {t('imageAdjustHint')}
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: currentTheme.text, fontSize: '13px', fontWeight: '700' }}>{t('imageScale')}</span>
                        <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>{Math.round(imageTransform.scale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.7"
                        max="1.8"
                        step="0.02"
                        value={imageTransform.scale}
                        onChange={(e) => setImageTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: currentTheme.text, fontSize: '13px', fontWeight: '700' }}>{t('imageOffsetX')}</span>
                          <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>{imageTransform.offsetX}%</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          step="1"
                          value={imageTransform.offsetX}
                          onChange={(e) => setImageTransform(prev => ({ ...prev, offsetX: parseInt(e.target.value, 10) }))}
                          style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: currentTheme.text, fontSize: '13px', fontWeight: '700' }}>{t('imageOffsetY')}</span>
                          <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>{imageTransform.offsetY}%</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          step="1"
                          value={imageTransform.offsetY}
                          onChange={(e) => setImageTransform(prev => ({ ...prev, offsetY: parseInt(e.target.value, 10) }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 故事文字 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: currentTheme.textSecondary,
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  {t('storyText')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('storyPlaceholder')}
                  maxLength="500"
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: theme === 'dark' ? '#111' : '#fafafa',
                    color: currentTheme.text,
                    fontSize: '15px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: '1.6',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                  onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                />
                <div style={{
                  textAlign: 'right',
                  fontSize: '12px',
                  color: currentTheme.textSecondary,
                  marginTop: '4px'
                }}>
                  {formData.content.length} / 500
                </div>
              </div>

              {/* 送出 / 取消 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  id="btn-submit-post"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '13px',
                    background: isSubmitting
                      ? '#888'
                      : 'linear-gradient(135deg, #ff6b6b, #ff4444)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '800',
                    transition: 'all 0.3s ease',
                    letterSpacing: '0.03em'
                  }}
                >
                  {isSubmitting ? t('submitting') : t('btnSubmitPost')}
                </button>
                <button
                  type="button"
                  id="btn-cancel-post"
                  onClick={() => {
                    setShowPostForm(false);
                    setFormData({ image: null, content: '' });
                    setImagePreview(null);
                    setImageTransform({ scale: 1, offsetX: 0, offsetY: 0 });
                  }}
                  style={{
                    flex: 1,
                    padding: '13px',
                    backgroundColor: currentTheme.tabInactiveBg,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── 全局訊息提示 ───────────────────────────────────────────────────── */}
      {message && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 24px',
          padding: '14px 20px',
          backgroundColor: currentTheme.messageColors[messageType]?.bg || currentTheme.messageColors.info.bg,
          border: `1px solid ${currentTheme.messageColors[messageType]?.border || currentTheme.messageColors.info.border}`,
          color: currentTheme.messageColors[messageType]?.text || currentTheme.messageColors.info.text,
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          lineHeight: '1.5',
          animation: 'slideIn 0.3s ease'
        }}>
          {message}
        </div>
      )}

      {/* ── 管理員待審核說明欄 ─────────────────────────────────────────────── */}
      {isAdminPendingTab && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 24px',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,179,8,0.08))',
          border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: '12px',
          color: '#f59e0b',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {t('pendingExplain')}
        </div>
      )}

      {/* ── 讀取中提示 ─────────────────────────────────────────────────────── */}
      {isLoadingPosts && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: currentTheme.textSecondary,
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>
            ⏳
          </div>
          {t('inspirationLoading')}
        </div>
      )}

      {/* ── 卡片牆 ─────────────────────────────────────────────────────────── */}
      {!isLoadingPosts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {displayPosts.map((post) => {
            const isPending = post.status === 'pending';
            const isMyPendingCard = isPending && user && post.userId === user.id;

            return (
              <div
                key={post._id}
                style={{
                  backgroundColor: isPending ? currentTheme.cardBgPending : currentTheme.cardBg,
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: theme === 'dark'
                    ? '0 4px 24px rgba(0,0,0,0.4)'
                    : '0 4px 20px rgba(0,0,0,0.09)',
                  border: isPending
                    ? `2px solid ${currentTheme.borderPending}`
                    : `1px solid ${currentTheme.border}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = theme === 'dark'
                    ? '0 12px 40px rgba(0,0,0,0.6)'
                    : '0 12px 32px rgba(0,0,0,0.16)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme === 'dark'
                    ? '0 4px 24px rgba(0,0,0,0.4)'
                    : '0 4px 20px rgba(0,0,0,0.09)';
                }}
              >
                {/* 圖片區域 */}
                {post.imageUrl && (
                  <div style={{
                    position: 'relative',
                    paddingTop: '66.67%', // 3:2 比例
                    overflow: 'hidden',
                    backgroundColor: theme === 'dark' ? '#111' : '#f0f0f0'
                  }}>
                    {/* 管理員專用：刪除貼文按鈕（左上角） */}
                    {user && user.role === 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(post._id, true); }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          zIndex: 10
                        }}
                        title="刪除這張明信片"
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img
                          src={gomibakoIcon}
                          alt="刪除明信片"
                          style={{ width: '30px', height: '30px', display: 'block' }}
                        />
                      </button>
                    )}

                    <img
                      src={post.imageUrl}
                      alt={post.content || t('postImage')}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transform: `translate(calc(-50% + ${post.imageOffsetX || 0}%), calc(-50% + ${post.imageOffsetY || 0}%)) scale(${post.imageScale || 1})`,
                        transition: 'transform 0.2s ease',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                )}

                {/* ── 普通用戶自己的 pending 卡片：明顯審核中提示橫幅 ─── */}
                {isMyPendingCard && !(user && user.role === 'admin') && (
                  <div style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,179,8,0.1))',
                    borderBottom: '1px solid rgba(245,158,11,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#f59e0b',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    <span style={{ fontSize: '16px' }}></span>
                    <span>{t('myPendingCard')}</span>
                  </div>
                )}

                {/* 內容區域 */}
                <div style={{
                  padding: '18px 20px 20px',
                  backgroundColor: isPending
                    ? (theme === 'dark' ? '#1f1a0a' : '#fffbeb')
                    : (theme === 'dark' ? '#1a1a1a' : '#faf8f5'),
                  borderTop: isPending
                    ? '2px solid rgba(245,158,11,0.3)'
                    : `2px solid ${theme === 'dark' ? '#2a2a2a' : '#e8d5c4'}`
                }}>
                  {/* 作者資訊 + 日期 */}
                  <div 
                    onClick={() => setLightboxPost(post)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        color: theme === 'dark' ? '#d4a96a' : '#8b7355',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                         {post.username}
                      </span>
                      {/* 管理員看到的待審核 badge（非普通用戶那個） */}
                      {isPending && user && user.role === 'admin' && (
                        <span style={{
                          backgroundColor: '#f59e0b',
                          color: '#1a1a1a',
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.04em'
                        }}>
                          {t('pendingBadge')}
                        </span>
                      )}
                      {/* 行內管理員刪除按鈕 */}
                      {user && user.role === 'admin' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(post._id, true); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s',
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          title="刪除這張明信片"
                        >
                          <img
                            src={gomibakoIcon}
                            alt="刪除明信片"
                            style={{ width: '18px', height: '18px', display: 'block' }}
                          />
                        </button>
                      )}
                    </div>
                    <span style={{
                      color: currentTheme.textSecondary,
                      fontSize: '12px'
                    }}>
                      {new Date(post.createdAt).toLocaleDateString('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* 內文 */}
                  {post.content && (
                    <p 
                      onClick={() => setLightboxPost(post)}
                      style={{
                        color: theme === 'dark' ? '#c8b89a' : '#5c4a3a',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        marginBottom: '16px',
                        margin: '0 0 16px 0',
                        wordBreak: 'break-word',
                        cursor: 'pointer'
                      }}
                    >
                      {post.content}
                    </p>
                  )}

                  {/* 按讚與留言數量工具列 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    {/* 愛心按鈕 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLikeToggle(post._id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        transition: 'all 0.2s',
                        color: hasLiked(post) ? '#ef4444' : (theme === 'dark' ? '#c8b89a' : '#5c4a3a'),
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                      }}
                    >
                      <img
                        src={hasLiked(post) ? heartRedIcon : heartGrayIcon}
                        alt={hasLiked(post) ? '已喜歡' : '喜歡'}
                        style={{ width: '30px', height: '30px' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {post.likes ? post.likes.length : 0} {t('likeCount')}
                      </span>
                    </button>

                    {/* 留言數 */}
                    <span style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#8a7a60' : '#8b7355' }}>
                       {post.comments ? post.comments.length : 0}
                    </span>
                  </div>

                  {/* 查看留言按鈕 */}
                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e8d5c4',
                      color: theme === 'dark' ? '#c8b89a' : '#5c4a3a',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#d4c4b0';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#e8d5c4';
                    }}
                  >
                     {expandedComments[post._id] ? t('hideComments') : `${t('showComments')} (${post.comments?.length || 0})`}
                  </button>

                  {/* 留言區塊（展開時顯示） */}
                  {expandedComments[post._id] && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.border}`, animation: 'fadeIn 0.3s ease' }}>
                      {/* 留言列表 */}
                      {post.comments && post.comments.length > 0 ? (
                        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
                          {post.comments.map((comment, idx) => (
                            <div key={idx} style={{ marginBottom: '12px', fontSize: '13px', color: currentTheme.text }}>
                              <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: '700', color: theme === 'dark' ? '#d4a96a' : '#8b7355', marginRight: '8px' }}>
                                  {comment.username}
                                </span>
                                <span style={{ fontSize: '11px', color: currentTheme.textSecondary }}>
                                  {new Date(comment.createdAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div style={{ wordBreak: 'break-word', lineHeight: '1.5', color: theme === 'dark' ? '#e0e0e0' : '#444' }}>
                                {comment.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: currentTheme.textSecondary, textAlign: 'center', marginBottom: '12px' }}>
                          {t('noComments')}
                        </p>
                      )}

                      {/* 留言輸入框 */}
                      <form onSubmit={(e) => handleCommentSubmit(e, post._id)} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                          placeholder={token ? t('commentPlaceholder') : t('loginRequiredComment')}
                          disabled={!token || submittingCommentId === post._id}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '20px',
                            border: `1px solid ${currentTheme.border}`,
                            backgroundColor: theme === 'dark' ? '#111' : '#f9f9f9',
                            color: currentTheme.text,
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            cursor: token ? 'text' : 'not-allowed'
                          }}
                          onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                          onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                        />
                        <button
                          type="submit"
                          disabled={!token || submittingCommentId === post._id || !commentInputs[post._id]?.trim()}
                          style={{
                            padding: '8px 18px',
                            backgroundColor: currentTheme.accent,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: (!token || submittingCommentId === post._id || !commentInputs[post._id]?.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (!token || submittingCommentId === post._id || !commentInputs[post._id]?.trim()) ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          {t('send')}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ── 管理員審核按鈕（待審核 Tab 才顯示）────────────── */}
                  {isAdminPendingTab && (
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '12px'
                    }}>
                      {/*  核准 */}
                      <button
                        id={`btn-approve-${post._id}`}
                        onClick={() => handleApprove(post._id)}
                        disabled={approvingId === post._id || rejectingId === post._id}
                        style={{
                          flex: 1,
                          padding: '11px',
                          background: (approvingId === post._id)
                            ? '#666'
                            : 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: (approvingId === post._id || rejectingId === post._id)
                            ? 'not-allowed'
                            : 'pointer',
                          fontSize: '13px',
                          fontWeight: '800',
                          transition: 'all 0.25s ease',
                          letterSpacing: '0.03em',
                          boxShadow: '0 3px 10px rgba(34,197,94,0.3)'
                        }}
                        onMouseOver={(e) => {
                          if (approvingId !== post._id) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {approvingId === post._id ? '核准中...' : ' 核准上線'}
                      </button>

                      {/*  婉拒 */}
                      <button
                        id={`btn-reject-${post._id}`}
                        onClick={() => handleDelete(post._id)}
                        disabled={approvingId === post._id || rejectingId === post._id}
                        style={{
                          flex: 1,
                          padding: '11px',
                          background: (rejectingId === post._id)
                            ? '#666'
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: (approvingId === post._id || rejectingId === post._id)
                            ? 'not-allowed'
                            : 'pointer',
                          fontSize: '13px',
                          fontWeight: '800',
                          transition: 'all 0.25s ease',
                          letterSpacing: '0.03em',
                          boxShadow: '0 3px 10px rgba(239,68,68,0.3)'
                        }}
                        onMouseOver={(e) => {
                          if (rejectingId !== post._id) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {rejectingId === post._id ? '刪除中...' : ' 婉拒刪除'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 空狀態 ─────────────────────────────────────────────────────────── */}
      {!isLoadingPosts && displayPosts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: currentTheme.textSecondary
        }}>
          <div style={{ fontSize: '56px', marginBottom: '20px', opacity: 0.6 }}>
            {activeTab === 'public' ? '' : ''}
          </div>
          <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            {activeTab === 'public'
              ? t('emptyPublic')
              : t('emptyPending')}
          </p>
        </div>
      )}

      {/* ── FB 風格圖片雙欄放大燈箱 (FB Lightbox) ────────────────────────────────────────── */}
      {lightboxPost && (
        <div
          onClick={() => setLightboxPost(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.25s ease',
            padding: '20px', // 給視窗邊緣留點空隙
            boxSizing: 'border-box'
          }}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={() => setLightboxPost(null)}
            style={{
              position: 'absolute',
              top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '44px', height: '44px',
              fontSize: '28px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
              zIndex: 10000
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            &times;
          </button>
          
          <div
            onClick={(e) => e.stopPropagation()} // 避免點擊彈窗內部關閉
            style={{
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row', // 手機版垂直排列
              width: '100%',
              maxWidth: lightboxPost.imageUrl ? '1200px' : '500px',
              height: window.innerWidth < 768 ? 'auto' : '90vh',
              maxHeight: '90vh',
              backgroundColor: currentTheme.cardBg,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              animation: 'zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* 左側：圖片區 (佔滿剩餘空間) */}
            {lightboxPost.imageUrl && (
              <div style={{
                flex: 1,
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: window.innerWidth < 768 ? '40vh' : 'auto'
              }}>
                <img
                  src={lightboxPost.imageUrl}
                  alt="放大預覽"
                  style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    maxWidth: '95%',
                    maxHeight: '95%',
                    objectFit: 'contain',
                    transform: `translate(calc(-50% + ${(lightboxPost.imageOffsetX || 0)}%), calc(-50% + ${(lightboxPost.imageOffsetY || 0)}%)) scale(${lightboxPost.imageScale || 1})`
                  }}
                />
              </div>
            )}

            {/* 右側：資訊與留言區 (固定寬度) */}
            <div style={{
              width: lightboxPost.imageUrl ? (window.innerWidth < 768 ? '100%' : '380px') : '100%',
              minWidth: lightboxPost.imageUrl ? (window.innerWidth < 768 ? 'auto' : '380px') : 'auto',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: currentTheme.cardBg,
              borderLeft: (lightboxPost.imageUrl && window.innerWidth >= 768) ? `1px solid ${currentTheme.border}` : 'none',
              position: 'relative',
              height: window.innerWidth < 768 ? '50vh' : 'auto'
            }}>
              {/* 右側頂部：作者與內文 */}
              <div style={{ padding: '20px', borderBottom: `1px solid ${currentTheme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme === 'dark' ? '#d4a96a' : '#8b7355', fontSize: '15px', fontWeight: '800' }}>
                       {lightboxPost.username}
                    </span>
                    {user && user.role === 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(lightboxPost._id, true); }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                  <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>
                    {new Date(lightboxPost.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric', month: '2-digit', day: '2-digit'
                    })}
                  </span>
                </div>
                {lightboxPost.content && (
                  <p style={{
                    color: theme === 'dark' ? '#c8b89a' : '#5c4a3a',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0,
                    wordBreak: 'break-word',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {lightboxPost.content}
                  </p>
                )}

                {/* 詳情區底部按讚資訊 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${currentTheme.border}`,
                }}>
                  <button
                    onClick={() => handleLikeToggle(lightboxPost._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      transition: 'all 0.2s',
                      color: hasLiked(lightboxPost) ? '#ef4444' : (theme === 'dark' ? '#c8b89a' : '#5c4a3a'),
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                    }}
                  >
                    <img
                      src={hasLiked(lightboxPost) ? heartRedIcon : heartGrayIcon}
                      alt={hasLiked(lightboxPost) ? '已喜歡' : '喜歡'}
                      style={{ width: '30px', height: '30px' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {lightboxPost.likes ? lightboxPost.likes.length : 0} {t('likeCount')}
                    </span>
                  </button>
                </div>
              </div>

              {/* 右側中間：留言列表 (可滾動) */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: theme === 'dark' ? '#111' : '#fafafa'
              }}>
                {lightboxPost.comments && lightboxPost.comments.length > 0 ? (
                  lightboxPost.comments.map((comment, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', fontSize: '13px', color: currentTheme.text }}>
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: theme === 'dark' ? '#d4a96a' : '#8b7355', marginRight: '8px' }}>
                          {comment.username}
                        </span>
                        <span style={{ fontSize: '11px', color: currentTheme.textSecondary }}>
                          {new Date(comment.createdAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ wordBreak: 'break-word', lineHeight: '1.5', color: theme === 'dark' ? '#e0e0e0' : '#444' }}>
                        {comment.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: currentTheme.textSecondary, opacity: 0.7
                  }}>
                    <span style={{ fontSize: '40px', marginBottom: '8px' }}></span>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{t('noComments')}</p>
                  </div>
                )}
              </div>

              {/* 右側底部：留言輸入框 */}
              <div style={{
                padding: '16px',
                borderTop: `1px solid ${currentTheme.border}`,
                backgroundColor: currentTheme.cardBg
              }}>
                <form onSubmit={(e) => handleCommentSubmit(e, lightboxPost._id)} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={commentInputs[lightboxPost._id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [lightboxPost._id]: e.target.value }))}
                    placeholder={token ? t('commentPlaceholder') : t('loginRequiredComment')}
                    disabled={!token || submittingCommentId === lightboxPost._id || lightboxPost.status !== 'approved'}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${currentTheme.border}`,
                      backgroundColor: theme === 'dark' ? '#111' : '#f9f9f9',
                      color: currentTheme.text,
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      cursor: (token && lightboxPost.status === 'approved') ? 'text' : 'not-allowed'
                    }}
                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                  />
                  <button
                    type="submit"
                    disabled={!token || submittingCommentId === lightboxPost._id || !commentInputs[lightboxPost._id]?.trim() || lightboxPost.status !== 'approved'}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: currentTheme.accent,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: (!token || submittingCommentId === lightboxPost._id || !commentInputs[lightboxPost._id]?.trim() || lightboxPost.status !== 'approved') ? 'not-allowed' : 'pointer',
                      opacity: (!token || submittingCommentId === lightboxPost._id || !commentInputs[lightboxPost._id]?.trim() || lightboxPost.status !== 'approved') ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {t('send')}
                  </button>
                </form>
                {lightboxPost.status !== 'approved' && (
                  <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>
                    {t('pendingNoComment')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS 動畫（keyframes 放在 style 標籤，避免依賴外部 CSS） ──────────── */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StationWall;
