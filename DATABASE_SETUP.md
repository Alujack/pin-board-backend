# Database Setup Guide

## 🔍 Is Your Database the Problem?

Your 500 errors might be caused by:

1. ❌ **Pin/Comment doesn't exist** - Trying to like a pin that's not in the database
2. ❌ **User data incomplete** - Missing required fields
3. ❌ **No data at all** - Empty database
4. ❌ **Missing indexes** - Slow queries or errors

## ✅ Quick Database Check

Run this to verify your database:

```bash
cd /opt/school-project/board/pin-board-backend
npx tsx scripts/verify-database.ts
```

This will show you:
- ✅ If database is connected
- ✅ How many users, pins, comments exist
- ✅ If the specific pin from your logs exists
- ✅ Sample data you can use for testing

## 🔧 Create Indexes

If indexes are missing:

```bash
npx tsx scripts/create-indexes.ts
```

## 📊 What the Verification Will Tell You

### Scenario 1: Database is Empty

```
📊 Document Counts:
   Users: 0
   Pins: 0
   Comments: 0
```

**Solution**: You need to create data first!
1. Register a user via your API
2. Create some pins
3. Then test liking/commenting

### Scenario 2: Pin Doesn't Exist

```
🔍 Checking test pin: 68eb10063edcc8eb591d248c
❌ Pin NOT found in database!
```

**Solution**: Use a valid pin ID from your database
- The verification script will show you valid pin IDs
- Update your mobile app test to use a real pin ID

### Scenario 3: User Doesn't Exist

```
🔍 Checking test user: 68e27790...
❌ User NOT found!
```

**Solution**: Token is invalid or user was deleted
- Login again to get a fresh token
- Or register a new user

### Scenario 4: Everything Exists

```
✅ Database has data and looks good!
✅ Pin exists!
✅ User exists!
```

**Then the 500 error is NOT a database issue!**
It's a code/logic error. Add debug logging to find it.

## 🎯 Most Likely Scenario

Based on your logs showing:
```
POST /api/pinLike/togglePinLike - 500
POST /api/comment/createComment - 500
```

**The pin probably doesn't exist in your database!**

The mobile app is trying to like/comment on pin `68eb10063edcc8eb591d248c`, but that pin might not exist.

## 🔧 How to Fix

### Option 1: Use Existing Data

1. Run verification script to see what pins exist
2. Use a valid pin ID in your mobile app tests

### Option 2: Create Test Data

Create a pin via API:

```bash
curl -X POST "http://localhost:3000/api/pins/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Pin" \
  -F "description=Test Description" \
  -F "board=YOUR_BOARD_ID" \
  -F "media=@/path/to/image.jpg"
```

Or use your mobile app to create a pin first.

### Option 3: Seed Database

Create a seed script to populate test data (we can create this if needed).

## 🚀 Step-by-Step Fix

1. **Run verification:**
   ```bash
   npx tsx scripts/verify-database.ts
   ```

2. **Check the output:**
   - If pin doesn't exist → Use a different pin ID
   - If no pins at all → Create some pins first
   - If everything exists → It's a code error, not database

3. **Create indexes (if needed):**
   ```bash
   npx tsx scripts/create-indexes.ts
   ```

4. **Test again from mobile app**

## 💡 Pro Tip

The verification script will show you valid pin IDs like:

```
📌 Sample Pins (first 5):
   68eb10063edcc8eb591d248c - "My First Pin" by 68e27790...
   68eb10063edcc8eb591d248d - "Another Pin" by 68e27790...
```

Use these IDs in your mobile app for testing!

## 🔍 Still Getting 500 Errors After Verification?

If the database looks good but you still get 500 errors:

1. **Add debug logging** (see TEST_SUMMARY.md)
2. **Check backend console** for the actual error
3. **Verify authentication** - Make sure token is valid

The database verification will tell you if it's a data problem or a code problem!

---

**Run the verification script now to see what's in your database! 🎯**

```bash
npx tsx scripts/verify-database.ts
```

