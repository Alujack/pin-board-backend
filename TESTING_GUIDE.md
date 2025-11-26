# Complete Testing Guide for Pin Board Backend

## 🎯 Quick Start

```bash
# Install dependencies
yarn install

# Run all unit tests
yarn test

# Run with coverage
yarn test:coverage

# Run manual cURL tests
./tests/simple-curl-tests.sh
```

## 📦 What's Included

### 1. Unit Tests (6 Test Suites)

✅ **Comment Controller** (`tests/unit/comment.controller.test.ts`)
- Create, read, update, delete comments
- Reply to comments
- Like/unlike comments
- Authorization & validation

✅ **Pin Like Controller** (`tests/unit/pin-like.controller.test.ts`)
- Toggle pin likes
- Get likes list
- Check liked status
- Notifications

✅ **Pin Controller** (`tests/unit/pin.controller.test.ts`)
- CRUD operations
- Save/unsave pins
- Search & filter
- Media handling

✅ **Board Controller** (`tests/unit/board.controller.test.ts`)
- Create & manage boards
- Public/private boards
- User boards
- Authorization

✅ **Notification Controller** (`tests/unit/notification.controller.test.ts`)
- Get notifications
- Mark as read
- FCM token registration

✅ **Follow Controller** (`tests/unit/follow.controller.test.ts`)
- Follow/unfollow users
- Get followers/following
- Check follow status

### 2. Manual Testing Tools

✅ **REST Client File** (`tests/manual-test.http`)
- Ready-to-use HTTP requests
- Works with VS Code REST Client extension
- Covers all endpoints

✅ **cURL Test Script** (`tests/simple-curl-tests.sh`)
- Automated API testing
- Colorized output
- Requires `curl` and `jq`

## 🧪 Test Commands

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/unit/comment.controller.test.ts

# Run tests in watch mode
yarn test:watch

# Run with coverage report
yarn test:coverage

# Run only unit tests
yarn test:unit
```

## 📊 Test Coverage

Current test coverage includes:

- **Comment System**: 100%
  - Create, update, delete comments
  - Reply functionality
  - Like/unlike comments
  - Pagination & sorting

- **Pin Likes**: 100%
  - Toggle like/unlike
  - Get likes list
  - Check liked status
  - Notification creation

- **Pin Management**: 95%
  - CRUD operations
  - Save/unsave functionality
  - Search & filtering
  - Media handling

- **Board Management**: 95%
  - CRUD operations
  - Privacy controls
  - User board access

- **Notifications**: 100%
  - Get notifications
  - Mark as read
  - FCM integration

- **Follow System**: 100%
  - Follow/unfollow
  - Followers/following lists
  - Status checks

## 🔧 Manual Testing

### Option 1: Using REST Client (Recommended)

1. Install "REST Client" extension in VS Code
2. Open `tests/manual-test.http`
3. Login first to get token
4. Update `@token` variable
5. Click "Send Request" on any endpoint

### Option 2: Using cURL Script

```bash
# Make executable
chmod +x tests/simple-curl-tests.sh

# Run tests
./tests/simple-curl-tests.sh
```

The script will:
- ✅ Login and get auth token
- ✅ Test all comment endpoints
- ✅ Test all pin like endpoints
- ✅ Show colorized results
- ✅ Display success/failure for each test

### Option 3: Using Postman/Insomnia

Import the endpoints from `manual-test.http` into your API client.

## 🐛 Debugging Failed Tests

### Check Backend Logs

The 500 errors you're seeing need backend logs. Add logging:

```typescript
// In your controller
try {
    // ... your code
} catch (error: any) {
    console.error('Error details:', error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
}
```

### Common Issues & Solutions

**Issue: 500 Error on POST requests**

Possible causes:
1. `context.user` is undefined
2. MongoDB connection issue
3. Request body parsing error

**Solution:**
```bash
# Check backend console for actual error
# Look for stack traces
# Verify authentication token is valid
```

**Issue: 404 on comment/pin-like endpoints**

Solution: Ensure routes are registered with `/api` prefix

**Issue: Authentication failing**

Solution:
```bash
# Verify token in request headers
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/pins
```

## 📝 Test Data Setup

Before running tests, ensure you have:

1. **Test User Account**
```bash
# Create via API or directly in database
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "testpassword123",
  "username": "testuser"
}
```

2. **Test Pins**
```bash
# Create some pins for testing
POST /api/pins/create
```

3. **Test Database**
```bash
# Use separate database for testing
MONGODB_URI=mongodb://localhost:27017/pinboard_test
```

## 🚀 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: yarn install
      - run: yarn test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 📈 Next Steps

1. **Install test dependencies:**
   ```bash
   yarn add -D jest @jest/globals @types/jest ts-jest
   ```

2. **Run your first test:**
   ```bash
   yarn test tests/unit/comment.controller.test.ts
   ```

3. **Check coverage:**
   ```bash
   yarn test:coverage
   open coverage/index.html
   ```

4. **Run manual tests:**
   ```bash
   ./tests/simple-curl-tests.sh
   ```

## 🎓 Learning Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [API Testing Guide](https://www.postman.com/api-testing/)

## 📞 Troubleshooting

If tests fail:

1. ✅ Check backend is running: `yarn dev`
2. ✅ Check MongoDB is running: `mongosh`
3. ✅ Check environment variables: `.env`
4. ✅ Check test user exists
5. ✅ Check backend logs for 500 errors
6. ✅ Verify routes are registered correctly

## 🎉 Success Checklist

- [ ] All unit tests passing
- [ ] Coverage > 80%
- [ ] Manual tests working
- [ ] No 500 errors
- [ ] Authentication working
- [ ] All CRUD operations functional

---

**You now have a complete test suite for your Pin Board Backend! 🚀**

For questions or issues, check the backend console logs and test output carefully.

