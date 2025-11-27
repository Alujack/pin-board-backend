import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { pinModel } from '../src/models/pin.model.js';
import { userModel } from '../src/models/user.model.js';
import { commentModel } from '../src/models/comment.model.js';
import { pinLikeModel } from '../src/models/pin-like.model.js';
import { boardModel } from '../src/models/board.model.js';

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URI || '';

async function verifyDatabase() {
    console.log('🔍 Database Verification Script');
    console.log('================================\n');

    try {
        // Connect to database
        console.log('📡 Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.name);
        console.log('');

        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📦 Collections in database:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        console.log('');

        // Count documents
        console.log('📊 Document Counts:');
        const userCount = await userModel.countDocuments();
        const pinCount = await pinModel.countDocuments();
        const commentCount = await commentModel.countDocuments();
        const likeCount = await pinLikeModel.countDocuments();
        const boardCount = await boardModel.countDocuments();

        console.log(`   Users: ${userCount}`);
        console.log(`   Pins: ${pinCount}`);
        console.log(`   Comments: ${commentCount}`);
        console.log(`   Likes: ${likeCount}`);
        console.log(`   Boards: ${boardCount}`);
        console.log('');

        // Check specific pin from your logs
        const testPinId = '68eb10063edcc8eb591d248c';
        console.log(`🔍 Checking test pin: ${testPinId}`);
        const testPin = await pinModel.findById(testPinId);
        if (testPin) {
            console.log('✅ Pin exists!');
            console.log(`   Title: ${testPin.title}`);
            console.log(`   User: ${testPin.user}`);
        } else {
            console.log('❌ Pin NOT found in database!');
            console.log('   This would cause 500 errors when trying to like/comment');
        }
        console.log('');

        // Check user from token
        const testUserId = '68e27790 51f65cdb7ac9a58f';
        console.log(`🔍 Checking test user: ${testUserId}`);
        const testUser = await userModel.findById(testUserId);
        if (testUser) {
            console.log('✅ User exists!');
            console.log(`   Username: ${testUser.username}`);
            console.log(`   Email: ${testUser.email}`);
        } else {
            console.log('❌ User NOT found!');
            console.log('   This would cause authentication errors');
        }
        console.log('');

        // List some pins
        console.log('📌 Sample Pins (first 5):');
        const samplePins = await pinModel.find().limit(5).select('_id title user');
        if (samplePins.length > 0) {
            samplePins.forEach(pin => {
                console.log(`   ${pin._id} - "${pin.title}" by ${pin.user}`);
            });
        } else {
            console.log('   ⚠️  No pins found! Create some pins first.');
        }
        console.log('');

        // List some users
        console.log('👥 Sample Users (first 5):');
        const sampleUsers = await userModel.find().limit(5).select('_id username email');
        if (sampleUsers.length > 0) {
            sampleUsers.forEach(user => {
                console.log(`   ${user._id} - ${user.username} (${user.email})`);
            });
        } else {
            console.log('   ⚠️  No users found! Register some users first.');
        }
        console.log('');

        // Check indexes
        console.log('🔑 Checking Indexes:');
        const pinIndexes = await pinModel.collection.getIndexes();
        console.log('   Pin indexes:', Object.keys(pinIndexes).join(', '));
        
        const userIndexes = await userModel.collection.getIndexes();
        console.log('   User indexes:', Object.keys(userIndexes).join(', '));
        console.log('');

        // Summary
        console.log('📋 Summary:');
        if (userCount === 0) {
            console.log('   ❌ No users - Register a user first!');
        }
        if (pinCount === 0) {
            console.log('   ❌ No pins - Create some pins first!');
        }
        if (userCount > 0 && pinCount > 0) {
            console.log('   ✅ Database has data and looks good!');
            if (!testPin) {
                console.log('   ⚠️  But the specific pin from your logs doesn\'t exist');
                console.log('   💡 Use a valid pin ID from the list above');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

verifyDatabase();

