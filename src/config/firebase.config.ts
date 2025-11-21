import admin from 'firebase-admin';
import type { Messaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Initialize Firebase Admin SDK
let credential: admin.credential.Credential;
let projectId: string | undefined;

if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
) {
    credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    projectId = process.env.FIREBASE_PROJECT_ID;
} else {
    const serviceAccountPath = join(
        process.cwd(),
        'src/firebase/pinterest-app-4c344-firebase-adminsdk-fbsvc-df010b3042.json',
    );
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    projectId = (serviceAccount as any).project_id;
}

try {
    admin.initializeApp({
        credential,
        projectId,
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error: any) {
    if (error.code === 'app/duplicate-app') {
        console.log('⚠️ Firebase Admin SDK already initialized');
    } else {
        console.error('❌ Error initializing Firebase Admin SDK:', error);
        throw error;
    }
}

export const firebaseAdmin = admin;
export const messaging: Messaging = admin.messaging();
