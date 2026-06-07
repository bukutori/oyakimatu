// ─────────────────────────────────────────────

// 多國語言翻譯字典

// ─────────────────────────────────────────────

const TRANSLATIONS = {

  zh: {

    // 導覽列與設定

    settings: '設定',

    timeAwareBackground: '時間感知背景',

    timeAwareBackgroundDesc: '根據時間自動切換日間/夜間模式',

    timeRules: '時間規則：',

    dayMode: '日間模式：06:00 - 18:00（白色背景）',

    nightMode: '夜間模式：18:00 - 06:00（黑色背景）',

    note: '注意：',

    autoModeNote: '開啟後，手動切換按鈕將被禁用。',

    language: '語言',

    login: '登入',

    register: '註冊',

    logout: '登出',

    explore: '探索靈感',

    favorites: '我的收藏',

    sketch: '速寫練習',

    inspiration: '靈感抽籤',

    palette: '主題色票',

    mySite: '我的網站',

    autoTimeModeEnabled: '已啟用自動時間模式',

    toggleDarkMode: '切換深色/淺色模式',

    // 速寫計時牆

    sketchTimerWall: '速寫計時牆',

    randomGallery: '隨機圖庫',

    customImages: '自訂圖片',

    secondsSketch: '秒速寫',

    minutesSketch: '分鐘速寫',

    customSeconds: '自訂秒數',

    set: '設定',

    timing: '計時中',

    paused: '已暫停',

    noCustomImages: '尚未載入自訂圖片',

    uploadOrPaste: '請在下方上傳本地圖片或貼上網址',

    canvasPreparing: '網頁畫布準備中...',

    loadImageError: '無法載入參考圖，請嘗試重新載入。',

    retry: '重試',

    toggleFitMode: '切換裁剪填充或完整顯示',

    fill: '填滿',

    full: '完整',

    unfavorite: '取消收藏',

    favorite: '加入收藏',

    customReference: '📁 自訂參考：',

    referenceSource: '👤 參考圖源：',

    selectLocalImages: '選擇本地圖片 (支援複選批次練習)',

    orEnterUrl: '或輸入線上圖片 URL...',

    load: '載入',

    pause: '暫停',

    continue: '繼續',

    reset: '重設',

    nextImage: '下一張 (Skip)',

    clickToClose: '點擊背景或右上角 ✕ 關閉',

    // 主題調色盤

    themePalette: '主題調色盤',

    clickToCopy: '點擊色彩條即可複製 Hex 色碼',

    clickToChange: '再次點擊按鈕可換組配色',

    harmoniousPalette: '和諧配色',

    randomPalette: '隨機配色',

    colorCopied: '已複製色碼：',

    // 靈感抽籤機

    inspirationLottery: '靈感抽籤機',

    textChallenge: '文字挑戰',

    imageChallenge: '圖片挑戰',

    randomDrawingChallenge: '🎲 隨機繪畫挑戰',

    capturingMood: '🔮 正在捕捉共鳴意境...',

    moodResonance: '意境共鳴：',

    clickToSummon: '點擊下方按鈕，召喚你的創作靈感！',

    inspirationTransferring: '靈感傳送中...',

    clickToEnlarge: '點擊圖片放大查看',

    clickToDraw: '點擊下方按鈕，抽一張天馬行空的靈感圖片！',

    summonChallenge: '🎲 召喚隨機挑戰',

    drawingLottery: '🎰 抽籤中...',

    drawInspirationImage: '🌌 抽一張靈感圖',

    // 靈感圖庫

    inspirationGallery: '靈感圖庫',

    poses: '動作參考',

    landscapes: '奇幻風景',

    outfits: '角色穿搭',

    nature: '自然場景',

    urban: '都市建築',

    all: '全部',

    pinnedCanvas: '釘選對照畫布',

    multiCompare: '🔍 多圖對比',

    clear: '清空',

    loadFailed: '圖片載入失敗，請檢查網路連線。',

    inspirationLoading: '靈感載入中...',

    loadingMore: '載入中...稍等一下呦',

    loadMore: '載入更多靈感',

    cancelFavorite: '取消收藏',

    addFavorite: '加入收藏',

    cancelPin: '取消釘選',

    pinToCanvas: '釘選到畫布',

    pinLimit: '釘選對照畫布最多只能放置 6 張圖片喔！',

    // 其他

    copy: 'Copy',

  },

  JP: {

    // 導覽列與設定

    settings: '設定',

    timeAwareBackground: '時間感知背景',

    timeAwareBackgroundDesc: '時間に応じて日中/夜間モードを自動切り替え',

    timeRules: '時間ルール：',

    dayMode: '日中モード：06:00 - 18:00（白背景）',

    nightMode: '夜間モード：18:00 - 06:00（黒背景）',

    note: '注意：',

    autoModeNote: '有効にすると、手動切り替えボタンは無効になります。',

    language: '言語',

    login: 'ログイン',

    register: '登録',

    logout: 'ログアウト',

    explore: 'インスピレーションを探す',

    favorites: 'お気に入り',

    sketch: 'スケッチ練習',

    inspiration: 'インスピレーション抽選',

    palette: 'テーマパレット',

    mySite: 'マイサイト',

    autoTimeModeEnabled: '自動時間モードが有効です',

    toggleDarkMode: 'ダーク/ライトモード切り替え',

    // 速寫計時牆

    sketchTimerWall: 'スケッチタイマー',

    randomGallery: 'ランダムギャラリー',

    customImages: 'カスタム画像',

    secondsSketch: '秒スケッチ',

    minutesSketch: '分スケッチ',

    customSeconds: 'カスタム秒数',

    set: '設定',

    timing: '計時中',

    paused: '一時停止',

    noCustomImages: 'カスタム画像が読み込まれていません',

    uploadOrPaste: '下でローカル画像をアップロードするかURLを貼り付けてください',

    canvasPreparing: 'キャンバス準備中...',

    loadImageError: '参照画像を読み込めません。再試してください。',

    retry: '再試行',

    toggleFitMode: '切り詰め表示または完全表示を切り替え',

    fill: '切り詰め',

    full: '完全',

    unfavorite: 'お気に入り解除',

    favorite: 'お気に入り追加',

    customReference: '📁 カスタム参照：',

    referenceSource: '👤 参照ソース：',

    selectLocalImages: 'ローカル画像を選択（複数選択可能）',

    orEnterUrl: 'またはオンライン画像URLを入力...',

    load: '読み込み',

    pause: '一時停止',

    continue: '続行',

    reset: 'リセット',

    nextImage: '次の画像 (Skip)',

    clickToClose: '背景または右上の ✕ をクリックして閉じる',

    // 主題調色盤

    themePalette: 'テーマパレット',

    clickToCopy: 'カラーバーをクリックしてHexコードをコピー',

    clickToChange: 'ボタンを再度クリックして配色を変更',

    harmoniousPalette: '調和配色',

    randomPalette: 'ランダム配色',

    colorCopied: '色コードをコピー：',

    // 靈感抽籤機

    inspirationLottery: 'インスピレーション抽選機',

    textChallenge: 'テキストチャレンジ',

    imageChallenge: '画像チャレンジ',

    randomDrawingChallenge: '🎲 ランダム絵画チャレンジ',

    capturingMood: '🔮 雰囲気をキャプチャ中...',

    moodResonance: '雰囲気共鳴：',

    clickToSummon: 'ボタンをクリックして創作インスピレーションを召喚！',

    inspirationTransferring: 'インスピレーション転送中...',

    clickToEnlarge: '画像をクリックして拡大表示',

    clickToDraw: 'ボタンをクリックして自由なインスピレーション画像を抽選！',

    summonChallenge: '🎲 ランダムチャレンジ召喚',

    drawingLottery: '🎰 抽選中...',

    drawInspirationImage: '🌌 インスピレーション画像を抽選',

    // 靈感圖庫

    inspirationGallery: 'インスピレーションギャラリー',

    poses: 'ポーズ参考',

    landscapes: 'ファンタジー風景',

    outfits: 'キャラクターコーディネート',

    nature: '自然風景',

    urban: '都市建築',

    all: 'すべて',

    pinnedCanvas: 'ピン留めキャンバス',

    multiCompare: '🔍 複数比較',

    clear: 'クリア',

    loadFailed: '画像の読み込みに失敗しました。ネットワーク接続を確認してください。',

    inspirationLoading: 'インスピレーション読み込み中...',

    loadingMore: '読み込み中...少々お待ちください',

    loadMore: 'もっとインスピレーションを読み込む',

    cancelFavorite: 'お気に入り解除',

    addFavorite: 'お気に入り追加',

    cancelPin: 'ピン留め解除',

    pinToCanvas: 'キャンバスにピン留め',

    pinLimit: 'ピン留めキャンバスには最大6枚の画像しか配置できません！',

    // 其他

    copy: 'Copy',

  },

};



export default TRANSLATIONS;
