import React, { useState, useEffect, useCallback } from 'react';
import SketchWall from './SketchWall';
import InspirationGenerator from './InspirationGenerator';
import ColorPalette from './ColorPalette';
import ImageBrowser from './ImageBrowser';
import logoImg from './img/144.png';

// ─────────────────────────────────────────────
// 全域收藏 localStorage 鍵名
// 對接後端時：將此處的讀寫邏輯替換為 API call
// GET /api/favorites → 初始化 savedImages
// POST /api/favorites → 新增
// DELETE /api/favorites/:id → 移除
// ─────────────────────────────────────────────
const LS_KEY = 'my-art-tools-favorites';

// 導覽列設定（順序即渲染順序）
const NAV_TABS = [
  { id: 'explore', label: ' 探索靈感' },
  { id: 'favorites', label: ' 我的收藏' },
  { id: 'sketch', label: ' 速寫練習' },
  { id: 'inspiration', label: ' 靈感抽籤' },
  { id: 'palette', label: ' 主題色票' },
  { id: 'my-site', label: '我的網站' }
];

// ─────────────────────────────────────────────────────────
// App：最上層狀態持有者
// ─────────────────────────────────────────────────────────
function App() {

  // ── 1. 全域收藏狀態（由 localStorage 初始化）───────────
  const [savedImages, setSavedImages] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // 收藏狀態變更時同步至 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(savedImages));
    } catch (e) {
      console.error('[Favorites] 無法寫入 localStorage', e);
    }
  }, [savedImages]);

  // ── 2. 切換收藏的共用函式（Props 向下傳遞給子組件）──────
  const toggleFavorite = useCallback((img) => {
    if (!img) return;
    setSavedImages(prev => {
      const alreadySaved = prev.some(item => String(item.id) === String(img.id));
      if (alreadySaved) {
        return prev.filter(item => String(item.id) !== String(img.id));
      }
      // FavoriteImage 資料結構（欄位與後端 API schema 對齊）：
      // { id, author, url, isCustom, savedAt }
      return [...prev, {
        id: img.id,
        author: img.author || '未知作者',
        url: img.url || `https://picsum.photos/id/${img.id}/600/450`,
        isCustom: img.isCustom || false,
        savedAt: Date.now(),
      }];
    });
  }, []);

  // ── 3. 單頁面分頁切換（SPA view）──────────────────────
  const [activeView, setActiveView] = useState('explore');

  // ── 4. 收藏畫廊 Lightbox ──────────────────────────────
  const [zoomedImage, setZoomedImage] = useState(null);

  // ── Hover 狀態（導覽列按鈕 micro-animation）────────────
  const [hoveredTab, setHoveredTab] = useState(null);

  // ──────────────────────────────────────────────────────
  // Style helpers
  // ──────────────────────────────────────────────────────
  const getNavBtnStyle = (tabId) => {
    const isActive = activeView === tabId;
    const isHovered = hoveredTab === tabId;
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
        ? 'rgba(251, 113, 133, 0.18)'
        : isHovered
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
      color: isActive ? '#fb7185' : isHovered ? '#fff' : '#9ca3af',
      borderBottom: isActive ? '2px solid #fb7185' : '2px solid transparent',
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
            savedImages={savedImages}
            toggleFavorite={toggleFavorite}
          />
        );

      // ── 我的收藏：收藏畫廊 ────────────────────────────
      case 'favorites':
        return <FavoritesGallery
          savedImages={savedImages}
          toggleFavorite={toggleFavorite}
          onZoom={setZoomedImage}
          onGoExplore={() => setActiveView('explore')}
        />;

      // ── 速寫練習 ──────────────────────────────────────
      case 'sketch':
        return (
          <SketchWall
            savedImages={savedImages}
            toggleFavorite={toggleFavorite}
          />
        );

      // ── 靈感抽籤 ──────────────────────────────────────
      case 'inspiration':
        return <InspirationGenerator />;

      // ── 主題色票 ──────────────────────────────────────
      case 'palette':
        return <ColorPalette />;

      case 'my-site':
        return (
          <div style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
            <iframe
              src="https://bukutori.github.io/devfolio-1.0.0/" // 💡 這裡換成你另一個專案的網址（或 localhost 網址）
              title="My Personal Website"
              style={{
                width: '100%',
                height: 'calc(100vh - 160px)', // 💡 自動計算高度，扣掉頂部導覽列，讓它剛好塞滿螢幕
                border: 'none',                // 去除傳統內嵌框架的邊框
                backgroundColor: '#111',       // 在另一個網站載入前顯示的背景底色
              }}
            />
          </div>
        );

      default:
        return null;
    }

  };

  // ──────────────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────────────
  return (
    <div style={{
      backgroundColor: '#0f0f0f',
      minHeight: '100vh',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>

      {/* ── 頂部導覽列 ───────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 15, 15, 0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
      }}>
        {/* 內容限寬容器 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
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
              color: '#fff',
              letterSpacing: '-0.5px',
            }}>
              畫師工具箱
            </span>
          </div>

          {/* 導覽按鈕群組 */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            padding: '6px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '13px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                style={getNavBtnStyle(tab.id)}
                onClick={() => setActiveView(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {tab.label}
                {/* 收藏數量徽章 */}
                {tab.id === 'favorites' && savedImages.length > 0 && (
                  <span style={{
                    backgroundColor: '#fb7185',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    lineHeight: '1.4',
                    marginLeft: '2px',
                  }}>
                    {savedImages.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── 主內容區（限寬 + 水平置中）─────────────────── */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px 60px',
        width: '100%',
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// FavoritesGallery
// ──────────────────────────────────────────────────────────
function FavoritesGallery({ savedImages, toggleFavorite, onZoom, onGoExplore }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (savedImages.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '20px',
        border: '1px dashed rgba(255,255,255,0.1)',
        maxWidth: '560px',
        margin: '60px auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '18px' }}>🖼️</span>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 10px', fontWeight: '700' }}>
          收藏庫空空如也
        </h2>
        <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: '1.7', margin: '0 0 28px' }}>
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
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: '16px',
      }}>
        <h2 style={{
          color: '#fff',
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
            backgroundColor: 'rgba(251,113,133,0.15)',
            color: '#fb7185',
            border: '1px solid rgba(251,113,133,0.3)',
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
              backgroundColor: '#1a1a1a',
              borderRadius: '14px',
              overflow: 'hidden',
              border: hoveredId === img.id
                ? '1px solid rgba(251,113,133,0.4)'
                : '1px solid rgba(255,255,255,0.07)',
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

export default App;