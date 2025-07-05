# Automatic Psychologist Booking System

## Overview
This system automatically matches users to appropriate psychologists based on their questionnaire responses and creates bookings automatically.

## How It Works

### 1. Questionnaire Flow
1. User selects their state
2. User chooses booking type: "Myself", "My child", "Couples", or "My loved ones"
3. User answers follow-up questions
4. System automatically finds and books the best psychologist

### 2. Psychologist Matching Logic
- **Myself** → Counseling Psychologists
- **My child** → Child Psychology Specialists  
- **Couples** → Couples Therapy Specialists
- **My loved ones** → Family Therapy Specialists

### 3. Matching Criteria
1. **Primary**: State location match
2. **Secondary**: Specialization match
3. **Tertiary**: Rating and experience (highest first)
4. **Fallback**: If no match in state, find in other states

## API Endpoints

### User Endpoints
- `GET /states` - Get all Indian states
- `GET /booking-options` - Get booking options (Myself, My child, etc.)
- `GET /specializations` - Get available specializations
- `GET /follow-up/:selectedOption` - Get follow-up questions
- `POST /submit` - Submit questionnaire and auto-book psychologist

### Admin Endpoints
- `GET /admin/psychologists/:specialization` - Get psychologists by specialization
- `GET /admin/booking-stats` - Get booking statistics

## Psychologist Specializations

When adding psychologists, use these exact specializations:
- **Counseling** - For individual adult therapy
- **Child Psychology** - For children and adolescent therapy
- **Couples Therapy** - For relationship and couples counseling
- **Family Therapy** - For family and loved ones counseling

## Database Changes

### Psychologist Model Updates
- `specialization` field now uses enum validation
- Must be one of the 4 predefined categories

### Booking Model Updates
- Added `questionnaireData` field to store user responses
- Added `bookingType` field to track booking category

## Response Format

### Successful Auto-Booking Response
```json
{
  "success": true,
  "message": "Questionnaire submitted and psychologist booked automatically!",
  "questionnaireResponse": { /* saved response */ },
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
    "state": "Karnataka",
    "image": "http://localhost:3000/uploads/psychologist/image.jpg",
    "rating": 4.5,
    "experienceYears": 10,
    "hourlyRate": 1500
  }
}
```

## Error Handling

### No Psychologist Available
If no psychologist is found, the system returns:
```json
{
  "success": true,
  "message": "Questionnaire submitted successfully, but automatic booking failed",
  "questionnaireResponse": { /* saved response */ },
  "bookingError": "No available psychologists found for Counseling",
  "suggestion": "Please contact support for manual booking assistance"
}
```

## Testing

### Test the System
1. Add psychologists with different specializations and states
2. Submit questionnaire with different booking types
3. Verify automatic booking creation
4. Check psychologist matching logic

### Example Test Data
```javascript
// Add a counseling psychologist in Karnataka
{
  name: "Dr. Sarah Johnson",
  specialization: "Counseling",
  state: "Karnataka",
  available: true,
  rating: 4.8,
  experienceYears: 15
}

// Add a child psychologist in Maharashtra  
{
  name: "Dr. Michael Chen",
  specialization: "Child Psychology", 
  state: "Maharashtra",
  available: true,
  rating: 4.6,
  experienceYears: 12
}
```

## Frontend Integration

### Questionnaire Submission
```javascript
const response = await fetch('/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    state: "Karnataka",
    bookingFor: "Myself", 
    followUpAnswers: {
      age: "30 to 45",
      gender: "Female",
      reason: "Anxiety",
      relationship: "Married",
      therapy: "CBT"
    }
  })
});

const result = await response.json();
if (result.success) {
  // Show booking confirmation with psychologist details
  console.log("Booked with:", result.psychologist.name);
}
```

## Maintenance

### Adding New Specializations
1. Update the enum in `psychologist_adding_model.js`
2. Update the mapping in `psychologist_matching_service.js`
3. Update validation in `psychologist_adding_controller.js`

### Monitoring
- Check booking statistics via `/admin/booking-stats`
- Monitor psychologist availability by specialization
- Track matching success rates 
 