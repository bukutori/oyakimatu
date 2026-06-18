import React, { useState, useEffect, useCallback } from 'react';

import axios from 'axios';
import heartIcon from './img/like2.png';
import heartActiveIcon from './img/like3.png';
import pushpinIcon from './img/pushpin.png';
import TRANSLATIONS from './translations';



// ──────────────────────────────────────────────────

// 分類設定（調整 limit 以利一次多顯示圖片）

// ──────────────────────────────────────────────────

const categories = [

    { id: 'poses', name: '動作參考' },

    { id: 'landscapes', name: '奇幻風景' },

    { id: 'outfits', name: '角色穿搭' },

    { id: 'nature', name: '自然場景' },

    { id: 'urban', name: '都市建築' },

    { id: 'all', name: '全部' },

];



const INITIAL_LIMIT = 12;   // 初始載入張數

const MORE_LIMIT = 9;    // 每次「載入更多」追加張數



// ──────────────────────────────────────────────────

// 隨機生成 Picsum 圖片清單（避免 API 分頁重複）

// Picsum /v2/list 最多 page 80，limit 最多 100

// ──────────────────────────────────────────────────

const getRandomPage = () => Math.floor(Math.random() * 70) + 1;



// ──────────────────────────────────────────────────

// 主題設定

const THEMES = {

  dark: {

    background: '#0f0f0f',

    text: '#e0e0e0',

    cardBg: '#1a1a1a',

    border: 'rgba(255,255,255,0.08)',

  },

  light: {

    background: '#f5f5f5',

    text: '#1a1a1a',

    cardBg: '#ffffff',

    border: 'rgba(0,0,0,0.08)',

  },

  custom: {

    background: '#1a1a2e',

    text: '#e0e0e0',

    cardBg: '#16213e',

    border: 'rgba(255,255,255,0.1)',

  },

};



// ──────────────────────────────────────────────────

function ImageBrowser({ savedImages = [], toggleFavorite, theme = 'dark', language = 'zh' }) {



    const [selectedCategory, setSelectedCategory] = useState(categories[0]);

    // Translation helper
    const t = (key) => TRANSLATIONS[language][key] || key;

    const [images, setImages] = useState([]);

    const [pinnedImages, setPinnedImages] = useState([]);

    const [loading, setLoading] = useState(false);

    const [loadingMore, setLoadingMore] = useState(false); // 載入更多獨立狀態

    const [error, setError] = useState(null);

    const [activeImage, setActiveImage] = useState(null);

    const [modalMode, setModalMode] = useState('single');

    const [hoveredEl, setHoveredEl] = useState(null);

    const currentTheme = THEMES[theme] || THEMES.dark;

    const isLight = theme === 'light';

    const [canLoadMore, setCanLoadMore] = useState(true); // 是否還有更多

    const [extractedPalette, setExtractedPalette] = useState([]);
    const [copiedColorIndex, setCopiedColorIndex] = useState(null);
    const [isGrayscale, setIsGrayscale] = useState(false);
    const [toolboxOpen, setToolboxOpen] = useState(false);

    // ── Color Extraction Effect ────────────────────────
    useEffect(() => {
        if (activeImage && activeImage.url) {
            // Reset states
            setIsGrayscale(false);
            setCopiedColorIndex(null);
            setExtractedPalette([]);
            setToolboxOpen(false);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = activeImage.url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 60;
                    canvas.height = 60;
                    ctx.drawImage(img, 0, 0, 60, 60);
                    const imgData = ctx.getImageData(0, 0, 60, 60).data;

                    const colors = [];
                    for (let i = 0; i < imgData.length; i += 4) {
                        const r = imgData[i];
                        const g = imgData[i + 1];
                        const b = imgData[i + 2];
                        const a = imgData[i + 3];
                        if (a >= 128) {
                            colors.push({ r, g, b });
                        }
                    }

                    // Simple popularity analysis with spacing
                    const bins = {};
                    colors.forEach(c => {
                        const br = Math.round(c.r / 16) * 16;
                        const bg = Math.round(c.g / 16) * 16;
                        const bb = Math.round(c.b / 16) * 16;
                        const key = `${br},${bg},${bb}`;
                        bins[key] = (bins[key] || 0) + 1;
                    });

                    const sorted = Object.entries(bins)
                        .map(([key, count]) => {
                            const [r, g, b] = key.split(',').map(Number);
                            return { r, g, b, count };
                        })
                        .sort((a, b) => b.count - a.count);

                    const dominantColors = [];
                    for (const color of sorted) {
                        if (dominantColors.length >= 5) break;
                        const isDistinct = dominantColors.every(dc => {
                            const dist = Math.sqrt((dc.r - color.r) ** 2 + (dc.g - color.g) ** 2 + (dc.b - color.b) ** 2);
                            return dist > 45;
                        });
                        if (isDistinct || dominantColors.length === 0) {
                            dominantColors.push(color);
                        }
                    }

                    if (dominantColors.length < 5) {
                        for (const color of sorted) {
                            if (dominantColors.length >= 5) break;
                            if (!dominantColors.some(dc => dc.r === color.r && dc.g === color.g && dc.b === color.b)) {
                                dominantColors.push(color);
                            }
                        }
                    }

                    const hexColors = dominantColors.map(c => {
                        const toHex = val => {
                            const clamped = Math.max(0, Math.min(255, val));
                            const hex = clamped.toString(16);
                            return hex.length === 1 ? '0' + hex : hex;
                        };
                        return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`.toUpperCase();
                    });

                    // Ensure we always have 5 colors
                    while (hexColors.length < 5) {
                        hexColors.push('#888888');
                    }

                    setExtractedPalette(hexColors);
                } catch (err) {
                    console.error('Canvas processing error:', err);
                    setExtractedPalette(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);
                }
            };
            img.onerror = () => {
                console.error('Image loading failed for color extraction');
                setExtractedPalette(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);
            };
        }
    }, [activeImage]);

    // ── 初始拉取圖片 ──────────────────────────────

    const fetchImages = useCallback(async (category) => {

        setLoading(true);

        setError(null);

        setImages([]);

        setCanLoadMore(true);

        try {

            const categoryName = category.name;

            const res = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/images?category=${encodeURIComponent(categoryName)}&per_page=${INITIAL_LIMIT}&page=1`

            );

            if (res.data.success && Array.isArray(res.data.images)) {

                setImages(res.data.images);

                // 檢查是否還有更多圖片
                if (res.data.images.length < INITIAL_LIMIT) {
                    setCanLoadMore(false);
                }

            } else {

                throw new Error('Invalid data');

            }

        } catch (err) {

            console.error('ImageBrowser fetchImages error:', err);

            setError(t('loadFailed'));

        } finally {

            setLoading(false);

        }

    }, []);



    useEffect(() => {

        fetchImages(selectedCategory);

    }, [selectedCategory, fetchImages]);



    // ── 載入更多（隨機頁碼追加）─────────────────────

    const handleLoadMore = async () => {

        setLoadingMore(true);

        try {

            const currentPage = Math.ceil(images.length / INITIAL_LIMIT) + 1;
            const categoryName = selectedCategory.name;

            const res = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/images?category=${encodeURIComponent(categoryName)}&per_page=${MORE_LIMIT}&page=${currentPage}`

            );

            if (res.data.success && Array.isArray(res.data.images) && res.data.images.length > 0) {

                // 過濾掉已存在的 id，避免 key 重複

                setImages(prev => {

                    const existingIds = new Set(prev.map(i => i.id));

                    const fresh = res.data.images.filter(i => !existingIds.has(i.id));

                    return [...prev, ...fresh];

                });

                // 檢查是否還有更多圖片
                if (res.data.images.length < MORE_LIMIT) {
                    setCanLoadMore(false);
                }

            } else {

                setCanLoadMore(false);

            }

        } catch (err) {

            console.error('ImageBrowser loadMore error:', err);

        } finally {

            setLoadingMore(false);

        }

    };



    // ── 釘選功能 ────────────────────────────────────

    const togglePin = (img, e) => {

        if (e) e.stopPropagation();

        if (pinnedImages.some(item => item.id === img.id)) {

            setPinnedImages(prev => prev.filter(item => item.id !== img.id));

        } else {

            if (pinnedImages.length >= 6) {

                alert(t('pinLimit'));

                return;

            }

            setPinnedImages(prev => [...prev, img]);

        }

    };



    // ── 收藏按鈕點擊 ─────────────────────────────────

    const handleLikeClick = (item, e) => {

        if (e) e.stopPropagation();

        if (toggleFavorite) {

            toggleFavorite({

                id: item.id,

                author: item.author,

                url: item.url,

                isCustom: false,

            });

        }

    };



    // ── Lightbox 導覽 ─────────────────────────────────

    const handlePrev = (e) => {

        e.stopPropagation();

        if (modalMode === 'compare') return;

        const idx = images.findIndex(i => i.id === activeImage.id);

        setActiveImage(images[(idx - 1 + images.length) % images.length]);

    };



    const handleNext = (e) => {

        e.stopPropagation();

        if (modalMode === 'compare') return;

        const idx = images.findIndex(i => i.id === activeImage.id);

        setActiveImage(images[(idx + 1) % images.length]);

    };



    const openCompareModal = () => {

        if (pinnedImages.length > 0) {

            setModalMode('compare');

            setActiveImage(pinnedImages[0]);

        }

    };



    // ensure toolbox resets when closing
    const handleCloseLightbox = () => {
        setToolboxOpen(false);
        setActiveImage(null);
    };

    // ESC 鍵關閉工具箱（在燈箱開啟時有效）
    useEffect(() => {
        if (!activeImage) return;
        const onKey = (e) => {
            if (e.key === 'Escape' && toolboxOpen) {
                setToolboxOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeImage, toolboxOpen]);



    // ──────────────────────────────────────────────────

    // Styles

    // ──────────────────────────────────────────────────

    const cardStyle = {

        backgroundColor: currentTheme.cardBg,

        borderRadius: '18px',

        padding: '28px',

        boxShadow: isLight ? '0 8px 40px rgba(0,0,0,0.15)' : '0 8px 40px rgba(0,0,0,0.45)',

        border: `1px solid ${currentTheme.border}`,

        color: currentTheme.text,

        width: '100%',

        maxWidth: '100%',

        boxSizing: 'border-box',

        display: 'flex',

        flexDirection: 'column',

        gap: '20px',

        transition: 'background-color 0.3s ease, color 0.3s ease',

    };



    const headerStyle = {

        fontSize: '1.5rem',

        fontWeight: '800',

        textAlign: 'center',

        margin: 0,

        background: 'linear-gradient(135deg, #60a5fa, #818cf8)',

        WebkitBackgroundClip: 'text',

        WebkitTextFillColor: 'transparent',

    };



    const catBtnStyle = (cat) => {

        const isActive = selectedCategory.id === cat.id;

        const isHovered = hoveredEl === `cat-${cat.id}`;

        return {

            padding: '8px 16px',

            borderRadius: '10px',

            border: isActive ? 'none' : `1px solid ${currentTheme.border}`,

            background: isActive

                ? (isLight ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #3b82f6, #6366f1)')

                : isHovered ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)') : 'transparent',

            color: isActive ? '#fff' : isHovered ? currentTheme.text : (isLight ? '#6b7280' : '#888'),

            fontWeight: '600',

            fontSize: '0.88rem',

            cursor: 'pointer',

            transition: 'all 0.2s ease',

            boxShadow: isActive ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',

            transform: isHovered && !isActive ? 'translateY(-1px)' : 'none',

            outline: 'none',

            whiteSpace: 'nowrap',

        };

    };



    const imgWrapperStyle = (id) => {

        const isHov = hoveredEl === `img-${id}`;

        return {

            position: 'relative',

            borderRadius: '10px',

            overflow: 'hidden',

            aspectRatio: '4/3',

            cursor: 'pointer',

            backgroundColor: isLight ? '#e5e5e5' : '#111',

            boxShadow: isHov 

                ? (isLight ? '0 8px 20px rgba(0,0,0,0.25)' : '0 8px 20px rgba(0,0,0,0.6)') 

                : (isLight ? '0 2px 10px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.35)'),

            transform: isHov ? 'scale(1.04) translateY(-2px)' : 'scale(1)',

            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',

            border: `1px solid ${currentTheme.border}`,

        };

    };



    const renderSkeletons = (n = 12) =>

        Array(n).fill(0).map((_, i) => (

            <div

                key={`sk-${i}`}

                className="shimmer-card"

                style={{ borderRadius: '10px', aspectRatio: '4/3' }}

            />

        ));



    // ──────────────────────────────────────────────────

    // JSX

    // ──────────────────────────────────────────────────

    return (

        <div style={cardStyle}>

            {/* Animations */}

            <style>{`

                @keyframes shimmer {

                    0%   { background-position: -200% 0; }

                    100% { background-position:  200% 0; }

                }

                .shimmer-card {

                    background: linear-gradient(90deg, #151515 25%, #252525 50%, #151515 75%);

                    background-size: 200% 100%;

                    animation: shimmer 1.5s infinite;

                }

                @keyframes fadeInUp {

                    from { opacity: 0; transform: scale(0.95) translateY(8px); }

                    to   { opacity: 1; transform: scale(1)    translateY(0);    }

                }

                .lb-fade { animation: fadeInUp 0.25s cubic-bezier(0.4,0,0.2,1); }

            `}</style>



            {/* 標題 */}

            <h2 style={headerStyle}>{t('inspirationGallery')}</h2>



            {/* 分類按鈕 */}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>

                {categories.map(cat => (

                    <button

                        key={cat.id}

                        style={catBtnStyle(cat)}

                        onClick={() => selectedCategory.id !== cat.id && setSelectedCategory(cat)}

                        onMouseEnter={() => setHoveredEl(`cat-${cat.id}`)}

                        onMouseLeave={() => setHoveredEl(null)}

                    >

                        {t(cat.id === 'poses' ? 'poses' : cat.id === 'landscapes' ? 'landscapes' : cat.id === 'outfits' ? 'outfits' : cat.id === 'nature' ? 'nature' : cat.id === 'urban' ? 'urban' : 'all')}

                    </button>

                ))}

            </div>



            {/* 釘選對照畫布 */}

            {pinnedImages.length > 0 && (
                <div style={{
                    backgroundColor: '#151515',
                    border: '1px dashed rgba(96,165,250,0.4)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 'bold' }}>
                            {t('pinnedCanvas')}（{pinnedImages.length}）
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={openCompareModal}
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: '#fff', border: 'none',
                                    borderRadius: '6px', padding: '4px 10px',
                                    fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold',
                                }}
                            >
                                {t('multiCompare')}
                            </button>
                            <button
                                onClick={() => setPinnedImages([])}
                                style={{
                                    background: 'none', color: '#888',
                                    border: 'none', cursor: 'pointer',
                                    fontSize: '0.75rem', textDecoration: 'underline',
                                }}
                            >
                                {t('clear')}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {pinnedImages.map(img => (
                            <div
                                key={img.id}
                                style={{ position: 'relative', flexShrink: 0, width: '64px', height: '48px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => { setModalMode('single'); setActiveImage(img); }}
                            >
                                <img src={img.url} alt="Pinned" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div
                                    onClick={e => { e.stopPropagation(); togglePin(img); }}
                                    style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#f87171', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}
                                >
                                    ×
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* 圖片網格 */}

            {error ? (

                <div style={{

                    display: 'flex', justifyContent: 'center', alignItems: 'center',

                    minHeight: '240px', color: '#f43f5e', fontSize: '0.9rem', textAlign: 'center',

                }}>

                     {error}

                </div>

            ) : (

                <>

                    <div style={{

                        display: 'grid',

                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',

                        gap: '14px',

                        minHeight: '240px',

                    }}>

                        {loading

                            ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '240px',
                                    gridColumn: '1 / -1',
                                }}>
                                    <span style={{
                                        fontSize: '2rem',
                                        marginBottom: '12px',
                                        display: 'inline-block',
                                        animation: 'spin 2s linear infinite'
                                    }}></span>
                                    <span style={{
                                        fontSize: '0.95rem',
                                        color: currentTheme.text,
                                        animation: 'pulse 1.5s infinite ease-in-out'
                                    }}>
                                        {t('inspirationLoading')}
                                    </span>
                                </div>
                            )

                            : images.map(item => {

                                const isPinned = pinnedImages.some(p => p.id === item.id);

                                const isLiked = savedImages.some(p => String(p.id) === String(item.id));

                                const isHov = hoveredEl === `img-${item.id}`;



                                return (

                                    <div

                                        key={item.id}

                                        style={imgWrapperStyle(item.id)}

                                        onClick={() => { setModalMode('single'); setActiveImage(item); }}

                                        onMouseEnter={() => setHoveredEl(`img-${item.id}`)}

                                        onMouseLeave={() => setHoveredEl(null)}

                                    >

                                        <img

                                            src={item.url}

                                            alt={item.title || item.author}

                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}

                                            loading="lazy"

                                        />



                                        {/*  收藏按鈕（左上） */}

                                        {toggleFavorite && (

                                            <button

                                                onClick={e => handleLikeClick(item, e)}

                                                style={{

                                                    position: 'absolute',

                                                    top: '7px', left: '7px',

                                                    backgroundColor: 'transparent',

                                                    border: 'none',

                                                    borderRadius: 0,

                                                    width: '28px', height: '28px',

                                                    padding: 0,

                                                    display: 'flex',

                                                    alignItems: 'center',

                                                    justifyContent: 'center',

                                                    cursor: 'pointer',

                                                    boxShadow: 'none',

                                                    opacity: (isHov || isLiked) ? 1 : 0,

                                                    transition: 'all 0.2s ease',

                                                    zIndex: 4,

                                                    outline: 'none',

                                                }}

                                                title={isLiked ? t('cancelFavorite') : t('addFavorite')}

                                            >

                                                <img
                                                  src={isLiked ? heartActiveIcon : heartIcon}
                                                  alt={isLiked ? t('cancelFavorite') : t('addFavorite')}
                                                  style={{ width: '32px', height: '32px', display: 'block' }}
                                                />

                                            </button>

                                        )}



                                        {/*  釘選按鈕（右上） */}
                                        <button
                                            onClick={e => togglePin(item, e)}
                                            style={{
                                                position: 'absolute',
                                                top: '7px', right: '7px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                borderRadius: 0,
                                                width: '28px', height: '28px',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: 'none',
                                                opacity: (isHov || isPinned) ? 1 : 0,
                                                transition: 'all 0.2s ease',
                                                zIndex: 4,
                                                outline: 'none',
                                            }}
                                            title={isPinned ? t('cancelPin') : t('pinToCanvas')}
                                        >
                                            <img
                                                src={pushpinIcon}
                                                alt={isPinned ? t('cancelPin') : t('pinToCanvas')}
                                                style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    display: 'block',
                                                    filter: isPinned ? 'none' : 'grayscale(100%) opacity(0.6)',
                                                    transform: isPinned ? 'scale(1.15) rotate(-15deg)' : 'scale(1) rotate(0deg)',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                }}
                                            />
                                        </button>



                                        {/* 作者浮層 */}

                                        <div style={{

                                            position: 'absolute',

                                            bottom: 0, left: 0, right: 0,

                                            padding: '18px 8px 6px',

                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.82))',

                                            color: '#ddd',

                                            fontSize: '0.65rem',

                                            overflow: 'hidden',

                                            textOverflow: 'ellipsis',

                                            whiteSpace: 'nowrap',

                                            opacity: isHov ? 1 : 0,

                                            transition: 'opacity 0.2s ease',

                                        }}>

                                            {item.author}

                                        </div>

                                    </div>

                                );

                            })

                        }



                        {/* 「載入更多」骨架佔位 */}

                        {loadingMore && renderSkeletons(MORE_LIMIT)}

                    </div>



                    {/* 載入更多按鈕 */}

                    {!loading && canLoadMore && (

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>

                            <button

                                onClick={handleLoadMore}

                                disabled={loadingMore}

                                style={{

                                    background: loadingMore

                                        ? 'rgba(255,255,255,0.05)'

                                        : 'linear-gradient(135deg, #3b82f6, #6366f1)',

                                    color: loadingMore ? '#666' : '#fff',

                                    border: 'none',

                                    borderRadius: '12px',

                                    padding: '12px 36px',

                                    fontSize: '0.95rem',

                                    fontWeight: '700',

                                    cursor: loadingMore ? 'default' : 'pointer',

                                    boxShadow: loadingMore ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',

                                    transition: 'all 0.2s ease',

                                    letterSpacing: '0.3px',

                                    outline: 'none',

                                }}

                                onMouseEnter={e => {

                                    if (!loadingMore) e.currentTarget.style.transform = 'translateY(-2px)';

                                }}

                                onMouseLeave={e => {

                                    e.currentTarget.style.transform = 'none';

                                }}

                            >

                                {loadingMore ? t('loadingMore') : t('loadMore')}

                            </button>

                        </div>

                    )}

                </>

            )}



            {/* ── Lightbox / Compare Modal ────────────────── */}

            {activeImage && (

                <div

                    className="lb-fade"

                    style={{

                        position: 'fixed',

                        inset: 0,

                        backgroundColor: 'rgba(0,0,0,0.92)',

                        display: 'flex',

                        flexDirection: 'column',

                        justifyContent: 'center',

                        alignItems: 'center',

                        zIndex: 9999,

                        padding: '20px',

                        backdropFilter: 'blur(8px)',

                        cursor: 'zoom-out',

                    }}

                    onClick={handleCloseLightbox}

                >

                    <div

                        style={{

                            position: 'relative',

                            width: '100%',

                            maxWidth: modalMode === 'compare' ? '1100px' : '1050px',

                            maxHeight: '92vh',

                            display: 'flex',

                            flexDirection: 'column',

                            alignItems: 'center',

                            cursor: 'default',

                            backgroundColor: '#181818',

                            padding: '24px',

                            borderRadius: '18px',

                            border: '1px solid rgba(255,255,255,0.09)',

                            boxShadow: '0 28px 72px rgba(0,0,0,0.85)',

                            gap: '0',

                        }}

                        onClick={e => e.stopPropagation()}

                    >

                        {/* 關閉 */}

                        <button

                            onClick={handleCloseLightbox}

                            style={{

                                position: 'absolute',

                                top: '14px', right: '14px',

                                background: 'rgba(255,255,255,0.06)',

                                border: 'none',

                                color: '#fff',

                                borderRadius: '50%',

                                width: '32px', height: '32px',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'center',

                                fontSize: '1rem',

                                cursor: 'pointer',

                                outline: 'none',

                                transition: 'background 0.2s',

                            }}

                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}

                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}

                        >

                            ×

                        </button>



                        <h4 style={{

                            margin: '0 0 20px 0',

                            color: '#fff',

                            alignSelf: 'flex-start',

                            fontSize: '1rem',

                            fontWeight: '700',

                        }}>

                            {modalMode === 'compare' ? ' 多圖對照畫布' : ' 參考圖瀏覽'}

                        </h4>



                        {/* Compare 模式 */}

                        {modalMode === 'compare' ? (

                            <div style={{

                                display: 'grid',

                                gridTemplateColumns: pinnedImages.length <= 2

                                    ? `repeat(${pinnedImages.length}, 1fr)`

                                    : 'repeat(auto-fit, minmax(260px, 1fr))',

                                gap: '14px',

                                width: '100%',

                                overflowY: 'auto',

                                maxHeight: '65vh',

                            }}>

                                {pinnedImages.map(img => (

                                    <div key={img.id} style={{

                                        position: 'relative',

                                        borderRadius: '8px',

                                        overflow: 'hidden',

                                        aspectRatio: '4/3',

                                        backgroundColor: '#111',

                                    }}>

                                        <img

                                            src={img.url}

                                            alt={img.title || img.author}

                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}

                                        />

                                        <div style={{

                                            position: 'absolute',

                                            bottom: 0, left: 0, right: 0,

                                            padding: '16px 10px 8px',

                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',

                                            display: 'flex',

                                            justifyContent: 'space-between',

                                            alignItems: 'center',

                                            color: '#ccc',

                                            fontSize: '0.72rem',

                                        }}>

                                            <span> {img.author}</span>

                                            <button

                                                onClick={() => togglePin(img)}

                                                style={{

                                                    background: 'rgba(244,63,94,0.8)',

                                                    border: 'none', color: '#fff',

                                                    borderRadius: '4px', padding: '2px 8px',

                                                    fontSize: '0.65rem', cursor: 'pointer',

                                                }}

                                            >

                                                解除釘選

                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        ) : (

                            // Single 模式
                            <div className={`lightbox-container ${toolboxOpen ? 'toolbox-open' : ''}`}>
                                <style>{`
                                    .lightbox-container {
                                        display: flex;
                                        flex-direction: row;
                                        width: 100%;
                                        gap: 24px;
                                        align-items: center;
                                        position: relative;
                                        min-width: 0;
                                        max-height: 92vh;
                                        overflow: hidden;
                                    }
                                    .lightbox-left {
                                        flex: 1 1 100%;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        position: relative;
                                        border-radius: 14px;
                                        overflow: hidden;
                                        background-color: #0b0b0b;
                                        justify-content: center;
                                        min-height: 400px;
                                        transition: width 420ms cubic-bezier(0.2,0.9,0.2,1), transform 420ms;
                                        min-width: 0;
                                        max-height: 65vh;
                                        overflow: auto;
                                    }
                                    .lightbox-right {
                                        position: relative;
                                        flex: 0 0 0%;
                                        opacity: 0;
                                        transform: translateX(12px);
                                        background-color: rgba(255, 255, 255, 0.03);
                                        backdrop-filter: blur(16px);
                                        -webkit-backdrop-filter: blur(16px);
                                        border: 1px solid rgba(255, 255, 255, 0.08);
                                        border-radius: 16px;
                                        padding: 0;
                                        display: flex;
                                        flex-direction: column;
                                        gap: 20px;
                                        box-sizing: border-box;
                                        box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
                                        transition: width 420ms cubic-bezier(0.2,0.9,0.2,1), transform 420ms, opacity 320ms;
                                        pointer-events: none;
                                        overflow: hidden;
                                        min-width: 0;
                                        max-height: 65vh;
                                        overflow: auto;
                                    }
                                    .lightbox-container.toolbox-open .lightbox-left {
                                        flex: 0 0 70%;
                                    }
                                    .lightbox-container.toolbox-open .lightbox-right {
                                        flex: 0 0 30%;
                                        opacity: 1;
                                        transform: translateX(0);
                                        pointer-events: auto;
                                        padding: 20px;
                                    }
                                    .lightbox-img {
                                        width: 100%;
                                        max-height: 65vh;
                                        object-fit: contain;
                                        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                                        transition: transform 420ms cubic-bezier(0.2,0.9,0.2,1);
                                    }
                                    .color-block-wrapper {
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        flex: 1;
                                        min-width: 0;
                                    }
                                    .color-block-square {
                                        width: 100%;
                                        aspect-ratio: 1/1;
                                        border-radius: 8px;
                                        border: 1px solid rgba(255, 255, 255, 0.12);
                                        cursor: pointer;
                                        transition: transform 0.2s, box-shadow 0.2s;
                                        position: relative;
                                    }
                                    .color-block-square:hover {
                                        transform: scale(1.08) translateY(-2px);
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                                    }
                                    .nav-btn-hover {
                                        background: rgba(0,0,0,0.4);
                                        border: none;
                                        color: #fff;
                                        border-radius: 50%;
                                        width: 44px;
                                        height: 44px;
                                        cursor: pointer;
                                        font-size: 1.5rem;
                                        display: flex;
                                        align-items: center;
                                        justifyContent: center;
                                        transition: background 0.2s, transform 0.2s;
                                        position: absolute;
                                        top: 50%;
                                        transform: translateY(-50%);
                                        z-index: 10;
                                    }
                                    .nav-btn-hover:hover {
                                        background: rgba(0,0,0,0.7);
                                        transform: translateY(-50%) scale(1.08);
                                    }
                                    .toolbox-toggle-button {
                                        position: fixed;
                                        right: 28px;
                                        bottom: 28px;
                                        background: rgba(0,0,0,0.45);
                                        color: #fff;
                                        border-radius: 10px;
                                        padding: 10px 12px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        box-shadow: 0 6px 18px rgba(0,0,0,0.5);
                                        transition: transform 0.18s, background 0.18s, opacity 0.18s;
                                        z-index: 20;
                                        backdrop-filter: blur(6px);
                                    }
                                    .toolbox-toggle-button:hover { background: rgba(0,0,0,0.72); transform: scale(1.04); }
                                    .toolbox-right .collapse-btn {
                                        position: absolute;
                                        top: 12px;
                                        right: 12px;
                                        background: rgba(255,255,255,0.04);
                                        border: none;
                                        color: #fff;
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        outline: none;
                                    }
                                    @media (max-width: 768px) {
                                        .lightbox-container {
                                            flex-direction: column;
                                        }
                                        .lightbox-left {
                                            width: 100%;
                                            min-height: 280px;
                                        }
                                        .lightbox-right {
                                            width: 100%;
                                            opacity: 1;
                                            transform: none;
                                            pointer-events: auto;
                                            margin-top: 16px;
                                        }
                                    }
                                `}</style>

                                {/* Floating toggle button (corner) */}
                                <button
                                    className="toolbox-toggle-button"
                                    title="開啟/收合 繪師工具箱"
                                    onClick={(e) => { e.stopPropagation(); setToolboxOpen(prev => !prev); }}
                                >
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>工具箱</span>
                                </button>

                                {/* Left Column: Preview Panel */}
                                <div className="lightbox-left">
                                    <button
                                        onClick={handlePrev}
                                        className="nav-btn-hover"
                                        style={{ left: '16px' }}
                                    >
                                        ‹
                                    </button>

                                    <img
                                        src={activeImage.url}
                                        alt={activeImage.title || activeImage.author}
                                        className="lightbox-img"
                                        style={{
                                            filter: isGrayscale ? 'grayscale(100%)' : 'none',
                                            transition: 'filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    />

                                    <button
                                        onClick={handleNext}
                                        className="nav-btn-hover"
                                        style={{ right: '16px' }}
                                    >
                                        ›
                                    </button>
                                </div>

                                {/* Right Column: Frosted Glass Artist Toolbox */}
                                <div className="lightbox-right toolbox-right">
                                    <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); setToolboxOpen(false); }} title="收合工具箱">×</button>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                                            ARTIST TOOLBOX
                                        </h3>
                                    </div>

                                    {/* Author Info */}
                                    <div style={{
                                        fontSize: '0.82rem',
                                        color: '#bbb',
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span>{t('referenceSource')}</span>
                                        <strong style={{ color: '#fff' }}>{activeImage.author}</strong>
                                    </div>

                                    {/* Color Extractor Section */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.9rem' }}></span>
                                            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#eee' }}>色彩分析調色盤</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                                            {extractedPalette.length > 0 ? (
                                                extractedPalette.map((hex, idx) => (
                                                    <div key={`palette-${idx}`} className="color-block-wrapper">
                                                        <div
                                                            className="color-block-square"
                                                            style={{ backgroundColor: hex }}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(hex);
                                                                setCopiedColorIndex(idx);
                                                                setTimeout(() => setCopiedColorIndex(null), 1500);
                                                            }}
                                                        >
                                                            {copiedColorIndex === idx && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '-32px',
                                                                    left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    backgroundColor: '#10b981',
                                                                    color: '#fff',
                                                                    padding: '3px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.68rem',
                                                                    fontWeight: 'bold',
                                                                    whiteSpace: 'nowrap',
                                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                                                    zIndex: 99
                                                                }}>
                                                                    已複製
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            color: '#aaa',
                                                            marginTop: '6px',
                                                            fontFamily: 'monospace',
                                                            letterSpacing: '-0.3px',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {hex}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '0.78rem', color: '#777', width: '100%', textAlign: 'center', padding: '8px 0' }}>
                                                    正在分析色彩分析調色盤...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grayscale Toggle Section */}
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#eee', fontWeight: '600' }}>
                                                關閉色彩 - 明度模式
                                            </span>
                                            <label className="switch" style={{
                                                position: 'relative',
                                                display: 'inline-block',
                                                width: '42px',
                                                height: '22px'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isGrayscale}
                                                    onChange={(e) => setIsGrayscale(e.target.checked)}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: isGrayscale ? '#3b82f6' : '#444',
                                                    transition: '0.2s',
                                                    borderRadius: '22px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '""',
                                                        height: '16px',
                                                        width: '16px',
                                                        left: isGrayscale ? '23px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: '#fff',
                                                        transition: '0.2s',
                                                        borderRadius: '50%',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                                                    }} />
                                                </span>
                                            </label>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: '#888', lineHeight: '1.4' }}>
                                            過濾色彩以呈現明暗灰階，便於學習大師的光影明度結構與明暗對比關係。
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                                        {/* 收藏按鈕 */}
                                        {toggleFavorite && (() => {
                                            const isLiked = savedImages.some(p => String(p.id) === String(activeImage.id));
                                            return (
                                                <button
                                                    onClick={() => toggleFavorite({
                                                        id: activeImage.id,
                                                        author: activeImage.author,
                                                        url: activeImage.url,
                                                        isCustom: false,
                                                    })}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: isLiked ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.04)',
                                                        color: isLiked ? '#fb7185' : '#fff',
                                                        border: isLiked ? '1px solid #fb7185' : '1px solid rgba(255,255,255,0.12)',
                                                        borderRadius: '10px',
                                                        padding: '10px 16px',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        outline: 'none',
                                                    }}
                                                >
                                                    {isLiked ? ' 已收藏圖片' : ' 收藏圖片'}
                                                </button>
                                            );
                                        })()}

                                        {/* 釘選按鈕 */}
                                        <button
                                            onClick={() => togglePin(activeImage)}
                                            style={{
                                                width: '100%',
                                                backgroundColor: pinnedImages.some(p => p.id === activeImage.id) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                                                color: pinnedImages.some(p => p.id === activeImage.id) ? '#ef4444' : '#60a5fa',
                                                border: pinnedImages.some(p => p.id === activeImage.id) ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(37, 99, 235, 0.3)',
                                                borderRadius: '10px',
                                                padding: '10px 16px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                outline: 'none',
                                            }}
                                        >
                                            <img
                                                src={pushpinIcon}
                                                alt="pin"
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    filter: pinnedImages.some(p => p.id === activeImage.id) ? 'none' : 'grayscale(100%) brightness(1.2)'
                                                }}
                                            />
                                            {pinnedImages.some(p => p.id === activeImage.id) ? ' 取消釘選' : ' 釘選到對照畫布'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>

    );

}



export default ImageBrowser;