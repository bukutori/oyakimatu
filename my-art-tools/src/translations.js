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

    station: '驛站留言牆',

    admin: '管理員',

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

    // 時光驛站牆 & 頁尾
    stationTitle: '🚂 時光驛站牆',
    stationDesc: '分享你的創作故事，與旅人們交流靈感',
    tabPublic: '🌍 旅人明信片',
    tabPending: '⏳ 待審核驛站',
    btnOpenPostForm: '📮 掛上我的明信片',
    createPostcard: '📝 創作你的明信片',
    uploadImage: '📷 上傳圖片',
    uploadHint: '點擊或拖曳圖片至此處上傳',
    uploadSupport: '支援 JPG、PNG、GIF、WebP（最大 10MB）',
    storyText: '✍️ 故事文字',
    storyPlaceholder: '分享你的創作故事、旅程心得、或一句觸動你的話...',
    btnSubmitPost: '📤 送出明信片',
    submitting: '⏳ 上傳中...',
    cancel: '取消',
    pendingExplain: '🔍 以下為待審核明信片——圖片預設模糊，懸停可預覽。請仔細審核後再決定核准或婉拒。',
    myPendingCard: '明信片已送出，等待管理員審核！',
    pendingBadge: '待審核',
    hideComments: '隱藏留言',
    showComments: '查看留言',
    noComments: '還沒有留言，來當第一個留言的人吧！',
    commentPlaceholder: '寫下你的留言...',
    loginRequiredComment: '請先登入才能留言',
    send: '送出',
    btnApprove: '🟢 核准上線',
    approving: '核准中...',
    btnReject: '🔴 婉拒刪除',
    rejecting: '刪除中...',
    emptyPublic: '還沒有明信片，成為第一個分享者吧！',
    emptyPending: '沒有待審核的明信片，一切清空 ✨',
    delete: '🗑️ 刪除',
    pendingNoComment: '⏳ 待審核的明信片無法留言',
    alertSizeLimit: '圖片檔案大小不能超過 10MB',
    alertLoginRequiredPost: '請先登入才能發布明信片 🔐',
    alertSelectImage: '請選擇圖片',
    alertTextRequired: '請填寫故事文字',
    alertUploadSuccess: '明信片已送出，等待管理員審核！',
    alertUploadFailed: '發布失敗，請稍後再試',
    alertNetworkFailed: '網路連線失敗，請稍後再試',
    alertApproveSuccess: '✅ 明信片已核准上線！',
    alertApproveFailed: '核准失敗，請稍後再試',
    confirmDelete: '確定要永久刪除這張明信片嗎？',
    alertDeleteSuccess: '🗑️ 明信片已刪除',
    alertDeleteFailed: '刪除失敗，請稍後再試',
    alertLoginRequiredComment: '請先登入才能留言',
    alertCommentSuccess: '留言成功！',
    alertCommentFailed: '留言失敗',
    alertNetworkError: '網路錯誤，請稍後再試',
    alertTextOrImageRequired: '請上傳圖片或填寫故事文字',
    alertUploadSuccessAdmin: '明信片已成功發布！',
    footerAbout: '關於繪師驛站',
    footerAboutDesc: '專為藝術創作者打造的數位工具箱。提供隨機繪畫靈感、精選色彩搭配與速寫練習功能，陪伴妳的創作每一天。',
    footerQuickLinks: '快捷連結',
    footerMySite: '我的個人網站',
    footerStatus: '驛站連線狀態',
    footerStatusDesc: '雲端資料庫（MongoDB）已同步連線。歡迎前往交流討論版留下一期一會的創作足跡！',
    footerStatusSynced: '全球同步中',
    footerCopyright: '繪師驛站',

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

    explore: 'ギャラリー',

    favorites: 'お気に入り',

    sketch: 'スケッチ',

    inspiration: 'インスピガチャ',

    palette: 'パレット',

    station: '掲示板',

    admin: '管理者',

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

    // 時光驛站牆 & 頁尾
    stationTitle: '🚂 駅のメッセージボード',
    stationDesc: '創作ストーリーを共有し、旅人とインスピレーションを交流しましょう',
    tabPublic: '🌍 旅人の絵葉書',
    tabPending: '⏳ 承認待ち駅',
    btnOpenPostForm: '📮 絵葉書を投稿する',
    createPostcard: '📝 絵葉書を作成する',
    uploadImage: '📷 画像アップロード',
    uploadHint: 'クリックまたは画像をドラッグしてアップロード',
    uploadSupport: 'JPG、PNG、GIF、WebPに対応（最大10MB）',
    storyText: '✍️ ストーリーテキスト',
    storyPlaceholder: '創作の裏話、旅の感想、または心に響いた言葉を共有しましょう...',
    btnSubmitPost: '📤 絵葉書を送る',
    submitting: '⏳ アップロード中...',
    cancel: 'キャンセル',
    pendingExplain: '🔍 こちらは承認待ちの絵葉書です——画像はデフォルトでぼかしがかかっており、ホバーでプレビューできます。よくご確認の上、承認または却下を決定してください。',
    myPendingCard: '絵葉書は送信されました。管理者の承認をお待ちください！',
    pendingBadge: '承認待ち',
    hideComments: 'コメントを非表示',
    showComments: 'コメントを表示',
    noComments: 'コメントはまだありません。最初のコメントを書きましょう！',
    commentPlaceholder: 'コメントを書く...',
    loginRequiredComment: 'コメントを投稿するにはログインしてください',
    send: '送信',
    btnApprove: '🟢 承認する',
    approving: '承認中...',
    btnReject: '🔴 却下して削除',
    rejecting: '削除中...',
    emptyPublic: '絵葉書はまだありません。最初の共有者になりましょう！',
    emptyPending: '承認待ちの絵葉書はありません。すべて完了です ✨',
    delete: '🗑️ 削除',
    pendingNoComment: '⏳ 承認待ちの絵葉書にはコメントできません',
    alertSizeLimit: '画像のファイルサイズは10MBを超えられません',
    alertLoginRequiredPost: '絵葉書を投稿するにはログインしてください 🔐',
    alertSelectImage: '画像を選択してください',
    alertTextRequired: 'ストーリーテキストを入力してください',
    alertUploadSuccess: '絵葉書は送信されました。管理者の承認をお待ちください！',
    alertUploadFailed: '投稿に失敗しました。後で再試行してください',
    alertNetworkFailed: 'ネットワーク接続に失敗しました。後で再試行してください',
    alertApproveSuccess: '✅ 絵葉書が承認されました！',
    alertApproveFailed: '承認に失敗しました。後で再試行してください',
    confirmDelete: 'この絵葉書を永久に削除してもよろしいですか？',
    alertDeleteSuccess: '🗑️ 絵葉書が削除されました',
    alertDeleteFailed: '削除に失敗しました。後で再試行してください',
    alertLoginRequiredComment: 'コメントを投稿するにはログインしてください',
    alertCommentSuccess: 'コメントが投稿されました！',
    alertCommentFailed: 'コメントの投稿に失敗しました',
    alertNetworkError: 'ネットワークエラーが発生しました。後で再試行してください',
    alertTextOrImageRequired: '画像かストーリーテキスト of どちらかを入力してください',
    alertUploadSuccessAdmin: '絵葉書が正常に投稿されました！',
    footerAbout: '「絵師駅」について',
    footerAboutDesc: 'イラストレーターのために作られたデジタルツールボックス。ランダムなインスピレーション、厳選されたパレット、スケッチ練習機能を提供し、毎日の創作をサポートします。',
    footerQuickLinks: 'クイックリンク',
    footerMySite: 'マイウェブサイト',
    footerStatus: 'サーバー接続状態',
    footerStatusDesc: 'クラウドデータベース（MongoDB）に正常に接続されました。メッセージボードであなたの足跡を残しましょう！',
    footerStatusSynced: '同期中',
    footerCopyright: '絵師駅',

  },

};



export default TRANSLATIONS;
