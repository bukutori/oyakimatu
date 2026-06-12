/**
 * StationWall.jsx
 * 時光驛站牆（Station Wall）元件
 */

import React, { useState, useEffect } from 'react';

const StationWall = ({ token, user, theme = 'dark', language = 'zh' }) => {
  const [posts, setPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('public');
  const [showPostForm, setShowPostForm] = useState(false);
  const [formData, setFormData] = useState({ image: null, content: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 載入已審核的明信片
  useEffect(() => {
    fetchApprovedPosts();
  }, []);

  // 如果是管理員，額外載入待審核的明信片
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingPosts();
    }
  }, [user]);

  const fetchApprovedPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/approved`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('載入明信片失敗:', error);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingPosts(data.posts);
      }
    } catch (error) {
      console.error('載入待審核明信片失敗:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('請先登入才能發布明信片');
      return;
    }

    if (!formData.image) {
      setMessage('請選擇圖片');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', formData.image);
      formDataToSend.append('content', formData.content);

      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        setMessage('明信片已送出，等待管理員審核！');
        setFormData({ image: null, content: '' });
        setImagePreview(null);
        setShowPostForm(false);
        // 如果是管理員，重新載入待審核列表
        if (user && user.role === 'admin') {
          fetchPendingPosts();
        }
      } else {
        setMessage(data.message || '發布失敗');
      }
    } catch (error) {
      console.error('發布明信片失敗:', error);
      setMessage('發布失敗，請稍後再試');
    }
  };

  const handleApprove = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage('明信片已核准上線');
        fetchPendingPosts();
        fetchApprovedPosts();
      } else {
        setMessage(data.message || '核准失敗');
      }
    } catch (error) {
      console.error('核准失敗:', error);
      setMessage('核准失敗，請稍後再試');
    }
  };

  const handleDelete = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage('明信片已刪除');
        fetchPendingPosts();
      } else {
        setMessage(data.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      setMessage('刪除失敗，請稍後再試');
    }
  };

  const currentTheme = theme === 'dark' ? {
    bg: '#0f0f0f',
    cardBg: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#333333',
    accent: '#ff6b6b',
    accentHover: '#ff5252'
  } : {
    bg: '#f5f5f5',
    cardBg: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    accent: '#ff6b6b',
    accentHover: '#ff5252'
  };

  const displayPosts = activeTab === 'public' ? posts : pendingPosts;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: currentTheme.bg,
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* 頁面標題 */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px'
      }}>
        <h1 style={{ 
          color: currentTheme.text, 
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          🚂 時光驛站牆
        </h1>
        <p style={{ color: currentTheme.textSecondary }}>
          分享你的創作故事，與旅人們交流靈感
        </p>
      </div>

      {/* 管理員標籤頁 */}
      {user && user.role === 'admin' && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => setActiveTab('public')}
            style={{
              padding: '12px 30px',
              backgroundColor: activeTab === 'public' ? currentTheme.accent : currentTheme.cardBg,
              color: activeTab === 'public' ? '#fff' : currentTheme.text,
              border: `2px solid ${currentTheme.accent}`,
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            🌍 旅人明信片
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 30px',
              backgroundColor: activeTab === 'pending' ? currentTheme.accent : currentTheme.cardBg,
              color: activeTab === 'pending' ? '#fff' : currentTheme.text,
              border: `2px solid ${currentTheme.accent}`,
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            ⏳ 待審核驛站
          </button>
        </div>
      )}

      {/* 發文表單 */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto 30px',
        textAlign: 'center'
      }}>
        {!showPostForm ? (
          <button
            onClick={() => setShowPostForm(true)}
            style={{
              padding: '15px 40px',
              backgroundColor: currentTheme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
            onMouseOut={(e) => e.target.style.backgroundColor = currentTheme.accent}
          >
            📮 掛上我的明信片
          </button>
        ) : (
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${currentTheme.border}`
          }}>
            <h3 style={{ color: currentTheme.text, marginBottom: '20px' }}>
              📝 創作你的明信片
            </h3>
            <form onSubmit={handleSubmitPost}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: currentTheme.textSecondary,
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  上傳圖片
                </label>
                <div style={{
                  position: 'relative',
                  border: `2px dashed ${currentTheme.border}`,
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.borderColor = currentTheme.accent}
                onMouseOut={(e) => e.target.style.borderColor = currentTheme.border}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="預覽"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <div>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>📷</div>
                      <p style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>
                        點擊或拖曳圖片至此處上傳
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: currentTheme.textSecondary,
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  故事文字
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="分享你的創作故事..."
                  maxLength="500"
                  required
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.bg,
                    color: currentTheme.text,
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: currentTheme.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  📤 送出明信片
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPostForm(false);
                    setFormData({ image: null, content: '' });
                    setImagePreview(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: currentTheme.border,
                    color: currentTheme.text,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 訊息提示 */}
      {message && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 20px',
          padding: '15px',
          backgroundColor: currentTheme.accent,
          color: '#fff',
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* 卡片牆 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {displayPosts.map((post) => (
          <div
            key={post._id}
            style={{
              backgroundColor: currentTheme.cardBg,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: `1px solid ${currentTheme.border}`,
              transition: 'all 0.3s ease'
            }}
          >
            {/* 圖片區域 */}
            <div style={{
              position: 'relative',
              paddingTop: '75%',
              overflow: 'hidden'
            }}>
              <img
                src={post.imageUrl}
                alt="明信片"
                className={activeTab === 'pending' ? 'blur-md hover:blur-none transition duration-300' : ''}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              />
            </div>

            {/* 內容區域 */}
            <div style={{
              padding: '20px',
              backgroundColor: post.status === 'pending' ? '#fff3cd' : '#faf8f5',
              borderTop: post.status === 'pending' ? '3px solid #ffc107' : '3px solid #e8d5c4'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    color: '#8b7355',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ✍️ {post.username}
                  </span>
                  {post.status === 'pending' && (
                    <span style={{
                      backgroundColor: '#ffc107',
                      color: '#333',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      ⏳ 待審核
                    </span>
                  )}
                </div>
                <span style={{
                  color: '#a08060',
                  fontSize: '12px'
                }}>
                  {new Date(post.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
              <p style={{
                color: '#5c4a3a',
                fontSize: '15px',
                lineHeight: '1.6',
                marginBottom: '15px'
              }}>
                {post.content}
              </p>

              {/* 查看留言按鈕 */}
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#e8d5c4',
                  color: '#5c4a3a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#d4c4b0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e8d5c4'}
              >
                💬 查看留言 ({post.comments?.length || 0})
              </button>

              {/* 管理員按鈕 */}
              {activeTab === 'pending' && user && user.role === 'admin' && (
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px'
                }}>
                  <button
                    onClick={() => handleApprove(post._id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🟢 核准上線
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🔴 婉拒刪除
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 空狀態 */}
      {displayPosts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: currentTheme.textSecondary
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            📭
          </div>
          <p style={{ fontSize: '18px' }}>
            {activeTab === 'public' ? '還沒有明信片，成為第一個分享者吧！' : '沒有待審核的明信片'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StationWall;
