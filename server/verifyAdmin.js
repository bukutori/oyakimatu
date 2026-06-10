/**
 * verifyAdmin.js
 * 驗證 Admin 帳號是否存在於 MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyAdmin() {
  try {
    console.log('🔄 連接到 MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas 連接成功');

    console.log('🔍 查找 admin 帳號...');
    const admin = await User.findOne({ email: 'admin@kimatu.com' });

    if (admin) {
      console.log('✅ 找到 admin 帳號：');
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - PasswordHash exists: ${!!admin.passwordHash}`);
      console.log(`   - PasswordHash length: ${admin.passwordHash?.length}`);
    } else {
      console.log('❌ 找不到 admin 帳號');
    }

    await mongoose.disconnect();
    console.log('👋 MongoDB 連線已關閉');
  } catch (err) {
    console.error('❌ 驗證失敗:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyAdmin();
