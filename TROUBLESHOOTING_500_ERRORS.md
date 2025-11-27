# Troubleshooting 500 Errors - Pin Board Backend

## 🔍 Current Issue

Based on your logs:
```
✅ GET /api/comment/getComments - 200 OK
✅ GET /api/pins/detail - 200 OK
❌ POST /api/pinLike/togglePinLike - 500 ERROR
❌ POST /api/comment/createComment - 500 ERROR
```

**Pattern**: GET requests work, POST requests fail with 500 errors.

## 🐛 Root Cause Analysis

The 500 errors indicate a **runtime exception** in your backend code. Since GET requests work but POST requests fail, the issue is likely:

1. **Authentication Context Issue** - `context.user` might be undefined in POST handlers
2. **Request Body Parsing** - ORPC might not be parsing POST bodies correctly
3. **Database Query Error** - MongoDB operations failing

## 🔧 How to Find the Exact Error

### Step 1: Check Backend Console

Look at your backend terminal (where you ran `yarn dev`). You should see error stack traces like:

```
TypeError: Cannot read property '_id' of undefined
    at pinLikeController.togglePinLike (...)
```

This will tell you exactly what's failing.

### Step 2: Add Debug Logging

Add this to your controllers to see what's happening:

```typescript
// In pin-like.controller.ts
async togglePinLike(pinId: string, context: any) {
    console.log('🔍 togglePinLike called');
    console.log('  pinId:', pinId);
    console.log('  context:', context);
    console.log('  context.user:', context.user);
    
    try {
        const userId = context.user._id;
        console.log('  userId:', userId);
        // ... rest of code
    } catch (error) {
        console.error('❌ Error in togglePinLike:', error);
        throw error;
    }
}
```

### Step 3: Test with cURL

```bash
# Test with your actual token
curl -X POST "http://localhost:3000/api/pinLike/togglePinLike" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"pinId":"68eb10063edcc8eb591d248c"}'
```

## 🎯 Most Likely Fixes

### Fix 1: Authentication Context

The `context.user` might be undefined. Check your authentication middleware:

```typescript
// src/config/context.ts or similar
export async function createContext(req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return { user: null };
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await userModel.findById(decoded.id);
        
        console.log('✅ User authenticated:', user?._id); // Add this
        
        return { user };
    } catch (error) {
        console.error('❌ Auth error:', error); // Add this
        return { user: null };
    }
}
```

### Fix 2: Check ORPC Route Input Parsing

The issue might be that ORPC expects inputs in a specific format. Your mobile app sends:

```json
{
  "pinId": "68eb10063edcc8eb591d248c"
}
```

But ORPC might be looking for it in a different structure. Check if the input is being received:

```typescript
// In your route handler
.handler(async ({ input, context }: any) => {
    console.log('📥 Received input:', JSON.stringify(input));
    console.log('👤 Context user:', context.user?._id);
    return await pinLikeController.togglePinLike(input.pinId, context);
})
```

### Fix 3: Database Connection

Ensure MongoDB is connected:

```typescript
// In your database config
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});
```

## 📋 Quick Debugging Checklist

Run through these checks:

- [ ] Backend server is running (`yarn dev`)
- [ ] MongoDB is running and connected
- [ ] Check backend console for error stack traces
- [ ] Verify authentication token is valid
- [ ] Check if `context.user` is defined
- [ ] Verify request body is being parsed
- [ ] Check if pinId/commentId exists in database
- [ ] Ensure all required environment variables are set

## 🚀 Testing Steps

1. **Start backend with logging:**
   ```bash
   cd pin-board-backend
   yarn dev
   ```

2. **In another terminal, test the endpoint:**
   ```bash
   # Replace TOKEN with your actual token from the logs
   TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   
   curl -X POST "http://localhost:3000/api/pinLike/togglePinLike" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"pinId":"68eb10063edcc8eb591d248c"}' \
     -w "\nHTTP Status: %{http_code}\n"
   ```

3. **Check backend console immediately** - You should see either:
   - Debug logs showing what's happening
   - Error stack trace showing what failed

## 🔍 Common Error Messages & Solutions

### Error: "Cannot read property '_id' of undefined"

**Cause**: `context.user` is undefined

**Solution**: Check authentication middleware, ensure token is valid

### Error: "Cast to ObjectId failed"

**Cause**: Invalid pinId/commentId format

**Solution**: Verify the ID is a valid MongoDB ObjectId

### Error: "Pin not found" / "Comment not found"

**Cause**: The ID doesn't exist in database

**Solution**: Use a valid ID from your database

### Error: "User not authenticated"

**Cause**: No auth token or invalid token

**Solution**: Ensure Authorization header is set correctly

## 📝 Next Steps

1. **Check your backend console NOW** - Look for error messages
2. **Add the debug logging** shown above to your controllers
3. **Test with cURL** to see the exact error response
4. **Share the error message** so we can fix it precisely

## 💡 Pro Tip

The fastest way to debug is to look at your backend console where `yarn dev` is running. The error stack trace will tell you exactly what line is failing and why.

---

**Once you find the exact error message, we can provide a precise fix!** 🎯

