import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Helper functions defined outside the component to preserve React purity
const getRandomPage = () => Math.floor(Math.random() * 80) + 1;
const getRandomIndex = (length) => Math.floor(Math.random() * length);

function SketchWall({ savedImages = [], toggleFavorite }) {
    const [duration, setDuration] = useState(30); // 30s or 60s
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false); // timer state (Play/Pause) - 預設不自動計時
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fitMode, setFitMode] = useState('contain'); // 'contain' or 'cover'
    const [hoveredEl, setHoveredEl] = useState(null);

    // Practice Mode: 'random' (system gallery) or 'custom' (user custom images)
    const [practiceMode, setPracticeMode] = useState('random');
    const [customImages, setCustomImages] = useState([]);
    const [customIndex, setCustomIndex] = useState(0);
    const [pastedUrl, setPastedUrl] = useState('');

    // Keep track of active interval using a ref to prevent multiple timers
    const timerRef = useRef(null);

    const fetchRandomImage = async () => {
        // Yield execution to make state changes asynchronous relative to useEffect
        await Promise.resolve();
        setLoading(true);
        setError(null);
        try {
            // Get random page from Picsum API to fetch a diverse set of photos
            const randomPage = getRandomPage();
            const response = await axios.get(`https://picsum.photos/v2/list?page=${randomPage}&limit=15`);
            if (response.data && response.data.length > 0) {
                const randomIndex = getRandomIndex(response.data.length);
                const img = response.data[randomIndex];
                setCurrentImage({
                    id: img.id,
                    author: img.author,
                    url: `https://picsum.photos/id/${img.id}/600/450`,
                    isCustom: false
                });
            } else {
                throw new Error("No images found");
            }
        } catch (err) {
            console.error("Error fetching random image:", err);
            setError("無法載入參考圖，請嘗試重新載入。");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on mount for random mode
    useEffect(() => {
        if (practiceMode === 'random') {
            fetchRandomImage();
        }
    }, [practiceMode]);

    const handleNextImage = async () => {
        // Yield execution to prevent state-in-effect warnings when called by countdown
        await Promise.resolve();
        if (practiceMode === 'random') {
            fetchRandomImage();
        } else {
            if (customImages.length > 1) {
                const nextIndex = (customIndex + 1) % customImages.length;
                setCustomIndex(nextIndex);
                setCurrentImage(customImages[nextIndex]);
            }
            // If only 1 custom image, it resets the timer but keeps the image
        }
        setTimeLeft(duration);
    };

    // Countdown Timer logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleNextImage();
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive, timeLeft, duration, practiceMode, customImages, customIndex]);

    // Handle local file upload
    const handleLocalUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newImages = files.map((file, idx) => ({
                id: `custom-${Date.now()}-${idx}`,
                author: file.name,
                url: URL.createObjectURL(file),
                isCustom: true
            }));
            setCustomImages(newImages);
            setCustomIndex(0);
            setCurrentImage(newImages[0]);
            setLoading(false);
            setError(null);
            setTimeLeft(duration);
            // 不再強制啟動計時器，維持原本狀態
        }
    };

    // Handle pasted URL loading
    const handleUrlSubmit = (url) => {
        if (url.trim()) {
            const newImage = {
                id: `custom-url-${Date.now()}`,
                author: '自訂網址來源',
                url: url.trim(),
                isCustom: true
            };
            setCustomImages([newImage]);
            setCustomIndex(0);
            setCurrentImage(newImage);
            setLoading(false);
            setError(null);
            setPastedUrl('');
            setTimeLeft(duration);
            // 不再強制啟動計時器，維持原本狀態
        }
    };

    // Handle duration selection
    const handleDurationChange = (secs) => {
        setDuration(secs);
        setTimeLeft(secs);
        // 不再強制啟動計時器，維持原本狀態
    };

    // Switch practice mode
    const handleModeSwitch = (mode) => {
        setPracticeMode(mode);
        if (mode === 'random') {
            fetchRandomImage();
        } else {
            if (customImages.length > 0) {
                setCurrentImage(customImages[customIndex]);
                setLoading(false);
            } else {
                setCurrentImage(null);
            }
        }
        setTimeLeft(duration);
        // 不再強制啟動計時器，維持原本狀態
    };

    // Toggle play/pause
    const handleToggleActive = () => {
        setIsActive(!isActive);
    };

    // Reset current countdown
    const handleReset = () => {
        setTimeLeft(duration);
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
    };

    const headerStyle = {
        fontSize: '1.4rem',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 0 5px 0',
        background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    const modeContainerStyle = {
        display: 'flex',
        backgroundColor: '#121212',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.03)',
    };

    const getModeBtnStyle = (mode) => {
        const isActiveMode = practiceMode === mode;
        const isHovered = hoveredEl === `mode-${mode}`;
        return {
            flex: 1,
            padding: '8px 0',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: isActiveMode ? '#2a2a2a' : 'transparent',
            color: isActiveMode ? '#fb7185' : (isHovered ? '#e0e0e0' : '#8c8c8c'),
            fontWeight: 'bold',
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            outline: 'none',
        };
    };

    const timerAreaStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: '#121212',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.03)',
    };

    const timerNumStyle = {
        fontSize: '3rem',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        color: timeLeft <= 5 ? '#f43f5e' : '#fb7185',
        textShadow: timeLeft <= 5 ? '0 0 16px rgba(244, 63, 90, 0.6)' : 'none',
        lineHeight: 1,
    };

    const progressBarStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        width: `${(timeLeft / duration) * 100}%`,
        backgroundColor: timeLeft <= 5 ? '#f43f5e' : '#fb7185',
        transition: 'width 1s linear, background-color 0.2s',
        boxShadow: timeLeft <= 5 ? '0 0 8px #f43f5e' : 'none',
    };

    const durationContainerStyle = {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
    };

    const getDurationBtnStyle = (secs) => {
        const isSelected = duration === secs;
        const isHovered = hoveredEl === `dur-${secs}`;
        return {
            padding: '6px 12px',
            borderRadius: '8px',
            border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: isSelected
                ? '#fb7185'
                : (isHovered ? '#2a2a2a' : '#121212'),
            color: isSelected ? '#ffffff' : (isHovered ? '#e0e0e0' : '#8c8c8c'),
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: isSelected ? '0 4px 12px rgba(251, 113, 133, 0.3)' : 'none',
        };
    };

    const imageAreaStyle = {
        width: '100%',
        height: '300px',
        backgroundColor: '#151515',
        borderRadius: '12px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    };

    const fitToggleStyle = {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.7rem',
        cursor: 'pointer',
        fontWeight: 'bold',
        zIndex: 5,
        transition: 'all 0.2s',
    };

    const controlRowStyle = {
        display: 'flex',
        gap: '12px',
    };

    const getControlBtnStyle = (type) => {
        const isHovered = hoveredEl === `ctrl-${type}`;
        let bg = '#121212';
        let border = '1px solid rgba(255, 255, 255, 0.1)';
        let color = '#a0a0a0';

        if (type === 'play-pause') {
            bg = isActive ? 'rgba(251, 113, 133, 0.15)' : 'rgba(52, 211, 153, 0.15)';
            border = isActive ? '1px solid #fb7185' : '1px solid #34d399';
            color = isActive ? '#fb7185' : '#34d399';
        } else if (type === 'skip') {
            bg = 'linear-gradient(135deg, #f43f5e, #fb7185)';
            border = 'none';
            color = '#ffffff';
        }

        return {
            flex: type === 'skip' ? 2 : 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border,
            background: bg,
            color,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateY(-1px)' : 'none',
            boxShadow: isHovered && type === 'skip' ? '0 4px 12px rgba(251, 113, 133, 0.4)' : 'none',
            outline: 'none',
        };
    };

    const customInputAreaStyle = {
        backgroundColor: '#151515',
        borderRadius: '12px',
        padding: '14px',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    };

    return (
        <div style={cardStyle}>
            {/* Animation style block */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>

            <h3 style={headerStyle}>
                <span>⏱️</span> 速寫計時牆
            </h3>

            {/* Mode Switcher */}
            <div style={modeContainerStyle}>
                <button
                    style={getModeBtnStyle('random')}
                    onClick={() => handleModeSwitch('random')}
                    onMouseEnter={() => setHoveredEl('mode-random')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    🎲 隨機圖庫
                </button>
                <button
                    style={getModeBtnStyle('custom')}
                    onClick={() => handleModeSwitch('custom')}
                    onMouseEnter={() => setHoveredEl('mode-custom')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    📁 自訂圖片
                </button>
            </div>

            {/* Duration Selector */}
            <div style={durationContainerStyle}>
                <button
                    style={getDurationBtnStyle(60)}
                    onClick={() => handleDurationChange(60)}
                    onMouseEnter={() => setHoveredEl('dur-60')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    ⏱️ 60 秒速寫
                </button>
                <button
                    style={getDurationBtnStyle(180)}
                    onClick={() => handleDurationChange(180)}
                    onMouseEnter={() => setHoveredEl('dur-180')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    ⏱️ 3 分鐘速寫
                </button>
            </div>

            {/* Glowing Timer Display */}
            <div style={timerAreaStyle}>
                <span style={timerNumStyle}>
                    {timeLeft} <span style={{ fontSize: '1rem', color: '#666' }}>S</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {isActive ? '⏳ 計時中' : '⏸️ 已暫停'}
                </span>
                {/* Horizontal Progress Bar */}
                <div style={progressBarStyle} />
            </div>

            {/* Reference Image Canvas */}
            <div style={imageAreaStyle}>
                {practiceMode === 'custom' && customImages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📁</span>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#8c8c8c' }}>尚未載入自訂圖片</p>
                        <p style={{ margin: '0', fontSize: '0.8rem', color: '#555' }}>請在下方上傳本地圖片或貼上網址</p>
                    </div>
                ) : loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '1.8rem',
                            marginBottom: '10px',
                            display: 'inline-block',
                            animation: 'spin 2s linear infinite'
                        }}>🎨</span>
                        <span style={{
                            fontSize: '0.88rem',
                            color: '#fb7185',
                            animation: 'pulse 1.5s infinite ease-in-out'
                        }}>
                            網頁畫布準備中...
                        </span>
                    </div>
                ) : error ? (
                    <div style={{ color: '#f43f5e', fontSize: '0.88rem', padding: '20px', textAlign: 'center' }}>
                        {error}
                        {practiceMode === 'random' && (
                            <button
                                onClick={fetchRandomImage}
                                style={{
                                    marginTop: '10px', display: 'block', margin: '10px auto 0 auto',
                                    border: '1px solid #f43f5e', borderRadius: '4px',
                                    background: 'transparent', color: '#f43f5e',
                                    padding: '4px 8px', cursor: 'pointer'
                                }}
                            >
                                重試
                            </button>
                        )}
                    </div>
                ) : (
                    currentImage && (
                        <>
                            {/* Toggle sizing fit mode for drawing convenience */}
                            <button
                                onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                                style={fitToggleStyle}
                                title="切換裁剪填充或完整顯示"
                            >
                                ⛶ {fitMode === 'contain' ? '填滿' : '完整'}
                            </button>
                            {/* Favorite Button overlay */}
                            {toggleFavorite && (
                                <button
                                    onClick={() => toggleFavorite(currentImage)}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                        color: savedImages.some(item => String(item.id) === String(currentImage.id)) ? '#fb7185' : '#ffffff',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        zIndex: 5,
                                        transition: 'all 0.2s',
                                        outline: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
                                    }}
                                    title={savedImages.some(item => String(item.id) === String(currentImage.id)) ? "取消收藏" : "加入收藏"}
                                >
                                    {savedImages.some(item => String(item.id) === String(currentImage.id)) ? '❤️' : '🤍'}
                                </button>
                            )}
                            <img
                                src={currentImage.url}
                                alt={currentImage.author}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: fitMode,
                                    transition: 'object-fit 0.3s ease',
                                }}
                            />
                            {/* Credit Tag overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, right: 0,
                                padding: '8px 12px',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                                color: '#aaa',
                                fontSize: '0.7rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                pointerEvents: 'none',
                            }}>
                                <span>
                                    {currentImage.isCustom ? '📁 自訂參考：' : '👤 參考圖源：'}
                                    {currentImage.author}
                                </span>
                                <span>
                                    {currentImage.isCustom
                                        ? `(${customIndex + 1}/${customImages.length})`
                                        : `ID: #${currentImage.id}`}
                                </span>
                            </div>
                        </>
                    )
                )}
            </div>

            {/* Custom Image Uploader Area (only shown in Custom mode) */}
            {practiceMode === 'custom' && (
                <div style={customInputAreaStyle}>
                    <label style={{
                        padding: '10px 14px',
                        backgroundColor: '#1c1c1c',
                        border: '1px dashed rgba(251, 113, 133, 0.4)',
                        borderRadius: '8px',
                        color: '#fb7185',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        display: 'block',
                        transition: 'background-color 0.2s',
                    }}
                        onMouseEnter={() => setHoveredEl('custom-upload')}
                        onMouseLeave={() => setHoveredEl(null)}
                    >
                        📁 選擇本地圖片 (支援複選批次練習)
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleLocalUpload}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="或輸入線上圖片 URL..."
                            value={pastedUrl}
                            onChange={(e) => setPastedUrl(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: '#121212',
                                color: '#ffffff',
                                fontSize: '0.85rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={() => handleUrlSubmit(pastedUrl)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#fb7185',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            載入
                        </button>
                    </div>
                </div>
            )}

            {/* Timer Control Panel */}
            <div style={controlRowStyle}>
                <button
                    style={getControlBtnStyle('play-pause')}
                    onClick={handleToggleActive}
                    onMouseEnter={() => setHoveredEl('ctrl-play-pause')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    {isActive ? '⏸ 暫停' : '▶ 繼續'}
                </button>
                <button
                    style={getControlBtnStyle('reset')}
                    onClick={handleReset}
                    onMouseEnter={() => setHoveredEl('ctrl-reset')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    🔄 重設
                </button>
                <button
                    style={getControlBtnStyle('skip')}
                    onClick={handleNextImage}
                    onMouseEnter={() => setHoveredEl('ctrl-skip')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    ⏩ 下一張 (Skip)
                </button>
            </div>
        </div>
    );
}

export default SketchWall;