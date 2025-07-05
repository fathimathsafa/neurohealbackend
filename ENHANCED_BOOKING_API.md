# Enhanced Booking System API Documentation

## Overview
The enhanced booking system allows users to book psychologists with detailed patient information and a step-by-step date/time selection process.

## Booking Flow
1. **Patient Details Form**: Enter patient name, contact, relation, age
2. **Date Selection**: Choose from available dates (next 14 days)
3. **Time Selection**: Select available time slots for chosen date
4. **Submit Booking**: Complete booking with all details

## API Endpoints

### 1. Get Available Dates for Psychologist
**GET** `/psychologist/:psychologistId/available-dates`
- **Auth**: Required (Bearer token)
- **Purpose**: Get available dates for the next 14 days
- **Response**:
```json
{
  "status": true,
  "message": "Available dates retrieved successfully",
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. Sarah Johnson",
    "specialization": "Counseling",
    "clinicName": "Mind Wellness Clinic"
  },
  "availableDates": [
    {
      "date": "2024-01-15",
      "dayName": "Monday",
      "availableSlots": 8
    },
    {
      "date": "2024-01-16", 
      "dayName": "Tuesday",
      "availableSlots": 6
    }
  ]
}
```

### 2. Get Available Times for Specific Date
**GET** `/psychologist/:psychologistId/available-times/:date`
- **Auth**: Required (Bearer token)
- **Purpose**: Get available time slots for a specific date
- **Response**:
```json
{
  "status": true,
  "message": "Available time slots retrieved successfully",
  "date": "2024-01-15",
  "dayName": "Monday",
  "psychologist": {
    "id": "psychologist_id",
    "name": "Dr. Sarah Johnson",
    "specialization": "Counseling",
    "clinicName": "Mind Wellness Clinic"
  },
  "availableSlots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "date": "2024-01-15",
      "dayName": "Monday"
    },
    {
      "startTime": "10:15",
      "endTime": "11:15", 
      "date": "2024-01-15",
      "dayName": "Monday"
    }
  ]
}
```

### 3. Create Booking with Patient Details
**POST** `/book-with-details`
- **Auth**: Required (Bearer token)
- **Purpose**: Create booking with complete patient information
- **Body**:
```json
{
  "psychologistId": "psychologist_id",
  "date": "2024-01-15",
  "time": "09:00",
  "patientDetails": {
    "patientName": "John Doe",
    "contactNumber": "+91-9876543210",
    "relationWithPatient": "Self",
    "age": 25
  }
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Booking created successfully with patient details",
  "booking": {
    "id": "booking_id",
    "date": "2024-01-15T09:00:00.000Z",
    "time": "09:00",
    "status": "pending",
    "patientDetails": {
      "patientName": "John Doe",
      "contactNumber": "+91-9876543210",
      "relationWithPatient": "Self",
      "age": 25
    },
    "createdAt": "2024-01-10T15:30:00.000Z"
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

## Patient Details Schema

### Required Fields
- **patientName**: String (required)
- **contactNumber**: String (required)
- **relationWithPatient**: String (required, enum)
- **age**: Number (required, 1-120)

### Relation Options
- "Self"
- "Child" 
- "Spouse"
- "Parent"
- "Sibling"
- "Friend"
- "Other"

## Frontend Integration Example

### Step 1: Get Available Dates
```javascript
const getAvailableDates = async (psychologistId) => {
  const response = await fetch(`/psychologist/${psychologistId}/available-dates`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.availableDates;
};
```

### Step 2: Get Available Times for Selected Date
```javascript
const getAvailableTimes = async (psychologistId, date) => {
  const response = await fetch(`/psychologist/${psychologistId}/available-times/${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.availableSlots;
};
```

### Step 3: Create Booking with Details
```javascript
const createBookingWithDetails = async (bookingData) => {
  const response = await fetch('/book-with-details', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });
  return response.json();
};
```

## Complete Frontend Flow Example

```javascript
// 1. Patient Details Form
const patientDetails = {
  patientName: "John Doe",
  contactNumber: "+91-9876543210", 
  relationWithPatient: "Self",
  age: 25
};

// 2. Get available dates
const dates = await getAvailableDates(psychologistId);
console.log('Available dates:', dates);

// 3. User selects a date
const selectedDate = "2024-01-15";

// 4. Get available times for selected date
const times = await getAvailableTimes(psychologistId, selectedDate);
console.log('Available times:', times);

// 5. User selects a time
const selectedTime = "09:00";

// 6. Create booking
const bookingData = {
  psychologistId: psychologistId,
  date: selectedDate,
  time: selectedTime,
  patientDetails: patientDetails
};

const result = await createBookingWithDetails(bookingData);
console.log('Booking created:', result);
```

## Postman Testing Guide

### Step 1: Setup Authentication
```bash
POST http://localhost:3000/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

### Step 2: Get Available Dates
```bash
GET http://localhost:3000/psychologist/PSYCHOLOGIST_ID/available-dates
Headers: Authorization: Bearer YOUR_TOKEN
```

### Step 3: Get Available Times for a Date
```bash
GET http://localhost:3000/psychologist/PSYCHOLOGIST_ID/available-times/2024-01-15
Headers: Authorization: Bearer YOUR_TOKEN
```

### Step 4: Create Booking with Details
```bash
POST http://localhost:3000/book-with-details
Headers: 
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
Body: {
  "psychologistId": "PSYCHOLOGIST_ID",
  "date": "2024-01-15",
  "time": "09:00",
  "patientDetails": {
    "patientName": "John Doe",
    "contactNumber": "+91-9876543210",
    "relationWithPatient": "Self",
    "age": 25
  }
}
```

## Error Responses

### 404 - Psychologist Not Found
```json
{
  "status": false,
  "message": "Psychologist not found"
}
```

### 400 - Missing Required Fields
```json
{
  "status": false,
  "message": "All fields are required: psychologistId, date, time, and patientDetails"
}
```

### 400 - Invalid Patient Details
```json
{
  "status": false,
  "message": "Patient details incomplete: name, contact, relation, and age are required"
}
```

### 400 - Invalid Age
```json
{
  "status": false,
  "message": "Age must be between 1 and 120"
}
```

### 400 - Slot Not Available
```json
{
  "status": false,
  "message": "Selected time slot is no longer available"
}
```

## Database Schema Updates

### Booking Model Changes
```javascript
// New patient details fields added
patientDetails: {
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  relationWithPatient: {
    type: String,
    required: true,
    enum: ['Self', 'Child', 'Spouse', 'Parent', 'Sibling', 'Friend', 'Other'],
    default: 'Self'
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  }
}
```

## Validation Rules

### Patient Name
- Required
- String
- Trimmed (no leading/trailing spaces)

### Contact Number
- Required
- String
- Trimmed
- Can include country code and special characters

### Relation with Patient
- Required
- Must be one of: Self, Child, Spouse, Parent, Sibling, Friend, Other
- Default: "Self"

### Age
- Required
- Number
- Must be between 1 and 120
- Integer validation

## Booking Status Flow

1. **pending** - Initial booking status
2. **confirmed** - Psychologist confirms booking
3. **completed** - Session completed
4. **cancelled** - Booking cancelled
5. **rescheduled** - Booking rescheduled

## Time Slot Logic

### Working Days
- Psychologists have specific working days
- Only shows dates where psychologist works

### Session Duration
- Each session has a fixed duration (default: 60 minutes)
- Break time between sessions (default: 15 minutes)

### Availability Check
- Checks existing bookings for the date
- Filters out already booked time slots
- Only shows truly available slots

## Testing Scenarios

### Scenario 1: Complete Booking Flow
1. Get available dates → Should show next 14 days with available slots
2. Select a date → Get available times for that date
3. Select a time → Create booking with patient details
4. Verify booking → Check booking was created with all details

### Scenario 2: Validation Testing
1. Try booking without patient details → Should return 400 error
2. Try booking with invalid age → Should return 400 error
3. Try booking with missing fields → Should return 400 error
4. Try booking already booked slot → Should return 400 error

### Scenario 3: Edge Cases
1. Book for different relations (Self, Child, Spouse, etc.)
2. Book with different age ranges
3. Book on different days of the week
4. Book at different times of day

## Frontend UI Suggestions

### Step 1: Patient Details Form
```html
<form>
  <input type="text" placeholder="Patient Name" required>
  <input type="tel" placeholder="Contact Number" required>
  <select required>
    <option value="">Select Relation</option>
    <option value="Self">Self</option>
    <option value="Child">Child</option>
    <option value="Spouse">Spouse</option>
    <!-- ... other options -->
  </select>
  <input type="number" placeholder="Age" min="1" max="120" required>
</form>
```

### Step 2: Date Selection
```html
<div class="date-grid">
  <!-- Show available dates as clickable cards -->
  <div class="date-card" onclick="selectDate('2024-01-15')">
    <div class="date">15</div>
    <div class="day">Monday</div>
    <div class="slots">8 slots available</div>
  </div>
</div>
```

### Step 3: Time Selection
```html
<div class="time-grid">
  <!-- Show available times as clickable buttons -->
  <button onclick="selectTime('09:00')">09:00 AM</button>
  <button onclick="selectTime('10:15')">10:15 AM</button>
  <button onclick="selectTime('11:30')">11:30 AM</button>
</div>
```

### Step 4: Submit Booking
```html
<button onclick="submitBooking()" class="submit-btn">
  Confirm Booking
</button>
```

## Security Considerations

### Input Validation
- All patient details are validated server-side
- Age range validation (1-120)
- Contact number format validation
- Relation enum validation

### Authentication
- All endpoints require valid JWT token
- User can only book for themselves
- Booking ownership verification

### Data Sanitization
- Patient names are trimmed
- Contact numbers are trimmed
- Age is converted to integer

## Performance Optimizations

### Caching
- Available dates can be cached for 5 minutes
- Available times can be cached for 2 minutes
- Reduces database queries

### Database Indexing
- Index on psychologist + date for faster slot queries
- Index on user + date for faster booking queries
- Index on status for filtering

### Pagination
- For large datasets, implement pagination
- Limit results to reasonable numbers
- Use cursor-based pagination for better performance 