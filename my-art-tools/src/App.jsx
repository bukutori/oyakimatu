import React, { useState, useEffect, useCallback, useRef } from 'react';

import SketchWall from './SketchWall';

import InspirationGenerator from './InspirationGenerator';

import ColorPalette from './ColorPalette';

import ImageBrowser from './ImageBrowser';

import AdminPanel from './AdminPanel';

import StationWall from './StationWall';

import logoImg from './img/144.png';

import TRANSLATIONS from './translations';



// ─────────────────────────────────────────────

// 後端 API 基礎 URL

// ─────────────────────────────────────────────

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;



// ─────────────────────────────────────────────

// 全域收藏 localStorage 鍵名（備用，未登入時使用）

// ─────────────────────────────────────────────

const LS_KEY = 'my-art-tools-favorites';

const AUTH_KEY = 'my-art-tools-auth';



// 導覽列設定（順序即渲染順序）

const NAV_TABS = [

  { id: 'explore', labelKey: 'explore' },

  { id: 'favorites', labelKey: 'favorites' },

  { id: 'sketch', labelKey: 'sketch' },

  { id: 'inspiration', labelKey: 'inspiration' },

  { id: 'palette', labelKey: 'palette' },

  { id: 'station', labelKey: 'station' },

];



// ─────────────────────────────────────────────

// 主題設定

// ─────────────────────────────────────────────

const THEMES = {

  dark: {

    background: '#0f0f0f',

    text: '#e0e0e0',

    cardBg: '#1a1a1a',

    border: 'rgba(255,255,255,0.07)',

    navBg: 'rgba(15, 15, 15, 0.85)',

  },

  light: {

    background: '#f5f5f5',

    text: '#111111',

    cardBg: '#ffffff',

    border: 'rgba(0,0,0,0.08)',

    navBg: 'rgba(255, 255, 255, 0.9)',

  },

};






// ─────────────────────────────────────────────────────────

// App：最上層狀態持有者

// ─────────────────────────────────────────────────────────

function App() {



  // ── 1. 用戶認證狀態 ───────────────────────────────

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const [authError, setAuthError] = useState('');



  // ── 1.5 主題狀態（深色/淺色模式）──────────────────────

  const [isDarkMode, setIsDarkMode] = useState(() => {

    const saved = localStorage.getItem('my-art-tools-dark-mode');

    return saved !== null ? saved === 'true' : true; // 預設深色模式

  });

  // ── 1.6 時間感知背景模式──────────────────────────────

  const [autoTimeMode, setAutoTimeMode] = useState(() => {

    const saved = localStorage.getItem('my-art-tools-auto-time-mode');

    return saved !== null ? saved === 'true' : false; // 預設關閉

  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [language, setLanguage] = useState('zh'); // 'zh' or 'JP'



  // 套用主題到 document

  useEffect(() => {

    const currentTheme = isDarkMode ? THEMES.dark : THEMES.light;

    document.body.style.backgroundColor = currentTheme.background;

    document.body.style.color = currentTheme.text;

    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    localStorage.setItem('my-art-tools-dark-mode', isDarkMode.toString());

  }, [isDarkMode]);

  // 更新時鐘（每秒）

  useEffect(() => {

    const timer = setInterval(() => {

      setCurrentTime(new Date());

    }, 1000);

    return () => clearInterval(timer);

  }, []);

  // 時間感知背景切換邏輯

  useEffect(() => {

    if (autoTimeMode) {

      const hour = new Date().getHours();

      const isNight = hour < 6 || hour >= 18;

      setIsDarkMode(isNight);

    }

  }, [autoTimeMode]);

  // 儲存自動時間模式設定

  useEffect(() => {

    localStorage.setItem('my-art-tools-auto-time-mode', autoTimeMode.toString());

  }, [autoTimeMode]);

  // 儲存語言設定到後端

  const saveLanguagePreference = async (lang) => {

    if (!user || !token) return;

    try {

      // 使用新的 PUT /api/auth/settings 端點同步到雲端
      const response = await fetch(`${API_BASE}/auth/settings`, {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`,

        },

        body: JSON.stringify({ language: lang }),

      });

      const data = await response.json();
      if (data.success) {
        console.log('語言設定已同步到雲端');
      }

    } catch (error) {

      console.error('儲存語言設定失敗:', error);

    }

  };

  // 語言切換處理

  const handleLanguageChange = (newLanguage) => {

    setLanguage(newLanguage);

    saveLanguagePreference(newLanguage);

  };

  // 取得當前語言的翻譯

  const t = (key) => TRANSLATIONS[language][key] || key;



  const toggleDarkMode = () => {

    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // 同步到雲端
    if (user && token) {
      syncThemeSettingsToCloud({ isDarkMode: newDarkMode });
    }

  };

  const syncThemeSettingsToCloud = async (themeSettings) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ themeSettings }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('主題設定已同步到雲端');
      }
    } catch (error) {
      console.error('同步主題設定失敗:', error);
    }
  };



  // 從 localStorage 讀取認證資訊並載入雲端資料

  useEffect(() => {

    const loadAuthAndCloudData = async () => {
      try {

        const raw = localStorage.getItem(AUTH_KEY);

        if (raw) {

          const { token: savedToken, user: savedUser } = JSON.parse(raw);

          console.log('[Auth] 發現 localStorage Token，開始載入雲端資料...');

          setToken(savedToken);

          setUser(savedUser);

          // 載入雲端資料（收藏、語言、主題設定）
          const meResponse = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          
          if (!meResponse.ok) {
            console.error('[Auth] /api/auth/me 請求失敗:', meResponse.status);
            return;
          }

          const meData = await meResponse.json();
          
          if (meData.success) {
            console.log('[Auth] 雲端資料載入成功:', meData.user);
            
            setUser(meData.user);
            localStorage.setItem(AUTH_KEY, JSON.stringify({ token: savedToken, user: meData.user }));

            // 初始化雲端同步的狀態
            if (meData.user.favorites && Array.isArray(meData.user.favorites)) {
              console.log('[Auth] 載入收藏照片:', meData.user.favorites.length, '張');
              console.log('[Auth] 收藏照片資料結構:', JSON.stringify(meData.user.favorites[0], null, 2));
              setSavedImages(meData.user.favorites);
            } else {
              console.log('[Auth] 雲端無收藏資料，使用空陣列');
              setSavedImages([]);
            }
            
            if (meData.user.language) {
              console.log('[Auth] 載入語言設定:', meData.user.language);
              setLanguage(meData.user.language);
            }
            
            if (meData.user.themeSettings) {
              console.log('[Auth] 載入主題設定:', meData.user.themeSettings);
              if (meData.user.themeSettings.isDarkMode !== undefined) {
                setIsDarkMode(meData.user.themeSettings.isDarkMode);
              }
            }
          } else {
            console.error('[Auth] 雲端資料載入失敗:', meData.message);
          }

        } else {
          console.log('[Auth] localStorage 無 Token，跳過雲端載入');
        }

      } catch (e) {

        console.error('[Auth] 無法讀取 localStorage 或載入雲端資料', e);

      }
    };

    loadAuthAndCloudData();

  }, []);



  // ── 2. 全域收藏狀態（預設為空陣列，由雲端或 localStorage 初始化）───────────

  const [savedImages, setSavedImages] = useState([]);

  // 確保 savedImages 總是陣列
  const safeSavedImages = Array.isArray(savedImages) ? savedImages : [];



  // 收藏狀態變更時同步至 localStorage（未登入時）

  useEffect(() => {

    if (!user) {

      try {

        localStorage.setItem(LS_KEY, JSON.stringify(savedImages));

      } catch (e) {

        console.error('[Favorites] 無法寫入 localStorage', e);

      }

    }

  }, [savedImages, user]);



  const syncFavoriteToBackend = useCallback(async (img, action) => {

    if (!user || !token) return;

    try {

      // 計算更新後的收藏列表
      const updatedFavorites = action === 'add'
        ? [...safeSavedImages, {
            id: img.id,
            author: img.author || '未知作者',
            url: img.url || `https://picsum.photos/id/${img.id}/600/450`,
            isCustom: img.isCustom || false,
            savedAt: Date.now(),
          }]
        : safeSavedImages.filter(item => String(item.id) !== String(img.id));

      // 使用新的 PUT /api/auth/settings 端點同步到雲端
      const response = await fetch(`${API_BASE}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          favorites: updatedFavorites,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 後端已經更新，不需要再從後端拉取
        console.log('收藏同步到雲端成功');
      }

    } catch (e) {
      console.error('同步收藏到雲端失敗:', e);
    }

  }, [user, token, safeSavedImages, API_BASE]);



  const handleLogin = async (email, password) => {

    setAuthError('');

    try {

      const response = await fetch(`${API_BASE}/auth/login`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ email, password }),

      });

      const data = await response.json();

      

      if (data.success) {

        // 立即更新狀態（使用登入回傳的資料，不需要額外呼叫 /me）
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));

        // 立即初始化雲端同步的狀態
        if (data.user.favorites && Array.isArray(data.user.favorites)) {
          setSavedImages(data.user.favorites);
        }
        if (data.user.language) {
          setLanguage(data.user.language);
        }
        if (data.user.themeSettings) {
          if (data.user.themeSettings.isDarkMode !== undefined) {
            setIsDarkMode(data.user.themeSettings.isDarkMode);
          }
        }

        setShowAuthModal(false);

        setAuthError('');

      } else {

        setAuthError(data.message || '登入失敗');

      }

    } catch (e) {

      setAuthError('網路錯誤，請稍後再試');

    }

  };



  const handleRegister = async (username, email, password, displayName) => {

    setAuthError('');

    try {

      const response = await fetch(`${API_BASE}/auth/register`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ username, email, password, displayName }),

      });

      const data = await response.json();

      

      if (data.success) {

        setToken(data.token);

        setUser(data.user);

        localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));

        setShowAuthModal(false);

        setAuthError('');

      } else {

        setAuthError(data.message || '註冊失敗');

      }

    } catch (e) {

      setAuthError('網路錯誤，請稍後再試');

    }

  };



  const handleLogout = () => {

    setToken(null);

    setUser(null);

    localStorage.removeItem(AUTH_KEY);

    // 重置所有狀態到預設值
    setSavedImages([]);
    setLanguage('zh');
    setIsDarkMode(false);
    setAutoTimeMode(false);

  };



  // ── 4. 切換收藏的共用函式（Props 向下傳遞給子組件）──────

  const toggleFavorite = useCallback((img) => {

    if (!img) return;

    

    // 未登入時提示

    if (!user) {

      alert('請先登入會員，才能解鎖收藏功能喔！');

      setShowAuthModal(true);

      return;

    }

    

    const alreadySaved = safeSavedImages.some(item => String(item.id) === String(img.id));

    const action = alreadySaved ? 'remove' : 'add';

    

    // 先更新本地狀態

    setSavedImages(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      
      if (alreadySaved) {

        return prevArray.filter(item => String(item.id) !== String(img.id));

      }

      return [...prevArray, {

        id: img.id,

        author: img.author || '未知作者',

        url: img.url || `https://picsum.photos/id/${img.id}/600/450`,

        isCustom: img.isCustom || false,

        savedAt: Date.now(),

      }];

    });

    

    // 同步到後端

    syncFavoriteToBackend(img, action);

  }, [user, safeSavedImages, syncFavoriteToBackend]);



  // ── 5. 單頁面分頁切換（SPA view）──────────────────────

  const [activeView, setActiveView] = useState('explore');



  // ── 6. 收藏畫廊 Lightbox ──────────────────────────────

  const [zoomedImage, setZoomedImage] = useState(null);



  // ── Hover 狀態（導覽列按鈕 micro-animation）────────────

  const [hoveredTab, setHoveredTab] = useState(null);



  // ── 7. 手機版漢堡選單開關狀態 ────────────────────────────

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);

  // 點擊選單外部關閉

  useEffect(() => {

    const handleClickOutside = (e) => {

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {

        setIsMobileMenuOpen(false);

      }

    };

    if (isMobileMenuOpen) {

      document.addEventListener('mousedown', handleClickOutside);

    }

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, [isMobileMenuOpen]);

  // ── 8. 通知系統狀態 ────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);

  const formatTimeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins} ${t('minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;
    return `${diffDays} ${t('daysAgo')}`;
  };

  const fetchUnreadNotifCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadNotifCount(data.count);
      }
    } catch (err) {
      console.error('[fetchUnreadNotifCount] 錯誤:', err);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter(n => !n.isRead).length;
        setUnreadNotifCount(unread);
      }
    } catch (err) {
      console.error('[fetchNotifications] 錯誤:', err);
    }
  }, [token]);

  const goToNotificationTarget = (notif) => {
    setActiveView('station');
    setShowNotifPanel(false);
    if (notif.type === 'apply' && user && user.role === 'admin') {
      window.__stationWallInitialTab = 'pending';
      window.dispatchEvent(new CustomEvent('switch-station-tab', { detail: 'pending' }));
    } else {
      window.__stationWallInitialTab = 'public';
      window.dispatchEvent(new CustomEvent('switch-station-tab', { detail: 'public' }));
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.isRead) {
      goToNotificationTarget(notif);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/notifications/${notif._id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
        goToNotificationTarget(notif);
      }
    } catch (err) {
      console.error('[handleNotificationClick] 錯誤:', err);
      goToNotificationTarget(notif);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadNotifCount(0);
      }
    } catch (err) {
      console.error('[markAllNotificationsAsRead] 錯誤:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      setUnreadNotifCount(0);
      setNotifications([]);
      return;
    }
    fetchUnreadNotifCount();
    const interval = setInterval(() => {
      fetchUnreadNotifCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [token, fetchUnreadNotifCount]);

  useEffect(() => {
    if (showNotifPanel) {
      fetchNotifications();
    }
  }, [showNotifPanel, fetchNotifications]);

  useEffect(() => {
    const handleClickOutsideNotif = (e) => {
      const btn = document.getElementById('notif-btn');
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target) && (!btn || !btn.contains(e.target))) {
        setShowNotifPanel(false);
      }
    };
    if (showNotifPanel) {
      document.addEventListener('mousedown', handleClickOutsideNotif);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideNotif);
  }, [showNotifPanel]);




  // ──────────────────────────────────────────────────────

  // Style helpers

  // ──────────────────────────────────────────────────────

  const getNavBtnStyle = (tabId) => {

    const isActive = activeView === tabId;

    const isHovered = hoveredTab === tabId;

    const currentTheme = isDarkMode ? THEMES.dark : THEMES.light;

    const isLight = !isDarkMode;

    

    return {

      display: 'flex',

      alignItems: 'center',

      gap: '5px',

      padding: '8px 12px',

      borderRadius: '10px',

      border: 'none',

      cursor: 'pointer',

      fontWeight: '600',

      fontSize: '0.88rem',

      whiteSpace: 'nowrap',

      transition: 'all 0.22s ease',

      outline: 'none',

      backgroundColor: isActive

        ? isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 113, 133, 0.18)'

        : isHovered

          ? isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'

          : 'transparent',

      color: isActive 

        ? (isLight ? '#3b82f6' : '#fb7185') 

        : isHovered 

          ? currentTheme.text 

          : (isLight ? '#6b7280' : '#9ca3af'),

      borderBottom: isActive 

        ? (isLight ? '2px solid #3b82f6' : '2px solid #fb7185') 

        : '2px solid transparent',

    };

  };



  // ──────────────────────────────────────────────────────

  // Render helpers

  // ──────────────────────────────────────────────────────

  const renderView = () => {

    switch (activeView) {



      // ── 探索靈感：ImageBrowser 全頁展示 ──────────────

      case 'explore':

        return (

          <ImageBrowser

            savedImages={safeSavedImages}

            toggleFavorite={toggleFavorite}

            theme={isDarkMode ? 'dark' : 'light'}

            language={language}

          />

        );



      // ── 我的收藏：收藏畫廊 ────────────────────────────

      case 'favorites':

        return <FavoritesGallery

          savedImages={safeSavedImages}

          toggleFavorite={toggleFavorite}

          onZoom={setZoomedImage}

          onGoExplore={() => setActiveView('explore')}

          theme={isDarkMode ? 'dark' : 'light'}

        />;



      // ── 速寫練習 ──────────────────────────────────────

      case 'sketch':

        return (

          <SketchWall

            savedImages={safeSavedImages}

            toggleFavorite={toggleFavorite}

            theme={isDarkMode ? 'dark' : 'light'}

            language={language}

          />

        );



      // ── 靈感抽籤 ──────────────────────────────────────

      case 'inspiration':

        return <InspirationGenerator theme={isDarkMode ? 'dark' : 'light'} language={language} />;



      // ── 主題色票 ──────────────────────────────────────

      case 'palette':

        return <ColorPalette theme={isDarkMode ? 'dark' : 'light'} language={language} />;



      // ── 驛站留言牆 ──────────────────────────────────────

      case 'station':

        return <StationWall token={token} user={user} theme={isDarkMode ? 'dark' : 'light'} language={language} />;



      // ── 管理員面板 ──────────────────────────────────────

      case 'admin':

        return <AdminPanel token={token} theme={isDarkMode ? 'dark' : 'light'} onClose={() => setActiveView('explore')} />;



      default:

        return null;

    }



  };



  // ──────────────────────────────────────────────────────

  // JSX

  // ──────────────────────────────────────────────────────

  const currentTheme = isDarkMode ? THEMES.dark : THEMES.light;

  const isLight = !isDarkMode;



  return (

    <div style={{

      background: isLight
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8edf5 100%)'
        : 'linear-gradient(135deg, #0a0a0f 0%, #0f1117 50%, #111827 100%)',

      minHeight: '100vh',

      width: '100vw',

      marginLeft: '0',

      marginRight: '0',

      paddingLeft: '0',

      paddingRight: '0',

      color: currentTheme.text,

      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

      transition: 'background 0.4s ease, color 0.3s ease',

      overflowX: 'hidden',

    }}>



      <style>{`
        @keyframes pulseNotif {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 5px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════
           頂部導覽列 — 毛玻璃 + RWD 漢堡選單
      ═══════════════════════════════════════════════════ */}

      <header
        ref={mobileMenuRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: isLight
            ? 'rgba(248, 250, 252, 0.82)'
            : 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          borderBottom: isLight
            ? '1px solid rgba(148, 163, 184, 0.18)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isLight
            ? '0 2px 20px rgba(0,0,0,0.06)'
            : '0 2px 20px rgba(0,0,0,0.3)',
          padding: '0',
          transition: 'all 0.3s ease',
        }}
      >

        {/* ── 主列（Logo + 桌面導覽 + 右側工具列） ── */}
        <div style={{
          width: '100%',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '12px',
          boxSizing: 'border-box',
        }}>

          {/* ─ Logo ─ */}
          <div 
            onClick={() => setActiveView('explore')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >

            <div style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img
                src={logoImg}
                alt="繪師驛站 Logo"
                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                color: currentTheme.text,
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
              }}>
                繪師驛站
              </div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: '500',
                letterSpacing: '0.08em',
                color: isLight ? '#94a3b8' : '#475569',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Artist Tools
              </div>
            </div>
          </div>


          {/* ─ 桌面版導覽列（md 以上顯示）─ */}
          <nav
            id="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              flex: 1,
              justifyContent: 'center',
              padding: '5px 8px',
              background: isLight
                ? 'rgba(0,0,0,0.04)'
                : 'rgba(255,255,255,0.04)',
              borderRadius: '14px',
              border: isLight
                ? '1px solid rgba(0,0,0,0.06)'
                : '1px solid rgba(255,255,255,0.06)',
              maxWidth: '760px',
              flexWrap: 'wrap',
            }}
            className="hide-mobile"
          >

            {NAV_TABS.map(tab => (

              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                style={getNavBtnStyle(tab.id)}
                onClick={() => {
                  if (tab.external) {
                    window.open(tab.url, '_blank');
                  } else {
                    setActiveView(tab.id);
                  }
                }}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <span style={{ whiteSpace: 'nowrap' }}>
                  {tab.labelKey ? t(tab.labelKey) : tab.label}
                </span>

                {tab.external && (
                  <span style={{ fontSize: '0.65rem', marginLeft: '2px', opacity: 0.7 }}>↗</span>
                )}

                {tab.id === 'favorites' && safeSavedImages && safeSavedImages.length > 0 && (
                  <span style={{
                    backgroundColor: isLight ? '#3b82f6' : '#fb7185',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    lineHeight: '1.5',
                    marginLeft: '3px',
                    flexShrink: 0,
                  }}>
                    {safeSavedImages.length}
                  </span>
                )}
              </button>

            ))}
          </nav>


          {/* ─ 右側工具列 ─ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}>

            {/* 數位時鐘 (桌面顯示) */}
            <div
              className="hide-mobile"
              style={{
                padding: '5px 10px',
                borderRadius: '10px',
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                color: currentTheme.text,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {currentTime.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: '400', opacity: 0.65, whiteSpace: 'nowrap' }}>
                {currentTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
            </div>


            {/* 深色/淺色切換 */}
            <button
              id="toggle-darkmode-btn"
              onClick={toggleDarkMode}
              disabled={autoTimeMode}
              title={autoTimeMode ? t('autoTimeModeEnabled') : t('toggleDarkMode')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: 'none',
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                color: autoTimeMode ? '#888' : currentTheme.text,
                fontSize: '1.1rem',
                cursor: autoTimeMode ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: autoTimeMode ? 0.45 : 1,
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!autoTimeMode) {
                  e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={e => {
                if (!autoTimeMode) {
                  e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>


            {/* 設定與通知按鈕（登入後） */}
            {user && (
              <>
                {/* 通知鈴鐺按鈕 */}
                <div style={{ position: 'relative' }} ref={notifPanelRef}>
                  <button
                    id="notif-btn"
                    onClick={() => setShowNotifPanel(prev => !prev)}
                    title={t('notifications')}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                      color: currentTheme.text,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    🔔
                    {unreadNotifCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.4)',
                          animation: 'pulseNotif 1.5s infinite',
                        }}
                      />
                    )}
                  </button>

                  {/* 下拉通知面板 */}
                  {showNotifPanel && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '46px',
                        right: '0',
                        width: '320px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        borderRadius: '12px',
                        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 25, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isLight ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' : '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* 面板頭部 */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: currentTheme.text }}>
                          {t('notifications')} ({unreadNotifCount})
                        </span>
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isLight ? '#3b82f6' : '#fb7185',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(59,130,246,0.1)' : 'rgba(251,113,133,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            {t('markAllRead')}
                          </button>
                        )}
                      </div>

                      {/* 通知列表 */}
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div
                            style={{
                              padding: '30px 20px',
                              textAlign: 'center',
                              color: isLight ? '#94a3b8' : '#475569',
                              fontSize: '0.82rem',
                            }}
                          >
                            {t('noNotifications')}
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              style={{
                                padding: '12px 14px',
                                borderBottom: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                background: notif.isRead 
                                  ? 'transparent' 
                                  : (isLight ? 'rgba(59,130,246,0.05)' : 'rgba(251,113,133,0.05)'),
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}
                              onMouseLeave={e => e.currentTarget.style.background = notif.isRead 
                                ? 'transparent' 
                                : (isLight ? 'rgba(59,130,246,0.05)' : 'rgba(251,113,133,0.05)')}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                  {notif.type === 'apply' && '📬'}
                                  {notif.type === 'approved' && '✅'}
                                  {notif.type === 'comment' && '💬'}
                                </span>
                                <div style={{ flex: 1, fontSize: '0.78rem', color: currentTheme.text, lineHeight: '1.4', textAlign: 'left' }}>
                                  <strong>{notif.senderName}</strong> {notif.message.replace(notif.senderName, '').trim()}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#475569', alignSelf: 'flex-end' }}>
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="settings-btn"
                  onClick={() => setShowSettingsModal(true)}
                  title={t('settings')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                    color: currentTheme.text,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.transform = 'rotate(45deg) scale(1.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  }}
                >
                  ⚙️
                </button>
              </>
            )}


            {/* 用戶狀態 / 登入按鈕（桌面版） */}
            {user ? (
              <div
                className="hide-mobile"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '10px',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                  border: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ fontSize: '1rem' }}>👤</span>
                  <span style={{
                    color: currentTheme.text,
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user.displayName || user.username}
                  </span>
                  {user.role === 'admin' && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.6rem',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>

                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9px',
                    border: `1px solid ${currentTheme.border}`,
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                    color: isLight ? '#64748b' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = isLight ? '#64748b' : '#94a3b8';
                    e.currentTarget.style.borderColor = currentTheme.border;
                  }}
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <button
                id="login-btn-desktop"
                className="hide-mobile"
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); setAuthError(''); }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  border: isLight ? '1.5px solid rgba(59,130,246,0.4)' : '1.5px solid rgba(251,113,133,0.4)',
                  background: isLight ? 'rgba(59,130,246,0.1)' : 'rgba(251,113,133,0.1)',
                  color: isLight ? '#3b82f6' : '#fb7185',
                  fontSize: '0.83rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.22s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isLight ? 'rgba(59,130,246,0.2)' : 'rgba(251,113,133,0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(59,130,246,0.25)' : '0 4px 12px rgba(251,113,133,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isLight ? 'rgba(59,130,246,0.1)' : 'rgba(251,113,133,0.1)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>👤</span>
                <span style={{ whiteSpace: 'nowrap' }}>{t('login')} / {t('register')}</span>
              </button>
            )}


            {/* ── 漢堡選單按鈕（手機版）─────────────────────── */}
            <button
              id="hamburger-btn"
              className="show-mobile"
              aria-label="開啟選單"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '11px',
                border: isLight
                  ? '1.5px solid rgba(0,0,0,0.1)'
                  : '1.5px solid rgba(255,255,255,0.12)',
                background: isMobileMenuOpen
                  ? (isLight ? 'rgba(59,130,246,0.12)' : 'rgba(251,113,133,0.12)')
                  : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                cursor: 'pointer',
                transition: 'all 0.22s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '9px',
                flexShrink: 0,
              }}
            >
              {/* 三條線動態變叉 */}
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    borderRadius: '2px',
                    background: isMobileMenuOpen
                      ? (isLight ? '#3b82f6' : '#fb7185')
                      : currentTheme.text,
                    transformOrigin: 'center',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    transform: isMobileMenuOpen
                      ? i === 0 ? 'translateY(7px) rotate(45deg)'
                        : i === 1 ? 'scaleX(0) opacity(0)'
                        : 'translateY(-7px) rotate(-45deg)'
                      : 'none',
                    opacity: isMobileMenuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>

          </div>
        </div>


        {/* ── 手機版下拉選單（僅手機顯示）─────────────────── */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-enter show-mobile"
            style={{
              width: '100%',
              padding: '12px 16px 20px',
              borderTop: isLight
                ? '1px solid rgba(0,0,0,0.07)'
                : '1px solid rgba(255,255,255,0.06)',
              background: isLight
                ? 'rgba(248, 250, 252, 0.95)'
                : 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >

            {/* 導覽按鈕 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: '8px',
            }}>
              {NAV_TABS.map((tab, idx) => {
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`mobile-nav-btn-${tab.id}`}
                    onClick={() => {
                      if (tab.external) {
                        window.open(tab.url, '_blank');
                      } else {
                        setActiveView(tab.id);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isActive
                        ? (isLight ? '1.5px solid rgba(59,130,246,0.35)' : '1.5px solid rgba(251,113,133,0.35)')
                        : (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'),
                      background: isActive
                        ? (isLight ? 'rgba(59,130,246,0.1)' : 'rgba(251,113,133,0.1)')
                        : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                      color: isActive
                        ? (isLight ? '#3b82f6' : '#fb7185')
                        : currentTheme.text,
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      animation: `fadeInUp 0.2s ease ${idx * 0.04}s both`,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {tab.labelKey ? t(tab.labelKey) : tab.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tab.id === 'favorites' && safeSavedImages.length > 0 && (
                        <span style={{
                          background: isLight ? '#3b82f6' : '#fb7185',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '1px 6px',
                          borderRadius: '8px',
                        }}>
                          {safeSavedImages.length}
                        </span>
                      )}
                      {isActive && <span style={{ fontSize: '0.8rem' }}>✓</span>}
                      {tab.external && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>↗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 分隔線 */}
            <div style={{
              height: '1px',
              background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
              margin: '4px 0',
            }} />

            {/* 時鐘（手機版） */}
            <div style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeInUp 0.25s ease 0.15s both',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: '700', color: currentTheme.text }}>
                {currentTime.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
              <span style={{ fontSize: '0.82rem', color: isLight ? '#94a3b8' : '#475569' }}>
                {currentTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
            </div>

            {/* 用戶通知（手機版） */}
            {user && (
              <div style={{
                animation: 'fadeInUp 0.25s ease 0.18s both',
                marginBottom: '4px',
              }}>
                <button
                  onClick={() => {
                    setActiveView('station');
                    setShowNotifPanel(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                    color: currentTheme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔔</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{t('notifications')}</span>
                  </div>
                  {unreadNotifCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}>
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 用戶區（手機版） */}
            {user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                animation: 'fadeInUp 0.25s ease 0.2s both',
              }}>
                <span style={{ fontSize: '1.1rem' }}>👤</span>
                <span style={{
                  flex: 1,
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  color: currentTheme.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.displayName || user.username}
                </span>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <button
                id="login-btn-mobile"
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode('login');
                  setAuthError('');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: isLight ? '1.5px solid rgba(59,130,246,0.4)' : '1.5px solid rgba(251,113,133,0.4)',
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.1))'
                    : 'linear-gradient(135deg, rgba(251,113,133,0.12), rgba(244,63,94,0.1))',
                  color: isLight ? '#3b82f6' : '#fb7185',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'fadeInUp 0.25s ease 0.22s both',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>👤</span>
                <span>{t('login')} / {t('register')}</span>
              </button>
            )}

          </div>
        )}

      </header>



      {/* ── 主內容區（全螢幕響應式）─────────────────── */}

      <main style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0',
        padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px) 60px',
        boxSizing: 'border-box',
        flex: 1,
      }}>
        {renderView()}
      </main>



      {/* ── 收藏圖片大圖 Lightbox ────────────────────── */}

      {zoomedImage && (

        <FavoritesLightbox

          image={zoomedImage}

          onClose={() => setZoomedImage(null)}

          onUnfavorite={() => {

            toggleFavorite(zoomedImage);

            setZoomedImage(null);

          }}

        />

      )}



      {/* ── 登入/註冊 Modal ──────────────────────────── */}

      {showAuthModal && (

        <AuthModal

          mode={authMode}

          onClose={() => {

            setShowAuthModal(false);

            setAuthError('');

          }}

          onModeChange={setAuthMode}

          onLogin={handleLogin}

          onRegister={handleRegister}

          error={authError}

          theme={isDarkMode ? 'dark' : 'light'}

        />

      )}

      {/* ── 設定 Modal ────────────────────────────────── */}

      {showSettingsModal && (

        <div

          style={{

            position: 'fixed',

            inset: 0,

            backgroundColor: 'rgba(0, 0, 0, 0.6)',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            zIndex: 2000,

            backdropFilter: 'blur(4px)',

          }}

          onClick={() => setShowSettingsModal(false)}

        >

          <div

            style={{

              backgroundColor: currentTheme.cardBg,

              borderRadius: '16px',

              padding: '28px',

              maxWidth: '400px',

              width: '90%',

              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',

              border: `1px solid ${currentTheme.border}`,

            }}

            onClick={e => e.stopPropagation()}

          >

            <div style={{

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              marginBottom: '24px',

            }}>

              <h3 style={{

                margin: 0,

                fontSize: '1.3rem',

                fontWeight: 'bold',

                color: currentTheme.text,

              }}>

                ⚙️ {t('settings')}

              </h3>

              <button

                onClick={() => setShowSettingsModal(false)}

                style={{

                  background: 'none',

                  border: 'none',

                  color: currentTheme.text,

                  fontSize: '1.5rem',

                  cursor: 'pointer',

                  padding: '4px',

                  lineHeight: '1',

                }}

              >

                ✕

              </button>

            </div>

            {/* 語言選擇 */}

            <div style={{

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              padding: '16px',

              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',

              borderRadius: '12px',

              border: `1px solid ${currentTheme.border}`,

              marginBottom: '16px',

            }}>

              <div>

                <div style={{

                  fontSize: '1rem',

                  fontWeight: '600',

                  color: currentTheme.text,

                  marginBottom: '4px',

                }}>

                  {t('language')}

                </div>

              </div>

              <select

                value={language}

                onChange={(e) => handleLanguageChange(e.target.value)}

                style={{

                  padding: '8px 12px',

                  borderRadius: '8px',

                  border: `1px solid ${currentTheme.border}`,

                  backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                  color: currentTheme.text,

                  fontSize: '0.9rem',

                  cursor: 'pointer',

                  outline: 'none',

                }}

              >

                <option value="zh">繁體中文</option>

                <option value="JP">日本語</option>

              </select>

            </div>

            {/* 時間感知背景開關 */}

            <div style={{

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              padding: '16px',

              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',

              borderRadius: '12px',

              border: `1px solid ${currentTheme.border}`,

            }}>

              <div>

                <div style={{

                  fontSize: '1rem',

                  fontWeight: '600',

                  color: currentTheme.text,

                  marginBottom: '4px',

                }}>

                  {t('timeAwareBackground')}

                </div>

                <div style={{

                  fontSize: '0.8rem',

                  color: isLight ? '#6b7280' : '#888',

                }}>

                  {t('timeAwareBackgroundDesc')}

                </div>

              </div>

              <button

                onClick={() => setAutoTimeMode(!autoTimeMode)}

                style={{

                  width: '52px',

                  height: '28px',

                  borderRadius: '14px',

                  border: 'none',

                  backgroundColor: autoTimeMode ? (isLight ? '#3b82f6' : '#fb7185') : (isLight ? '#d1d5db' : '#4b5563'),

                  cursor: 'pointer',

                  position: 'relative',

                  transition: 'background-color 0.2s',

                }}

              >

                <div

                  style={{

                    position: 'absolute',

                    top: '3px',

                    left: autoTimeMode ? '27px' : '3px',

                    width: '22px',

                    height: '22px',

                    borderRadius: '50%',

                    backgroundColor: '#ffffff',

                    transition: 'left 0.2s',

                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',

                  }}

                />

              </button>

            </div>

            {/* 說明文字 */}

            <div style={{

              marginTop: '16px',

              padding: '12px',

              backgroundColor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(251, 113, 133, 0.08)',

              borderRadius: '8px',

              border: isLight ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(251, 113, 133, 0.2)',

              fontSize: '0.8rem',

              color: isLight ? '#3b82f6' : '#fb7185',

              lineHeight: '1.6',

            }}>

              <strong>{t('timeRules')}</strong><br />

              • {t('dayMode')}<br />

              • {t('nightMode')}<br />

              <br />

              <strong>{t('note')}</strong><br />

              {t('autoModeNote')}

            </div>

            {/* 管理員選項 - 僅管理員可見 */}

            {user && user.role === 'admin' && (

              <div style={{

                marginTop: '16px',

                padding: '16px',

                backgroundColor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.08)',

                borderRadius: '12px',

                border: isLight ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',

              }}>

                <div style={{

                  fontSize: '1rem',

                  fontWeight: '600',

                  color: currentTheme.text,

                  marginBottom: '12px',

                }}>

                   管理員功能

                </div>

                <button

                  onClick={() => {

                    setShowSettingsModal(false);

                    setActiveView('admin');

                  }}

                  style={{

                    width: '100%',

                    padding: '12px',

                    borderRadius: '8px',

                    border: 'none',

                    backgroundColor: '#ef4444',

                    color: '#fff',

                    fontSize: '0.9rem',

                    fontWeight: '600',

                    cursor: 'pointer',

                    transition: 'background-color 0.2s',

                  }}

                  onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}

                  onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}

                >

                  開啟管理員面板

                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* ── 頁尾 ─────────────────────────────────────────── */}
<footer style={{
  padding: 'clamp(40px, 6vw, 72px) clamp(16px, 4vw, 40px) clamp(24px, 4vw, 40px)',
  borderTop: isLight
    ? '1px solid rgba(148,163,184,0.2)'
    : '1px solid rgba(255,255,255,0.06)',
  background: isLight
    ? 'rgba(248,250,252,0.8)'
    : 'rgba(10,10,15,0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: currentTheme.text,
  fontSize: '0.9rem',
  letterSpacing: '0.01em',
}}>
  <div style={{
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'clamp(24px, 4vw, 48px)',
  }}>

    {/* 關於 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: isLight ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 'linear-gradient(135deg, #1e1b4b, #312e81)',
          border: isLight ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>
          🖌️
        </div>
        <h4 style={{
          margin: '0',
          fontSize: '1rem',
          fontWeight: '700',
          color: isLight ? '#3b82f6' : '#fb7185',
          letterSpacing: '-0.01em',
        }}>
          {t('footerAbout')}
        </h4>
      </div>
      <p style={{
        margin: '0',
        lineHeight: '1.75',
        color: isLight ? '#64748b' : '#64748b',
        fontSize: '0.875rem',
      }}>
        {t('footerAboutDesc')}
      </p>
    </div>

    {/* 快捷連結 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 style={{
        margin: '0 0 4px 0',
        fontSize: '1rem',
        fontWeight: '700',
        color: isLight ? '#3b82f6' : '#fb7185',
        letterSpacing: '-0.01em',
      }}>
        {t('footerQuickLinks')}
      </h4>
      <ul style={{ margin: '0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <li>
          <a
            href="https://bukutori.github.io/devfolio-1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? '#64748b' : '#64748b',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = isLight ? '#3b82f6' : '#fb7185'; }}
            onMouseOut={e => { e.currentTarget.style.color = isLight ? '#64748b' : '#64748b'; }}
          >
            <span style={{ fontSize: '0.85rem' }}>↗</span>
            {t('footerMySite')}
          </a>
        </li>
      </ul>
    </div>

    {/* 連線狀態 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 style={{
        margin: '0 0 4px 0',
        fontSize: '1rem',
        fontWeight: '700',
        color: isLight ? '#3b82f6' : '#fb7185',
        letterSpacing: '-0.01em',
      }}>
        {t('footerStatus')}
      </h4>
      <p style={{
        margin: '0 0 12px 0',
        lineHeight: '1.75',
        color: isLight ? '#64748b' : '#64748b',
        fontSize: '0.875rem',
      }}>
        {t('footerStatusDesc')}
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.75rem',
          padding: '4px 10px',
          borderRadius: '20px',
          background: isLight ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: isLight ? '#059669' : '#34d399',
          fontWeight: '600',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          {t('footerStatusSynced')}
        </span>
      </div>
    </div>
  </div>

  {/* 底部版權 */}
  <div style={{
    maxWidth: '1200px',
    margin: '40px auto 0 auto',
    paddingTop: '20px',
    borderTop: isLight ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: 0.5,
    fontSize: '0.78rem',
    textAlign: 'center',
  }}>
    © 2024 – {new Date().getFullYear()} {t('footerCopyright')} · All rights reserved.
  </div>
</footer>

    </div>

  );

}



// ──────────────────────────────────────────────────────────

// FavoritesGallery

// ──────────────────────────────────────────────────────────

function FavoritesGallery({ savedImages, toggleFavorite, onZoom, onGoExplore, theme = 'dark' }) {

  const [hoveredId, setHoveredId] = useState(null);

  const currentTheme = THEMES[theme] || THEMES.dark;
  const isLight = theme === 'light';



  if (savedImages.length === 0) {

    return (

      <div style={{

        textAlign: 'center',

        padding: '80px 20px',

        backgroundColor: currentTheme.cardBg,

        borderRadius: '20px',

        border: `1px dashed ${currentTheme.border}`,

        maxWidth: '560px',

        margin: '60px auto',

        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',

      }}>

        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '18px' }}>🖼️</span>

        <h2 style={{ color: currentTheme.text, fontSize: '1.5rem', margin: '0 0 10px', fontWeight: '700' }}>

          收藏庫空空如也

        </h2>

        <p style={{ color: isLight ? '#6b7280' : '#888', fontSize: '0.95rem', lineHeight: '1.7', margin: '0 0 28px' }}>

          在「探索靈感」或「速寫練習」中<br />點擊圖片上的 🤍 愛心，即可收藏在此！

        </p>

        <button

          onClick={onGoExplore}

          style={{

            background: 'linear-gradient(135deg, #fb7185, #f43f5e)',

            color: '#fff',

            border: 'none',

            borderRadius: '10px',

            padding: '11px 24px',

            fontWeight: 'bold',

            cursor: 'pointer',

            fontSize: '0.95rem',

            boxShadow: '0 4px 16px rgba(251,113,133,0.35)',

            transition: 'opacity 0.2s',

          }}

          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}

          onMouseLeave={e => e.currentTarget.style.opacity = '1'}

        >

          前往探索靈感 →

        </button>

      </div>

    );

  }



  return (

    <div>

      <div style={{

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: '24px',

        borderBottom: `1px solid ${currentTheme.border}`,

        paddingBottom: '16px',

      }}>

        <h2 style={{

          color: currentTheme.text,

          fontSize: '1.6rem',

          margin: 0,

          fontWeight: '700',

          display: 'flex',

          alignItems: 'center',

          gap: '8px',

        }}>

          ❤️ 我的收藏

          <span style={{

            fontSize: '0.8rem',

            backgroundColor: isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251,113,133,0.15)',

            color: isLight ? '#3b82f6' : '#fb7185',

            border: isLight ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(251,113,133,0.3)',

            borderRadius: '20px',

            padding: '2px 10px',

            fontWeight: '600',

          }}>

            {savedImages.length} 張

          </span>

        </h2>

      </div>



      <div style={{

        display: 'grid',

        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',

        gap: '20px',

      }}>

        {savedImages.map(img => (

          <div

            key={img.id}

            style={{

              backgroundColor: currentTheme.cardBg,

              borderRadius: '14px',

              overflow: 'hidden',

              border: hoveredId === img.id

                ? (isLight ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(251,113,133,0.4)')

                : `1px solid ${currentTheme.border}`,

              boxShadow: hoveredId === img.id

                ? '0 12px 32px rgba(0,0,0,0.5)'

                : '0 4px 16px rgba(0,0,0,0.3)',

              cursor: 'pointer',

              position: 'relative',

              aspectRatio: '4/3',

              transform: hoveredId === img.id ? 'translateY(-5px) scale(1.02)' : 'none',

              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

            }}

            onMouseEnter={() => setHoveredId(img.id)}

            onMouseLeave={() => setHoveredId(null)}

            onClick={() => onZoom(img)}

          >

            <img

              src={img.url}

              alt={img.author}

              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}

              loading="lazy"

            />

            {/* 底部漸層資訊欄 */}

            <div style={{

              position: 'absolute',

              bottom: 0, left: 0, right: 0,

              padding: '20px 14px 10px',

              background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

            }}>

              <span style={{

                color: '#ddd',

                fontSize: '0.72rem',

                overflow: 'hidden',

                textOverflow: 'ellipsis',

                whiteSpace: 'nowrap',

                maxWidth: '75%',

              }}>

                👤 {img.author}

              </span>

              {/* 移除收藏按鈕 */}

              <button

                onClick={e => { e.stopPropagation(); toggleFavorite(img); }}

                style={{

                  background: 'none',

                  border: 'none',

                  color: '#fb7185',

                  cursor: 'pointer',

                  fontSize: '1.2rem',

                  padding: '3px',

                  transition: 'transform 0.2s',

                  outline: 'none',

                }}

                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}

                onMouseLeave={e => e.currentTarget.style.transform = 'none'}

                title="取消收藏"

              >

                ❤️

              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}



// ──────────────────────────────────────────────────────────

// FavoritesLightbox

// ──────────────────────────────────────────────────────────

function FavoritesLightbox({ image, onClose, onUnfavorite }) {

  return (

    <div

      style={{

        position: 'fixed',

        inset: 0,

        backgroundColor: 'rgba(0,0,0,0.92)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 99999,

        padding: '20px',

        backdropFilter: 'blur(10px)',

        cursor: 'zoom-out',

        animation: 'lbFadeIn 0.22s ease',

      }}

      onClick={onClose}

    >

      <style>{`

        @keyframes lbFadeIn {

          from { opacity: 0; transform: scale(0.96); }

          to   { opacity: 1; transform: scale(1);    }

        }

      `}</style>



      <div

        style={{

          position: 'relative',

          width: '100%',

          maxWidth: '820px',

          backgroundColor: '#181818',

          borderRadius: '18px',

          padding: '24px',

          border: '1px solid rgba(255,255,255,0.09)',

          boxShadow: '0 32px 80px rgba(0,0,0,0.85)',

          cursor: 'default',

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          gap: '20px',

        }}

        onClick={e => e.stopPropagation()}

      >

        {/* 關閉 */}

        <button

          onClick={onClose}

          style={{

            position: 'absolute',

            top: '14px',

            right: '14px',

            background: 'rgba(255,255,255,0.06)',

            border: 'none',

            color: '#fff',

            borderRadius: '50%',

            width: '32px',

            height: '32px',

            fontSize: '1rem',

            cursor: 'pointer',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            outline: 'none',

            transition: 'background 0.2s',

          }}

          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}

          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}

        >

          ✕

        </button>



        <h4 style={{

          margin: 0,

          color: '#fff',

          fontSize: '1rem',

          fontWeight: '600',

          alignSelf: 'flex-start',

          display: 'flex',

          alignItems: 'center',

          gap: '6px',

        }}>

          🖼️ 收藏大圖檢視

        </h4>



        <img

          src={

            image.url.includes('picsum.photos')

              ? image.url.replace(/\/\d+\/\d+$/, '/900/675')

              : image.url

          }

          alt={image.author}

          style={{

            maxWidth: '100%',

            maxHeight: '65vh',

            borderRadius: '10px',

            objectFit: 'contain',

            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',

          }}

        />



        <div style={{

          width: '100%',

          display: 'flex',

          justifyContent: 'space-between',

          alignItems: 'center',

          borderTop: '1px solid rgba(255,255,255,0.07)',

          paddingTop: '16px',

        }}>

          <span style={{ color: '#999', fontSize: '0.88rem' }}>

            👤 {image.author}{image.isCustom ? '（自訂上傳）' : ''}

          </span>

          <button

            onClick={onUnfavorite}

            style={{

              backgroundColor: '#ef4444',

              color: '#fff',

              border: 'none',

              borderRadius: '9px',

              padding: '8px 18px',

              fontSize: '0.85rem',

              fontWeight: 'bold',

              cursor: 'pointer',

              transition: 'background 0.2s',

              outline: 'none',

              display: 'flex',

              alignItems: 'center',

              gap: '5px',

            }}

            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}

            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}

          >

            💔 取消收藏

          </button>

        </div>

      </div>

    </div>

  );

}



// ──────────────────────────────────────────────────────────

// AuthModal - 登入/註冊彈窗

// ──────────────────────────────────────────────────────────

function AuthModal({ mode, onClose, onModeChange, onLogin, onRegister, error, theme = 'dark' }) {

  const [formData, setFormData] = useState({

    username: '',

    email: '',

    password: '',

    displayName: '',

  });

  const currentTheme = THEMES[theme] || THEMES.dark;
  const isLight = theme === 'light';



  const handleSubmit = (e) => {

    e.preventDefault();

    if (mode === 'login') {

      onLogin(formData.email, formData.password);

    } else {

      onRegister(formData.username, formData.email, formData.password, formData.displayName);

    }

  };



  return (

    <div

      style={{

        position: 'fixed',

        inset: 0,

        backgroundColor: 'rgba(0,0,0,0.85)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 99999,

        padding: '20px',

        backdropFilter: 'blur(8px)',

        animation: 'modalFadeIn 0.2s ease',

      }}

      onClick={onClose}

    >

      <style>{`

        @keyframes modalFadeIn {

          from { opacity: 0; transform: scale(0.95); }

          to   { opacity: 1; transform: scale(1);    }

        }

      `}</style>



      <div

        style={{

          position: 'relative',

          width: '100%',

          maxWidth: '420px',

          backgroundColor: currentTheme.cardBg,

          borderRadius: '20px',

          padding: '32px',

          border: `1px solid ${currentTheme.border}`,

          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',

          cursor: 'default',

        }}

        onClick={e => e.stopPropagation()}

      >

        {/* 關閉按鈕 */}

        <button

          onClick={onClose}

          style={{

            position: 'absolute',

            top: '16px',

            right: '16px',

            background: 'none',

            border: 'none',

            color: isLight ? '#6b7280' : '#666',

            fontSize: '1.5rem',

            cursor: 'pointer',

            padding: '4px',

            lineHeight: '1',

            transition: 'color 0.2s',

          }}

          onMouseEnter={e => e.currentTarget.style.color = currentTheme.text}

          onMouseLeave={e => e.currentTarget.style.color = isLight ? '#6b7280' : '#666'}

        >

          ✕

        </button>



        {/* 標題 */}

        <h2 style={{

          color: currentTheme.text,

          fontSize: '1.6rem',

          margin: '0 0 24px',

          fontWeight: '700',

          textAlign: 'center',

        }}>

          {mode === 'login' ? '👤 登入會員' : '📝 註冊新會員'}

        </h2>



        {/* 模式切換 */}

        <div style={{

          display: 'flex',

          backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

          borderRadius: '10px',

          padding: '4px',

          marginBottom: '24px',

        }}>

          <button

            onClick={() => {

              onModeChange('login');

              setFormData({ username: '', email: '', password: '', displayName: '' });

            }}

            style={{

              flex: 1,

              padding: '10px',

              border: 'none',

              borderRadius: '8px',

              backgroundColor: mode === 'login' ? (isLight ? '#3b82f6' : '#fb7185') : 'transparent',

              color: mode === 'login' ? '#fff' : (isLight ? '#6b7280' : '#888'),

              fontSize: '0.9rem',

              fontWeight: '600',

              cursor: 'pointer',

              transition: 'all 0.2s',

            }}

          >

            登入

          </button>

          <button

            onClick={() => {

              onModeChange('register');

              setFormData({ username: '', email: '', password: '', displayName: '' });

            }}

            style={{

              flex: 1,

              padding: '10px',

              border: 'none',

              borderRadius: '8px',

              backgroundColor: mode === 'register' ? (isLight ? '#3b82f6' : '#fb7185') : 'transparent',

              color: mode === 'register' ? '#fff' : (isLight ? '#6b7280' : '#888'),

              fontSize: '0.9rem',

              fontWeight: '600',

              cursor: 'pointer',

              transition: 'all 0.2s',

            }}

          >

            註冊

          </button>

        </div>



        {/* 表單 */}

        <form onSubmit={handleSubmit}>

          {mode === 'register' && (

            <>

              <div style={{ marginBottom: '16px' }}>

                <label style={{

                  display: 'block',

                  color: isLight ? '#6b7280' : '#aaa',

                  fontSize: '0.85rem',

                  marginBottom: '6px',

                  fontWeight: '500',

                }}>

                  使用者名稱

                </label>

                <input

                  type="text"

                  value={formData.username}

                  onChange={e => setFormData({ ...formData, username: e.target.value })}

                  placeholder="例如：artist01"

                  required

                  style={{

                    width: '100%',

                    padding: '12px 14px',

                    borderRadius: '10px',

                    border: `1px solid ${currentTheme.border}`,

                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                    color: currentTheme.text,

                    fontSize: '0.95rem',

                    outline: 'none',

                    transition: 'border-color 0.2s',

                  }}

                  onFocus={e => e.currentTarget.style.borderColor = isLight ? '#3b82f6' : '#fb7185'}

                  onBlur={e => e.currentTarget.style.borderColor = currentTheme.border}

                />

              </div>



              <div style={{ marginBottom: '16px' }}>

                <label style={{

                  display: 'block',

                  color: isLight ? '#6b7280' : '#aaa',

                  fontSize: '0.85rem',

                  marginBottom: '6px',

                  fontWeight: '500',

                }}>

                  顯示名稱

                </label>

                <input

                  type="text"

                  value={formData.displayName}

                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}

                  placeholder="例如：繪師小花"

                  required

                  style={{

                    width: '100%',

                    padding: '12px 14px',

                    borderRadius: '10px',

                    border: `1px solid ${currentTheme.border}`,

                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                    color: currentTheme.text,

                    fontSize: '0.95rem',

                    outline: 'none',

                    transition: 'border-color 0.2s',

                  }}

                  onFocus={e => e.currentTarget.style.borderColor = isLight ? '#3b82f6' : '#fb7185'}

                  onBlur={e => e.currentTarget.style.borderColor = currentTheme.border}

                />

              </div>

            </>

          )}



          <div style={{ marginBottom: '16px' }}>

            <label style={{

              display: 'block',

              color: isLight ? '#6b7280' : '#aaa',

              fontSize: '0.85rem',

              marginBottom: '6px',

              fontWeight: '500',

            }}>

              Email

            </label>

            <input

              type="email"

              value={formData.email}

              onChange={e => setFormData({ ...formData, email: e.target.value })}

              placeholder="your@email.com"

              required

              style={{

                width: '100%',

                padding: '12px 14px',

                borderRadius: '10px',

                border: `1px solid ${currentTheme.border}`,

                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                color: currentTheme.text,

                fontSize: '0.95rem',

                outline: 'none',

                transition: 'border-color 0.2s',

              }}

              onFocus={e => e.currentTarget.style.borderColor = isLight ? '#3b82f6' : '#fb7185'}

              onBlur={e => e.currentTarget.style.borderColor = currentTheme.border}

            />

          </div>



          <div style={{ marginBottom: '24px' }}>

            <label style={{

              display: 'block',

              color: isLight ? '#6b7280' : '#aaa',

              fontSize: '0.85rem',

              marginBottom: '6px',

              fontWeight: '500',

            }}>

              密碼

            </label>

            <input

              type="password"

              value={formData.password}

              onChange={e => setFormData({ ...formData, password: e.target.value })}

              placeholder="••••••••"

              required

              style={{

                width: '100%',

                padding: '12px 14px',

                borderRadius: '10px',

                border: `1px solid ${currentTheme.border}`,

                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                color: currentTheme.text,

                fontSize: '0.95rem',

                outline: 'none',

                transition: 'border-color 0.2s',

              }}

              onFocus={e => e.currentTarget.style.borderColor = isLight ? '#3b82f6' : '#fb7185'}

              onBlur={e => e.currentTarget.style.borderColor = currentTheme.border}

            />

          </div>



          {/* 錯誤訊息 */}

          {error && (

            <div style={{

              backgroundColor: 'rgba(239, 68, 68, 0.15)',

              border: '1px solid rgba(239, 68, 68, 0.3)',

              borderRadius: '8px',

              padding: '10px 14px',

              marginBottom: '16px',

              color: '#ef4444',

              fontSize: '0.85rem',

              textAlign: 'center',

            }}>

              {error}

            </div>

          )}



          {/* 提交按鈕 */}

          <button

            type="submit"

            style={{

              width: '100%',

              padding: '14px',

              borderRadius: '10px',

              border: 'none',

              background: isLight ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #fb7185, #f43f5e)',

              color: '#fff',

              fontSize: '1rem',

              fontWeight: 'bold',

              cursor: 'pointer',

              transition: 'opacity 0.2s, transform 0.2s',

            }}

            onMouseEnter={e => {

              e.currentTarget.style.opacity = '0.9';

              e.currentTarget.style.transform = 'translateY(-1px)';

            }}

            onMouseLeave={e => {

              e.currentTarget.style.opacity = '1';

              e.currentTarget.style.transform = 'none';

            }}

          >

            {mode === 'login' ? '登入' : '註冊'}

          </button>

        </form>



        {/* 測試帳號提示 */}

        {mode === 'login' && (

          <div style={{

            marginTop: '20px',

            padding: '12px',

            backgroundColor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(251, 113, 133, 0.08)',

            borderRadius: '8px',

            border: isLight ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(251, 113, 133, 0.2)',

            fontSize: '0.8rem',

            color: isLight ? '#3b82f6' : '#fb7185',

            lineHeight: '1.6',

          }}>

            <strong>測試帳號：</strong><br />

            Email: artist01@example.com<br />

            密碼: password123

          </div>

        )}

      </div>

    </div>

  );

}



export default App;