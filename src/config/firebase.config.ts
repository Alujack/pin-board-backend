import admin from 'firebase-admin';
import type { Messaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = join(
    __dirname,
    '../firebase/pinterest-app-4c344-firebase-adminsdk-fbsvc-df010b3042.json',
);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: (serviceAccount as any).project_id,
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
