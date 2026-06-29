# Apple Tree API Documentation

This document outlines the REST API endpoints available in the Apple Tree backend.

## Base URL
All API endpoints are relative to the base URL: `http://localhost:3000/api`

## Authentication
This API uses JSON Web Tokens (JWT) for authentication. For endpoints requiring authentication, include the token in the `Authorization` header:
`Authorization: Bearer <your_token_here>`

---

## Auth Endpoints

### 1. Register a new user
- **Method**: `POST`
- **URL**: `/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "display_name": "John Doe",
    "password": "securepassword123"
  }
  ```
- **Example Response** (201 Created):
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "johndoe",
      "display_name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. Login
- **Method**: `POST`
- **URL**: `/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "securepassword123"
  }
  ```
- **Example Response** (200 OK):
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "johndoe",
      "display_name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 3. Logout
- **Method**: `POST`
- **URL**: `/auth/logout`
- **Auth Required**: No (Client discards token)
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

### 4. Get Current User (Me)
- **Method**: `GET`
- **URL**: `/auth/me`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "user": {
      "id": 1,
      "username": "johndoe",
      "display_name": "John Doe"
    }
  }
  ```

---

## Post Endpoints

### 5. Get All Live Posts (Global Feed)
- **Method**: `GET`
- **URL**: `/posts`
- **Auth Required**: Optional (If authenticated, includes `is_liked` status)
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "content": "Hello world #firstpost",
      "created_at": "2026-06-29 01:23:45",
      "expires_at": "2026-06-30 01:23:45",
      "username": "johndoe",
      "display_name": "John Doe",
      "like_count": 5,
      "is_liked": true
    }
  ]
  ```

### 6. Get Following Feed
- **Method**: `GET`
- **URL**: `/posts/feed`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK): List of posts (same format as `/posts`) from users the current user follows.

### 7. Create a Post
- **Method**: `POST`
- **URL**: `/posts`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "content": "Having a great day! #sunny"
  }
  ```
- **Example Response** (201 Created):
  ```json
  {
    "success": true,
    "post": {
      "id": 2,
      "user_id": 1,
      "content": "Having a great day! #sunny",
      "created_at": "2026-06-29 02:00:00",
      "expires_at": "2026-06-30 02:00:00"
    }
  }
  ```

### 8. Delete a Post
- **Method**: `DELETE`
- **URL**: `/posts/:id`
- **Auth Required**: Yes (Must be author of the post)
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

### 9. Like a Post
- **Method**: `POST`
- **URL**: `/posts/:id/like`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

### 10. Unlike a Post
- **Method**: `DELETE`
- **URL**: `/posts/:id/like`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

---

## User Endpoints

### 11. Get User Profile
- **Method**: `GET`
- **URL**: `/users/:username`
- **Auth Required**: Optional (If authenticated, includes `is_following` and `is_liked` status)
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "user": {
      "id": 2,
      "username": "janedoe",
      "display_name": "Jane Doe",
      "follower_count": 10,
      "following_count": 5,
      "is_following": false
    },
    "posts": [
      {
        "id": 3,
        "content": "Jane's post",
        "created_at": "...",
        "expires_at": "...",
        "username": "janedoe",
        "display_name": "Jane Doe",
        "like_count": 2,
        "is_liked": false
      }
    ]
  }
  ```

### 12. Follow a User
- **Method**: `POST`
- **URL**: `/users/:username/follow`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

### 13. Unfollow a User
- **Method**: `DELETE`
- **URL**: `/users/:username/follow`
- **Auth Required**: Yes
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

---

## Hashtag Endpoints

### 14. Get Trending Hashtags
- **Method**: `GET`
- **URL**: `/hashtags/trending`
- **Auth Required**: No
- **Request Body**: None
- **Example Response** (200 OK):
  ```json
  [
    {
      "name": "tech",
      "count": 42
    },
    {
      "name": "news",
      "count": 35
    }
  ]
  ```

### 15. Get Posts by Hashtag
- **Method**: `GET`
- **URL**: `/hashtags/:tag`
- **Auth Required**: Optional
- **Request Body**: None
- **Example Response** (200 OK): List of posts (same format as `/posts`) containing the specific hashtag.
