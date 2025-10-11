# Board API Documentation

## Overview

The Board API allows users to create, read, update, and delete boards. Boards are collections of pins organized by users.

## API Endpoints

### 1. Create Board

**Endpoint:** `POST /api/boards`

**Description:** Create a new board

**Request Body:**

```json
{
  "name": "My Board",
  "description": "Board description",
  "is_public": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "_id": "board_id",
    "user": {
      "_id": "user_id",
      "username": "username",
      "profile_picture": "url"
    },
    "name": "My Board",
    "description": "Board description",
    "is_public": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "pinCount": 0
  }
}
```

### 2. Get All Boards

**Endpoint:** `GET /api/boards`

**Description:** Retrieve boards with pagination and filtering

**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 10, max: 50)
- `user`: string (optional) - Filter by user ID
- `search`: string (optional) - Search in name and description
- `is_public`: string (optional) - Filter by public/private boards
- `sort`: string (default: "newest") - Options: "newest", "oldest", "popular"

**Response:**

```json
{
  "success": true,
  "message": "Boards retrieved successfully",
  "data": [...boards],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 3. Get Single Board

**Endpoint:** `GET /api/boards/:id`

**Description:** Retrieve a single board by ID with its pins

**Response:**

```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "_id": "board_id",
    "user": {
      "_id": "user_id",
      "username": "username",
      "profile_picture": "url"
    },
    "name": "My Board",
    "description": "Board description",
    "is_public": true,
    "pins": [
      {
        "_id": "pin_id",
        "title": "Pin Title",
        "media_url": "media_url",
        "thumbnail_url": "thumbnail_url",
        "createdAt": "timestamp"
      }
    ],
    "pinCount": 5,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 4. Update Board

**Endpoint:** `PUT /api/boards/:id`

**Description:** Update board details

**Request Body:**

```json
{
  "name": "Updated Board Name",
  "description": "Updated description",
  "is_public": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Board updated successfully",
  "data": {
    // Updated board object
  }
}
```

### 5. Delete Board

**Endpoint:** `DELETE /api/boards/:id`

**Description:** Delete a board and all its pins

**Response:**

```json
{
  "success": true,
  "message": "Board deleted successfully"
}
```

### 6. Get User's Boards

**Endpoint:** `GET /api/boards/my-boards`

**Description:** Get all boards created by the authenticated user

**Response:**

```json
{
  "success": true,
  "message": "User boards retrieved successfully",
  "data": [
    {
      "_id": "board_id",
      "name": "My Board",
      "description": "Board description",
      "is_public": true,
      "pinCount": 5,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Usage Examples

### Create Board

```bash
curl -X POST http://localhost:3000/api/boards \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Travel Board",
    "description": "Collection of travel photos",
    "is_public": true
  }'
```

### Get All Boards

```bash
curl -X GET "http://localhost:3000/api/boards?page=1&limit=10&sort=newest" \
  -H "Authorization: Bearer your_token"
```

### Get Single Board

```bash
curl -X GET http://localhost:3000/api/boards/board_id \
  -H "Authorization: Bearer your_token"
```

### Update Board

```bash
curl -X PUT http://localhost:3000/api/boards/board_id \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Board Name",
    "is_public": false
  }'
```

### Delete Board

```bash
curl -X DELETE http://localhost:3000/api/boards/board_id \
  -H "Authorization: Bearer your_token"
```

### Get User's Boards

```bash
curl -X GET http://localhost:3000/api/boards/my-boards \
  -H "Authorization: Bearer your_token"
```

## Board Features

### Public/Private Boards

- **Public boards**: Visible to all users
- **Private boards**: Only visible to the creator

### Pin Management

- Boards automatically track pin count
- Deleting a board removes all associated pins
- Boards can contain unlimited pins

### Search and Filtering

- Search by board name or description
- Filter by user, public/private status
- Sort by creation date or popularity

## Integration with Pin API

Boards work seamlessly with the Pin API:

1. **Create a board** using the Board API
2. **Add pins to the board** using the Pin API with the board ID
3. **View board with pins** using the single board endpoint
4. **Manage board settings** independently of pins

## Data Relationships

```
User → Boards → Pins
  ↓      ↓       ↓
 1:N    1:N     1:N
```

- One user can have multiple boards
- One board can contain multiple pins
- One pin belongs to one board
- Deleting a board cascades to delete all its pins
