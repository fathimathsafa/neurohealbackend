# Questionnaire and Automatic Booking Flow

## Overview
The backend now supports a two-step process:
1. **Questionnaire Submission** - User completes questionnaire (no automatic booking)
2. **Booking Availability Check** - Frontend checks if automatic booking is possible
3. **Automatic Booking Creation** - User chooses to create automatic booking or not

## API Endpoints

### 1. Submit Questionnaire (No Automatic Booking)
**POST** `/api/questions/submit`

**Request Body:**
```json
{
  "bookingFor": "Myself",
  "followUpAnswers": {
    "question1": "answer1",
    "question2": "answer2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questionnaire submitted successfully!",
  "questionnaireResponse": { /* saved response data */ },
  "canCheckBooking": true
}
```

### 2. Check Booking Availability
**GET** `/api/questions/check-booking-availability`

**Response (if booking is available):**
```json
{
  "canBook": true,
  "message": "Automatic booking is available!",
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. John Doe",
    "specialization": "Clinical Psychology",
    "clinicName": "Mental Health Clinic",
    "state": "Karnataka",
    "image": "/uploads/psychologist/image.jpg",
    "rating": 4.8,
    "experienceYears": 10,
    "hourlyRate": 1500,
    "description": "Experienced psychologist"
  },
  "matchType": "exact_state_match",
  "estimatedTime": "Within 24-48 hours"
}
```

**Response (if booking is not available):**
```json
{
  "canBook": false,
  "message": "No suitable psychologist available in your state at the moment.",
  "reason": "no_psychologist_available",
  "suggestion": "Please try again later or contact support for manual booking assistance."
}
```

### 3. Create Automatic Booking
**POST** `/api/questions/create-automatic-booking`

**Response:**
```json
{
  "success": true,
  "message": "Automatic booking created successfully!",
  "matchType": "exact_state_match",
  "booking": {
    "id": "booking_id",
    "date": "2024-01-15",
    "time": "10:00 AM",
    "status": "confirmed"
  },
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. John Doe",
    "specialization": "Clinical Psychology",
    "clinicName": "Mental Health Clinic",
    "state": "Karnataka",
    "image": "/uploads/psychologist/image.jpg",
    "rating": 4.8,
    "experienceYears": 10,
    "hourlyRate": 1500
  }
}
```

## Frontend Implementation Flow

### Step 1: User completes questionnaire
1. User fills out questionnaire form
2. Frontend calls `POST /api/questions/submit`
3. Show success message: "Questionnaire submitted successfully!"

### Step 2: Check if automatic booking is available
1. After questionnaire submission, call `GET /api/questions/check-booking-availability`
2. If `canBook: true`, show psychologist details and booking option
3. If `canBook: false`, show appropriate message

### Step 3: User chooses to book or not
1. **If user clicks "Yes" (Book Automatically):**
   - Call `POST /api/questions/create-automatic-booking`
   - Show booking confirmation with psychologist details
   - Navigate to booking confirmation screen

2. **If user clicks "No" (Don't Book):**
   - Show message: "No problem! You can book manually later."
   - Navigate to main dashboard or booking screen

## Frontend UI Flow Example

```
Questionnaire Form
       ↓
   Submit Button
       ↓
"Questionnaire submitted successfully!"
       ↓
"Would you like us to automatically book a session for you?"
       ↓
[Show Psychologist Details]
- Name: Dr. John Doe
- Specialization: Clinical Psychology
- Rating: 4.8 ⭐
- Experience: 10 years
- Estimated booking time: Within 24-48 hours
       ↓
[Yes Button] [No Button]
       ↓
If Yes: "Booking created successfully!"
If No: "No problem! You can book manually later."
```

## Error Handling

- **401 Unauthorized**: User not authenticated
- **400 Bad Request**: User already had automatic booking or questionnaire not completed
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

## Notes

- Users can only have **one automatic booking** in their lifetime
- Automatic booking requires completed profile (state must be provided)
- If no psychologist is available in user's state, booking will not be possible
- The system automatically finds the best available psychologist based on state and specialization 