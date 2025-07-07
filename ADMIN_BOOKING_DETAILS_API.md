# Admin Booking Details API Documentation

This document describes the admin endpoints for retrieving all booking details and comprehensive booking statistics.

## Authentication

All admin endpoints require admin authentication using the `verifyAdmin` middleware.

**Header Required:**
```
Authorization: Bearer <admin_jwt_token>
```

---

## 1. Get All Bookings with Details

**GET** `/admin/bookings/all`

Retrieves all bookings with comprehensive details, filtering, pagination, and statistics.

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by booking status | `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled` |
| `date` | string | No | Filter by specific date (YYYY-MM-DD) | `2024-01-15` |
| `psychologistId` | string | No | Filter by specific psychologist | `507f1f77bcf86cd799439011` |
| `userId` | string | No | Filter by specific user | `507f1f77bcf86cd799439012` |
| `bookingMethod` | string | No | Filter by booking method | `automatic`, `manual` |
| `page` | number | No | Page number for pagination (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 20, max: 100) | `20` |
| `sortBy` | string | No | Sort field (default: createdAt) | `date`, `time`, `status`, `createdAt` |
| `sortOrder` | string | No | Sort order (default: desc) | `asc`, `desc` |
| `search` | string | No | Search in booking ID | `507f1f77bcf86cd799439013` |

### Example Request

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?status=pending&page=1&limit=10&sortBy=date&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Response

```json
{
  "status": true,
  "message": "All bookings retrieved successfully for admin",
  "data": {
    "bookings": [
      {
        "id": "507f1f77bcf86cd799439013",
        "date": "2024-01-15T00:00:00.000Z",
        "time": "10:00 AM",
        "status": "pending",
        "bookingType": "consultation",
        "bookingMethod": "manual",
        "patientDetails": {
          "name": "John Doe",
          "age": 30,
          "phone": "+1234567890"
        },
        "user": {
          "_id": "507f1f77bcf86cd799439012",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        },
        "psychologist": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Jane Smith",
          "specialization": "Anxiety",
          "clinicName": "Mind Wellness Clinic",
          "state": "California",
          "image": "http://localhost:3000/uploads/psychologist/psychologist-image.jpg",
          "rating": 4.8,
          "experienceYears": 10,
          "hourlyRate": 150,
          "email": "jane@clinic.com",
          "phone": "+1987654321"
        },
        "rescheduleHistory": [],
        "cancelledAt": null,
        "cancellationReason": null,
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBookings": 100,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    },
    "statistics": {
      "totalBookings": 100,
      "recentBookings": 25,
      "todayBookings": 3,
      "thisWeekBookings": 15,
      "thisMonthBookings": 45,
      "uniqueUsers": 50,
      "uniquePsychologists": 10,
      "bookingsByStatus": {
        "pending": 20,
        "confirmed": 30,
        "completed": 25,
        "cancelled": 15,
        "rescheduled": 10
      },
      "bookingsByMethod": {
        "automatic": 60,
        "manual": 40
      }
    },
    "filters": {
      "status": "pending",
      "date": null,
      "psychologistId": null,
      "userId": null,
      "bookingMethod": "all",
      "search": null
    },
    "sorting": {
      "sortBy": "date",
      "sortOrder": "desc"
    }
  }
}
```

---

## 2. Get Booking Count Summary

**GET** `/admin/bookings/summary`

Retrieves comprehensive booking statistics and summary data for admin dashboard.

### Example Request

```bash
curl -X GET "http://localhost:3000/admin/bookings/summary" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Response

```json
{
  "status": true,
  "message": "Booking count summary retrieved successfully for admin",
  "data": {
    "summary": {
      "totalBookings": 1000,
      "uniqueUsers": 500,
      "uniquePsychologists": 25,
      "averageBookingsPerUser": 2.0,
      "averageBookingsPerPsychologist": 40.0
    },
    "recentActivity": {
      "recentBookings": 150,
      "todayBookings": 12,
      "thisWeekBookings": 85,
      "thisMonthBookings": 320
    },
    "breakdown": {
      "bookingsByStatus": {
        "pending": 200,
        "confirmed": 300,
        "completed": 250,
        "cancelled": 150,
        "rescheduled": 100
      },
      "bookingsByMethod": {
        "automatic": 600,
        "manual": 400
      }
    },
    "dailyTrend": [
      {
        "_id": "2024-01-08",
        "count": 15
      },
      {
        "_id": "2024-01-09",
        "count": 18
      },
      {
        "_id": "2024-01-10",
        "count": 12
      },
      {
        "_id": "2024-01-11",
        "count": 20
      },
      {
        "_id": "2024-01-12",
        "count": 16
      },
      {
        "_id": "2024-01-13",
        "count": 14
      },
      {
        "_id": "2024-01-14",
        "count": 19
      }
    ]
  }
}
```

---

## Usage Examples

### 1. Get All Pending Bookings

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Get Bookings for Today

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?date=2024-01-15" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Get Bookings for Specific Psychologist

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?psychologistId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Get Automatic Bookings Only

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?bookingMethod=automatic" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Search by Booking ID

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?search=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 6. Get Paginated Results

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?page=2&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Sort by Date (Oldest First)

```bash
curl -X GET "http://localhost:3000/admin/bookings/all?sortBy=date&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Access denied. Admin privileges required."
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Error retrieving all bookings",
  "error": "Database connection error"
}
```

---

## Features

### Comprehensive Filtering
- Filter by booking status
- Filter by specific date
- Filter by psychologist or user
- Filter by booking method (automatic/manual)
- Search by booking ID

### Advanced Pagination
- Configurable page size (1-100 items)
- Page navigation information
- Total count and page statistics

### Flexible Sorting
- Sort by any booking field
- Ascending or descending order
- Default sorting by creation date

### Rich Statistics
- Total bookings count
- Recent activity metrics
- Status breakdown
- Booking method breakdown
- Unique users and psychologists count
- Daily trends (last 7 days)

### Complete Booking Details
- Full user information
- Complete psychologist details with image URLs
- Patient details
- Reschedule history
- Cancellation information
- Timestamps

---

## Use Cases

1. **Admin Dashboard**: Display booking overview and statistics
2. **Reporting**: Generate booking reports with filters
3. **Analytics**: Analyze booking patterns and trends
4. **Support**: Troubleshoot booking issues
5. **Data Export**: Export booking data for external analysis
6. **Monitoring**: Track system usage and performance 