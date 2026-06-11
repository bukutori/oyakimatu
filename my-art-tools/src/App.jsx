import React, { useState, useEffect, useCallback } from 'react';

import SketchWall from './SketchWall';

import InspirationGenerator from './InspirationGenerator';

import ColorPalette from './ColorPalette';

import ImageBrowser from './ImageBrowser';

import AdminPanel from './AdminPanel';

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

  // 從後端撈取語言設定

  const fetchLanguagePreference = async () => {

    if (!user || !token) return;

    try {

      const response = await fetch(`${API_BASE}/user/settings`, {

        method: 'GET',

        headers: {

          'Authorization': `Bearer ${token}`,

        },

      });

      if (response.ok) {

        const data = await response.json();

        if (data.language) {

          setLanguage(data.language);

        }

      }

    } catch (error) {

      console.error('撈取語言設定失敗:', error);

    }

  };

  // 登入成功後撈取語言設定

  useEffect(() => {

    if (user && token) {

      fetchLanguagePreference();

    }

  }, [user, token]);

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

          setToken(savedToken);

          setUser(savedUser);

          // 載入雲端資料（收藏、語言、主題設定）
          const meResponse = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          const meData = await meResponse.json();
          if (meData.success) {
            setUser(meData.user);
            localStorage.setItem(AUTH_KEY, JSON.stringify({ token: savedToken, user: meData.user }));

            // 初始化雲端同步的狀態
            if (meData.user.favorites && Array.isArray(meData.user.favorites)) {
              setSavedImages(meData.user.favorites);
            }
            if (meData.user.language) {
              setLanguage(meData.user.language);
            }
            if (meData.user.themeSettings) {
              // 如果有時間感知背景設定，可以在此處理
              if (meData.user.themeSettings.isDarkMode !== undefined) {
                setIsDarkMode(meData.user.themeSettings.isDarkMode);
              }
            }
          }

        }

      } catch (e) {

        console.error('[Auth] 無法讀取 localStorage 或載入雲端資料', e);

      }
    };

    loadAuthAndCloudData();

  }, []);



  // ── 2. 全域收藏狀態（由 localStorage 初始化）───────────

  const [savedImages, setSavedImages] = useState(() => {

    try {

      const raw = localStorage.getItem(LS_KEY);

      return raw ? JSON.parse(raw) : [];

    } catch {

      return [];

    }

  });

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



  // 登入後從後端載入收藏

  useEffect(() => {

    if (user && token) {

      fetchFavorites();

    }

  }, [user, token]);



  // ── 3. 後端 API 函式 ───────────────────────────────

  const fetchFavorites = useCallback(async () => {

    if (!user || !token) return;

    try {

      const response = await fetch(`${API_BASE}/favorites?userId=${user.id}`, {

        headers: {

          'Authorization': `Bearer ${token}`,

        },

      });

      const data = await response.json();

      if (data.success) {

        setSavedImages(data.favorites);

      }

    } catch (e) {

      console.error('[Favorites] 載入失敗', e);

    }

  }, [user, token]);



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

        setToken(data.token);

        setUser(data.user);

        localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));

        // 呼叫 /api/auth/me 取得完整用戶資訊（包含 role、favorites、language、themeSettings）
        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        const meData = await meResponse.json();
        if (meData.success) {
          setUser(meData.user);
          localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: meData.user }));

          // 初始化雲端同步的狀態
          if (meData.user.favorites && Array.isArray(meData.user.favorites)) {
            setSavedImages(meData.user.favorites);
          }
          if (meData.user.language) {
            setLanguage(meData.user.language);
          }
          if (meData.user.themeSettings) {
            // 如果有時間感知背景設定，可以在此處理
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

      padding: '9px 16px',

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

      backgroundColor: currentTheme.background,

      minHeight: '100vh',

      width: '100vw',

      marginLeft: '0',

      marginRight: '0',

      paddingLeft: '0',

      paddingRight: '0',

      color: currentTheme.text,

      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

      transition: 'background-color 0.3s ease, color 0.3s ease',

      overflowX: 'hidden',

    }}>



      {/* ── 頂部導覽列 ───────────────────────────────── */}

      <header style={{

        position: 'sticky',

        top: 0,

        zIndex: 1000,

        backgroundColor: currentTheme.navBg,

        backdropFilter: 'blur(14px)',

        borderBottom: 'none',

        padding: '0',

        transition: 'background-color 0.3s ease',

      }}>

        {/* 內容容器 - 全螢幕響應式 */}

        <div style={{

          width: '100%',

          maxWidth: '100%',

          margin: '0',

          padding: '0 24px',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'space-between',

          height: '60px',

          gap: '16px',

        }}>

          <div style={{

            display: 'flex',

            alignItems: 'center',

            gap: '8px', // 💡 這裡可以控制圖片和文字的距離，數字越小越近（例如：6px 或 4px）

          }}>

            <img

              src={logoImg}

              alt="Logo"

              style={{

                width: '50px',

                height: '50px',

                objectFit: 'contain'

              }}

            />

            <span style={{

              fontSize: '1.1rem',

              fontWeight: '800',

              color: currentTheme.text,

              letterSpacing: '-0.5px',

            }}>

              繪師驛站

            </span>

          </div>



          {/* 導覽按鈕群組 - 響應式 */}

          <nav style={{

            display: 'flex',

            alignItems: 'center',

            gap: '4px',

            overflowX: 'auto',

            padding: '6px',

            backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',

            borderRadius: '13px',

            border: 'none',

            maxWidth: 'calc(100% - 200px)',

          }}>

            {NAV_TABS.map(tab => (

              <button

                key={tab.id}

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

                {tab.labelKey ? t(tab.labelKey) : tab.label}

                {/* 外部連結圖示 */}

                {tab.external && (

                  <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>↗</span>

                )}

                {/* 收藏數量徽章 */}

                {tab.id === 'favorites' && safeSavedImages && safeSavedImages.length > 0 && (

                  <span style={{

                    backgroundColor: isLight ? '#3b82f6' : '#fb7185',

                    color: '#fff',

                    fontSize: '0.7rem',

                    fontWeight: '800',

                    padding: '1px 5px',

                    borderRadius: '8px',

                    lineHeight: '1.4',

                    marginLeft: '2px',

                  }}>

                    {safeSavedImages.length}

                  </span>

                )}

              </button>

            ))}

          </nav>



          {/* 右側控制區（時鐘、背景切換、設定） */}

          <div style={{

            display: 'flex',

            alignItems: 'center',

            gap: '6px',

          }}>

            {/* 數位時鐘顯示 */}

            <div style={{

              padding: '6px 12px',

              borderRadius: '10px',

              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

              color: currentTheme.text,

              fontSize: '0.9rem',

              fontWeight: '600',

              fontFamily: 'monospace',

              display: 'flex',

              flexDirection: 'column',

              alignItems: 'center',

              gap: '2px',

            }}>

              <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>

                {currentTime.toLocaleTimeString('zh-TW', {

                  hour: 'numeric',

                  minute: '2-digit',

                  hour12: true

                })}

              </span>

              <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.8 }}>

                {currentTime.toLocaleDateString('zh-TW', {

                  year: 'numeric',

                  month: 'long',

                  day: 'numeric',

                  weekday: 'long'

                })}

              </span>

            </div>

            {/* 深色/淺色切換按鈕 */}

            <button

              onClick={toggleDarkMode}

              disabled={autoTimeMode}

              title={autoTimeMode ? t('autoTimeModeEnabled') : t('toggleDarkMode')}

              style={{

                padding: '8px 12px',

                borderRadius: '10px',

                border: 'none',

                backgroundColor: autoTimeMode ? 'rgba(128,128,128,0.2)' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),

                color: autoTimeMode ? '#888' : currentTheme.text,

                fontSize: '1.2rem',

                cursor: autoTimeMode ? 'not-allowed' : 'pointer',

                transition: 'all 0.2s',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                opacity: autoTimeMode ? 0.5 : 1,

              }}

              onMouseEnter={e => {

                if (!autoTimeMode) {

                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

                  e.currentTarget.style.transform = 'scale(1.05)';

                }

              }}

              onMouseLeave={e => {

                if (!autoTimeMode) {

                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

                  e.currentTarget.style.transform = 'scale(1)';

                }

              }}

            >

              {isDarkMode ? '🌙' : '☀️'}

            </button>

            {/* 設定按鈕（僅登入後顯示） */}

            {user && (

              <button

                onClick={() => setShowSettingsModal(true)}

                style={{

                  padding: '8px 12px',

                  borderRadius: '10px',

                  border: 'none',

                  backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                  color: currentTheme.text,

                  fontSize: '1.2rem',

                  cursor: 'pointer',

                  transition: 'all 0.2s',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                }}

                onMouseEnter={e => {

                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

                  e.currentTarget.style.transform = 'scale(1.05)';

                }}

                onMouseLeave={e => {

                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

                  e.currentTarget.style.transform = 'scale(1)';

                }}

              >

                ⚙️

              </button>

            )}

          </div>



          {/* 登入/註冊按鈕 */}

          {user ? (

            <div style={{

              display: 'flex',

              alignItems: 'center',

              gap: '8px',

              marginRight: '60px'

            }}>

              <span style={{

                color: currentTheme.text,

                fontSize: '0.85rem',

                fontWeight: '500',

              }}>

                👤 {user.displayName || user.username}
                {user.role === 'admin' && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}>
                    ADMIN
                  </span>
                )}

              </span>

              <button

                onClick={handleLogout}

                style={{

                  padding: '6px 14px',

                  borderRadius: '8px',

                  border: `1px solid ${currentTheme.border}`,

                  backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',

                  color: isLight ? '#6b7280' : '#9ca3af',

                  fontSize: '0.8rem',

                  fontWeight: '600',

                  cursor: 'pointer',

                  transition: 'all 0.2s',

                }}

                onMouseEnter={e => {

                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';

                  e.currentTarget.style.color = '#ef4444';

                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';

                }}

                onMouseLeave={e => {

                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

                  e.currentTarget.style.color = isLight ? '#6b7280' : '#9ca3af';

                  e.currentTarget.style.borderColor = currentTheme.border;

                }}

              >

                登出

              </button>

            </div>

          ) : (

            <button

              onClick={() => {

                setShowAuthModal(true);

                setAuthMode('login');

                setAuthError('');

              }}

              style={{

                padding: '8px 16px',

                borderRadius: '10px',

                marginRight: '60px',

                border: isLight ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(251, 113, 133, 0.4)',

                backgroundColor: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(251, 113, 133, 0.12)',

                color: isLight ? '#3b82f6' : '#fb7185',

                fontSize: '0.85rem',

                fontWeight: '600',

                cursor: 'pointer',

                transition: 'all 0.2s',

                display: 'flex',

                alignItems: 'center',

                gap: '6px',

              }}

              onMouseEnter={e => {

                e.currentTarget.style.backgroundColor = isLight ? 'rgba(59, 130, 246, 0.22)' : 'rgba(251, 113, 133, 0.22)';

                e.currentTarget.style.transform = 'translateY(-1px)';

              }}

              onMouseLeave={e => {

                e.currentTarget.style.backgroundColor = isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(251, 113, 133, 0.12)';

                e.currentTarget.style.transform = 'none';

              }}

            >

              👤 登入/註冊

            </button>

          )}

        </div>

      </header>



      {/* ── 主內容區（全螢幕響應式）─────────────────── */}

      <main style={{

        width: '100%',

        maxWidth: '100%',

        margin: '0',

        padding: '32px 24px 60px',

        boxSizing: 'border-box',

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

      {/* 頁尾 */}
<footer style={{
  padding: '60px 20px 40px 20px',
  borderTop: `1px solid ${currentTheme.border}`,
  backgroundColor: currentTheme.bg,
  color: currentTheme.text,
  fontSize: '0.9rem',
}}>
  <div style={{
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '40px',
  }}>
    {/* 區塊一：關於 */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h4 style={{
        margin: '0 0 15px 0',
        fontSize: '1.1rem',
        fontWeight: '600',
        color: isLight ? '#3b82f6' : '#fb7185',
        letterSpacing: '1px'
      }}>
        關於畫師驛站
      </h4>
      <p style={{
        margin: '0',
        lineHeight: '1.7',
        opacity: 0.8
      }}>
        專為藝術創作者打造的數位工具箱。提供隨機繪畫靈感、精選色彩搭配與速寫練習功能，陪伴妳的創作每一天。
      </p>
    </div>

    {/* 區塊二：連結 */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h4 style={{
        margin: '0 0 15px 0',
        fontSize: '1.1rem',
        fontWeight: '600',
        color: isLight ? '#3b82f6' : '#fb7185',
        letterSpacing: '1px'
      }}>
        快捷連結
      </h4>
      <ul style={{
        margin: '0',
        padding: 0,
        listStyle: 'none',
      }}>
        <li style={{ marginBottom: '12px' }}>
          <a
            href="https://bukutori.github.io/devfolio-1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: currentTheme.text,
              textDecoration: 'none',
              opacity: 0.8,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = '1';
              e.target.style.color = isLight ? '#3b82f6' : '#fb7185';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '0.8';
              e.target.style.color = currentTheme.text;
            }}
          >
            我的個人網站
          </a>
        </li>
      </ul>
    </div>

    {/* 區塊三：驛站連線狀態 */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h4 style={{
        margin: '0 0 15px 0',
        fontSize: '1.1rem',
        fontWeight: '600',
        color: isLight ? '#3b82f6' : '#fb7185',
        letterSpacing: '1px'
      }}>
        驛站連線狀態
      </h4>
      <p style={{
        margin: '0 0 15px 0',
        lineHeight: '1.7',
        opacity: 0.8
      }}>
        雲端資料庫（MongoDB）已同步連線。歡迎前往交流討論版留下一期一會的創作足跡！
      </p>
      <div>
        <span style={{
          display: 'inline-block',
          fontSize: '0.8rem',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: isLight ? '#e0f2fe' : '#311523',
          color: isLight ? '#0369a1' : '#f43f5e',
          fontWeight: '500'
        }}>
          全球多伺服器同步中
        </span>
      </div>
    </div>
  </div>

  {/* 底部版權列 - 確保視覺收尾與橫向置中對齊 */}
  <div style={{
    maxWidth: '1200px',
    margin: '40px auto 0 auto',
    paddingTop: '20px',
    borderTop: `1px solid ${currentTheme.border}`,
    opacity: 0.5,
    fontSize: '0.8rem',
    textAlign: 'center'
  }}>
    © 2024 - {new Date().getFullYear()} 藝術創作工具箱 All rights reserved.
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