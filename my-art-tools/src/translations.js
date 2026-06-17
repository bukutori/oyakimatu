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

    onlineTravelers: '在線旅人',

    explore: '探索靈感',

    favorites: '我的收藏',

    sketch: '速寫練習',

    inspiration: '靈感抽籤',

    palette: '主題色票',
    noPalette: '無可用色票',
    copied: '已複製',
    toolbox: '工具箱',
    grayscale: '關閉色彩 - 明度模式',

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

    customReference: '自訂參考：',

    referenceSource: '參考圖源：',

    selectLocalImages: '選擇本地圖片 (支援複選批次練習)',

    orEnterUrl: '或輸入線上圖片 URL...',

    load: '載入',

    pause: '暫停',

    continue: '繼續',

    reset: '重設',

    nextImage: '下一張 (Skip)',

    clickToClose: '點擊背景或右上角 × 關閉',

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

    randomDrawingChallenge: ' 隨機繪畫挑戰',

    capturingMood: ' 正在捕捉共鳴意境...',

    moodResonance: '意境共鳴：',

    clickToSummon: '點擊下方按鈕，召喚你的創作靈感！',

    inspirationTransferring: '靈感傳送中...',

    clickToEnlarge: '點擊圖片放大查看',

    clickToDraw: '點擊下方按鈕，抽一張天馬行空的靈感圖片！',

    summonChallenge: ' 召喚隨機挑戰',

    drawingLottery: ' 抽籤中...',

    drawInspirationImage: ' 抽一張靈感圖',

    // 靈感圖庫

    inspirationGallery: '靈感圖庫',

    poses: '動作參考',

    landscapes: '奇幻風景',

    outfits: '角色穿搭',

    nature: '自然場景',

    urban: '都市建築',

    all: '全部',

    pinnedCanvas: '釘選對照畫布',

    multiCompare: ' 多圖對比',

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
    stationTitle: ' 時光驛站牆',
    stationDesc: '分享你的創作故事，與旅人們交流靈感',
    tabPublic: ' 旅人明信片',
    tabPending: '待審核驛站',
    btnOpenPostForm: '掛上我的明信片',
    createPostcard: '創作你的明信片',
    uploadImage: '上傳圖片',
    uploadHint: '點擊或拖曳圖片至此處上傳',
    uploadSupport: '支援 JPG、PNG、GIF、WebP（最大 10MB）',
    storyText: '故事文字',
    storyPlaceholder: '分享你的創作故事、旅程心得、或一句觸動你的話...',
    btnSubmitPost: '送出明信片',
    submitting: '上傳中...',
    cancel: '取消',
    pendingExplain: '以下為待審核明信片——圖片預設模糊，懸停可預覽。請仔細審核後再決定核准或婉拒。',
    myPendingCard: '明信片已送出，等待管理員審核！',
    pendingBadge: '待審核',
    hideComments: '隱藏留言',
    showComments: '查看留言',
    noComments: '還沒有留言，來當第一個留言的人吧！',
    commentPlaceholder: '寫下你的留言...',
    loginRequiredComment: '請先登入才能留言',
    send: '送出',
    btnApprove: '核准上線',
    approving: '核准中...',
    btnReject: '婉拒刪除',
    rejecting: '刪除中...',
    emptyPublic: '還沒有明信片，成為第一個分享者吧！',
    emptyPending: '沒有待審核的明信片，一切清空',
    delete: '刪除',
    pendingNoComment: '待審核的明信片無法留言',
    alertSizeLimit: '圖片檔案大小不能超過 10MB',
    alertLoginRequiredPost: '請先登入才能發布明信片',
    alertSelectImage: '請選擇圖片',
    alertTextRequired: '請填寫故事文字',
    alertUploadSuccess: '明信片已送出，等待管理員審核！',
    alertUploadFailed: '發布失敗，請稍後再試',
    alertNetworkFailed: '網路連線失敗，請稍後再試',
    alertApproveSuccess: '明信片已核准上線！',
    alertApproveFailed: '核准失敗，請稍後再試',
    confirmDelete: '確定要永久刪除這張明信片嗎？',
    alertDeleteSuccess: ' 明信片已刪除',
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

    // 通知系統
    notifications: '通知',
    markAllRead: '全部已讀',
    noNotifications: '目前沒有通知',
    notifApply: ' 新的明信片審核申請',
    notifApproved: ' 明信片已通過審核',
    notifComment: ' 新留言通知',
    justNow: '剛剛',
    minutesAgo: '分前',
    hoursAgo: '小時前',
    daysAgo: '天前',

    // 按讚功能
    like: '按讚',
    unlike: '取消按讚',
    likeCount: '個讚',
    alertLoginRequiredLike: '請先登入才能按讚 ',

    // 管理員設定與面板
    adminFeatures: '管理員功能',
    openAdminPanel: '開啟管理員面板',
    adminPanel: '管理員面板',
    noToken: ' 未提供認證 Token',
    pleaseLogin: '請先登入',
    userManagement: ' 用戶管理',
    messageManagement: ' 留言管理',
    allUsers: '所有用戶',
    allMessages: '所有留言',
    username: '用戶名稱',
    displayName: '顯示名稱',
    email: 'Email',
    role: '角色',
    userRole: '一般用戶',
    adminRole: '管理員',
    createdAt: '建立時間',
    noMessages: '尚無留言',
    deleteBtn: '刪除',
    confirmDeleteMessage: '確定要刪除這則留言嗎？',
    fetchUsersFailed: '載入用戶失敗',
    networkError: '網路錯誤: ',
    changeRoleFailed: '修改角色失敗',
    deleteMessageFailed: '刪除留言失敗',

    // 通知細節
    notifApplyDetail: '發布了一張新明信片，等待審核',
    notifApprovedDetail: '你的明信片已通過審核，已在驛站牆上展示！',
    notifCommentDetail: '在你的明信片上留了言',
    notifLikeDetail: '喜歡你的明信片',

    // 時間單位
    minutesUnit: '分',
    secondsUnit: '秒',

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

    onlineTravelers: 'オンライン旅人',

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

    customReference: ' カスタム参照：',

    referenceSource: ' 参照ソース：',

    selectLocalImages: 'ローカル画像を選択（複数選択可能）',

    orEnterUrl: 'またはオンライン画像URLを入力...',

    load: '読み込み',

    pause: '一時停止',

    continue: '続行',

    reset: 'リセット',

    nextImage: '次の画像 (Skip)',

    clickToClose: '背景または右上の × をクリックして閉じる',

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

    randomDrawingChallenge: ' ランダム絵画チャレンジ',

    capturingMood: ' 雰囲気をキャプチャ中...',

    moodResonance: '雰囲気共鳴：',

    clickToSummon: 'ボタンをクリックして創作インスピレーションを召喚！',

    inspirationTransferring: 'インスピレーション転送中...',

    clickToEnlarge: '画像をクリックして拡大表示',

    clickToDraw: 'ボタンをクリックして自由なインスピレーション画像を抽選！',

    summonChallenge: ' ランダムチャレンジ召喚',

    drawingLottery: ' 抽選中...',

    drawInspirationImage: ' インスピレーション画像を抽選',

    // 靈感圖庫

    inspirationGallery: 'インスピレーションギャラリー',

    poses: 'ポーズ参考',

    landscapes: 'ファンタジー風景',

    outfits: 'キャラクターコーディネート',

    nature: '自然風景',

    urban: '都市建築',

    all: 'すべて',

    pinnedCanvas: 'ピン留めキャンバス',

    multiCompare: ' 複数比較',

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
    stationTitle: ' 駅のメッセージボード',
    stationDesc: '創作ストーリーを共有し、旅人とインスピレーションを交流しましょう',
    tabPublic: ' 旅人の絵葉書',
    tabPending: '⏳ 承認待ち駅',
    btnOpenPostForm: ' 絵葉書を投稿する',
    createPostcard: ' 絵葉書を作成する',
    uploadImage: ' 画像アップロード',
    uploadHint: 'クリックまたは画像をドラッグしてアップロード',
    uploadSupport: 'JPG、PNG、GIF、WebPに対応（最大10MB）',
    storyText: ' ストーリーテキスト',
    storyPlaceholder: '創作の裏話、旅の感想、または心に響いた言葉を共有しましょう...',
    btnSubmitPost: ' 絵葉書を送る',
    submitting: '⏳ アップロード中...',
    cancel: 'キャンセル',
    pendingExplain: ' こちらは承認待ちの絵葉書です——画像はデフォルトでぼかしがかかっており、ホバーでプレビューできます。よくご確認の上、承認または却下を決定してください。',
    myPendingCard: '絵葉書は送信されました。管理者の承認をお待ちください！',
    pendingBadge: '承認待ち',
    hideComments: 'コメントを非表示',
    showComments: 'コメントを表示',
    noComments: 'コメントはまだありません。最初のコメントを書きましょう！',
    commentPlaceholder: 'コメントを書く...',
    loginRequiredComment: 'コメントを投稿するにはログインしてください',
    send: '送信',
    btnApprove: ' 承認する',
    approving: '承認中...',
    btnReject: ' 却下して削除',
    rejecting: '削除中...',
    emptyPublic: '絵葉書はまだありません。最初の共有者になりましょう！',
    emptyPending: '承認待ちの絵葉書はありません。すべて完了です ',
    delete: ' 削除',
    pendingNoComment: '⏳ 承認待ちの絵葉書にはコメントできません',
    alertSizeLimit: '画像のファイルサイズは10MBを超えられません',
    alertLoginRequiredPost: '絵葉書を投稿するにはログインしてください ',
    alertSelectImage: '画像を選択してください',
    alertTextRequired: 'ストーリーテキストを入力してください',
    alertUploadSuccess: '絵葉書は送信されました。管理者の承認をお待ちください！',
    alertUploadFailed: '投稿に失敗しました。後で再試行してください',
    alertNetworkFailed: 'ネットワーク接続に失敗しました。後で再試行してください',
    alertApproveSuccess: ' 絵葉書が承認されました！',
    alertApproveFailed: '承認に失敗しました。後で再試行してください',
    confirmDelete: 'この絵葉書を永久に削除してもよろしいですか？',
    alertDeleteSuccess: ' 絵葉書が削除されました',
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

    // 通知システム
    notifications: '通知',
    markAllRead: 'すべて既読',
    noNotifications: '現在通知はありません',
    notifApply: ' 新しい絵葉書の承認申請',
    notifApproved: ' 絵葉書が承認されました',
    notifComment: ' 新しいコメント',
    justNow: 'たった今',
    minutesAgo: '分前',
    hoursAgo: '時間前',
    daysAgo: '日前',

    // いいね機能
    like: 'いいね',
    unlike: 'いいね取消',
    likeCount: 'いいね',
    alertLoginRequiredLike: 'いいねするにはログインしてください ',

    // 管理者設定とパネル
    adminFeatures: '管理者機能',
    openAdminPanel: '管理者パネルを開く',
    adminPanel: '管理者パネル',
    noToken: ' トークンが提供されていません',
    pleaseLogin: 'ログインしてください',
    userManagement: ' ユーザー管理',
    messageManagement: ' コメント管理',
    allUsers: 'すべてのユーザー',
    allMessages: 'すべてのコメント',
    username: 'ユーザー名',
    displayName: '表示名',
    email: 'メールアドレス',
    role: 'ロール',
    userRole: '一般ユーザー',
    adminRole: '管理者',
    createdAt: '作成日時',
    noMessages: 'コメントはまだありません',
    deleteBtn: '削除',
    confirmDeleteMessage: 'このコメントを削除してもよろしいですか？',
    fetchUsersFailed: 'ユーザーの読み込みに失敗しました',
    networkError: 'ネットワークエラー: ',
    changeRoleFailed: 'ロールの変更に失敗しました',
    deleteMessageFailed: 'コメントの削除に失敗しました',

    // 通知詳細
    notifApplyDetail: 'が新しい絵葉書を投稿しました。承認待ちです',
    notifApprovedDetail: 'あなたの絵葉書が承認され、掲示板に表示されました！',
    notifCommentDetail: 'があなたの絵葉書にコメントしました',
    notifLikeDetail: 'があなたの絵葉書にいいねしました',

    // 時間単位
    minutesUnit: '分',
    secondsUnit: '秒',

  },

  en: {

    // 導覽列與設定

    settings: 'Settings',

    timeAwareBackground: 'Time-Aware Background',

    timeAwareBackgroundDesc: 'Automatically toggle day/night mode based on time',

    timeRules: 'Time Rules:',

    dayMode: 'Day Mode: 06:00 - 18:00 (Light Background)',

    nightMode: 'Night Mode: 18:00 - 06:00 (Dark Background)',

    note: 'Note:',

    autoModeNote: 'When enabled, manual dark mode toggle is disabled.',

    language: 'Language',

    login: 'Log In',

    register: 'Register',

    logout: 'Log Out',

    onlineTravelers: 'Online Travelers',

    explore: 'Explore Inspiration',

    favorites: 'My Favorites',

    sketch: 'Sketch Practice',

    inspiration: 'Inspiration Draw',

    palette: 'Color Palette',

    station: 'Message Board',

    admin: 'Admin',

    mySite: 'My Site',

    autoTimeModeEnabled: 'Auto-time mode enabled',

    toggleDarkMode: 'Toggle Dark/Light Mode',

    // 速寫計時牆

    sketchTimerWall: 'Sketch Timer',

    randomGallery: 'Random Gallery',

    customImages: 'Custom Images',

    secondsSketch: 'Seconds Sketch',

    minutesSketch: 'Minutes Sketch',

    customSeconds: 'Custom Seconds',

    set: 'Set',

    timing: 'Timing',

    paused: 'Paused',

    noCustomImages: 'No custom images loaded',

    uploadOrPaste: 'Upload local images or paste URL below',

    canvasPreparing: 'Preparing canvas...',

    loadImageError: 'Failed to load reference image, please retry.',

    retry: 'Retry',

    toggleFitMode: 'Toggle crop-fill or full display',

    fill: 'Fill',

    full: 'Full',

    unfavorite: 'Remove Favorite',

    favorite: 'Add to Favorites',

    customReference: ' Custom Reference:',

    referenceSource: ' Reference Source:',

    selectLocalImages: 'Select local images (supports multiple selection for batch practice)',

    orEnterUrl: 'Or enter online image URL...',

    load: 'Load',

    pause: 'Pause',

    continue: 'Continue',

    reset: 'Reset',

    nextImage: 'Next Image (Skip)',

    clickToClose: 'Click background or × to close',

    // 主題調色盤

    themePalette: 'Theme Palette',

    clickToCopy: 'Click a color bar to copy its hex code',

    clickToChange: 'Click button again to get a new color scheme',

    harmoniousPalette: 'Harmonious Palette',

    randomPalette: 'Random Palette',

    colorCopied: 'Copied code:',

    // 靈感抽籤機

    inspirationLottery: 'Inspiration Draw',

    textChallenge: 'Text Challenge',

    imageChallenge: 'Image Challenge',

    randomDrawingChallenge: ' Random Drawing Challenge',

    capturingMood: ' Capturing vibe...',

    moodResonance: 'Vibe resonance:',

    clickToSummon: 'Click the button below to summon drawing inspiration!',

    inspirationTransferring: 'Transferring inspiration...',

    clickToEnlarge: 'Click image to enlarge',

    clickToDraw: 'Click button below to draw a random inspiration image!',

    summonChallenge: ' Summon Random Challenge',

    drawingLottery: ' Drawing...',

    drawInspirationImage: ' Draw Inspiration Image',

    // 靈感圖庫

    inspirationGallery: 'Inspiration Gallery',

    poses: 'Action References',

    landscapes: 'Fantasy Landscapes',

    outfits: 'Character Outfits',

    nature: 'Nature Scenes',

    urban: 'Urban Buildings',

    all: 'All',

    pinnedCanvas: 'Pinned Reference Canvas',

    multiCompare: ' Compare Images',

    clear: 'Clear',

    loadFailed: 'Failed to load image, please check connection.',

    inspirationLoading: 'Loading inspiration...',

    loadingMore: 'Loading... Please wait a moment',

    loadMore: 'Load More Inspiration',

    cancelFavorite: 'Remove Favorite',

    addFavorite: 'Add Favorite',

    cancelPin: 'Unpin',

    pinToCanvas: 'Pin to Canvas',

    pinLimit: 'The pinned reference canvas can only hold up to 6 images!',

    // 其他

    copy: 'Copy',

    // 時光驛站牆 & 頁尾
    stationTitle: ' Message Board',
    stationDesc: 'Share your creative stories and exchange inspiration with other travelers',
    tabPublic: ' Travelers\' Postcards',
    tabPending: '⏳ Pending Postcards',
    btnOpenPostForm: ' Post My Postcard',
    createPostcard: ' Create Your Postcard',
    uploadImage: ' Upload Image',
    uploadHint: 'Click or drag image here to upload',
    uploadSupport: 'Supports JPG, PNG, GIF, WebP (Max 10MB)',
    storyText: ' Story Text',
    storyPlaceholder: 'Share your story, journey notes, or quotes that touched you...',
    btnSubmitPost: ' Send Postcard',
    submitting: '⏳ Uploading...',
    cancel: 'Cancel',
    pendingExplain: ' Below are pending postcards - images are blurred by default, hover to preview. Review carefully before approving or rejecting.',
    myPendingCard: 'Postcard submitted, waiting for admin approval!',
    pendingBadge: 'Pending',
    hideComments: 'Hide Comments',
    showComments: 'View Comments',
    noComments: 'No comments yet. Be the first to leave one!',
    commentPlaceholder: 'Write a comment...',
    loginRequiredComment: 'Please log in to leave a comment',
    send: 'Send',
    btnApprove: ' Approve',
    approving: 'Approving...',
    btnReject: ' Reject & Delete',
    rejecting: 'Deleting...',
    emptyPublic: 'No postcards yet. Be the first to share!',
    emptyPending: 'No pending postcards. All clear! ',
    delete: ' Delete',
    pendingNoComment: '⏳ Cannot comment on pending postcards',
    alertSizeLimit: 'Image size cannot exceed 10MB',
    alertLoginRequiredPost: 'Please log in to publish a postcard ',
    alertSelectImage: 'Please select an image',
    alertTextRequired: 'Please enter story text',
    alertUploadSuccess: 'Postcard submitted, waiting for admin approval!',
    alertUploadFailed: 'Submission failed, please try again later',
    alertNetworkFailed: 'Network connection failed, please try again later',
    alertApproveSuccess: ' Postcard approved!',
    alertApproveFailed: 'Approval failed, please try again later',
    confirmDelete: 'Are you sure you want to permanently delete this postcard?',
    alertDeleteSuccess: ' Postcard deleted',
    alertDeleteFailed: 'Deletion failed, please try again later',
    alertLoginRequiredComment: 'Please log in to leave a comment',
    alertCommentSuccess: 'Commented successfully!',
    alertCommentFailed: 'Comment failed',
    alertNetworkError: 'Network error, please try again later',
    alertTextOrImageRequired: 'Please upload an image or fill in the story text',
    alertUploadSuccessAdmin: 'Postcard published successfully!',
    footerAbout: 'About Painter\'s Station',
    footerAboutDesc: 'A digital toolbox tailored for artists. Providing random drawing inspiration, curated color schemes, and sketch timing features to accompany your daily creation.',
    footerQuickLinks: 'Quick Links',
    footerMySite: 'My Personal Site',
    footerStatus: 'Station Connection Status',
    footerStatusDesc: 'Cloud database (MongoDB) connected. Welcome to the discussion board to leave your creative footprint!',
    footerStatusSynced: 'Synchronizing globally',
    footerCopyright: 'Painter\'s Station',

    // 通知系統
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
    notifApply: ' New postcard approval request',
    notifApproved: ' Postcard approved',
    notifComment: ' New comment notification',
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',

    // いいね機能
    like: 'Like',
    unlike: 'Unlike',
    likeCount: 'Likes',
    alertLoginRequiredLike: 'Please log in to like ',

    // Admin Settings and Panel
    adminFeatures: 'Admin Features',
    openAdminPanel: 'Open Admin Panel',
    adminPanel: 'Admin Panel',
    noToken: ' Authentication Token not provided',
    pleaseLogin: 'Please log in',
    userManagement: ' User Management',
    messageManagement: ' Message Management',
    allUsers: 'All Users',
    allMessages: 'All Messages',
    username: 'Username',
    displayName: 'Display Name',
    email: 'Email',
    role: 'Role',
    userRole: 'User',
    adminRole: 'Admin',
    createdAt: 'Created At',
    noMessages: 'No messages yet',
    deleteBtn: 'Delete',
    confirmDeleteMessage: 'Are you sure you want to delete this message?',
    fetchUsersFailed: 'Failed to load users',
    networkError: 'Network Error: ',
    changeRoleFailed: 'Failed to modify role',
    deleteMessageFailed: 'Failed to delete message',

    // Notification Details
    notifApplyDetail: 'submitted a new postcard for approval',
    notifApprovedDetail: 'Your postcard has been approved and is now displayed on the board!',
    notifCommentDetail: 'commented on your postcard',
    notifLikeDetail: 'liked your postcard',

    // Time Units
    minutesUnit: 'min',
    secondsUnit: 'sec',

  },

};



export default TRANSLATIONS;
