/**
 * promote-admin.js — CLI Utility to promote any user to the Admin role
 * Usage: node promote-admin.js <username_or_email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const usernameOrEmail = process.argv[2];

if (!usernameOrEmail) {
  console.log('\x1b[31m%s\x1b[0m', '❌ Error: Please provide a username or email address.');
  console.log('Usage: node promote-admin.js <username_or_email>');
  process.exit(1);
}

const promote = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from environment (.env file).');
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail.trim() },
        { email: usernameOrEmail.trim().toLowerCase() }
      ]
    });

    if (!user) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Error: User "${usernameOrEmail}" not found.`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log('\x1b[33m%s\x1b[0m', `ℹ️ Info: User "${user.username}" is already an Admin.`);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log('\x1b[32m%s\x1b[0m', `🎉 Success! User "${user.username}" has been successfully promoted to ADMIN.`);
    console.log('You can now log in to the dashboard with this account and access the Admin Dashboard features.');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Promotion failed: ${error.message}`);
    process.exit(1);
  }
};

promote();
