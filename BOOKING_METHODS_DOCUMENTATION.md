# Booking Methods Documentation

## Overview
The system supports two distinct booking methods:

1. **Automatic Booking** - Based on questionnaire responses (no patient details required)
2. **Manual Booking** - Traditional booking with patient details

## 1. Automatic Booking (Questionnaire-Based)

### How It Works
- User completes questionnaire with state, booking type, and follow-up questions
- System automatically matches best psychologist based on location and specialization
- Creates booking without requiring patient details (age, contact, name, etc.)
- Uses questionnaire data for booking information

### API Endpoint
```
POST /api/submit
```

### Request Body
```json
{
  "state": "Kerala",
  "bookingFor": "Myself",
  "followUpAnswers": {
    "0": "18 to 30",
    "1": "Male", 
    "2": "Stress",
    "3": "Unmarried",
    "4": "Talk Therapy"
  }
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Found Counseling psychologist in Kerala",
  "isFirstTimeUser": false,
  "matchType": "exact",
  "questionnaireResponse": {
    "userId": "user_id",
    "state": "Kerala",
    "bookingFor": "Myself",
    "followUpAnswers": { /* user responses */ }
  },
  "booking": {
    "id": "booking_id",
    "date": "2024-01-15T10:00:00.000Z",
    "time": "10:00 AM",
    "status": "pending"
  },
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. John Doe",
    "specialization": "Counseling",
    "clinicName": "Mental Health Clinic",
    "state": "Kerala",
    "image": "http://localhost:3001/uploads/psychologist/image.jpg",
    "rating": 4.5,
    "experienceYears": 10,
    "hourlyRate": 1500
  }
}
```

### Response (No Psychologist Available)
```json
{
  "success": true,
  "message": "No psychologists available in Kerala. Your questionnaire has been saved.",
  "isFirstTimeUser": false,
  "matchType": "no_match",
  "questionnaireResponse": { /* saved response */ },
  "booking": null,
  "psychologist": null
}
```

### Database Fields for Automatic Booking
- `bookingMethod`: "automatic"
- `questionnaireData`: Contains all questionnaire responses
- `bookingType`: "Myself", "My child", "Couples", "My loved ones"
- `patientDetails`: **NOT REQUIRED** (validation skipped)

## 2. Manual Booking (Traditional)

### How It Works
- User manually selects psychologist, date, and time
- User provides patient details (name, contact, age, relationship)
- System validates all required fields
- Creates booking with complete patient information

### API Endpoints

#### Get Available Dates
```
GET /api/psychologist/:psychologistId/available-dates
```

#### Get Available Times
```
GET /api/psychologist/:psychologistId/available-times/:date
```

#### Create Manual Booking
```
POST /api/book-with-details
```

### Request Body for Manual Booking
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "10:00 AM",
  "patientDetails": {
    "patientName": "John Doe",
    "contactNumber": "+91 9876543210",
    "relationWithPatient": "Self",
    "age": 25
  }
}
```

### Response (Success)
```json
{
  "status": true,
  "message": "Booking created successfully with patient details",
  "booking": {
    "id": "booking_id",
    "date": "2024-01-15T10:00:00.000Z",
    "time": "10:00 AM",
    "status": "pending",
    "patientDetails": {
      "patientName": "John Doe",
      "contactNumber": "+91 9876543210",
      "relationWithPatient": "Self",
      "age": 25
    },
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. Sarah Johnson",
    "specialization": "Counseling",
    "clinicName": "Mental Health Clinic",
    "state": "Karnataka",
    "image": "http://localhost:3001/uploads/psychologist/image.jpg",
    "rating": 4.8,
    "experienceYears": 15,
    "hourlyRate": 2000
  }
}
```

### Database Fields for Manual Booking
- `bookingMethod`: "manual"
- `patientDetails`: **REQUIRED** (all fields validated)
  - `patientName`: String (required)
  - `contactNumber`: String (required)
  - `relationWithPatient`: Enum (required)
  - `age`: Number 1-120 (required)
- `questionnaireData`: Not used
- `bookingType`: Not used

## 3. Simple Manual Booking (Legacy)

### API Endpoint
```
POST /api/book
```

### Request Body
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "10:00 AM"
}
```

**Note**: This method still requires patient details in the database model, so it's recommended to use `/api/book-with-details` instead.

## 4. Validation Rules

### Automatic Booking Validation
- ✅ `questionnaireData` required
- ✅ `bookingType` required
- ❌ `patientDetails` NOT required
- ✅ `bookingMethod` = "automatic"

### Manual Booking Validation
- ❌ `questionnaireData` NOT required
- ❌ `bookingType` NOT required
- ✅ `patientDetails` required (all fields)
- ✅ `bookingMethod` = "manual"

## 5. Frontend Integration Examples

### Automatic Booking Flow
```javascript
// 1. Submit questionnaire
const questionnaireResponse = await fetch('/api/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    state: "Kerala",
    bookingFor: "Myself",
    followUpAnswers: {
      "0": "18 to 30",
      "1": "Male",
      "2": "Stress",
      "3": "Unmarried", 
      "4": "Talk Therapy"
    }
  })
});

const result = await questionnaireResponse.json();

if (result.success && result.booking) {
  // Automatic booking successful
  console.log("Booked with:", result.psychologist.name);
  console.log("Booking ID:", result.booking.id);
} else {
  // No psychologist available, show manual booking option
  console.log("No automatic booking, use manual booking");
}
```

### Manual Booking Flow
```javascript
// 1. Get available dates
const datesResponse = await fetch(`/api/psychologist/${psychologistId}/available-dates`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Get available times for selected date
const timesResponse = await fetch(`/api/psychologist/${psychologistId}/available-times/${selectedDate}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Create manual booking
const bookingResponse = await fetch('/api/book-with-details', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    psychologistId: psychologistId,
    date: selectedDate,
    time: selectedTime,
    patientDetails: {
      patientName: "John Doe",
      contactNumber: "+91 9876543210",
      relationWithPatient: "Self",
      age: 25
    }
  })
});
```

## 6. Error Handling

### Automatic Booking Errors
```json
{
  "success": true,
  "message": "Questionnaire submitted successfully, but automatic booking failed",
  "questionnaireResponse": { /* saved response */ },
  "bookingError": "No available psychologists found for Counseling",
  "suggestion": "Please contact support for manual booking assistance"
}
```

### Manual Booking Errors
```json
{
  "status": false,
  "message": "Patient details incomplete: name, contact, relation, and age are required"
}
```

## 7. Use Cases

### When to Use Automatic Booking
- First-time users
- Users who prefer guided booking
- Users who want quick booking without filling forms
- Users who don't mind automatic psychologist selection

### When to Use Manual Booking
- Returning users who know their preferred psychologist
- Users who want to choose specific psychologist
- Users who need to book for someone else
- Users who want more control over booking details

## 8. Database Schema Changes

The booking model now supports both methods:

```javascript
const bookingSchema = new mongoose.Schema({
  // ... other fields ...
  
  // Patient details (required only for manual booking)
  patientDetails: {
    patientName: {
      type: String,
      required: function() {
        return !this.questionnaireData; // Only required if no questionnaire data
      }
    },
    // ... other patient detail fields with same conditional validation
  },
  
  // Questionnaire data (for automatic booking)
  questionnaireData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Booking method
  bookingMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true,
    default: 'manual'
  }
});
```

This design ensures that:
- Automatic bookings don't require patient details
- Manual bookings require complete patient information
- Both methods work independently
- Database validation is conditional based on booking type 