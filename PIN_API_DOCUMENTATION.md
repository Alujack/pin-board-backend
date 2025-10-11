# Pin API Documentation

## Overview

The Pin API allows users to create, read, update, and delete pins with support for both image and video uploads. Videos automatically generate thumbnails using FFmpeg.

## API Endpoints

### 1. Create Pin with Media Upload

**Endpoint:** `POST /api/pins/create`

**Description:** Create a new pin with media files (images/videos)

**Request:**

- **Method:** POST
- **Content-Type:** multipart/form-data
- **Authentication:** Required (Bearer token in Authorization header)

**Form Data:**

```
board: string (required) - Board ID
title: string (required) - Pin title
description: string (optional) - Pin description
link_url: string (optional) - External link URL
media: File[] (required) - Media files (images/videos)
```

**Supported File Types:**

- Images: jpg, jpeg, png, webp
- Videos: mp4, mov, avi, mkv, webm

**Response:**

```json
{
  "success": true,
  "message": "Pin created successfully",
  "data": {
    "_id": "pin_id",
    "board": "board_id",
    "user": {
      "_id": "user_id",
      "username": "username",
      "profile_picture": "url"
    },
    "title": "Pin Title",
    "description": "Pin Description",
    "media_url": "cloudinary_url",
    "thumbnail_url": "thumbnail_url", // Only for videos
    "link_url": "external_url",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2. Get All Pins

**Endpoint:** `GET /api/pins`

**Description:** Retrieve pins with pagination and filtering

**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 10, max: 50)
- `board`: string (optional) - Filter by board ID
- `user`: string (optional) - Filter by user ID
- `search`: string (optional) - Search in title and description
- `sort`: string (default: "newest") - Options: "newest", "oldest", "popular"

**Response:**

```json
{
  "success": true,
  "message": "Pins retrieved successfully",
  "data": [...pins],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 3. Get Single Pin

**Endpoint:** `GET /api/pins/:id`

**Description:** Retrieve a single pin by ID

**Response:**

```json
{
  "success": true,
  "message": "Pin retrieved successfully",
  "data": {
    // Pin object with populated user and board
  }
}
```

### 4. Update Pin

**Endpoint:** `PUT /api/pins/:id`

**Description:** Update pin details (title, description, link_url)

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "link_url": "https://example.com"
}
```

### 5. Delete Pin

**Endpoint:** `DELETE /api/pins/:id`

**Description:** Delete a pin

**Response:**

```json
{
  "success": true,
  "message": "Pin deleted successfully"
}
```

### 6. Assign Tags to Pin

**Endpoint:** `POST /api/pins/:id/tags`

**Description:** Assign tags to a pin

**Request Body:**

```json
{
  "tagIds": ["tag_id_1", "tag_id_2"]
}
```

## Media Upload Features

### Image Upload

- Images are uploaded directly to Cloudinary
- File name format: `{pin_id}.{extension}`
- Stored in folder: `pins/{pin_id}/`

### Video Upload

- Videos are uploaded to Cloudinary
- Automatic thumbnail generation using FFmpeg
- Thumbnail extracted at 1 second mark
- File structure:
  - Video: `pins/{pin_id}/video.{extension}`
  - Thumbnail: `pins/{pin_id}/video_thumb.jpg`

### Mixed Media Support

- Single request can contain both images and videos
- Each file type is processed according to its type
- All files are stored in the same pin folder

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

## Setup Requirements

### FFmpeg Installation

For video thumbnail generation, FFmpeg must be installed:

**Windows:**

1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract and add to PATH
3. Verify: `ffmpeg -version`

**macOS:**

```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install ffmpeg
```

### Environment Variables

Ensure these Cloudinary environment variables are set:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Usage Examples

### Create Pin with Image

```bash
curl -X POST http://localhost:3000/api/pins/create \
  -H "Authorization: Bearer your_token" \
  -F "board=board_id" \
  -F "title=My Pin" \
  -F "description=Pin description" \
  -F "media=@image.jpg"
```

### Create Pin with Video

```bash
curl -X POST http://localhost:3000/api/pins/create \
  -H "Authorization: Bearer your_token" \
  -F "board=board_id" \
  -F "title=My Video Pin" \
  -F "description=Video description" \
  -F "media=@video.mp4"
```

### Create Pin with Multiple Media Files

```bash
curl -X POST http://localhost:3000/api/pins/create \
  -H "Authorization: Bearer your_token" \
  -F "board=board_id" \
  -F "title=Mixed Media Pin" \
  -F "media=@image1.jpg" \
  -F "media=@video1.mp4" \
  -F "media=@image2.png"
```
