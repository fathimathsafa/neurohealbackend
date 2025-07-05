# Smart Booking System API Documentation

## Overview
The smart booking system provides different experiences for first-time and returning users:

- **First-time users**: Complete questionnaire → Automatic booking based on state and booking type
- **Returning users**: Browse all psychologists → Manual selection

## User Flow

### First-Time Users
1. Check user status → Shows questionnaire
2. Complete questionnaire → Auto-books appropriate psychologist
3. User becomes returning user

### Returning Users
1. Check user status → Shows psychologist list
2. Browse psychologists → Manual booking

## API Endpoints

### 1. Check User Status
**GET** `/user-status`
- **Auth**: Required (Bearer token)
- **Purpose**: Determine if user is first-time or returning
- **Response**:
```json
{
  "isFirstTimeUser": true,
  "hasCompletedQuestionnaire": false,
  "preferredState": null,
  "preferredSpecialization": null
}
```

### 2. Get States (First-time users)
**GET** `/states`
- **Purpose**: Get list of available states
- **Response**: Array of state names

### 3. Get Booking Options (First-time users)
**GET** `/booking-options`
- **Purpose**: Get booking options (Myself, My child, Couples, My loved ones)
- **Response**: Array of booking options

### 4. Get Follow-up Questions (First-time users)
**GET** `/follow-up/:selectedOption`
- **Purpose**: Get follow-up questions based on booking option
- **Response**: Array of questions with options

### 5. Submit Questionnaire & Auto-Book (First-time users)
**POST** `/submit`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "state": "Kerala",
  "bookingFor": "Myself",
  "followUpAnswers": [
    {"question": "What is your age?", "answer": "18 to 30"},
    {"question": "What is your gender?", "answer": "Male"}
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Questionnaire submitted and psychologist booked automatically!",
  "isFirstTimeUser": false,
  "booking": {
    "id": "booking_id",
    "date": "2024-01-15T10:00:00.000Z",
    "time": "10:00",
    "status": "pending"
  },
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. Sarah Johnson",
    "specialization": "Counseling",
    "clinicName": "Mind Wellness Clinic",
    "state": "Kerala",
    "image": "http://localhost:3000/uploads/psychologist/image.jpg",
    "rating": 4.5,
    "experienceYears": 8,
    "hourlyRate": 150
  }
}
```

### 6. Get All Psychologists (Returning users)
**GET** `/psychologists/all`
- **Auth**: Required (Bearer token)
- **Purpose**: Get all available psychologists for manual selection
- **Response**:
```json
{
  "status": true,
  "message": "All psychologists retrieved successfully",
  "psychologists": [
    {
      "id": "psychologist_id",
      "name": "Dr. Sarah Johnson",
      "specialization": "Counseling",
      "bookingType": "Myself",
      "clinicName": "Mind Wellness Clinic",
      "state": "Kerala",
      "image": "http://localhost:3000/uploads/psychologist/image.jpg",
      "rating": 4.5,
      "experienceYears": 8,
      "hourlyRate": 150
    }
  ]
}
```

### 7. Get Psychologists by State (Returning users)
**GET** `/psychologists/state/:state`
- **Auth**: Required (Bearer token)
- **Purpose**: Get psychologists in a specific state
- **Response**: Same as above but filtered by state

### 8. Manual Booking (Returning users)
**POST** `/book`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "10:00"
}
```

### 9. Get User's Bookings
**GET** `/my-bookings`
- **Auth**: Required (Bearer token)
- **Purpose**: Get all bookings for the authenticated user
- **Response**:
```json
{
  "status": true,
  "message": "Bookings retrieved successfully",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T10:00:00.000Z",
      "time": "10:00",
      "status": "pending",
      "psychologist": {
        "name": "Dr. Sarah Johnson",
        "specialization": "Counseling",
        "image": "http://localhost:3000/uploads/psychologist/image.jpg"
      }
    }
  ]
}
```

### 10. Get Booking History (with reschedule/cancel details)
**GET** `/booking-history`
- **Auth**: Required (Bearer token)
- **Purpose**: Get detailed booking history including reschedule and cancellation information
- **Response**:
```json
{
  "status": true,
  "message": "Booking history retrieved successfully",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2024-01-15T10:00:00.000Z",
      "time": "10:00",
      "status": "rescheduled",
      "bookingType": "Myself",
      "psychologist": {
        "name": "Dr. Sarah Johnson",
        "specialization": "Counseling",
        "image": "http://localhost:3000/uploads/psychologist/image.jpg"
      },
      "rescheduleHistory": [
        {
          "previousDate": "2024-01-10T10:00:00.000Z",
          "previousTime": "10:00",
          "rescheduledAt": "2024-01-08T15:30:00.000Z",
          "reason": "User requested reschedule"
        }
      ],
      "cancelledAt": null,
      "cancellationReason": null
    }
  ]
}
```

### 11. Get Available Reschedule Slots
**GET** `/booking/:bookingId/reschedule-slots`
- **Auth**: Required (Bearer token)
- **Purpose**: Get available time slots for rescheduling a specific booking
- **Response**:
```json
{
  "status": true,
  "message": "Available reschedule slots retrieved successfully",
  "currentBooking": {
    "id": "booking_id",
    "date": "2024-01-15T10:00:00.000Z",
    "time": "10:00",
    "psychologist": "Dr. Sarah Johnson"
  },
  "availableSlots": {
    "2024-01-16": [
      {
        "startTime": "09:00",
        "endTime": "10:00",
        "date": "2024-01-16",
        "dayName": "Tuesday"
      },
      {
        "startTime": "14:00",
        "endTime": "15:00",
        "date": "2024-01-16",
        "dayName": "Tuesday"
      }
    ],
    "2024-01-17": [
      {
        "startTime": "11:00",
        "endTime": "12:00",
        "date": "2024-01-17",
        "dayName": "Wednesday"
      }
    ]
  }
}
```

### 12. Reschedule Booking
**PUT** `/booking/:bookingId/reschedule`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "newDate": "2024-01-16",
  "newTime": "14:00",
  "reason": "Schedule conflict"
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Booking rescheduled successfully",
  "booking": {
    "id": "booking_id",
    "date": "2024-01-16T14:00:00.000Z",
    "time": "14:00",
    "status": "rescheduled",
    "psychologist": "Dr. Sarah Johnson"
  }
}
```

### 13. Cancel Booking
**PUT** `/booking/:bookingId/cancel`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "reason": "Emergency came up"
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "booking_id",
    "status": "cancelled",
    "cancelledAt": "2024-01-10T15:30:00.000Z",
    "cancellationReason": "Emergency came up",
    "psychologist": "Dr. Sarah Johnson"
  }
}
```

## Postman Testing Guide

### Step 1: Setup Authentication
1. **Login/Register User**
   ```
   POST http://localhost:3000/login
   Body (JSON):
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
2. **Copy the token** from the response and set it in your Postman environment variable `authToken`

### Step 2: Create a Test Booking
1. **Check User Status**
   ```
   GET http://localhost:3000/user-status
   Headers: Authorization: Bearer {{authToken}}
   ```

2. **If first-time user, complete questionnaire**
   ```
   POST http://localhost:3000/submit
   Headers: Authorization: Bearer {{authToken}}
   Body (JSON):
   {
     "state": "Kerala",
     "bookingFor": "Myself",
     "followUpAnswers": [
       {"question": "What is your age?", "answer": "18 to 30"},
       {"question": "What is your gender?", "answer": "Male"}
     ]
   }
   ```

3. **If returning user, create manual booking**
   ```
   POST http://localhost:3000/book
   Headers: Authorization: Bearer {{authToken}}
   Body (JSON):
   {
     "psychologistId": "psychologist_id_here",
     "date": "2024-01-15",
     "time": "10:00"
   }
   ```

### Step 3: Test Reschedule Functionality

1. **Get User's Bookings** (to find booking ID)
   ```
   GET http://localhost:3000/my-bookings
   Headers: Authorization: Bearer {{authToken}}
   ```
   - Copy a booking ID from the response

2. **Get Available Reschedule Slots**
   ```
   GET http://localhost:3000/booking/{{bookingId}}/reschedule-slots
   Headers: Authorization: Bearer {{authToken}}
   ```
   - This shows available slots for the next 7 days
   - Note down a date and time from the available slots

3. **Reschedule the Booking**
   ```
   PUT http://localhost:3000/booking/{{bookingId}}/reschedule
   Headers: Authorization: Bearer {{authToken}}
   Body (JSON):
   {
     "newDate": "2024-01-16",
     "newTime": "14:00",
     "reason": "Schedule conflict"
   }
   ```

### Step 4: Test Cancel Functionality

1. **Cancel a Booking**
   ```
   PUT http://localhost:3000/booking/{{bookingId}}/cancel
   Headers: Authorization: Bearer {{authToken}}
   Body (JSON):
   {
     "reason": "Emergency came up"
   }
   ```

### Step 5: Verify Changes

1. **Check Booking History**
   ```
   GET http://localhost:3000/booking-history
   Headers: Authorization: Bearer {{authToken}}
   ```
   - This will show all bookings with reschedule history and cancellation details

2. **Check Updated Bookings**
   ```
   GET http://localhost:3000/my-bookings
   Headers: Authorization: Bearer {{authToken}}
   ```
   - This will show current booking status

## Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:
- `baseUrl`: `http://localhost:3000`
- `authToken`: (set after login)

### Collection Structure
```
📁 NeuroHeal Booking API
├── 🔐 Authentication
│   ├── Login User
│   └── Register User
├── 📋 User Status & Questionnaire
│   ├── Check User Status
│   ├── Get States
│   ├── Get Booking Options
│   ├── Get Follow-up Questions
│   └── Submit Questionnaire
├── 👨‍⚕️ Psychologist Management
│   ├── Get All Psychologists
│   ├── Get Psychologists by State
│   └── Get Psychologist Slots
├── 📅 Booking Management
│   ├── Create Booking
│   ├── Get My Bookings
│   ├── Get Booking by ID
│   └── Get Booking Stats
├── 🔄 Reschedule & Cancel
│   ├── Get Reschedule Slots
│   ├── Reschedule Booking
│   ├── Cancel Booking
│   └── Get Booking History
└── 🧪 Debug & Testing
    ├── Debug Psychologists
    └── Test Endpoints
```

## Testing Scenarios

### Scenario 1: First-time User Flow
1. Register new user
2. Check user status → Should show `isFirstTimeUser: true`
3. Complete questionnaire → Should auto-book
4. Check bookings → Should show pending booking
5. Test reschedule → Should show available slots
6. Reschedule booking → Should update booking
7. Check history → Should show reschedule history

### Scenario 2: Returning User Flow
1. Login existing user
2. Check user status → Should show `isFirstTimeUser: false`
3. Get all psychologists → Should show psychologist list
4. Create manual booking → Should create booking
5. Test cancel → Should cancel booking
6. Check history → Should show cancellation details

### Scenario 3: Edge Cases
1. **Try to reschedule non-existent booking** → Should return 404
2. **Try to reschedule to unavailable slot** → Should return 400
3. **Try to cancel already cancelled booking** → Should return 404
4. **Try to reschedule cancelled booking** → Should return 404

## Error Responses

### 404 - Booking Not Found
```json
{
  "status": false,
  "message": "Booking not found or cannot be rescheduled"
}
```

### 400 - Invalid Slot
```json
{
  "status": false,
  "message": "Selected time slot is not available"
}
```

### 400 - Missing Fields
```json
{
  "status": false,
  "message": "New date and time are required"
}
```

## Smart Matching Logic

### First-Time User Matching Priority:
1. **Exact match**: State + Specialization
   - Kerala + Myself → Counseling psychologist in Kerala
   - Kerala + My child → Child Psychology psychologist in Kerala
   - Kerala + Couples → Couples Therapy psychologist in Kerala

2. **State match**: Any psychologist in user's state
   - If no exact specialization in state, show any available psychologist in the same state

3. **No match**: No psychologists in user's state
   - If no psychologists available in user's state, only save questionnaire (no booking)
   - User becomes returning user and can browse all psychologists manually

### Booking Type to Specialization Mapping:
- "Myself" → "Counseling"
- "My child" → "Child Psychology"
- "Couples" → "Couples Therapy"
- "My loved ones" → "Family Therapy"

## Error Handling

### No Psychologists in State
```json
{
  "success": true,
  "message": "No psychologists available in Kerala. Your questionnaire has been saved.",
  "isFirstTimeUser": false,
  "matchType": "no_match",
  "questionnaireResponse": {...},
  "booking": null,
  "psychologist": null
}
```

### No Available Psychologists
```json
{
  "success": false,
  "message": "No psychologists available at the moment. Please try again later."
}
```

## Testing Examples

### First-Time User Flow:
1. Register/Login user
2. GET `/user-status` → `isFirstTimeUser: true`
3. GET `/states` → Get state list
4. GET `/booking-options` → Get booking options
5. GET `/follow-up/Myself` → Get questions for "Myself"
6. POST `/submit` → Auto-book with questionnaire data

### Returning User Flow:
1. Login user
2. GET `/user-status` → `isFirstTimeUser: false`
3. GET `/psychologists/all` → Browse all psychologists
4. POST `/book` → Manual booking

## Frontend Integration

### Check User Type:
```javascript
const checkUserType = async () => {
  const response = await fetch('/user-status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.isFirstTimeUser;
};
```

### Reschedule Booking:
```javascript
const rescheduleBooking = async (bookingId, newDate, newTime, reason) => {
  const response = await fetch(`/booking/${bookingId}/reschedule`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newDate,
      newTime,
      reason
    })
  });
  return response.json();
};
```

### Cancel Booking:
```javascript
const cancelBooking = async (bookingId, reason) => {
  const response = await fetch(`/booking/${bookingId}/cancel`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  return response.json();
};
``` 