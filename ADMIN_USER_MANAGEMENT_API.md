# Admin User Management API Documentation

This document describes the API endpoints for admin user management functionality that supports the Flutter frontend requirements.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All admin endpoints require admin authentication. Include the admin token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

---

## 1. Get All Users

Retrieves all registered users with detailed information including booking counts, filtering, sorting, and pagination.

### Endpoint
```
GET /admin/users
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of users per page |
| `search` | string | '' | Search by name or email |
| `filter` | string | 'all' | Filter by: 'all', 'premium', 'regular', 'active', 'inactive' |
| `sortBy` | string | 'recent' | Sort by: 'recent', 'name', 'email', 'lastActivity' |
| `sortOrder` | string | 'desc' | Sort order: 'asc' or 'desc' |

### Example Request
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10&search=john&filter=premium&sortBy=recent&sortOrder=desc" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Format
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Smith",
        "email": "john@example.com",
        "phone": "1234567890",
        "isPremium": true,
        "registeredDate": "2024-01-15T10:30:00.000Z",
        "totalBookings": 12,
        "status": "active",
        "lastActivity": "2024-06-10T15:45:00.000Z",
        "profileImage": null,
        "hasCompletedQuestionnaire": true,
        "preferredState": "California",
        "preferredSpecialization": "Counseling",
        "isFirstTimeUser": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalUsers": 50,
      "premiumUsers": 15,
      "activeUsers": 45,
      "totalBookings": 250
    }
  }
}
```

---

## 2. Get User Statistics

Retrieves overall user statistics for dashboard cards.

### Endpoint
```
GET /admin/users/statistics
```

### Example Request
```bash
curl -X GET "http://localhost:3000/api/admin/users/statistics" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Format
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 50,
    "premiumUsers": 15,
    "activeUsers": 45,
    "inactiveUsers": 5,
    "totalBookings": 250,
    "newUsersThisMonth": 8
  }
}
```

---

## 3. Get Single User Details

Retrieves detailed information about a specific user including their booking history.

### Endpoint
```
GET /admin/users/:userId
```

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID |

### Example Request
```bash
curl -X GET "http://localhost:3000/api/admin/users/64f8a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Format
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "1234567890",
    "isPremium": true,
    "registeredDate": "2024-01-15T10:30:00.000Z",
    "status": "active",
    "lastActivity": "2024-06-10T15:45:00.000Z",
    "profileImage": null,
    "hasCompletedQuestionnaire": true,
    "preferredState": "California",
    "preferredSpecialization": "Counseling",
    "isFirstTimeUser": false,
    "bookings": {
      "total": 12,
      "completed": 8,
      "pending": 2,
      "cancelled": 2,
      "history": [
        {
          "id": "64f8b1c2d3e4f5g6h7i8j9",
          "date": "2024-06-15T00:00:00.000Z",
          "time": "10:00 AM",
          "status": "confirmed",
          "psychologist": {
            "id": "64f7a1b2c3d4e5f6a7b8c9d",
            "name": "Dr. Sarah Johnson",
            "email": "sarah@example.com",
            "specialization": "Counseling"
          },
          "bookingType": "Myself",
          "bookingMethod": "automatic"
        }
      ]
    }
  }
}
```

---

## 4. Update User Status

Activates or deactivates a user account.

### Endpoint
```
PUT /admin/users/:userId/status
```

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID |

### Request Body
```json
{
  "isActive": true
}
```

### Example Request
```bash
curl -X PUT "http://localhost:3000/api/admin/users/64f8a1b2c3d4e5f6a7b8c9d0/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Response Format
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Smith",
    "email": "john@example.com",
    "status": "inactive"
  }
}
```

---

## 5. Update User Premium Status

Enables or disables premium status for a user.

### Endpoint
```
PUT /admin/users/:userId/premium
```

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID |

### Request Body
```json
{
  "isPremium": true
}
```

### Example Request
```bash
curl -X PUT "http://localhost:3000/api/admin/users/64f8a1b2c3d4e5f6a7b8c9d0/premium" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isPremium": true}'
```

### Response Format
```json
{
  "success": true,
  "message": "User premium status enabled successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Smith",
    "email": "john@example.com",
    "isPremium": true
  }
}
```

---

## 6. Delete User

Deletes a user account. By default, prevents deletion if user has active bookings.

### Endpoint
```
DELETE /admin/users/:userId
```

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `force` | boolean | false | Force delete even with active bookings |

### Example Request
```bash
# Safe delete (will fail if user has active bookings)
curl -X DELETE "http://localhost:3000/api/admin/users/64f8a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer <admin_token>"

# Force delete (will delete user and all bookings)
curl -X DELETE "http://localhost:3000/api/admin/users/64f8a1b2c3d4e5f6a7b8c9d0?force=true" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Format
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deletedUser": "John Smith",
    "deletedBookings": 0
  }
}
```

### Error Response (Safe Delete with Active Bookings)
```json
{
  "success": false,
  "message": "Cannot delete user. User has 2 active booking(s). Use force=true to delete anyway.",
  "activeBookings": 2
}
```

---

## Flutter Frontend Integration

### User Model Structure
The API responses are designed to match your Flutter `UserModel` class:

```dart
class UserModel {
  final String id;
  final String name;
  final String email;
  final bool isPremium;
  final DateTime registeredDate;
  final int totalBookings;
  UserStatus status;
  final DateTime lastActivity;
  final String? profileImage;
}
```

### Dashboard Statistics
The statistics endpoint provides data for your dashboard cards:
- Total Users
- Premium Users  
- Active Users
- Total Bookings

### Filtering and Sorting
The API supports all the filtering and sorting options shown in your Flutter UI:
- Filter: All, Premium, Regular, Active, Inactive
- Sort: Recent, Name, Bookings
- Search: By name or email

### Pagination
The API includes pagination information that can be used to implement infinite scrolling or pagination in your Flutter app.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not admin)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

---

## Testing Examples

### 1. Get all users with search and filtering
```bash
curl -X GET "http://localhost:3000/api/admin/users?search=john&filter=premium&sortBy=recent" \
  -H "Authorization: Bearer <admin_token>"
```

### 2. Get user statistics
```bash
curl -X GET "http://localhost:3000/api/admin/users/statistics" \
  -H "Authorization: Bearer <admin_token>"
```

### 3. Update user to premium
```bash
curl -X PUT "http://localhost:3000/api/admin/users/USER_ID/premium" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isPremium": true}'
```

### 4. Deactivate user
```bash
curl -X PUT "http://localhost:3000/api/admin/users/USER_ID/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### 5. Delete user (safe)
```bash
curl -X DELETE "http://localhost:3000/api/admin/users/USER_ID" \
  -H "Authorization: Bearer <admin_token>"
``` 