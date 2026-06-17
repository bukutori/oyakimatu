/**
 * AdminPanel.jsx
 * 管理員面板 - 查看所有用戶資料、管理用戶角色、刪除留言
 */

import { useState, useEffect } from 'react';

import TRANSLATIONS from './translations';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function AdminPanel({ token, theme = 'dark', language = 'zh', onClose }) {
  const t = (key) => TRANSLATIONS[language][key] || key;
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'messages'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || t('fetchUsersFailed'));
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(t('networkError') + err.message);
    }
  };

  // 載入所有留言
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError('網路錯誤: ' + err.message);
    }
  };

  // 修改用戶角色
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers(); // 重新載入用戶列表
      } else {
        setError(data.message || t('changeRoleFailed'));
      }
    } catch (err) {
      console.error('Role change error:', err);
      setError(t('networkError') + err.message);
    }
  };

  // 刪除留言
  const handleDeleteMessage = async (messageId) => {
    if (!confirm(t('confirmDeleteMessage'))) return;

    try {
      const response = await fetch(`${API_BASE}/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchMessages(); // 重新載入留言列表
      } else {
        setError(data.message || t('deleteMessageFailed'));
      }
    } catch (err) {
      console.error('Delete message error:', err);
      setError(t('networkError') + err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !mounted) return;
      
      setLoading(true);
      setError('');
      if (activeTab === 'users') {
        await fetchUsers();
      } else {
        await fetchMessages();
      }
      setLoading(false);
    };

    fetchData();
  }, [activeTab, token, mounted]);

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: isDark ? '#1e1e2f' : '#f5f5f5',
      minHeight: '100vh',
      color: isDark ? '#fff' : '#333'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>{t('adminPanel')}</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#fff' : '#333',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: '1',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.7'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            
          </button>
        )}
      </div>

      {/* 檢查 token 是否存在 */}
      {!token && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: isDark ? '#333' : '#e0e0e0',
          borderRadius: '8px'
        }}>
          <h3>{t('noToken')}</h3>
          <p>{t('pleaseLogin')}</p>
        </div>
      )}

      {/* Debug info */}
      {token && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: isDark ? '#333' : '#e0e0e0',
          borderRadius: '8px',
          fontSize: '0.85rem'
        }}>
          <div>Token: {token ? ' 已提供' : ' 未提供'}</div>
          <div>API_BASE: {API_BASE}</div>
          <div>Active Tab: {activeTab}</div>
        </div>
      )}

      {/* 標籤切換 */}
      {token && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'users' ? '#3b82f6' : (isDark ? '#333' : '#ddd'),
              color: activeTab === 'users' ? '#fff' : (isDark ? '#fff' : '#333'),
              cursor: 'pointer'
            }}
          >
            {t('userManagement')}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'messages' ? '#3b82f6' : (isDark ? '#333' : '#ddd'),
              color: activeTab === 'messages' ? '#fff' : (isDark ? '#fff' : '#333'),
              cursor: 'pointer'
            }}
          >
            {t('messageManagement')}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#ef4444',
          color: '#fff',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {!token ? null : loading ? (
        <div>{t('loadingMore')}</div>
      ) : (
        <>
          {activeTab === 'users' ? (
            <div>
              <h3 style={{ marginBottom: '15px' }}>{t('allUsers')} ({users.length})</h3>
              <div style={{
                backgroundColor: isDark ? '#2a2a3e' : '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{
                      backgroundColor: isDark ? '#3a3a4e' : '#f0f0f0',
                      borderBottom: `2px solid ${isDark ? '#444' : '#ddd'}`
                    }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('username')}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('displayName')}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('email')}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('role')}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('language')}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>{t('createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{
                        borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`
                      }}>
                        <td style={{ padding: '12px' }}>{user.username}</td>
                        <td style={{ padding: '12px' }}>{user.displayName}</td>
                        <td style={{ padding: '12px' }}>{user.email}</td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              backgroundColor: isDark ? '#333' : '#fff',
                              color: isDark ? '#fff' : '#333'
                            }}
                          >
                            <option value="user">{t('userRole')}</option>
                            <option value="admin">{t('adminRole')}</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>{user.language}</td>
                        <td style={{ padding: '12px' }}>
                          {new Date(user.createdAt).toLocaleString(language === 'zh' ? 'zh-TW' : (language === 'JP' ? 'ja-JP' : 'en-US'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: '15px' }}>{t('allMessages')} ({messages.length})</h3>
              <div style={{
                backgroundColor: isDark ? '#2a2a3e' : '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    {t('noMessages')}
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message._id} style={{
                      padding: '15px',
                      marginBottom: '15px',
                      backgroundColor: isDark ? '#333' : '#f9f9f9',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? '#444' : '#ddd'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong>{message.artistNickname}</strong>
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          {new Date(message.createdAt).toLocaleString(language === 'zh' ? 'zh-TW' : (language === 'JP' ? 'ja-JP' : 'en-US'))}
                        </span>
                      </div>
                      <p style={{ marginBottom: '10px' }}>{message.content}</p>
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        {t('deleteBtn')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;
