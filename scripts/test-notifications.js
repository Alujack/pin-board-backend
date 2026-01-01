/**
 * Test script to verify notifications are working
 * Run with: node scripts/test-notifications.js
 */

import mongoose from 'mongoose';
import { notificationModel } from '../src/models/notification.model.js';
import { userModel } from '../src/models/user.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinterest-clone';

async function testNotifications() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await userModel.find().select('username _id').limit(5);
    console.log('\n📋 Found users:');
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user._id})`);
    });

    // Get all notifications
    const allNotifications = await notificationModel.find().populate('user', 'username').populate('from_user', 'username').limit(10);
    console.log('\n📬 All notifications in database:');
    if (allNotifications.length === 0) {
      console.log('  ⚠️ No notifications found in database!');
    } else {
      allNotifications.forEach((notif, index) => {
        const user = typeof notif.user === 'object' ? notif.user.username : 'Unknown';
        const fromUser = notif.from_user && typeof notif.from_user === 'object' ? notif.from_user.username : 'Unknown';
        console.log(`  ${index + 1}. [${notif.type}] ${notif.content}`);
        console.log(`     User: ${user}, From: ${fromUser}, Read: ${notif.is_read}`);
        console.log(`     Created: ${notif.created_at}`);
      });
    }

    // Check notifications for each user
    console.log('\n👤 Notifications per user:');
    for (const user of users) {
      const userNotifications = await notificationModel
        .find({ user: user._id })
        .populate('from_user', 'username')
        .sort({ created_at: -1 })
        .limit(5);
      
      console.log(`\n  ${user.username} (${user._id}):`);
      if (userNotifications.length === 0) {
        console.log('    ⚠️ No notifications');
      } else {
        userNotifications.forEach(notif => {
          const fromUser = notif.from_user && typeof notif.from_user === 'object' ? notif.from_user.username : 'Unknown';
          console.log(`    - [${notif.type}] ${notif.content} (From: ${fromUser})`);
        });
      }
    }

    // Check FCM tokens
    console.log('\n📱 FCM Token Status:');
    for (const user of users) {
      const fullUser = await userModel.findById(user._id).select('username fcm_token');
      if (fullUser.fcm_token) {
        console.log(`  ✅ ${fullUser.username}: Has FCM token (${fullUser.fcm_token.substring(0, 20)}...)`);
      } else {
        console.log(`  ❌ ${fullUser.username}: No FCM token`);
      }
    }

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNotifications();

