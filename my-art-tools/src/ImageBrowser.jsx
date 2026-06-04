import React, { useState, useEffect, useCallback } from 'react';

import axios from 'axios';



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

function ImageBrowser({ savedImages = [], toggleFavorite, theme = 'dark' }) {



    const [selectedCategory, setSelectedCategory] = useState(categories[0]);

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



    // ── 初始拉取圖片 ──────────────────────────────

    const fetchImages = useCallback(async (category) => {

        setLoading(true);

        setError(null);

        setImages([]);

        setCanLoadMore(true);

        try {

            const categoryName = category.name;

            const res = await axios.get(

                `http://localhost:5000/api/images?category=${encodeURIComponent(categoryName)}&per_page=${INITIAL_LIMIT}&page=1`

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

            setError('圖片載入失敗，請檢查網路連線。');

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

                `http://localhost:5000/api/images?category=${encodeURIComponent(categoryName)}&per_page=${MORE_LIMIT}&page=${currentPage}`

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

                alert('釘選對照畫布最多只能放置 6 張圖片喔！');

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

                url: `https://picsum.photos/id/${item.id}/600/450`,

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



    const closeLightbox = () => setActiveImage(null);



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

            <h2 style={headerStyle}>靈感圖庫</h2>



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

                        {cat.name}

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

                            📌 釘選對照畫布（{pinnedImages.length}）

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

                                🔍 多圖對比

                            </button>

                            <button

                                onClick={() => setPinnedImages([])}

                                style={{

                                    background: 'none', color: '#888',

                                    border: 'none', cursor: 'pointer',

                                    fontSize: '0.75rem', textDecoration: 'underline',

                                }}

                            >

                                清空

                            </button>

                        </div>

                    </div>

                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>

                        {pinnedImages.map(img => (

                            <div

                                key={img.id}

                                style={{

                                    position: 'relative', flexShrink: 0,

                                    width: '64px', height: '48px',

                                    borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',

                                }}

                                onClick={() => { setModalMode('single'); setActiveImage(img); }}

                            >

                                <img

                                    src={img.url}

                                    alt="Pinned"

                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}

                                />

                                <div

                                    onClick={e => { e.stopPropagation(); togglePin(img); }}

                                    style={{

                                        position: 'absolute', top: '2px', right: '2px',

                                        backgroundColor: 'rgba(0,0,0,0.7)', color: '#f87171',

                                        borderRadius: '50%', width: '16px', height: '16px',

                                        display: 'flex', alignItems: 'center', justifyContent: 'center',

                                        fontSize: '0.6rem', fontWeight: 'bold',

                                    }}

                                >

                                    ✕

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

                    ❌ {error}

                </div>

            ) : (

                <>

                    <div style={{

                        display: 'grid',

                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',

                        gap: '14px',

                        minHeight: '240px',

                        '@media (min-width: 768px)': {

                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',

                        },

                        '@media (min-width: 1024px)': {

                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',

                        },

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
                                    }}>🎨</span>
                                    <span style={{
                                        fontSize: '0.95rem',
                                        color: currentTheme.text,
                                        animation: 'pulse 1.5s infinite ease-in-out'
                                    }}>
                                        靈感載入中...
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



                                        {/* ❤️ 收藏按鈕（左上） */}

                                        {toggleFavorite && (

                                            <button

                                                onClick={e => handleLikeClick(item, e)}

                                                style={{

                                                    position: 'absolute',

                                                    top: '7px', left: '7px',

                                                    backgroundColor: isLiked ? '#fb7185' : 'rgba(0,0,0,0.6)',

                                                    color: '#fff',

                                                    border: 'none',

                                                    borderRadius: '50%',

                                                    width: '28px', height: '28px',

                                                    display: 'flex',

                                                    alignItems: 'center',

                                                    justifyContent: 'center',

                                                    cursor: 'pointer',

                                                    fontSize: '0.85rem',

                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',

                                                    opacity: (isHov || isLiked) ? 1 : 0,

                                                    transition: 'all 0.2s ease',

                                                    zIndex: 4,

                                                    outline: 'none',

                                                }}

                                                title={isLiked ? '取消收藏' : '加入收藏'}

                                            >

                                                {isLiked ? '❤️' : '🤍'}

                                            </button>

                                        )}



                                        {/* 📌 釘選按鈕（右上） */}

                                        <button

                                            onClick={e => togglePin(item, e)}

                                            style={{

                                                position: 'absolute',

                                                top: '7px', right: '7px',

                                                backgroundColor: isPinned ? '#2563eb' : 'rgba(0,0,0,0.6)',

                                                color: '#fff',

                                                border: 'none',

                                                borderRadius: '50%',

                                                width: '28px', height: '28px',

                                                display: 'flex',

                                                alignItems: 'center',

                                                justifyContent: 'center',

                                                cursor: 'pointer',

                                                fontSize: '0.85rem',

                                                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',

                                                opacity: (isHov || isPinned) ? 1 : 0,

                                                transition: 'all 0.2s ease',

                                                zIndex: 4,

                                                outline: 'none',

                                            }}

                                            title={isPinned ? '取消釘選' : '釘選到畫布'}

                                        >

                                            📌

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

                                            👤 {item.author}

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

                                {loadingMore ? '載入中...稍等一下呦' : '載入更多靈感'}

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

                    onClick={closeLightbox}

                >

                    <div

                        style={{

                            position: 'relative',

                            width: '100%',

                            maxWidth: modalMode === 'compare' ? '1100px' : '860px',

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

                            onClick={closeLightbox}

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

                            ✕

                        </button>



                        <h4 style={{

                            margin: '0 0 20px 0',

                            color: '#fff',

                            alignSelf: 'flex-start',

                            fontSize: '1rem',

                            fontWeight: '700',

                        }}>

                            {modalMode === 'compare' ? '📌 多圖對照畫布' : '🖼️ 參考圖瀏覽'}

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

                                            <span>👤 {img.author}</span>

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

                            <div style={{

                                display: 'flex',

                                flexDirection: 'column',

                                alignItems: 'center',

                                width: '100%',

                            }}>

                                <div style={{

                                    display: 'flex',

                                    alignItems: 'center',

                                    justifyContent: 'space-between',

                                    width: '100%',

                                    minHeight: '320px',

                                }}>

                                    {/* 上一張 */}

                                    <button

                                        onClick={handlePrev}

                                        style={{

                                            background: 'rgba(0,0,0,0.5)', border: 'none',

                                            color: '#fff', borderRadius: '50%',

                                            width: '42px', height: '42px',

                                            cursor: 'pointer', fontSize: '1.4rem',

                                            zIndex: 10, flexShrink: 0,

                                            display: 'flex', alignItems: 'center', justifyContent: 'center',

                                        }}

                                    >

                                        ‹

                                    </button>



                                    <img

                                        src={activeImage.url}

                                        alt={activeImage.title || activeImage.author}

                                        style={{

                                            maxWidth: 'calc(100% - 110px)',

                                            maxHeight: '62vh',

                                            borderRadius: '10px',

                                            objectFit: 'contain',

                                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',

                                            flexGrow: 1,

                                        }}

                                    />



                                    {/* 下一張 */}

                                    <button

                                        onClick={handleNext}

                                        style={{

                                            background: 'rgba(0,0,0,0.5)', border: 'none',

                                            color: '#fff', borderRadius: '50%',

                                            width: '42px', height: '42px',

                                            cursor: 'pointer', fontSize: '1.4rem',

                                            zIndex: 10, flexShrink: 0,

                                            display: 'flex', alignItems: 'center', justifyContent: 'center',

                                        }}

                                    >

                                        ›

                                    </button>

                                </div>



                                {/* 底部操作列 */}

                                <div style={{

                                    marginTop: '18px',

                                    display: 'flex',

                                    justifyContent: 'space-between',

                                    alignItems: 'center',

                                    width: '100%',

                                    borderTop: '1px solid rgba(255,255,255,0.07)',

                                    paddingTop: '16px',

                                    gap: '10px',

                                }}>

                                    <span style={{ color: '#aaa', fontSize: '0.88rem' }}>

                                        👤 {activeImage.author}

                                    </span>



                                    <div style={{ display: 'flex', gap: '10px' }}>

                                        {/* 收藏按鈕 */}

                                        {toggleFavorite && (() => {

                                            const isLiked = savedImages.some(

                                                p => String(p.id) === String(activeImage.id)

                                            );

                                            return (

                                                <button

                                                    onClick={() => toggleFavorite({

                                                        id: activeImage.id,

                                                        author: activeImage.author,

                                                        url: `https://picsum.photos/id/${activeImage.id}/600/450`,

                                                        isCustom: false,

                                                    })}

                                                    style={{

                                                        backgroundColor: isLiked ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.05)',

                                                        color: isLiked ? '#fb7185' : '#fff',

                                                        border: isLiked ? '1px solid #fb7185' : '1px solid rgba(255,255,255,0.15)',

                                                        borderRadius: '9px',

                                                        padding: '8px 16px',

                                                        fontSize: '0.85rem',

                                                        cursor: 'pointer',

                                                        fontWeight: 'bold',

                                                        transition: 'all 0.2s ease',

                                                        display: 'flex',

                                                        alignItems: 'center',

                                                        gap: '5px',

                                                        outline: 'none',

                                                    }}

                                                >

                                                    {isLiked ? '❤️ 已收藏' : '🤍 收藏'}

                                                </button>

                                            );

                                        })()}



                                        {/* 釘選按鈕 */}

                                        <button

                                            onClick={() => togglePin(activeImage)}

                                            style={{

                                                backgroundColor: pinnedImages.some(p => p.id === activeImage.id)

                                                    ? '#ef4444' : '#2563eb',

                                                color: '#fff',

                                                border: 'none',

                                                borderRadius: '9px',

                                                padding: '8px 16px',

                                                fontSize: '0.85rem',

                                                cursor: 'pointer',

                                                fontWeight: 'bold',

                                                transition: 'background 0.2s',

                                                outline: 'none',

                                            }}

                                        >

                                            {pinnedImages.some(p => p.id === activeImage.id)

                                                ? '📌 取消釘選'

                                                : '📌 釘選對照'}

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