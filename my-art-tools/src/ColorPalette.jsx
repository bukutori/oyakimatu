import React, { useState, useEffect } from 'react';
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

// 預設幾組好看的和諧色票，當作初始值或備用光源
const PRESET_PALETTES = [
    ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#A29BFE'],
    ['#742DDD', '#4A00E0', '#8E2DE2', '#F000FF', '#00FFFF'],
    ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFA1A1', '#FFE162'],
    ['#20232A', '#282C34', '#61DAFB', '#21252B', '#ABB2BF'],
    ['#0F2027', '#203A43', '#2C5364', '#3A6073', '#FFF'],
    ['#FF00FF', '#00FF00', '#0000FF', '#FFFF00', '#FF0000'], // 隨機配色：極端亮色混搭
];

export default function ColorPalette({ theme = 'dark', language = 'zh' }) {
    const [colors, setColors] = useState([]);
    const [copiedColor, setCopiedColor] = useState(null);
    const currentTheme = THEMES[theme] || THEMES.dark;
    const [isRandomMode, setIsRandomMode] = useState(false);

    // Translation helper
    const t = (key) => TRANSLATIONS[language][key] || key;

    // 新增狀態：用來追蹤目前滑鼠正懸停在哪一個色塊上 (0~4)，null 代表沒有
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // 隨機生成一組好看、和諧的 HSL 顏色並轉成 HEX
    const generateHarmoniousPalette = () => {
        const baseHue = Math.floor(Math.random() * 360);
        const newColors = [];

        for (let i = 0; i < 5; i++) {
            const h = (baseHue + i * 30) % 360;
            const s = 65 + Math.floor(Math.random() * 20);
            const l = 45 + Math.floor(Math.random() * 20);
            newColors.push(hslToHex(h, s, l));
        }
        setColors(newColors);
    };

    // 隨機配色扭蛋機：生成高對比、極端亮色與暗色混搭的瘋狂顏色
    const generateRandomCrazyPalette = () => {
        const newColors = [];
        for (let i = 0; i < 6; i++) {
            // 隨機生成 RGB 值，偏向高飽和和極端亮度
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            newColors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
        }
        setColors(newColors);
    };

    // 點擊複製功能
    const handleCopy = (color) => {
        navigator.clipboard.writeText(color).then(() => {
            setCopiedColor(color);
            setTimeout(() => setCopiedColor(null), 1500);
        });
    };

    // 切換到和諧配色模式
    const handleHarmoniousMode = () => {
        setIsRandomMode(false);
        generateHarmoniousPalette();
    };

    // 切換到隨機配色模式
    const handleRandomMode = () => {
        setIsRandomMode(true);
        generateRandomCrazyPalette();
    };

    useEffect(() => {
        if (isRandomMode) {
            generateRandomCrazyPalette();
        } else {
            generateHarmoniousPalette();
        }
    }, [isRandomMode]);

    // Dynamic styles based on theme
    const styles = {
        card: {
            backgroundColor: currentTheme.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            position: 'relative',
            maxWidth: '600px',
            margin: '0 auto',
            overflow: 'hidden',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            color: currentTheme.text,
            fontSize: '1.25rem',
            fontWeight: '600',
            margin: '0 0 4px 0',
        },
        subtitle: {
            color: currentTheme.text === '#e0e0e0' ? '#888888' : '#6b7280',
            fontSize: '0.85rem',
            margin: 0,
        },
        button: {
            backgroundColor: '#742DDD',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(116, 45, 221, 0.3)',
        },
        paletteContainer: {
            display: 'flex',
            gap: '12px',
            height: '200px',
        },
        colorColumn: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
        },
        colorBar: {
            width: '100%',
            flex: 1,
            borderRadius: '8px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        colorText: {
            marginTop: '10px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            fontWeight: '500',
            letterSpacing: '0.5px',
            transition: 'color 0.2s ease',
        },
        copyOverlay: {
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
        },
        toast: {
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            backgroundColor: currentTheme.cardBg,
            color: '#6BCB77',
            padding: '10px 20px',
            borderRadius: '30px',
            fontSize: '0.9rem',
            fontWeight: '500',
            border: '1px solid rgba(107, 203, 119, 0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }
    };

    return (
        <div style={styles.card}>
            {/* 頂部標題與按鈕 */}
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>{t('themePalette')}</h3>
                    <p style={styles.subtitle}>{t('clickToCopy')}</p>
                     <p style={styles.subtitle}>{t('clickToChange')}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleHarmoniousMode}
                        style={{
                            ...styles.button,
                            backgroundColor: !isRandomMode ? '#742DDD' : '#e5e7eb',
                            boxShadow: !isRandomMode ? '0 4px 12px rgba(116, 45, 221, 0.3)' : 'none',
                            color: !isRandomMode ? '#ffffff' : '#6b7280',
                        }}
                        onMouseEnter={(e) => {
                            if (!isRandomMode) e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isRandomMode) e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {t('harmoniousPalette')}
                    </button>
                    <button
                        onClick={handleRandomMode}
                        style={{
                            ...styles.button,
                            backgroundColor: isRandomMode ? '#FF00FF' : '#e5e7eb',
                            boxShadow: isRandomMode ? '0 4px 12px rgba(255, 0, 255, 0.3)' : 'none',
                            color: isRandomMode ? '#ffffff' : '#6b7280',
                        }}
                        onMouseEnter={(e) => {
                            if (isRandomMode) e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            if (isRandomMode) e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {t('randomPalette')}
                    </button>
                </div>
            </div>

            {/* 色票長條狀區塊 */}
            <div style={styles.paletteContainer}>
                {colors.map((color, index) => {
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                            key={index}
                            style={styles.colorColumn}
                            onClick={() => handleCopy(color)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* 上方色彩條 */}
                            <div
                                style={{
                                    ...styles.colorBar,
                                    backgroundColor: color,
                                    // 透過動態狀態實現 Hover 放大與陰影特效
                                    transform: isHovered ? 'scale(1.03) translateY(-4px)' : 'scale(1) translateY(0)',
                                    boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.4)' : 'inset 0 0 10px rgba(0,0,0,0.2)',
                                }}
                            >
                                {/* 透過動態狀態控制 Copy 字樣顯現 */}
                                <div style={{
                                    ...styles.copyOverlay,
                                    opacity: isHovered ? 1 : 0,
                                }}>
                                    {t('copy')}
                                </div>
                            </div>
                            {/* 下方 Hex 字串 */}
                            <span style={{
                                ...styles.colorText,
                                color: isHovered ? '#ffffff' : '#cccccc' // 懸停時文字亮起
                            }}>
                                {color.toUpperCase()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 複製成功彈出提示（改用純 JS 狀態控制過渡，確保動畫正常運作） */}
            <div style={{
                ...styles.toast,
                opacity: copiedColor ? 1 : 0,
                transform: copiedColor ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
                pointerEvents: 'none'
            }}>
                {t('colorCopied')}{copiedColor ? copiedColor.toUpperCase() : ''} !
            </div>
        </div>
    );
}

// HSL 轉 HEX 的工具函數
function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
