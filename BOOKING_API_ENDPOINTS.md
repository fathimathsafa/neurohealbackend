# Booking API Endpoints Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All booking endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 User Booking Endpoints

### 1. Get All User Bookings
**GET** `/my-bookings`

Returns all bookings for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Bookings retrieved successfully",
  "bookings": [
    {
      "id": "booking_id",
      "user": "user_id",
      "psychologist": {
        "id": "psychologist_id",
        "name": "Dr. John Doe",
        "specialization": "Clinical Psychology",
        "clinicName": "Mental Health Clinic",
        "state": "California",
        "image": "http://localhost:3000/uploads/psychologist/image.jpg",
        "rating": 4.5,
        "experienceYears": 10,
        "hourlyRate": 150,
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "time": "10:00 AM",
      "status": "pending",
      "patientDetails": {
        "patientName": "John Smith",
        "contactNumber": "+1234567890",
        "relationWithPatient": "Self",
        "age": 30
      },
      "bookingType": "Myself",
      "questionnaireData": {},
      "rescheduleHistory": [],
      "cancelledAt": null,
      "cancellationReason": null,
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "totalBookings": 5
}
```

---

### 2. Get Pending Bookings Only
**GET** `/bookings/pending`

Returns only pending bookings for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Pending bookings retrieved successfully",
  "bookings": [...],
  "totalPending": 2
}
```

---

### 3. Get Active Bookings
**GET** `/bookings/active`

Returns active bookings (pending, confirmed, rescheduled) for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Active bookings retrieved successfully",
  "bookings": [...],
  "totalActive": 3
}
```

---

### 4. Get Completed Bookings
**GET** `/bookings/completed`

Returns completed bookings for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Completed bookings retrieved successfully",
  "bookings": [...],
  "totalCompleted": 1
}
```

---

### 5. Get Cancelled Bookings
**GET** `/bookings/cancelled`

Returns cancelled bookings for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Cancelled bookings retrieved successfully",
  "bookings": [...],
  "totalCancelled": 1
}
```

---

### 6. Get Rescheduled Bookings
**GET** `/bookings/rescheduled`

Returns rescheduled bookings for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Rescheduled bookings retrieved successfully",
  "bookings": [...],
  "totalRescheduled": 1
}
```

---

### 7. Get Booking History (Detailed)
**GET** `/booking-history`

Returns all bookings with detailed grouping and statistics.

**Response:**
```json
{
  "status": true,
  "message": "Booking history retrieved successfully",
  "bookings": [...],
  "groupedBookings": {
    "pending": [...],
    "confirmed": [...],
    "completed": [...],
    "cancelled": [...],
    "rescheduled": [...]
  },
  "totalBookings": 5,
  "stats": {
    "pending": 2,
    "confirmed": 1,
    "completed": 1,
    "cancelled": 1,
    "rescheduled": 0
  }
}
```

---

### 8. Get Specific Booking by ID
**GET** `/booking/:bookingId`

Returns a specific booking by its ID.

**Parameters:**
- `bookingId` (string): The ID of the booking

**Response:**
```json
{
  "status": true,
  "message": "Booking retrieved successfully",
  "booking": {
    "id": "booking_id",
    "psychologist": {...},
    "date": "2024-01-15T00:00:00.000Z",
    "time": "10:00 AM",
    "status": "pending",
    "patientDetails": {...},
    "createdAt": "2024-01-10T10:00:00.000Z"
  }
}
```

---

### 9. Get Booking Statistics
**GET** `/booking-stats`

Returns booking statistics for the logged-in user.

**Response:**
```json
{
  "status": true,
  "message": "Booking statistics retrieved successfully",
  "stats": {
    "pending": 2,
    "confirmed": 1,
    "completed": 1,
    "cancelled": 1,
    "total": 5
  }
}
```

---

## 📅 Booking Management Endpoints

### 10. Create Booking
**POST** `/book`

Creates a new booking.

**Body:**
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "10:00 AM"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Booking created successfully",
  "booking": {...}
}
```

---

### 11. Create Booking with Patient Details
**POST** `/book-with-details`

Creates a new booking with patient information.

**Body:**
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "10:00 AM",
  "patientDetails": {
    "patientName": "John Smith",
    "contactNumber": "+1234567890",
    "relationWithPatient": "Self",
    "age": 30
  },
  "bookingType": "Myself"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Booking created successfully with patient details",
  "booking": {...}
}
```

---

### 12. Reschedule Booking
**PUT** `/booking/:bookingId/reschedule`

Reschedules an existing booking.

**Parameters:**
- `bookingId` (string): The ID of the booking to reschedule

**Body:**
```json
{
  "newDate": "2024-01-20",
  "newTime": "2:00 PM",
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Booking rescheduled successfully",
  "booking": {...},
  "status": "rescheduled"
}
```

---

### 13. Cancel Booking
**PUT** `/booking/:bookingId/cancel`

Cancels an existing booking.

**Parameters:**
- `bookingId` (string): The ID of the booking to cancel

**Body:**
```json
{
  "reason": "Emergency came up"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Booking cancelled successfully",
  "booking": {...},
  "status": "cancelled"
}
```

---

### 14. Get Reschedule Slots
**GET** `/booking/:bookingId/reschedule-slots`

Gets available slots for rescheduling a specific booking.

**Parameters:**
- `bookingId` (string): The ID of the booking

**Response:**
```json
{
  "status": true,
  "message": "Available reschedule slots retrieved successfully",
  "availableSlots": [
    {
      "date": "2024-01-20",
      "time": "2:00 PM"
    }
  ]
}
```

---

## 🕐 Time Slot Endpoints

### 15. Get Available Dates
**GET** `/psychologist/:psychologistId/available-dates`

Gets available dates for a psychologist.

**Parameters:**
- `psychologistId` (string): The ID of the psychologist

**Response:**
```json
{
  "status": true,
  "message": "Available dates retrieved successfully",
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. John Doe",
    "specialization": "Clinical Psychology",
    "clinicName": "Mental Health Clinic"
  },
  "availableDates": [
    {
      "date": "2024-01-15",
      "dayName": "Monday",
      "availableSlots": 5
    }
  ]
}
```

---

### 16. Get Available Times
**GET** `/psychologist/:psychologistId/available-times/:date`

Gets available time slots for a specific date.

**Parameters:**
- `psychologistId` (string): The ID of the psychologist
- `date` (string): The date in YYYY-MM-DD format

**Response:**
```json
{
  "status": true,
  "message": "Available time slots retrieved successfully",
  "date": "2024-01-15",
  "dayName": "Monday",
  "psychologist": {...},
  "availableSlots": [
    "9:00 AM",
    "10:00 AM",
    "2:00 PM",
    "3:00 PM"
  ]
}
```

---

### 17. Get Time Slots (Alternative)
**GET** `/psychologist/:psychologistId/slots/:date`

Alternative endpoint for getting time slots.

**Parameters:**
- `psychologistId` (string): The ID of the psychologist
- `date` (string): The date in YYYY-MM-DD format

**Response:**
```json
{
  "status": true,
  "message": "Time slots retrieved successfully",
  "slots": [
    "9:00 AM",
    "10:00 AM",
    "2:00 PM",
    "3:00 PM"
  ]
}
```

---

### 18. Get Weekly Slots
**GET** `/psychologist/:psychologistId/weekly-slots`

Gets weekly time slots for a psychologist.

**Parameters:**
- `psychologistId` (string): The ID of the psychologist

**Response:**
```json
{
  "status": true,
  "message": "Weekly slots retrieved successfully",
  "slots": {
    "Monday": ["9:00 AM", "10:00 AM"],
    "Tuesday": ["2:00 PM", "3:00 PM"],
    "Wednesday": ["9:00 AM", "10:00 AM"]
  }
}
```

---

## 🧑‍⚕️ Psychologist Endpoints

### 19. Get All Psychologists
**GET** `/allpsychologist`

Gets all available psychologists.

**Response:**
```json
{
  "status": true,
  "message": "Psychologists retrieved successfully",
  "psychologists": [
    {
      "id": "psychologist_id",
      "name": "Dr. John Doe",
      "specialization": "Clinical Psychology",
      "clinicName": "Mental Health Clinic",
      "state": "California",
      "image": "http://localhost:3000/uploads/psychologist/image.jpg",
      "rating": 4.5,
      "experienceYears": 10,
      "hourlyRate": 150,
      "available": true
    }
  ]
}
```

---

### 20. Get Psychologists by State
**GET** `/psychologists/state/:state`

Gets psychologists filtered by state.

**Parameters:**
- `state` (string): The state name

**Response:**
```json
{
  "status": true,
  "message": "Psychologists in California retrieved successfully",
  "psychologists": [...]
}
```

---

### 21. Get All Available Psychologists
**GET** `/psychologists/all`

Gets all available psychologists with detailed information.

**Response:**
```json
{
  "status": true,
  "message": "All psychologists retrieved successfully",
  "psychologists": [...]
}
```

---

## 📊 Status Values

### Booking Statuses:
- `pending` - Initial booking status
- `confirmed` - Booking confirmed by psychologist
- `completed` - Session completed
- `cancelled` - Booking cancelled
- `rescheduled` - Booking rescheduled

### Patient Relations:
- `Self` - Booking for self
- `Child` - Booking for child
- `Spouse` - Booking for spouse
- `Parent` - Booking for parent
- `Sibling` - Booking for sibling
- `Friend` - Booking for friend
- `Other` - Other relationship

### Booking Types:
- `Myself` - Booking for myself
- `My child` - Booking for my child
- `Couples` - Couples therapy
- `My loved ones` - Booking for loved ones

---

## 🧪 Testing Examples

### Test in Postman:

1. **Login to get token:**
   ```
   POST /api/login
   Body: {
     "email": "user@example.com",
     "password": "password"
   }
   ```

2. **Get all user bookings:**
   ```
   GET /api/my-bookings
   Headers: Authorization: Bearer <token>
   ```

3. **Get pending bookings:**
   ```
   GET /api/bookings/pending
   Headers: Authorization: Bearer <token>
   ```

4. **Get completed bookings:**
   ```
   GET /api/bookings/completed
   Headers: Authorization: Bearer <token>
   ```

5. **Create a booking:**
   ```
   POST /api/book-with-details
   Headers: Authorization: Bearer <token>
   Body: {
     "psychologistId": "psychologist_id",
     "date": "2024-01-15",
     "time": "10:00 AM",
     "patientDetails": {
       "patientName": "John Smith",
       "contactNumber": "+1234567890",
       "relationWithPatient": "Self",
       "age": 30
     },
     "bookingType": "Myself"
   }
   ```

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "status": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error 