/**
 * images.js
 * 圖片 API 路由 - 串接 Unsplash API（含快取機制）
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// ── 記憶體快取機制 ─────────────────────────────────────
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時快取時間（毫秒）
const imageCache = new Map(); // 格式: Map<cacheKey, { data, timestamp }>

// 產生快取鍵值
function getCacheKey(category, page, perPage) {
  return `${category}_${page}_${perPage}`;
}

// 檢查快取是否有效
function isCacheValid(cacheEntry) {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

// 清理過期快取
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of imageCache.entries()) {
    if (now - entry.timestamp >= CACHE_DURATION) {
      imageCache.delete(key);
    }
  }
}

// 每 10 分鐘清理一次過期快取
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// ── 分類關鍵字對應表 (中文 -> 英文) ─────────────────────
const CATEGORY_MAPPING = {
 // 核心單字：日常人像、生活風格、自然街拍、動作姿態
  '動作參考': ['candid-photography lifestyle-people casual-street-photo'],
  '奇幻風景': ['fantasy landscape', 'concept art'],
  '角色穿搭': ['fashion outfit', 'costume design'],
  '自然場景': ['nature', 'scenery', 'forest'],
  '都市建築': ['urban', 'architecture', 'cyberpunk'],
  '全部': ['art', 'illustration']
};

// ── 參數驗證函數 ─────────────────────────────────────
function validateParams(params) {
  const { category, per_page, page } = params;
  
  // 驗證 category
  if (!category || typeof category !== 'string') {
    return { valid: false, error: 'category 參數必須是字串' };
  }
  
  // 驗證 per_page
  const perPageNum = parseInt(per_page);
  if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 30) {
    return { valid: false, error: 'per_page 參數必須是 1-30 之間的數字' };
  }
  
  // 驗證 page
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, error: 'page 參數必須是大於 0 的數字' };
  }
  
  return { valid: true, perPageNum, pageNum };
}

// ── GET /api/images ─────────────────────────────────────
// 參數: category (分類名稱), per_page (每頁數量), page (頁碼)
router.get('/', async (req, res) => {
  try {
    const { category = '全部', per_page = 12, page = 1 } = req.query;

    console.log(`[GET /api/images] Received request: category=${category}, per_page=${per_page}, page=${page}`);

    // 取得 Unsplash API Key
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!UNSPLASH_ACCESS_KEY) {
      console.error('[GET /api/images] Missing UNSPLASH_ACCESS_KEY in .env');
      return res.status(500).json({ 
        success: false, 
        message: '伺服器設定錯誤：缺少 Unsplash API Key' 
      });
    }

    console.log(`[GET /api/images] Access Key found: ${UNSPLASH_ACCESS_KEY.substring(0, 10)}...`);

    // 參數驗證
    const validation = validateParams({ category, per_page, page });
    if (!validation.valid) {
      console.error(`[GET /api/images] Parameter validation failed: ${validation.error}`);
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }

    const { perPageNum, pageNum } = validation;

    // 產生快取鍵值
    const cacheKey = getCacheKey(category, pageNum, perPageNum);

    // 檢查快取
    const cachedData = imageCache.get(cacheKey);
    if (cachedData && isCacheValid(cachedData)) {
      console.log(`[GET /api/images] Cache hit for ${cacheKey}`);
      return res.json(cachedData.data);
    }

    // 取得對應的英文關鍵字
    const keywords = CATEGORY_MAPPING[category] || CATEGORY_MAPPING['全部'];
    const query = keywords.join(',');

    console.log(`[GET /api/images] Fetching from Unsplash: category=${category}, query=${query}, page=${pageNum}, per_page=${perPageNum}`);

    // 準備 Unsplash API 參數
    const unsplashParams = {
      query: query,
      per_page: perPageNum,
      page: pageNum,
    };

    console.log(`[GET /api/images] Unsplash params:`, JSON.stringify(unsplashParams, null, 2));

    // 呼叫 Unsplash API
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: unsplashParams,
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    console.log(`[GET /api/images] Unsplash response status: ${response.status}`);
    console.log(`[GET /api/images] Unsplash total results: ${response.data.total}`);

    // 轉換資料格式以符合前端需求
    const images = response.data.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      title: photo.alt_description || photo.description || '無標題',
      author: photo.user.name,
      category: category,
      width: photo.width,
      height: photo.height,
    }));

    const responseData = {
      success: true,
      images,
      total: response.data.total,
      page: pageNum,
      per_page: perPageNum,
    };

    // 存入快取
    imageCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    console.log(`[GET /api/images] Cached ${cacheKey} (total cache entries: ${imageCache.size})`);

    res.json(responseData);

  } catch (error) {
    console.error('[GET /api/images] Error occurred:', error.message);
    console.error('[GET /api/images] Error stack:', error.stack);
    
    if (error.response) {
      // Unsplash API 回傳錯誤
      console.error('[GET /api/images] Unsplash 拒絕原因:', JSON.stringify(error.response.data, null, 2));
      console.error('[GET /api/images] Unsplash status code:', error.response.status);
      console.error('[GET /api/images] Unsplash headers:', JSON.stringify(error.response.headers, null, 2));
      
      return res.status(error.response.status).json({
        success: false,
        message: `Unsplash API 錯誤 (${error.response.status}): ${error.response.data?.errors?.[0] || JSON.stringify(error.response.data)}`,
        details: error.response.data,
      });
    }

    if (error.request) {
      console.error('[GET /api/images] Request made but no response received:', error.request);
      return res.status(500).json({ 
        success: false, 
        message: '無法連接到 Unsplash API' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: '伺服器錯誤，無法取得圖片',
      error: error.message 
    });
  }
});

// ── GET /api/images/cache/stats ─────────────────────────
// 取得快取統計資訊（除錯用）
router.get('/cache/stats', (req, res) => {
  const stats = {
    totalEntries: imageCache.size,
    entries: Array.from(imageCache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      isValid: isCacheValid(entry),
    })),
  };
  res.json(stats);
});

module.exports = router;
