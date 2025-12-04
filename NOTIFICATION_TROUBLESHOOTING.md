# 🔧 Notification Troubleshooting Guide

## Problem: Notifications not showing up in the app

Your Firebase setup is complete, but notifications aren't appearing. Here's how to diagnose and fix the issue.

## ❌ You DON'T Need Firebase Campaigns

**Important:** You do NOT need to create campaigns in Firebase Dashboard. Campaigns are for marketing/promotional messages. Your app uses FCM programmatically via the Firebase Admin SDK, which is already configured correctly.

## 🔍 Step-by-Step Debugging

### Step 1: Verify Backend Server is Running

```bash
cd /opt/school-project/board/pin-board-backend
yarn dev
# or
npm run dev
```

Check console output for:

- `✅ Firebase Admin SDK initialized successfully`
- `✅ Database connected successfully`
- Server running on port (usually 3000)

### Step 2: Check if FCM Token is Registered

#### Test 1: Login and check mobile app logs

After logging in, check Android Logcat for:

```
D/FCMTokenManager: FCM Token: dXJi... (your token)
D/FCMTokenManager: FCM token registered successfully
```

If you see `Failed to register FCM token`, the backend isn't receiving it properly.

#### Test 2: Verify token in database

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use pinterest-app

# Check if user has FCM token
db.users.findOne({ username: "your_username" }, { fcm_token: 1, username: 1 })
```

**Expected Output:**

```json
{
  "_id": ObjectId("..."),
  "username": "your_username",
  "fcm_token": "dXJi..." // Should have a token here
}
```

**If `fcm_token` is null or missing**, the token registration failed.

### Step 3: Test Notification Creation

#### Manually trigger a pin save notification

1. **User A** creates a pin (or use existing pin)
2. **User B** saves User A's pin:

```bash
# Get User B's auth token after login
# Then save a pin
curl -X POST http://YOUR_IP:3000/api/pins/{PIN_ID}/save \
  -H "Authorization: Bearer USER_B_TOKEN"
```

3. **Check backend logs** immediately after:

Look for these messages:

```
✅ Successfully sent push notification: projects/...
```

Or error messages:

```
❌ Error sending push notification: ...
⚠️ User has no FCM token, notification saved to DB only
```

### Step 4: Verify Notification Database Records

```bash
mongosh
use pinterest-app

# Check if notifications are being created
db.notifications.find({ user: ObjectId("USER_A_ID") }).sort({ created_at: -1 }).limit(5)
```

**Expected Output:**

```json
{
  "_id": ObjectId("..."),
  "user": ObjectId("..."),
  "type": "PIN_SAVED",
  "content": "john_doe saved your pin \"Beautiful Sunset\"",
  "is_read": false,
  "metadata": {
    "pinId": "...",
    "type": "pin_saved",
    "navigateTo": "/pins/..."
  },
  "created_at": ISODate("2025-11-29...")
}
```

### Step 5: Test Get Notifications API

```bash
curl -X GET "http://YOUR_IP:3000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [...], // Array of notifications
  "pagination": {...}
}
```

**If empty array but DB has notifications**, there's an auth/userId mismatch.

## 🐛 Common Issues and Solutions

### Issue 1: FCM Token Not Registering

**Symptoms:**

- Logcat shows: "Failed to register FCM token"
- Database shows `fcm_token: null`

**Solutions:**

1. **Check network connectivity** between mobile app and backend
2. **Verify API endpoint** is correct in mobile app:

Check `NotificationApi.kt`:

```kotlin
@POST("api/notifications/register-token")
suspend fun registerFCMToken(
    @Body body: Map<String, String>
): Response<ApiResponse<Unit>>
```

Make sure base URL is correct (e.g., `http://192.168.1.100:3000/`)

3. **Check if user is logged in** when FCM initialization happens:

The app calls `FCMTokenManager.initializeFCM()` in `App.kt` onCreate, but token registration needs authentication.

**Fix:** Ensure FCM token registration happens AFTER login.

In your login screen ViewModel or Activity:

```kotlin
// After successful login
fcmTokenManager.initializeFCM()
```

### Issue 2: Notifications Created in DB But No Push Received

**Symptoms:**

- Database has notification records
- Backend logs: `ℹ️ User has no FCM token, notification saved to DB only`
- No push notification on device

**Solutions:**

1. **User doesn't have FCM token registered** - See Issue 1

2. **Invalid or expired FCM token:**

Backend logs will show:

```
❌ Error sending push notification: messaging/invalid-registration-token
⚠️ Invalid FCM token detected
```

**Fix:**

- Delete token from database
- Restart mobile app
- Re-login to trigger new token registration

```bash
mongosh
use pinterest-app
db.users.updateOne({ _id: ObjectId("USER_ID") }, { $set: { fcm_token: null } })
```

3. **Firebase Admin SDK credentials issue:**

Check `src/firebase/pinterest-app-4c344-firebase-adminsdk-fbsvc-df010b3042.json` exists

Or environment variables:

```bash
FIREBASE_PROJECT_ID=pinterest-app-4c344
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### Issue 3: Push Received But Not Displayed

**Symptoms:**

- Backend logs: `✅ Successfully sent push notification`
- No notification visible on device

**Solutions:**

1. **Check notification permissions:**

In Android Settings → Apps → PinBoard → Notifications → Ensure enabled

2. **Check notification channel:**

In `PinBoardMessagingService.kt`, verify notification channel is created:

```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    val channel = NotificationChannel(
        CHANNEL_ID,
        "PinBoard Notifications",
        NotificationManager.IMPORTANCE_HIGH // Must be HIGH or DEFAULT
    )
    notificationManager.createNotificationChannel(channel)
}
```

3. **App in foreground vs background:**

- **Foreground**: `onMessageReceived()` should show notification manually
- **Background**: System automatically shows notification

Check `PinBoardMessagingService.kt` logs:

```kotlin
override fun onMessageReceived(message: RemoteMessage) {
    Log.d("PinBoardMessaging", "Notification received: ${message.notification}")
    // ...
}
```

### Issue 4: Notifications API Returns Empty Array

**Symptoms:**

- GET /notifications returns `{ data: [], pagination: { total: 0 } }`
- But database has notification records

**Solutions:**

1. **UserId mismatch:**

The API filters by `context.user._id`. Verify the logged-in user ID matches the notification's user field.

```bash
# Check auth token payload
# Decode JWT at jwt.io

# Check notifications
db.notifications.find({ user: ObjectId("THE_ID_FROM_JWT") })
```

2. **Notifications belong to different user:**

You might be testing with:

- User A creates pin
- User B saves pin → User A gets notification
- But you're checking notifications on User B's account

**Fix:** Check notifications on User A's account (pin owner)

### Issue 5: FCM Token Registration Timing Issue

**Symptoms:**

- Token logs show success, but notifications still don't work
- Works after app restart

**Solution:**

The app initializes FCM in `App.onCreate()` before user logs in. The token registration requires authentication.

**Fix in mobile app:**

1. Remove FCM initialization from `App.kt`:

```kotlin
// REMOVE THIS from App.kt onCreate()
// fcmTokenManager.initializeFCM()
```

2. Add to your MainActivity or Login flow:

```kotlin
// In your MainActivity after checking if user is logged in
// Or in LoginViewModel after successful login
class MainActivity : ComponentActivity() {
    @Inject lateinit var fcmTokenManager: FCMTokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if user is logged in
        if (isUserLoggedIn()) {
            fcmTokenManager.initializeFCM()
        }
    }
}
```

Or use a proper auth state observer with your auth system.

## ✅ Complete Testing Checklist

Follow this checklist to verify everything works:

- [ ] Backend server is running
- [ ] Firebase Admin SDK initialized (check logs: `✅ Firebase Admin SDK initialized successfully`)
- [ ] User logged in on mobile app
- [ ] FCM token obtained (check Logcat: `FCM Token: ...`)
- [ ] FCM token registered with backend (check Logcat: `FCM token registered successfully`)
- [ ] FCM token exists in database (verify with mongosh)
- [ ] Create test scenario:
  - [ ] User A creates a pin
  - [ ] User B (different account) saves User A's pin
  - [ ] Backend logs show: `✅ Successfully sent push notification`
  - [ ] User A receives push notification on device
  - [ ] Notification appears in Android notification tray
  - [ ] Tap notification opens app
- [ ] Check notifications screen in app:
  - [ ] GET /notifications API returns notification records
  - [ ] Notifications displayed in UI
  - [ ] Can mark as read
- [ ] Test on different network (WiFi vs mobile data)
- [ ] Test app in foreground and background

## 🔧 Quick Debug Script

Save this as a bash script to quickly test the notification flow:

```bash
#!/bin/bash

# Test notification system
# Usage: ./test-notifications.sh USER_A_TOKEN USER_B_TOKEN PIN_ID

USER_A_TOKEN=$1
USER_B_TOKEN=$2
PIN_ID=$3
BASE_URL="http://localhost:3000/api"

echo "=== Testing Notifications ==="

echo "\n1. Get User A notifications (before save):"
curl -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $USER_A_TOKEN"

echo "\n\n2. User B saves pin:"
curl -X POST "$BASE_URL/pins/$PIN_ID/save" \
  -H "Authorization: Bearer $USER_B_TOKEN"

echo "\n\n3. Get User A notifications (after save):"
curl -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $USER_A_TOKEN"

echo "\n\n=== Test Complete ==="
```

## 📱 Mobile App Debug Checklist

Add this logging to your mobile app to debug:

```kotlin
// In FCMTokenManager.kt
fun initializeFCM() {
    scope.launch {
        try {
            Log.d("FCM_DEBUG", "=== FCM Initialization Started ===")

            val token = FirebaseMessaging.getInstance().token.await()
            Log.d("FCM_DEBUG", "1. Token obtained: ${token.take(20)}...")

            val savedToken = prefs.getString("fcm_token", null)
            Log.d("FCM_DEBUG", "2. Saved token: ${savedToken?.take(20) ?: "null"}")

            if (token != savedToken) {
                Log.d("FCM_DEBUG", "3. Token changed, registering...")

                when (val result = repository.registerFCMToken(token)) {
                    is PinResult.Success -> {
                        prefs.edit().putString("fcm_token", token).apply()
                        Log.d("FCM_DEBUG", "4. ✅ Token registered successfully")
                    }
                    is PinResult.Error -> {
                        Log.e("FCM_DEBUG", "4. ❌ Registration failed: ${result.message}")
                    }
                }
            } else {
                Log.d("FCM_DEBUG", "3. Token unchanged, skipping registration")
            }

            Log.d("FCM_DEBUG", "=== FCM Initialization Complete ===")
        } catch (e: Exception) {
            Log.e("FCM_DEBUG", "=== FCM Initialization Failed ===", e)
        }
    }
}

// In PinBoardMessagingService.kt
override fun onMessageReceived(message: RemoteMessage) {
    Log.d("FCM_DEBUG", "=== Message Received ===")
    Log.d("FCM_DEBUG", "Notification: ${message.notification}")
    Log.d("FCM_DEBUG", "Data: ${message.data}")

    message.notification?.let {
        Log.d("FCM_DEBUG", "Title: ${it.title}")
        Log.d("FCM_DEBUG", "Body: ${it.body}")
        showNotification(it.title ?: "", it.body ?: "", message.data)
    }
}

private fun showNotification(title: String, body: String, data: Map<String, String>) {
    Log.d("FCM_DEBUG", "Showing notification: $title")
    // ... rest of code
    notificationManager.notify(notificationId, notification)
    Log.d("FCM_DEBUG", "Notification shown with ID: $notificationId")
}
```

## 🎯 Most Likely Issue

Based on your description ("notifications never show"), the most likely issue is **#5: FCM Token Registration Timing**.

The app tries to register the FCM token when the app starts (`App.onCreate()`), but the user isn't logged in yet, so the API call fails with 401 Unauthorized.

**Quick Fix:**

Call `fcmTokenManager.initializeFCM()` AFTER successful login, not in `App.onCreate()`.

## 📞 Still Having Issues?

If none of these solutions work:

1. Check backend server logs during:

   - App login
   - FCM token registration
   - Pin save action

2. Check mobile app Logcat with filter: `FCM|Notification|PinBoard`

3. Verify network connectivity between mobile app and backend server

4. Test with Firebase Console:
   - Go to Firebase Console → Cloud Messaging
   - Send a test notification directly to your FCM token
   - If this works, the issue is in your backend code
   - If this doesn't work, the issue is in your mobile app setup

---

**Last Updated:** November 29, 2025
