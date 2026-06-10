/**
 * seedAdmin.js
 * 建立測試用管理員帳號的 Seed Script
 *
 * 使用方式：
 *   node seedAdmin.js
 *
 * 此腳本會：
 * 1. 連接到 MongoDB Atlas
 * 2. 檢查是否已存在 admin 帳號
 * 3. 如果不存在，建立一個新的 admin 帳號
 * 4. 顯示建立結果
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// MongoDB 連線
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Admin 帳號設定
const ADMIN_CONFIG = {
  username: 'admin',
  email: 'admin@kimatu.com',
  password: 'admin123456', // 請在生產環境中修改為更強的密碼
  displayName: '系統管理員',
  role: 'admin',
  language: 'zh'
};

async function seedAdmin() {
  try {
    console.log('🔄 連接到 MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Atlas 連接成功');

    // 檢查是否已存在 admin 帳號
    console.log('🔍 檢查是否已存在 admin 帳號...');
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: ADMIN_CONFIG.email },
        { username: ADMIN_CONFIG.username }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin 帳號已存在：');
      console.log(`   - Username: ${existingAdmin.username}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      console.log('👋 不需要建立新的 admin 帳號');
      await mongoose.disconnect();
      return;
    }

    // 建立新的 admin 帳號
    console.log('📝 建立新的 admin 帳號...');
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    const newAdmin = new User({
      id: `usr_${uuidv4()}`,
      username: ADMIN_CONFIG.username.toLowerCase().trim(),
      email: ADMIN_CONFIG.email.toLowerCase().trim(),
      passwordHash,
      displayName: ADMIN_CONFIG.displayName.trim(),
      avatarUrl: '',
      role: ADMIN_CONFIG.role,
      language: ADMIN_CONFIG.language,
      createdAt: new Date()
    });

    await newAdmin.save();

    console.log('✅ Admin 帳號建立成功！');
    console.log('📋 帳號資訊：');
    console.log(`   - Username: ${newAdmin.username}`);
    console.log(`   - Email: ${newAdmin.email}`);
    console.log(`   - Password: ${ADMIN_CONFIG.password}`);
    console.log(`   - Role: ${newAdmin.role}`);
    console.log('');
    console.log('⚠️  請記住這些登入資訊，並在生產環境中修改密碼！');

    await mongoose.disconnect();
    console.log('👋 MongoDB 連線已關閉');

  } catch (err) {
    console.error('❌ Seed Admin 失敗:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 執行 seed
seedAdmin();
