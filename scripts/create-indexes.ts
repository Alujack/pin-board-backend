import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { pinModel } from '../src/models/pin.model.js';
import { userModel } from '../src/models/user.model.js';
import { commentModel } from '../src/models/comment.model.js';
import { pinLikeModel } from '../src/models/pin-like.model.js';
import { boardModel } from '../src/models/board.model.js';
import { followModel } from '../src/models/follow.model.js';
import { notificationModel } from '../src/models/notification.model.js';

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URI || '';

async function createIndexes() {
    console.log('🔧 Creating Database Indexes');
    console.log('============================\n');

    try {
        console.log('📡 Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        console.log('Creating indexes...');

        // Create indexes for all models
        await Promise.all([
            pinModel.createIndexes(),
            userModel.createIndexes(),
            commentModel.createIndexes(),
            pinLikeModel.createIndexes(),
            boardModel.createIndexes(),
            followModel.createIndexes(),
            notificationModel.createIndexes(),
        ]);

        console.log('✅ All indexes created successfully!\n');

        // Verify indexes
        console.log('📋 Verifying indexes:');
        const models = [
            { name: 'Pin', model: pinModel },
            { name: 'User', model: userModel },
            { name: 'Comment', model: commentModel },
            { name: 'PinLike', model: pinLikeModel },
            { name: 'Board', model: boardModel },
            { name: 'Follow', model: followModel },
            { name: 'Notification', model: notificationModel },
        ];

        for (const { name, model } of models) {
            const indexes = await model.collection.getIndexes();
            console.log(`   ${name}: ${Object.keys(indexes).length} indexes`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createIndexes();

