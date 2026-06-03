import React, { useState, useEffect } from 'react';
import axios from 'axios';

const categories = [
    { id: 'poses', name: '人體動作', page: 3 },
    { id: 'landscapes', name: '奇幻風景', page: 15 },
    { id: 'outfits', name: '角色穿搭', page: 8 }
];

function ImageBrowser() {
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [images, setImages] = useState([]);
    const [pinnedImages, setPinnedImages] = useState([]); // Selected references canvas
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(null); // Active single image inside Lightbox
    const [modalMode, setModalMode] = useState('single'); // 'single' or 'compare'
    const [hoveredEl, setHoveredEl] = useState(null);

    const fetchImages = async (category) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch themed sets from Picsum using different page numbers
            const response = await axios.get(`https://picsum.photos/v2/list?page=${category.page}&limit=6`);
            if (Array.isArray(response.data)) {
                setImages(response.data);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error("Error fetching images:", err);
            setError("圖片載入失敗，請檢查網路連線。");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages(selectedCategory);
    }, [selectedCategory]);

    const handleCategoryClick = (cat) => {
        if (cat.id !== selectedCategory.id) {
            setSelectedCategory(cat);
        }
    };

    const togglePin = (img, e) => {
        if (e) e.stopPropagation();
        if (pinnedImages.some(item => item.id === img.id)) {
            setPinnedImages(pinnedImages.filter(item => item.id !== img.id));
        } else {
            // Max limit of 6 to prevent layout break
            if (pinnedImages.length >= 6) {
                alert("釘選對照畫布最多只能放置 6 張圖片喔！");
                return;
            }
            setPinnedImages([...pinnedImages, img]);
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (modalMode === 'compare') return;
        const currentIndex = images.findIndex(item => item.id === activeImage.id);
        if (currentIndex > 0) {
            setActiveImage(images[currentIndex - 1]);
        } else {
            setActiveImage(images[images.length - 1]); // Loop back to end
        }
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (modalMode === 'compare') return;
        const currentIndex = images.findIndex(item => item.id === activeImage.id);
        if (currentIndex < images.length - 1) {
            setActiveImage(images[currentIndex + 1]);
        } else {
            setActiveImage(images[0]); // Loop back to start
        }
    };

    const openCompareModal = () => {
        if (pinnedImages.length > 0) {
            setModalMode('compare');
            setActiveImage(pinnedImages[0]); // open modal using any image as trigger
        }
    };

    const closeLightbox = () => {
        setActiveImage(null);
    };

    // Style constants
    const cardStyle = {
        backgroundColor: '#1e1e1e',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#f3f4f6',
        maxWidth: '500px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.3s ease',
    };

    const headerStyle = {
        fontSize: '1.4rem',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 0 10px 0',
        background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    const navStyle = {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    };

    const getBtnStyle = (cat) => {
        const isActive = selectedCategory.id === cat.id;
        const isHovered = hoveredEl === `btn-${cat.id}`;

        return {
            padding: '8px 14px',
            borderRadius: '10px',
            border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            background: isActive
                ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
                : (isHovered ? '#2a2a2a' : '#121212'),
            color: isActive ? '#ffffff' : (isHovered ? '#e0e0e0' : '#8c8c8c'),
            fontWeight: 'bold',
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isHovered && !isActive ? 'translateY(-1px)' : 'none',
            outline: 'none',
        };
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        minHeight: '220px',
    };

    const imgWrapperStyle = (id) => {
        const isHovered = hoveredEl === `img-${id}`;
        return {
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            aspectRatio: '4/3',
            cursor: 'pointer',
            backgroundColor: '#151515',
            boxShadow: isHovered ? '0 6px 16px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
            transform: isHovered ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
        };
    };

    const imgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        transition: 'opacity 0.3s ease',
    };

    // Shimmer placeholder cards for loading state
    const renderSkeletons = () => {
        return Array(6).fill(0).map((_, index) => (
            <div
                key={index}
                className="shimmer-card"
                style={{
                    borderRadius: '10px',
                    aspectRatio: '4/3',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            />
        ));
    };

    return (
        <div style={cardStyle}>
            {/* Styles for shimmer and modal fade animations */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .shimmer-card {
                    background: linear-gradient(90deg, #151515 25%, #252525 50%, #151515 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .lightbox-fade {
                    animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>

            <h3 style={headerStyle}>
                <span>📷</span> 畫師參考圖庫
            </h3>

            {/* Category Buttons */}
            <div style={navStyle}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        style={getBtnStyle(cat)}
                        onClick={() => handleCategoryClick(cat)}
                        onMouseEnter={() => setHoveredEl(`btn-${cat.id}`)}
                        onMouseLeave={() => setHoveredEl(null)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Pinned References Canvas (Drawer) */}
            {pinnedImages.length > 0 && (
                <div style={{
                    backgroundColor: '#151515',
                    border: '1px dashed rgba(96, 165, 250, 0.4)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📌 釘選對照畫布 ({pinnedImages.length})
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={openCompareModal}
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                🔍 雙螢幕/多圖對比
                            </button>
                            <button
                                onClick={() => setPinnedImages([])}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#888',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {pinnedImages.map((img) => (
                            <div
                                key={img.id}
                                style={{ position: 'relative', flexShrink: 0, width: '60px', height: '45px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => { setModalMode('single'); setActiveImage(img); }}
                            >
                                <img src={`https://picsum.photos/id/${img.id}/100/75`} alt="Pinned" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div
                                    onClick={(e) => { e.stopPropagation(); togglePin(img); }}
                                    style={{
                                        position: 'absolute',
                                        top: '2px', right: '2px',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: '#ff4d4f',
                                        borderRadius: '50%',
                                        width: '16px', height: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 'bold'
                                    }}
                                >
                                    ✕
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid Image List */}
            {error ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '220px',
                    color: '#f43f5e',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    ❌ {error}
                </div>
            ) : (
                <div style={gridContainerStyle}>
                    {loading ? (
                        renderSkeletons()
                    ) : (
                        images.map((item) => {
                            const isPinned = pinnedImages.some(p => p.id === item.id);
                            return (
                                <div
                                    key={item.id}
                                    style={imgWrapperStyle(item.id)}
                                    onClick={() => { setModalMode('single'); setActiveImage(item); }}
                                    onMouseEnter={() => setHoveredEl(`img-${item.id}`)}
                                    onMouseLeave={() => setHoveredEl(null)}
                                >
                                    <img
                                        src={`https://picsum.photos/id/${item.id}/300/225`}
                                        alt={item.author}
                                        style={imgStyle}
                                        loading="lazy"
                                    />

                                    {/* Pin Button overlay */}
                                    <button
                                        onClick={(e) => togglePin(item, e)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px', right: '8px',
                                            backgroundColor: isPinned ? '#2563eb' : 'rgba(0, 0, 0, 0.6)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '26px', height: '26px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                            opacity: (hoveredEl === `img-${item.id}` || isPinned) ? 1 : 0,
                                        }}
                                        title={isPinned ? "取消釘選" : "釘選到畫布"}
                                    >
                                        📌
                                    </button>

                                    {/* Author overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0, left: 0, right: 0,
                                        padding: '6px',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                        color: '#e0e0e0',
                                        fontSize: '0.65rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        opacity: hoveredEl === `img-${item.id}` ? 1 : 0,
                                        transition: 'opacity 0.2s ease',
                                    }}>
                                        👤 {item.author}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Lightbox / Compare Modal */}
            {activeImage && (
                <div
                    className="lightbox-fade"
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '20px',
                        backdropFilter: 'blur(6px)',
                        cursor: 'zoom-out'
                    }}
                    onClick={closeLightbox}
                >
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: modalMode === 'compare' ? '1200px' : '850px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'default',
                        backgroundColor: '#181818',
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
                    }} onClick={(e) => e.stopPropagation()}>

                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            ✕
                        </button>

                        {/* Title Bar */}
                        <h4 style={{
                            margin: '0 0 20px 0',
                            color: '#ffffff',
                            alignSelf: 'flex-start',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            {modalMode === 'compare' ? '📌 多圖比對對照畫布' : '🖼️ 參考圖瀏覽'}
                        </h4>

                        {/* Modal Content */}
                        {modalMode === 'compare' ? (
                            // Tiled comparison mode (multiple images)
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: pinnedImages.length === 1
                                    ? '1fr'
                                    : (pinnedImages.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))'),
                                gap: '16px',
                                width: '100%',
                                overflowY: 'auto',
                                maxHeight: '60vh',
                                paddingRight: '4px'
                            }}>
                                {pinnedImages.map((img) => (
                                    <div key={img.id} style={{
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        aspectRatio: '4/3',
                                        backgroundColor: '#121212',
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <img
                                            src={`https://picsum.photos/id/${img.id}/500/375`}
                                            alt={img.author}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0,
                                            padding: '8px',
                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                                            color: '#ccc',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>👤 {img.author}</span>
                                            <button
                                                onClick={() => togglePin(img)}
                                                style={{
                                                    backgroundColor: 'rgba(244, 63, 94, 0.8)',
                                                    border: 'none', color: 'white',
                                                    borderRadius: '4px', padding: '2px 6px',
                                                    fontSize: '0.65rem', cursor: 'pointer'
                                                }}
                                            >
                                                解除釘選
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Single Focused Image View
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%',
                                position: 'relative'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    position: 'relative',
                                    minHeight: '300px'
                                }}>
                                    {/* Left Arrow */}
                                    <button
                                        onClick={handlePrev}
                                        style={{
                                            background: 'rgba(0,0,0,0.5)',
                                            border: 'none', color: '#fff',
                                            borderRadius: '50%', width: '40px', height: '40px',
                                            cursor: 'pointer', fontSize: '1.2rem',
                                            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginRight: '12px'
                                        }}
                                    >
                                        ‹
                                    </button>

                                    <img
                                        src={`https://picsum.photos/id/${activeImage.id}/800/600`}
                                        alt={activeImage.author}
                                        style={{
                                            maxWidth: 'calc(100% - 100px)',
                                            maxHeight: '60vh',
                                            borderRadius: '8px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                            objectFit: 'contain',
                                            flexGrow: 1
                                        }}
                                    />

                                    {/* Right Arrow */}
                                    <button
                                        onClick={handleNext}
                                        style={{
                                            background: 'rgba(0,0,0,0.5)',
                                            border: 'none', color: '#fff',
                                            borderRadius: '50%', width: '40px', height: '40px',
                                            cursor: 'pointer', fontSize: '1.2rem',
                                            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginLeft: '12px'
                                        }}
                                    >
                                        ›
                                    </button>
                                </div>

                                {/* Image Details & Pin Toggle in Lightbox */}
                                <div style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                    paddingTop: '16px'
                                }}>
                                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>👤 創作者：{activeImage.author}</span>
                                    <button
                                        onClick={() => togglePin(activeImage)}
                                        style={{
                                            backgroundColor: pinnedImages.some(p => p.id === activeImage.id) ? '#ef4444' : '#2563eb',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {pinnedImages.some(p => p.id === activeImage.id) ? '📌 已釘選此圖 (點擊取消)' : '📌 釘選此圖至畫布'}
                                    </button>
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