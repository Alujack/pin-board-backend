#!/bin/bash

# Simple cURL tests for Pin Board Backend API
# Run this script to test the API endpoints

BASE_URL="http://localhost:3000/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Pin Board Backend API Tests"
echo "========================================="
echo ""

# Test 1: Login
echo -e "${YELLOW}Test 1: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token (requires jq)
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.sessionToken // empty')
  if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
  else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}! jq not installed, please extract token manually${NC}"
  echo "Please set TOKEN variable manually"
  exit 1
fi

echo ""

# Test 2: Get Pins
echo -e "${YELLOW}Test 2: Get Pins${NC}"
PINS_RESPONSE=$(curl -s -X GET "$BASE_URL/pins?limit=1" \
  -H "Authorization: Bearer $TOKEN")

echo "$PINS_RESPONSE" | jq '.'

# Extract first pin ID
PIN_ID=$(echo "$PINS_RESPONSE" | jq -r '.data[0]._id // empty')
if [ -n "$PIN_ID" ]; then
  echo -e "${GREEN}✓ Got pins successfully${NC}"
  echo "Using PIN_ID: $PIN_ID"
else
  echo -e "${RED}✗ Failed to get pins${NC}"
  exit 1
fi

echo ""

# Test 3: Get Comments
echo -e "${YELLOW}Test 3: Get Comments for Pin${NC}"
COMMENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/comment/getComments?pinId=$PIN_ID&page=1&limit=20&sort=newest" \
  -H "Authorization: Bearer $TOKEN")

echo "$COMMENTS_RESPONSE" | jq '.'

if echo "$COMMENTS_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Get comments successful${NC}"
else
  echo -e "${RED}✗ Get comments failed${NC}"
fi

echo ""

# Test 4: Create Comment
echo -e "${YELLOW}Test 4: Create Comment${NC}"
CREATE_COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/comment/createComment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"pinId\": \"$PIN_ID\",
    \"body\": {
      \"content\": \"Test comment from cURL script - $(date)\"
    }
  }")

echo "$CREATE_COMMENT_RESPONSE" | jq '.'

COMMENT_ID=$(echo "$CREATE_COMMENT_RESPONSE" | jq -r '.data._id // empty')
if [ -n "$COMMENT_ID" ]; then
  echo -e "${GREEN}✓ Create comment successful${NC}"
  echo "Comment ID: $COMMENT_ID"
else
  echo -e "${RED}✗ Create comment failed${NC}"
  echo "Response: $CREATE_COMMENT_RESPONSE"
fi

echo ""

# Test 5: Toggle Pin Like
echo -e "${YELLOW}Test 5: Toggle Pin Like${NC}"
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/pinLike/togglePinLike" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"pinId\": \"$PIN_ID\"
  }")

echo "$LIKE_RESPONSE" | jq '.'

if echo "$LIKE_RESPONSE" | jq -e '.success' > /dev/null; then
  IS_LIKED=$(echo "$LIKE_RESPONSE" | jq -r '.isLiked')
  echo -e "${GREEN}✓ Toggle pin like successful (isLiked: $IS_LIKED)${NC}"
else
  echo -e "${RED}✗ Toggle pin like failed${NC}"
  echo "Response: $LIKE_RESPONSE"
fi

echo ""

# Test 6: Toggle Comment Like
if [ -n "$COMMENT_ID" ]; then
  echo -e "${YELLOW}Test 6: Toggle Comment Like${NC}"
  COMMENT_LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/comment/toggleCommentLike" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"commentId\": \"$COMMENT_ID\"
    }")

  echo "$COMMENT_LIKE_RESPONSE" | jq '.'

  if echo "$COMMENT_LIKE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Toggle comment like successful${NC}"
  else
    echo -e "${RED}✗ Toggle comment like failed${NC}"
    echo "Response: $COMMENT_LIKE_RESPONSE"
  fi
else
  echo -e "${YELLOW}Test 6: Skipped (no comment ID)${NC}"
fi

echo ""

# Test 7: Check Pin Liked Status
echo -e "${YELLOW}Test 7: Check Pin Liked Status${NC}"
CHECK_LIKED_RESPONSE=$(curl -s -X GET "$BASE_URL/pinLike/checkPinLiked?pinId=$PIN_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$CHECK_LIKED_RESPONSE" | jq '.'

if echo "$CHECK_LIKED_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Check pin liked successful${NC}"
else
  echo -e "${RED}✗ Check pin liked failed${NC}"
fi

echo ""

# Test 8: Get Pin Likes
echo -e "${YELLOW}Test 8: Get Pin Likes${NC}"
GET_LIKES_RESPONSE=$(curl -s -X GET "$BASE_URL/pinLike/getPinLikes?pinId=$PIN_ID&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN")

echo "$GET_LIKES_RESPONSE" | jq '.'

if echo "$GET_LIKES_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Get pin likes successful${NC}"
else
  echo -e "${RED}✗ Get pin likes failed${NC}"
fi

echo ""
echo "========================================="
echo "Tests completed!"
echo "========================================="

