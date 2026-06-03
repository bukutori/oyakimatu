import React, { useState } from 'react';
import axios from 'axios';

// Large Database (20 items per category)
const subjects = [
    '宇航員', '柴犬', '賽博朋克魔女', '古風刺客', 
    '貓頭鷹學者', '蒸汽龐克機械師', '森林精靈', '幽靈鋼琴家', 
    '機械戰警', '煉金術士', '深海潛水員', '熊貓武僧', 
    '糖果女巫', '時空旅人', '流浪詩人', '狐狸偵探', 
    '末日拾荒者', '九尾狐仙', '發光水母少女', '發條木偶'
];

const actions = [
    '在吃泡麵', '在太空中盪秋千', '與貓咪對視', '在雨中奔跑', 
    '閉眼沉思中', '悄悄彈琴', '翻閱古老卷軸', '修理發光齒輪', 
    '吹著口哨', '凝視遙遠星系', '釣起一隻星光', '正在烤棉花糖', 
    '編織七彩極光', '悄悄擦拭眼角', '聽著復古黑膠唱片', '調配發光的魔法藥水', 
    '在廢墟上跳舞', '與自己的影子對話', '在空中漂浮', '手寫一封密信'
];

const outfits = [
    '穿著發光雨衣', '戴著黃銅單片眼鏡', '披著星光斗篷', '穿著寬鬆連帽衣', 
    '戴著霓虹貓耳耳機', '提著復古手提油燈', '戴著磨損的草帽', '繫著鮮紅色圍巾', 
    '手握閃爍的星塵法杖', '背著巨型蒸汽動力背包', '戴著復古防毒面具', '穿著華麗的和風羽織', 
    '懷抱一顆發光水晶球', '戴著黑色圓頂禮帽', '身著金屬反光機甲', '戴著半遮面的狐狸面具', 
    '披著破舊的羊毛斗篷', '佩戴著發光的機械義眼', '穿著維多利亞蕾絲洋裝', '戴著飛行護目鏡'
];

const backgrounds = [
    '在霓虹閃爍的夜市', '在被植被覆蓋的廢棄廢墟', '在漂浮的雲端城堡', '在深海發光水母群旁', 
    '在發光的螢光森林中', '在蒸汽繚繞的老火車站', '在懸浮半空的魔法圖書館', '在滿天星斗的荒漠綠洲', 
    '在彩虹糖果工廠裡', '在幽藍的冰川裂谷深處', '在陽光灑落的復古閣樓', '在荒涼的月球基地邊緣', 
    '在盛開的向日葵花海中', '在溫馨的深夜貓咪咖啡廳', '在時空混亂的賽博診所', '在充滿螢光蕈類的地下洞穴', 
    '在楓葉如雨落下的日式庭院', '在懸崖邊的孤獨燈塔旁', '在齒輪囓合的機械迷宮', '在寂靜的星際太空站'
];

const styles = [
    '吉卜力溫馨風', '賽博朋克霓虹', '極簡線條美學', '傳統浮世繪', 
    '史詩奇幻插畫', '唯美水彩渲染', '復古 8-bit 像素', '粗獷柴油龐克', 
    '莫內印象派光影', '華麗裝飾藝術風 (Art Deco)', '哥特暗黑美學', '柔和馬卡龍粉彩', 
    '丁達爾效應逆光', '雙色調冷暖對比', '復古波普藝術 (Pop Art)', '超現實達利風', 
    '新海誠寫實天空感', '黑白高對比版畫', '科幻概念設定集', '廢土荒涼質感'
];

// Classifier Helper
const getClassifier = (subject) => {
    if (['柴犬', '九尾狐仙', '狐狸偵探', '貓頭鷹學者'].some(s => subject.includes(s))) {
        return '隻';
    }
    if (['精靈', '鋼琴家', '機械師', '旅人', '詩人', '偵探', '拾荒者', '少女', '魔女', '刺客', '武僧', '女巫', '宇航員', '煉金術士', '潛水員'].some(s => subject.includes(s))) {
        return '位';
    }
    return '個';
};

// Sentence Structure Templates
const structures = [
    // 3 Elements
    (style, bg, outfit, action, char, classifier) => `今日挑戰：請用 [${style}] 畫一${classifier} [${outfit}] 的 [${char}] ！`,
    
    // 4 Elements
    (style, bg, outfit, action, char, classifier) => `今日挑戰：請用 [${style}] 畫一${classifier} [${outfit}] 且 [${action}] 的 [${char}] ！`,
    
    // 5 Elements (Full)
    (style, bg, outfit, action, char, classifier) => `今日挑戰：請嘗試以 [${style}]，畫一${classifier} [${outfit}] 的 [${char}]，Ta正 [${bg}] [${action}] ！`,
    
    // Alternative 4 Elements
    (style, bg, outfit, action, char, classifier) => `今日挑戰：請用 [${style}] 畫一${classifier}身處 [${bg}] 且 [${outfit}] 的 [${char}] ！`
];

function InspirationGenerator() {
    const [activeTab, setActiveTab] = useState('text'); // 'text' or 'image'
    
    // Text challenge state
    const [challengeText, setChallengeText] = useState(null);

    // External Quote API State
    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    // Image challenge state
    const [imageUrl, setImageUrl] = useState('');
    const [imageLoading, setImageLoading] = useState(false);

    // Hover states for premium micro-animations
    const [hoveredEl, setHoveredEl] = useState(null);

    const generateTextChallenge = () => {
        // Randomly pick values
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const randomOutfit = outfits[Math.floor(Math.random() * outfits.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        const randomChar = subjects[Math.floor(Math.random() * subjects.length)];
        
        const classifier = getClassifier(randomChar);

        // Randomly pick a sentence structure
        const randomStructure = structures[Math.floor(Math.random() * structures.length)];
        const generatedText = randomStructure(randomStyle, randomBg, randomOutfit, randomAction, randomChar, classifier);
        
        setChallengeText(generatedText);
        fetchExternalQuote();
    };

    const fetchExternalQuote = async () => {
        setQuoteLoading(true);
        try {
            // Hit Hitokoto API (free, reliable, direct Chinese anime/philosophical quotes)
            const response = await axios.get('https://v1.hitokoto.cn/');
            if (response.data && response.data.hitokoto) {
                setQuote({
                    text: response.data.hitokoto,
                    from: response.data.from,
                    fromWho: response.data.from_who || ''
                });
            }
        } catch (error) {
            console.error("Error fetching quote:", error);
            // Dynamic fallback generator
            const fallbacks = [
                { text: "世界上只有一種真正的英雄主義，那就是在認清生活的真相後依然熱愛生活。", from: "羅曼·羅蘭" },
                { text: "隱約雷鳴，陰霾天空。但盼風雨來，能留你在此。", from: "萬葉集" },
                { text: "人生的旋轉木馬，一直在不停地轉動著。", from: "霍爾的移動城堡" },
                { text: "生活就如同漫天的繁星，即使再微弱，也有它發光的時候。", from: "原創靈感" },
                { text: "夢想若不曾被嘲笑，就沒有實現的價值。", from: "動漫名言" }
            ];
            const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            setQuote({
                text: randomFallback.text,
                from: randomFallback.from,
                fromWho: ''
            });
        } finally {
            setQuoteLoading(false);
        }
    };

    const generateImageChallenge = () => {
        setImageLoading(true);
        const randomId = Math.floor(Math.random() * 100000);
        setImageUrl(`https://picsum.photos/400/300?random=${randomId}`);
    };

    // Color code and format elements inside [brackets]
    const formatChallengeText = (text) => {
        const parts = text.split(/(\[.*?\])/g);
        return parts.map((part, index) => {
            if (part.startsWith('[') && part.endsWith(']')) {
                const innerText = part.slice(1, -1);
                
                let color = '#38bdf8'; // Sky blue (Subjects)
                let borderCol = 'rgba(56, 189, 248, 0.4)';
                
                if (styles.includes(innerText)) {
                    color = '#a78bfa'; // Violet (Style)
                    borderCol = 'rgba(167, 139, 250, 0.4)';
                } else if (backgrounds.includes(innerText)) {
                    color = '#f43f5e'; // Rose/Pink (Background)
                    borderCol = 'rgba(244, 63, 94, 0.4)';
                } else if (actions.includes(innerText)) {
                    color = '#fb923c'; // Orange (Action)
                    borderCol = 'rgba(251, 146, 60, 0.4)';
                } else if (outfits.includes(innerText)) {
                    color = '#34d399'; // Emerald (Outfit)
                    borderCol = 'rgba(52, 211, 153, 0.4)';
                }
                
                return (
                    <span key={index} style={{ 
                        color, 
                        fontWeight: 'bold', 
                        borderBottom: `2px solid ${borderCol}`, 
                        paddingBottom: '2px',
                        margin: '0 2px'
                    }}>
                        {innerText}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
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
        background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    const tabContainerStyle = {
        display: 'flex',
        backgroundColor: '#121212',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
    };

    const getTabStyle = (tabName) => {
        const isActive = activeTab === tabName;
        const isHovered = hoveredEl === `tab-${tabName}`;
        return {
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: isActive ? '#2a2a2a' : 'transparent',
            color: isActive 
                ? '#a78bfa' 
                : (isHovered ? '#e0e0e0' : '#8c8c8c'),
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            outline: 'none',
            boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.5)' : 'none',
        };
    };

    const contentAreaStyle = {
        minHeight: '290px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#151515',
        borderRadius: '12px',
        padding: '24px 20px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
    };

    const btnStyle = (type) => {
        const isHovered = hoveredEl === 'action-btn';
        let bg = 'linear-gradient(135deg, #6366f1, #a855f7)';
        let shadowColor = 'rgba(168, 85, 247, 0.4)';
        
        if (type === 'image') {
            bg = 'linear-gradient(135deg, #06b6d4, #3b82f6)';
            shadowColor = 'rgba(59, 130, 246, 0.4)';
        }

        return {
            width: '100%',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '10px',
            background: bg,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isHovered 
                ? `0 6px 20px ${shadowColor}` 
                : `0 4px 12px ${shadowColor}`,
            transform: isHovered ? 'translateY(-2px)' : 'none',
            outline: 'none',
        };
    };

    return (
        <div style={cardStyle}>
            {/* Inline CSS for Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            <h3 style={headerStyle}>
                <span>🔮</span> 靈感抽籤機
            </h3>

            {/* Tabs */}
            <div style={tabContainerStyle}>
                <button
                    style={getTabStyle('text')}
                    onClick={() => setActiveTab('text')}
                    onMouseEnter={() => setHoveredEl('tab-text')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    📝 文字挑戰
                </button>
                <button
                    style={getTabStyle('image')}
                    onClick={() => setActiveTab('image')}
                    onMouseEnter={() => setHoveredEl('tab-image')}
                    onMouseLeave={() => setHoveredEl(null)}
                >
                    🖼️ 圖片挑戰
                </button>
            </div>

            {/* Content Display Area */}
            <div style={contentAreaStyle}>
                {activeTab === 'text' ? (
                    challengeText ? (
                        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out', width: '100%' }}>
                            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                🎲 隨機繪畫挑戰
                            </p>
                            <h4 style={{ fontSize: '1.1rem', lineHeight: '1.75', margin: '0', fontWeight: '500', color: '#f3f4f6' }}>
                                {formatChallengeText(challengeText)}
                            </h4>

                            {/* External Quote / Ambient Inspiration */}
                            <div style={{
                                marginTop: '20px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minHeight: '60px',
                                justifyContent: 'center'
                            }}>
                                {quoteLoading ? (
                                    <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>🔮 正在捕捉共鳴意境...</span>
                                ) : (
                                    quote && (
                                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#a0a0a0', fontStyle: 'italic', lineHeight: '1.5' }}>
                                                「 {quote.text} 」
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 'bold' }}>
                                                —— 意境共鳴：{quote.fromWho ? `${quote.fromWho} · ` : ''}《{quote.from}》
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>⚡</span>
                            <p style={{ margin: '0', fontSize: '0.95rem' }}>點擊下方按鈕，召喚你的創作靈感！</p>
                        </div>
                    )
                ) : (
                    imageUrl ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {imageLoading && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 0, left: 0, right: 0, bottom: 0, 
                                    backgroundColor: 'rgba(21, 21, 21, 0.85)', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    zIndex: 2,
                                    borderRadius: '8px'
                                }}>
                                    <span style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🌀</span>
                                    <span style={{ fontSize: '0.85rem', color: '#a78bfa' }}>靈感傳送中...</span>
                                </div>
                            )}
                            <img
                                src={imageUrl}
                                alt="Inspiration"
                                onLoad={() => setImageLoading(false)}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '220px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    opacity: imageLoading ? 0.3 : 1,
                                    transition: 'opacity 0.3s ease',
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🎨</span>
                            <p style={{ margin: '0', fontSize: '0.95rem' }}>點擊下方按鈕，抽一張天馬行空的靈感圖片！</p>
                        </div>
                    )
                )}
            </div>

            {/* Action Button */}
            <button
                style={btnStyle(activeTab)}
                onClick={activeTab === 'text' ? generateTextChallenge : generateImageChallenge}
                onMouseEnter={() => setHoveredEl('action-btn')}
                onMouseLeave={() => setHoveredEl(null)}
            >
                {activeTab === 'text' ? '🎲 召喚隨機挑戰' : '🌌 抽一張靈感圖'}
            </button>
        </div>
    );
}

export default InspirationGenerator;