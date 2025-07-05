# Psychologist Booking API Documentation

This document outlines all the API endpoints available for psychologists to manage and view their bookings.

## Authentication

All psychologist endpoints require authentication using the `psychologistAuth` middleware. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Today's Bookings
**GET** `/api/psychologist/bookings/today`

Get all active bookings for the authenticated psychologist for today.

**Response:**
```json
{
  "status": true,
  "message": "Today's bookings retrieved successfully",
  "date": "2024-01-15",
  "dayName": "Monday",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T00:00:00.000Z",
      "time": "09:00",
      "status": "confirmed",
      "bookingType": "Myself",
      "patientDetails": {
        "patientName": "John Doe",
        "contactNumber": "+1234567890",
        "relationWithPatient": "Self",
        "age": 30
      },
      "user": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "totalBookings": 1
}
```

### 2. Get All Bookings (Enhanced)
**GET** `/api/psychologist/bookings/all`

Get all bookings for the authenticated psychologist with filtering, pagination, and statistics.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`, `all`)
- `date` (optional): Filter by specific date (YYYY-MM-DD format)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of bookings per page (default: 20)

**Example Request:**
```
GET /api/psychologist/bookings/all?status=confirmed&page=1&limit=10
```

**Response:**
```json
{
  "status": true,
  "message": "All bookings retrieved successfully",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T00:00:00.000Z",
      "time": "09:00",
      "status": "confirmed",
      "bookingType": "Myself",
      "patientDetails": {
        "patientName": "John Doe",
        "contactNumber": "+1234567890",
        "relationWithPatient": "Self",
        "age": 30
      },
      "user": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
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
    "hasPrevPage": false
  },
  "stats": {
    "pending": 10,
    "confirmed": 25,
    "completed": 50,
    "cancelled": 10,
    "rescheduled": 5,
    "total": 100
  },
  "filters": {
    "status": "confirmed",
    "date": null
  }
}
```

### 3. Get Bookings by Specific Date
**GET** `/api/psychologist/bookings/date/:date`

Get all bookings for the authenticated psychologist for a specific date.

**Parameters:**
- `date`: Date in YYYY-MM-DD format

**Example Request:**
```
GET /api/psychologist/bookings/date/2024-01-15
```

**Response:**
```json
{
  "status": true,
  "message": "Date bookings retrieved successfully",
  "date": "2024-01-15",
  "dayName": "Monday",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T00:00:00.000Z",
      "time": "09:00",
      "status": "confirmed",
      "bookingType": "Myself",
      "patientDetails": {
        "patientName": "John Doe",
        "contactNumber": "+1234567890",
        "relationWithPatient": "Self",
        "age": 30
      },
      "user": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "rescheduleHistory": [],
      "cancelledAt": null,
      "cancellationReason": null,
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "totalBookings": 1,
  "statusBreakdown": {
    "confirmed": 1
  }
}
```

### 4. Get Basic Bookings (Legacy)
**GET** `/api/psychologist/bookings`

Get all bookings for the authenticated psychologist (basic version without filtering).

**Response:**
```json
{
  "status": true,
  "message": "Bookings retrieved successfully",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T00:00:00.000Z",
      "time": "09:00",
      "status": "confirmed",
      "user": {
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

## Booking Status Values

- `pending`: Booking created but not yet confirmed
- `confirmed`: Booking confirmed by psychologist
- `completed`: Session completed
- `cancelled`: Booking cancelled
- `rescheduled`: Booking rescheduled to a different time

## Patient Details Structure

```json
{
  "patientName": "John Doe",
  "contactNumber": "+1234567890",
  "relationWithPatient": "Self|Child|Spouse|Parent|Sibling|Friend|Other",
  "age": 30
}
```

## Booking Types

- `Myself`: User booking for themselves
- `My child`: User booking for their child
- `Couples`: Couples therapy booking
- `My loved ones`: Family therapy booking

## Error Responses

### 400 Bad Request
```json
{
  "status": false,
  "message": "Invalid date format. Use YYYY-MM-DD"
}
```

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Access denied. Invalid token."
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Error retrieving bookings",
  "error": "Error details"
}
```

## Usage Examples

### Get Today's Bookings
```bash
curl -X GET \
  http://localhost:3000/api/psychologist/bookings/today \
  -H 'Authorization: Bearer your_jwt_token'
```

### Get All Confirmed Bookings
```bash
curl -X GET \
  'http://localhost:3000/api/psychologist/bookings/all?status=confirmed&page=1&limit=10' \
  -H 'Authorization: Bearer your_jwt_token'
```

### Get Bookings for Specific Date
```bash
curl -X GET \
  http://localhost:3000/api/psychologist/bookings/date/2024-01-15 \
  -H 'Authorization: Bearer your_jwt_token'
```

## Notes

1. **Authentication**: All endpoints require valid psychologist JWT token
2. **Date Format**: Always use YYYY-MM-DD format for dates
3. **Pagination**: Default page size is 20, maximum recommended is 50
4. **Time Zones**: All dates are stored in UTC, display according to your timezone
5. **Patient Privacy**: Patient details are only included for confirmed and active bookings
6. **Performance**: Use pagination for large datasets to improve response times 