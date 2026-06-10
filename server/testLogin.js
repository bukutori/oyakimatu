/**
 * testLogin.js
 * 測試登入 API
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function testLogin() {
  try {
    console.log('🔄 連接到 MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas 連接成功');

    console.log('🔍 查找 admin 帳號...');
    const admin = await User.findOne({ email: 'admin@kimatu.com' });

    if (!admin) {
      console.log('❌ 找不到 admin 帳號');
      return;
    }

    console.log('✅ 找到 admin 帳號');
    console.log('🔐 測試密碼比對...');
    
    const testPassword = 'admin123456';
    const isMatch = await bcrypt.compare(testPassword, admin.passwordHash);
    
    console.log(`   - 測試密碼: ${testPassword}`);
    console.log(`   - 密碼比對結果: ${isMatch ? '✅ 成功' : '❌ 失敗'}`);

    await mongoose.disconnect();
    console.log('👋 MongoDB 連線已關閉');
  } catch (err) {
    console.error('❌ 測試失敗:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testLogin();
