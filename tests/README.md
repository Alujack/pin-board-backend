# Pin Board Backend - Test Suite

Comprehensive unit and integration tests for the Pin Board Backend API.

## 📋 Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Unit Tests](#unit-tests)
- [Manual Testing](#manual-testing)
- [Coverage](#coverage)

## 🚀 Setup

### Install Dependencies

```bash
cd pin-board-backend
yarn install
```

### Environment Variables

Make sure you have a `.env` file with test database configuration:

```env
MONGODB_URI=mongodb://localhost:27017/pinboard_test
JWT_SECRET=your_test_secret
API_BASE_URL=http://localhost:3000/api
```

## 🧪 Running Tests

### Run All Tests

```bash
yarn test
```

### Run Unit Tests Only

```bash
yarn test:unit
```

### Run Tests in Watch Mode

```bash
yarn test:watch
```

### Run Tests with Coverage

```bash
yarn test:coverage
```

## 📁 Test Structure

```
tests/
├── unit/                           # Unit tests for controllers
│   ├── comment.controller.test.ts  # Comment functionality tests
│   ├── pin-like.controller.test.ts # Pin like functionality tests
│   ├── pin.controller.test.ts      # Pin CRUD tests
│   ├── board.controller.test.ts    # Board CRUD tests
│   ├── notification.controller.test.ts  # Notification tests
│   └── follow.controller.test.ts   # Follow/Unfollow tests
├── integration/                    # Integration tests (coming soon)
├── fixtures/                       # Test data fixtures
├── manual-test.http               # REST Client manual tests
└── simple-curl-tests.sh           # cURL test script
```

## 🔬 Unit Tests

### Comment Controller Tests

Tests for comment functionality:

- ✅ Create comment
- ✅ Get comments with pagination
- ✅ Update comment
- ✅ Delete comment
- ✅ Toggle comment like/unlike
- ✅ Create reply to comment
- ✅ Authorization checks

**Run:**
```bash
yarn test tests/unit/comment.controller.test.ts
```

### Pin Like Controller Tests

Tests for pin like functionality:

- ✅ Like a pin
- ✅ Unlike a pin
- ✅ Get pin likes list
- ✅ Check if pin is liked
- ✅ Pagination
- ✅ Authorization checks
- ✅ Notification creation

**Run:**
```bash
yarn test tests/unit/pin-like.controller.test.ts
```

### Pin Controller Tests

Tests for pin CRUD operations:

- ✅ Get all pins with pagination
- ✅ Get pin by ID
- ✅ Get created pins
- ✅ Get saved pins
- ✅ Update pin
- ✅ Delete pin
- ✅ Save/Unsave pin
- ✅ Search pins
- ✅ Authorization checks

**Run:**
```bash
yarn test tests/unit/pin.controller.test.ts
```

### Board Controller Tests

Tests for board functionality:

- ✅ Create board
- ✅ Get boards with pagination
- ✅ Get board by ID
- ✅ Update board
- ✅ Delete board
- ✅ Get user boards
- ✅ Private/Public board access
- ✅ Authorization checks

**Run:**
```bash
yarn test tests/unit/board.controller.test.ts
```

### Notification Controller Tests

Tests for notification system:

- ✅ Get notifications
- ✅ Mark notification as read
- ✅ Mark all as read
- ✅ Register FCM token
- ✅ Pagination
- ✅ Authorization checks

**Run:**
```bash
yarn test tests/unit/notification.controller.test.ts
```

### Follow Controller Tests

Tests for follow/unfollow functionality:

- ✅ Follow user
- ✅ Unfollow user
- ✅ Get followers list
- ✅ Get following list
- ✅ Check following status
- ✅ Prevent self-follow
- ✅ Authorization checks

**Run:**
```bash
yarn test tests/unit/follow.controller.test.ts
```

## 🔧 Manual Testing

### Using REST Client (VS Code Extension)

1. Install the "REST Client" extension in VS Code
2. Open `tests/manual-test.http`
3. Update the `@token` variable with your auth token
4. Click "Send Request" above any request

### Using cURL Script

```bash
# Make the script executable
chmod +x tests/simple-curl-tests.sh

# Run the tests
./tests/simple-curl-tests.sh
```

**Prerequisites:**
- `curl` installed
- `jq` installed (for JSON parsing)
- Backend server running on `http://localhost:3000`

### Manual Test Endpoints

The `manual-test.http` file includes tests for:

1. **Authentication**
   - Login
   - Get auth token

2. **Comments**
   - Get comments
   - Create comment
   - Create reply
   - Update comment
   - Delete comment
   - Toggle comment like

3. **Pin Likes**
   - Toggle pin like
   - Get pin likes
   - Check if liked

4. **Error Cases**
   - Unauthorized access
   - Invalid IDs
   - Missing fields

## 📊 Coverage

Generate coverage report:

```bash
yarn test:coverage
```

View the HTML coverage report:

```bash
open coverage/index.html
```

### Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## 🐛 Debugging Tests

### Run Single Test File

```bash
yarn test tests/unit/comment.controller.test.ts
```

### Run Specific Test

```bash
yarn test -t "should create a comment successfully"
```

### Debug in VS Code

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { yourController } from '../../src/controllers/your.controller.js';

jest.mock('../../src/models/your.model.js');

describe('Your Controller Unit Tests', () => {
    const mockContext = {
        user: { _id: 'user123', username: 'testuser' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('yourMethod', () => {
        it('should do something successfully', async () => {
            // Arrange
            // ... setup mocks

            // Act
            const result = await yourController.yourMethod(params, mockContext);

            // Assert
            expect(result.success).toBe(true);
        });

        it('should fail when...', async () => {
            // Test error cases
            await expect(
                yourController.yourMethod(invalidParams, mockContext)
            ).rejects.toThrow();
        });
    });
});
```

## 🔍 Test Best Practices

1. **Arrange-Act-Assert (AAA)** pattern
2. **Mock external dependencies** (database, APIs)
3. **Test both success and error cases**
4. **Use descriptive test names**
5. **Keep tests independent**
6. **Clean up after each test** (use `beforeEach`/`afterEach`)
7. **Test edge cases and boundary conditions**
8. **Maintain good coverage** (aim for >80%)

## 🚨 Common Issues

### Tests Failing Due to Timeouts

Increase timeout in `jest.config.js`:

```javascript
testTimeout: 30000  // 30 seconds
```

### Mock Not Working

Ensure you're mocking before importing:

```typescript
jest.mock('../../src/models/your.model.js');
import { yourModel } from '../../src/models/your.model.js';
```

### Database Connection Issues

Use a separate test database and ensure it's running:

```bash
mongod --dbpath ./test-db
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

## 🤝 Contributing

When adding new features:

1. Write unit tests for new controllers/services
2. Update manual test file with new endpoints
3. Ensure all tests pass before committing
4. Maintain or improve coverage

## 📞 Support

If you encounter issues with tests:

1. Check the error message carefully
2. Ensure all dependencies are installed
3. Verify environment variables
4. Check that the database is running
5. Review the test logs

---

**Happy Testing! 🎉**

