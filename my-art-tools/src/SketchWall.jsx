import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TRANSLATIONS from './translations';

// Theme colors
const THEMES = {
  dark: {
    background: '#0f0f0f',
    text: '#e0e0e0',
    cardBg: '#1a1a1a',
    border: 'rgba(255,255,255,0.07)',
  },
  light: {
    background: '#f5f5f5',
    text: '#111111',
    cardBg: '#ffffff',
    border: 'rgba(0,0,0,0.08)',
  },
};

// Helper functions defined outside the component to preserve React purity
const getRandomPage = () => Math.floor(Math.random() * 80) + 1;
const getRandomIndex = (length) => Math.floor(Math.random() * length);

function SketchWall({ savedImages = [], toggleFavorite, theme = 'dark', language = 'zh' }) {
    const currentTheme = THEMES[theme] || THEMES.dark;

    // Translation helper
    const t = (key) => TRANSLATIONS[language][key] || key;
    const isLight = theme === 'light';
    const [duration, setDuration] = useState(30); // 30s or 60s
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false); // timer state (Play/Pause) - 預設不自動計時
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fitMode, setFitMode] = useState('contain'); // 'contain' or 'cover'
    const [hoveredEl, setHoveredEl] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [customSeconds, setCustomSeconds] = useState('');
    const [isCustomDuration, setIsCustomDuration] = useState(false);

    // Modal timer state
    const [modalTimer, setModalTimer] = useState(0);
    const [modalTimerActive, setModalTimerActive] = useState(false);
    const modalTimerRef = useRef(null);

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
            setError(t('loadImageError'));
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

    // Modal timer logic
    useEffect(() => {
        if (modalTimerActive && modalTimer > 0) {
            modalTimerRef.current = setInterval(() => {
                setModalTimer((prev) => prev - 1);
            }, 1000);
        }

        return () => {
            if (modalTimerRef.current) {
                clearInterval(modalTimerRef.current);
            }
        };
    }, [modalTimerActive, modalTimer]);

    // Reset modal timer when modal opens/closes
    useEffect(() => {
        if (showImageModal) {
            setModalTimer(duration);
            setModalTimerActive(false);
        }
    }, [showImageModal, duration]);

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
                author: t('customReference'),
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
        setIsCustomDuration(false);
        // 不再強制啟動計時器，維持原本狀態
    };

    // Handle custom duration input
    const handleCustomDurationSubmit = () => {
        const secs = parseInt(customSeconds);
        if (secs && secs > 0 && secs <= 3600) {
            setDuration(secs);
            setTimeLeft(secs);
            setIsCustomDuration(true);
            setCustomSeconds('');
        }
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

    // Modal timer handlers
    const handleModalTimerStart = () => {
        setModalTimerActive(true);
    };

    const handleModalTimerPause = () => {
        setModalTimerActive(false);
    };

    const handleModalTimerReset = () => {
        setModalTimer(0);
        setModalTimerActive(false);
    };

    // Style constants
    const cardStyle = {
        backgroundColor: currentTheme.cardBg,
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: `1px solid ${currentTheme.border}`,
        color: currentTheme.text,
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
        background: isLight ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f43f5e, #fb7185)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    const modeContainerStyle = {
        display: 'flex',
        backgroundColor: currentTheme.cardBg,
        padding: '4px',
        borderRadius: '10px',
        border: `1px solid ${currentTheme.border}`,
    };

    const getModeBtnStyle = (mode) => {
        const isActiveMode = practiceMode === mode;
        const isHovered = hoveredEl === `mode-${mode}`;
        return {
            flex: 1,
            padding: '8px 0',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: isActiveMode ? (isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 113, 133, 0.2)') : 'transparent',
            color: isActiveMode ? (isLight ? '#3b82f6' : '#fb7185') : (isHovered ? currentTheme.text : (isLight ? '#6b7280' : '#8c8c8c')),
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
        backgroundColor: currentTheme.cardBg,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${currentTheme.border}`,
    };

    const timerNumStyle = {
        fontSize: '3rem',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        color: timeLeft <= 5 ? '#f43f5e' : (isLight ? '#3b82f6' : '#fb7185'),
        textShadow: timeLeft <= 5 ? '0 0 16px rgba(244, 63, 90, 0.6)' : 'none',
        lineHeight: 1,
    };

    const progressBarStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        width: `${(timeLeft / duration) * 100}%`,
        backgroundColor: timeLeft <= 5 ? '#f43f5e' : (isLight ? '#3b82f6' : '#fb7185'),
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
            border: isSelected ? 'none' : `1px solid ${currentTheme.border}`,
            backgroundColor: isSelected
                ? (isLight ? '#3b82f6' : '#fb7185')
                : (isHovered ? currentTheme.cardBg : currentTheme.cardBg),
            color: isSelected ? '#ffffff' : (isHovered ? currentTheme.text : (isLight ? '#6b7280' : '#8c8c8c')),
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: isSelected ? (isLight ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(251, 113, 133, 0.3)') : 'none',
        };
    };

    const imageAreaStyle = {
        width: '100%',
        height: '300px',
        backgroundColor: currentTheme.cardBg,
        borderRadius: '12px',
        border: `1px dashed ${currentTheme.border}`,
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
        let bg = currentTheme.cardBg;
        let border = `1px solid ${currentTheme.border}`;
        let color = isLight ? '#6b7280' : '#a0a0a0';

        if (type === 'play-pause') {
            bg = isActive ? (isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 113, 133, 0.15)') : (isLight ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.15)');
            border = isActive ? (isLight ? '1px solid #3b82f6' : '1px solid #fb7185') : (isLight ? '1px solid #34d399' : '1px solid #34d399');
            color = isActive ? (isLight ? '#3b82f6' : '#fb7185') : '#34d399';
        } else if (type === 'skip') {
            bg = isLight ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f43f5e, #fb7185)';
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
            boxShadow: isHovered && type === 'skip' ? (isLight ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 4px 12px rgba(251, 113, 133, 0.4)') : 'none',
            outline: 'none',
        };
    };

    const customInputAreaStyle = {
        backgroundColor: currentTheme.cardBg,
        borderRadius: '12px',
        padding: '14px',
        border: `1px solid ${currentTheme.border}`,
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
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <h3 style={headerStyle}>
                <span>⏱️</span> {t('sketchTimerWall')}
            </h3>

            {/* Mode Switcher */}
            <div style={modeContainerStyle}>
                <button
                    style={getModeBtnStyle('random')}
                    onClick={() => handleModeSwitch('random')}
                    onMouseEnter={() => setHoveredEl('mode-random')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    🎲 {t('randomGallery')}
                </button>
                <button
                    style={getModeBtnStyle('custom')}
                    onClick={() => handleModeSwitch('custom')}
                    onMouseEnter={() => setHoveredEl('mode-custom')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    📁 {t('customImages')}
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
                    ⏱️ 60 {t('secondsSketch')}
                </button>
                <button
                    style={getDurationBtnStyle(180)}
                    onClick={() => handleDurationChange(180)}
                    onMouseEnter={() => setHoveredEl('dur-180')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    ⏱️ 3 {t('minutesSketch')}
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={customSeconds}
                        onChange={(e) => setCustomSeconds(e.target.value)}
                        placeholder={t('customSeconds')}
                        min="1"
                        max="3600"
                        style={{
                            width: '80px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${currentTheme.border}`,
                            backgroundColor: currentTheme.cardBg,
                            color: currentTheme.text,
                            fontSize: '0.85rem',
                            outline: 'none',
                            textAlign: 'center',
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = isLight ? '#3b82f6' : '#fb7185'}
                        onBlur={e => e.currentTarget.style.borderColor = currentTheme.border}
                    />
                    <button
                        onClick={handleCustomDurationSubmit}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isCustomDuration ? 'none' : `1px solid ${currentTheme.border}`,
                            backgroundColor: isCustomDuration
                                ? (isLight ? '#3b82f6' : '#fb7185')
                                : (hoveredEl === 'dur-custom' ? currentTheme.cardBg : currentTheme.cardBg),
                            color: isCustomDuration ? '#ffffff' : (hoveredEl === 'dur-custom' ? currentTheme.text : (isLight ? '#6b7280' : '#8c8c8c')),
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            boxShadow: isCustomDuration ? (isLight ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(251, 113, 133, 0.3)') : 'none',
                        }}
                        onMouseEnter={() => setHoveredEl('dur-custom')}
                        onMouseLeave={() => setHoveredEl(null)}
                    >
                        {t('set')}
                    </button>
                </div>
            </div>

            {/* Glowing Timer Display */}
            <div style={timerAreaStyle}>
                <span style={timerNumStyle}>
                    {timeLeft} <span style={{ fontSize: '1rem', color: isLight ? '#6b7280' : '#666' }}>S</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#6b7280' : '#888', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {isActive ? '⏳ ' + t('timing') : '⏸️ ' + t('paused')}
                </span>
                {/* Horizontal Progress Bar */}
                <div style={progressBarStyle} />
            </div>

            {/* Reference Image Canvas */}
            <div style={imageAreaStyle}>
                {practiceMode === 'custom' && customImages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: isLight ? '#6b7280' : '#666', padding: '20px' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📁</span>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: isLight ? '#6b7280' : '#8c8c8c' }}>{t('noCustomImages')}</p>
                        <p style={{ margin: '0', fontSize: '0.8rem', color: isLight ? '#6b7280' : '#555' }}>{t('uploadOrPaste')}</p>
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
                            color: isLight ? '#3b82f6' : '#fb7185',
                            animation: 'pulse 1.5s infinite ease-in-out'
                        }}>
                            {t('canvasPreparing')}
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
                                {t('retry')}
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
                                title={t('toggleFitMode')}
                            >
                                ⛶ {fitMode === 'contain' ? t('fill') : t('full')}
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
                                        color: savedImages.some(item => String(item.id) === String(currentImage.id)) ? (isLight ? '#3b82f6' : '#fb7185') : '#ffffff',
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
                                    title={savedImages.some(item => String(item.id) === String(currentImage.id)) ? t('unfavorite') : t('favorite')}
                                >
                                    {savedImages.some(item => String(item.id) === String(currentImage.id)) ? '❤️' : '🤍'}
                                </button>
                            )}
                            <img
                                src={currentImage.url}
                                alt={currentImage.author}
                                onClick={() => setShowImageModal(true)}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: fitMode,
                                    transition: 'object-fit 0.3s ease, transform 0.2s ease',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
                                    {currentImage.isCustom ? t('customReference') : t('referenceSource')}
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
                        backgroundColor: currentTheme.cardBg,
                        border: isLight ? '1px dashed rgba(59, 130, 246, 0.4)' : '1px dashed rgba(251, 113, 133, 0.4)',
                        borderRadius: '8px',
                        color: isLight ? '#3b82f6' : '#fb7185',
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
                        📁 {t('selectLocalImages')}
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
                            placeholder={t('orEnterUrl')}
                            value={pastedUrl}
                            onChange={(e) => setPastedUrl(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${currentTheme.border}`,
                                backgroundColor: currentTheme.cardBg,
                                color: currentTheme.text,
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
                                backgroundColor: isLight ? '#3b82f6' : '#fb7185',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {t('load')}
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
                    {isActive ? '⏸ ' + t('pause') : '▶ ' + t('continue')}
                </button>
                <button
                    style={getControlBtnStyle('reset')}
                    onClick={handleReset}
                    onMouseEnter={() => setHoveredEl('ctrl-reset')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    🔄 {t('reset')}
                </button>
                <button
                    style={getControlBtnStyle('skip')}
                    onClick={handleNextImage}
                    onMouseEnter={() => setHoveredEl('ctrl-skip')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    ⏩ {t('nextImage')}
                </button>
            </div>

            {/* Image Modal */}
            {showImageModal && currentImage && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.92)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                        backdropFilter: 'blur(8px)',
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={() => setShowImageModal(false)}
                >
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '95vw',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                            alignItems: 'stretch',
                            gap: '20px',
                            backgroundColor: currentTheme.cardBg,
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: '2rem',
                                cursor: 'pointer',
                                padding: '8px',
                                lineHeight: '1',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = isLight ? '#3b82f6' : '#fb7185'}
                            onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                        >
                            ✕
                        </button>

                        {/* Left: Image Display (70-80%) */}
                        <div style={{
                            flex: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '400px',
                        }}>
                            <img
                                src={currentImage.url}
                                alt={currentImage.author}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    borderRadius: '12px',
                                    objectFit: 'contain',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                }}
                            />
                        </div>

                        {/* Right: Sidebar Control Panel (20-30%) */}
                        <div style={{
                            width: window.innerWidth < 768 ? '100%' : '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            padding: '10px',
                            borderLeft: window.innerWidth < 768 ? 'none' : `1px solid ${currentTheme.border}`,
                            borderTop: window.innerWidth < 768 ? `1px solid ${currentTheme.border}` : 'none',
                        }}>
                            {/* Timer Display */}
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 113, 133, 0.1)',
                                borderRadius: '12px',
                                border: `1px solid ${isLight ? 'rgba(59, 130, 246, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`,
                            }}>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: isLight ? '#3b82f6' : '#fb7185',
                                    fontFamily: 'monospace',
                                    lineHeight: '1',
                                    marginBottom: '8px',
                                }}>
                                    {Math.floor(modalTimer / 60).toString().padStart(2, '0')}:{(modalTimer % 60).toString().padStart(2, '0')}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: isLight ? '#6b7280' : '#888',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}>
                                    {modalTimerActive ? '⏳ ' + t('timing') : '⏸️ ' + t('paused')}
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}>
                                <button
                                    onClick={handleModalTimerStart}
                                    disabled={modalTimerActive}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        backgroundColor: modalTimerActive
                                            ? (isLight ? '#e5e7eb' : '#374151')
                                            : (isLight ? '#3b82f6' : '#fb7185'),
                                        color: modalTimerActive ? (isLight ? '#9ca3af' : '#6b7280') : '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: modalTimerActive ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: modalTimerActive ? 'none' : (isLight ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(251, 113, 133, 0.3)'),
                                    }}
                                    onMouseEnter={e => {
                                        if (!modalTimerActive) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = isLight ? '0 6px 16px rgba(59, 130, 246, 0.4)' : '0 6px 16px rgba(251, 113, 133, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!modalTimerActive) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(251, 113, 133, 0.3)';
                                        }
                                    }}
                                >
                                    ▶ {t('continue')}
                                </button>
                                <button
                                    onClick={handleModalTimerPause}
                                    disabled={!modalTimerActive}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        border: `1px solid ${currentTheme.border}`,
                                        backgroundColor: !modalTimerActive
                                            ? (isLight ? '#e5e7eb' : '#374151')
                                            : (isLight ? '#f59e0b' : '#fbbf24'),
                                        color: !modalTimerActive ? (isLight ? '#9ca3af' : '#6b7280') : '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: !modalTimerActive ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        if (modalTimerActive) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (modalTimerActive) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                    ⏸ {t('pause')}
                                </button>
                                <button
                                    onClick={handleModalTimerReset}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        border: `1px solid ${currentTheme.border}`,
                                        backgroundColor: currentTheme.cardBg,
                                        color: currentTheme.text,
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = isLight ? '#e5e7eb' : '#374151';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = currentTheme.cardBg;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    🔄 {t('reset')}
                                </button>
                            </div>

                            {/* Hint */}
                            <div style={{
                                marginTop: 'auto',
                                textAlign: 'center',
                                color: isLight ? '#6b7280' : '#888',
                                fontSize: '0.8rem',
                                lineHeight: '1.5',
                            }}>
                                {t('clickToClose')}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SketchWall;