/**
 * config/cloudinary.js
 * Cloudinary 雲端圖片儲存設定
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary 設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage 設定
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'station-wall', // Cloudinary 資料夾名稱
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req, file) => {
      // 生成唯一的檔案名稱
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `post-${timestamp}-${randomString}`;
    },
  },
});

module.exports = {
  cloudinary,
  storage,
};
