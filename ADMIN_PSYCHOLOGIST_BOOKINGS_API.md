# Admin Psychologist Bookings API Documentation

## Get All Booking Details for a Specific Psychologist

This endpoint allows admins to retrieve all booking details for a specific psychologist with comprehensive filtering, pagination, and statistics.

### Endpoint
```
GET /admin/psychologist/:psychologistId/bookings
```

### Authentication
- **Required**: Admin JWT token
- **Header**: `Authorization: Bearer <admin_token>`

### URL Parameters
- `psychologistId` (string, required): The ID of the psychologist

### Query Parameters
- `status` (string, optional): Filter by booking status
  - Values: `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`, `all`
  - Default: `all`
- `date` (string, optional): Filter by specific date (YYYY-MM-DD format)
- `page` (number, optional): Page number for pagination
  - Default: `1`
- `limit` (number, optional): Number of bookings per page
  - Default: `20`
  - Maximum: `100`
- `sortBy` (string, optional): Field to sort by
  - Values: `createdAt`, `date`, `time`, `status`
  - Default: `createdAt`
- `sortOrder` (string, optional): Sort order
  - Values: `asc`, `desc`
  - Default: `desc`
- `search` (string, optional): Search in booking ID or patient name

### Response Format

#### Success Response (200)
```json
{
  "status": true,
  "message": "Psychologist booking details retrieved successfully",
  "data": {
    "psychologist": {
      "id": "psychologist_id",
      "name": "Dr. John Doe",
      "specialization": "Counseling",
      "state": "California",
      "clinicName": "Mental Health Clinic",
      "rating": 4.8,
      "experienceYears": 10,
      "hourlyRate": 150,
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "available": true
    },
    "bookings": [
      {
        "id": "booking_id",
        "date": "2024-01-15T00:00:00.000Z",
        "time": "10:00 AM",
        "status": "confirmed",
        "bookingType": "Myself",
        "bookingMethod": "manual",
        "patientDetails": {
          "patientName": "Jane Smith",
          "contactNumber": "+1234567890",
          "relationWithPatient": "Self",
          "age": 25
        },
        "user": {
          "id": "user_id",
          "fullName": "Jane Smith",
          "email": "jane@example.com",
          "phone": "+1234567890"
        },
        "rescheduleHistory": [],
        "cancelledAt": null,
        "cancellationReason": null,
        "createdAt": "2024-01-10T10:30:00.000Z",
        "updatedAt": "2024-01-10T10:30:00.000Z"
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
      "recentBookings": 15,
      "todayBookings": 3,
      "thisWeekBookings": 12,
      "thisMonthBookings": 45,
      "uniqueUsers": 75,
      "bookingsByStatus": {
        "pending": 10,
        "confirmed": 25,
        "completed": 50,
        "cancelled": 10,
        "rescheduled": 5
      },
      "bookingsByMethod": {
        "manual": 60,
        "automatic": 40
      }
    },
    "filters": {
      "status": "all",
      "date": null,
      "search": null
    },
    "sorting": {
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid psychologist ID
```json
{
  "status": false,
  "message": "Psychologist ID is required"
}
```

**404 Not Found** - Psychologist not found
```json
{
  "status": false,
  "message": "Psychologist not found"
}
```

**401 Unauthorized** - Invalid or missing admin token
```json
{
  "status": false,
  "message": "Access denied. Admin privileges required."
}
```

**500 Internal Server Error**
```json
{
  "status": false,
  "message": "Error retrieving psychologist booking details",
  "error": "Error details"
}
```

### Example Usage

#### Get all bookings for a psychologist
```bash
curl -X GET \
  "http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0/bookings" \
  -H "Authorization: Bearer your_admin_token"
```

#### Get pending bookings only
```bash
curl -X GET \
  "http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0/bookings?status=pending" \
  -H "Authorization: Bearer your_admin_token"
```

#### Get bookings for a specific date
```bash
curl -X GET \
  "http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0/bookings?date=2024-01-15" \
  -H "Authorization: Bearer your_admin_token"
```

#### Get bookings with pagination and search
```bash
curl -X GET \
  "http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0/bookings?page=2&limit=10&search=Jane&sortBy=date&sortOrder=asc" \
  -H "Authorization: Bearer your_admin_token"
```

### Features

1. **Comprehensive Booking Details**: Returns complete booking information including patient details, user information, and booking history.

2. **Advanced Filtering**: Filter by status, date, and search in booking ID or patient name.

3. **Pagination**: Supports pagination with customizable page size and page number.

4. **Sorting**: Sort by various fields in ascending or descending order.

5. **Statistics**: Provides comprehensive statistics including:
   - Total bookings
   - Recent bookings (last 30 days)
   - Today's bookings
   - This week's bookings
   - This month's bookings
   - Unique users count
   - Bookings by status
   - Bookings by method (manual/automatic)

6. **Psychologist Information**: Includes complete psychologist details in the response.

7. **Search Functionality**: Search through booking IDs and patient names.

### Notes

- This endpoint requires admin privileges
- The response includes both booking details and comprehensive statistics
- Pagination is handled automatically with metadata
- All dates are returned in ISO format
- The endpoint validates the psychologist ID and returns appropriate error messages
- Search is case-insensitive and supports partial matches 