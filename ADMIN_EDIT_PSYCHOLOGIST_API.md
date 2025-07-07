# Admin Edit Psychologist API Documentation

This document describes the API endpoints for admin to edit psychologist details.

## Base URL
```
http://localhost:3000
```

## Authentication
All admin endpoints require admin authentication using JWT token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## 1. Get Psychologist Details for Editing

**Endpoint:** `GET /admin/psychologist/:id`

**Description:** Retrieve psychologist details for editing in the admin panel.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter): Psychologist ID

**Example Request:**
```bash
curl -X GET \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Psychologist details retrieved successfully",
  "psychologist": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Dr. Sarah Johnson",
    "username": "sarah.johnson.psy",
    "gender": "Female",
    "email": "sarah.johnson@clinic.com",
    "phone": "+1 (555) 123-4567",
    "specialization": "Clinical Psychology",
    "qualifications": "Ph.D. Clinical Psychology",
    "clinicName": "Mind Wellness Clinic",
    "state": "California",
    "experienceYears": 8,
    "hourlyRate": 150,
    "rating": 4.8,
    "available": true,
    "image": "http://localhost:3000/uploads/psychologist/1751516032805-18.jpg",
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "sessionDuration": 60,
    "breakTime": 15,
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastLogoutAt": "2024-01-15T18:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing admin token
- `404 Not Found`: Psychologist not found
- `500 Internal Server Error`: Server error

---

## 2. Edit Psychologist Details

**Endpoint:** `PUT /admin/psychologist/:id`

**Description:** Update psychologist details by admin.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Parameters:**
- `id` (path parameter): Psychologist ID

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | No | Full name of psychologist |
| `username` | String | No | Unique username |
| `password` | String | No | New password (optional) |
| `gender` | String | No | Gender (Male/Female/Other) |
| `email` | String | No | Email address |
| `phone` | String | No | Phone number |
| `specialization` | String | No | Specialization (Counseling/Child Psychology/Couples Therapy/Family Therapy) |
| `qualifications` | String | No | Professional qualifications |
| `clinicName` | String | No | Name of clinic |
| `state` | String | No | State/location |
| `experienceYears` | Number | No | Years of experience |
| `hourlyRate` | Number | No | Hourly rate in USD |
| `rating` | Number | No | Rating (0-5) |
| `available` | Boolean | No | Availability status |
| `workingDays` | String | No | JSON array of working days |
| `workingHoursStart` | String | No | Start time (HH:MM format) |
| `workingHoursEnd` | String | No | End time (HH:MM format) |
| `sessionDuration` | Number | No | Session duration in minutes |
| `breakTime` | Number | No | Break time between sessions |
| `image` | File | No | Profile image file |

**Note:** All fields are optional. Only the fields you want to update need to be included in the request.

**Example Request (Full Update):**
```bash
curl -X PUT \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'name=Dr. Sarah Johnson' \
  -F 'username=sarah.johnson.psy' \
  -F 'password=newpassword123' \
  -F 'gender=Female' \
  -F 'email=sarah.johnson@clinic.com' \
  -F 'phone=+1 (555) 123-4567' \
  -F 'specialization=Clinical Psychology' \
  -F 'qualifications=Ph.D. Clinical Psychology' \
  -F 'clinicName=Mind Wellness Clinic' \
  -F 'state=California' \
  -F 'experienceYears=8' \
  -F 'hourlyRate=150' \
  -F 'rating=4.8' \
  -F 'available=true' \
  -F 'workingDays=["Monday","Tuesday","Wednesday","Thursday","Friday"]' \
  -F 'workingHoursStart=09:00' \
  -F 'workingHoursEnd=18:00' \
  -F 'sessionDuration=60' \
  -F 'breakTime=15' \
  -F 'image=@/path/to/new-image.jpg'
```

**Example Request (Partial Update - Only Name and Email):**
```bash
curl -X PUT \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'name=Dr. Sarah Johnson Updated' \
  -F 'email=sarah.johnson.updated@clinic.com'
```

**Example Request (Partial Update - Only Hourly Rate):**
```bash
curl -X PUT \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'hourlyRate=175'
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Psychologist updated successfully",
  "psychologist": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Dr. Sarah Johnson",
    "username": "sarah.johnson.psy",
    "gender": "Female",
    "email": "sarah.johnson@clinic.com",
    "phone": "+1 (555) 123-4567",
    "specialization": "Clinical Psychology",
    "qualifications": "Ph.D. Clinical Psychology",
    "clinicName": "Mind Wellness Clinic",
    "state": "California",
    "experienceYears": 8,
    "hourlyRate": 150,
    "rating": 4.8,
    "available": true,
    "image": "http://localhost:3000/uploads/psychologist/1751516032805-18.jpg",
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "sessionDuration": 60,
    "breakTime": 15,
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastLogoutAt": "2024-01-15T18:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No fields provided for update or validation errors
- `401 Unauthorized`: Invalid or missing admin token
- `404 Not Found`: Psychologist not found
- `409 Conflict`: Username or email already taken
- `500 Internal Server Error`: Server error

**Validation Rules:**
1. At least one field must be provided for update
2. `specialization` must be one of: Counseling, Child Psychology, Couples Therapy, Family Therapy (only if provided)
3. `username` and `email` must be unique across all psychologists (only if provided)
4. `experienceYears`, `hourlyRate`, `rating`, `sessionDuration`, `breakTime` must be valid numbers (only if provided)
5. `workingDays` must be a valid JSON array (only if provided)
6. `workingHoursStart` and `workingHoursEnd` must be in HH:MM format (only if provided)

---

## Testing with Postman

### 1. Get Psychologist Details
1. Set method to `GET`
2. URL: `http://localhost:3000/admin/psychologist/:id`
3. Headers:
   - `Authorization`: `Bearer <admin_jwt_token>`
   - `Content-Type`: `application/json`

### 2. Edit Psychologist Details
1. Set method to `PUT`
2. URL: `http://localhost:3000/admin/psychologist/:id`
3. Headers:
   - `Authorization`: `Bearer <admin_jwt_token>`
4. Body: Form-data
   - Add all required fields as key-value pairs
   - For `image`, select "File" type and upload image
   - For `workingDays`, use JSON string: `["Monday","Tuesday","Wednesday","Thursday","Friday"]`

### Example Form Data:
```
name: Dr. Sarah Johnson
username: sarah.johnson.psy
password: newpassword123
gender: Female
email: sarah.johnson@clinic.com
phone: +1 (555) 123-4567
specialization: Clinical Psychology
qualifications: Ph.D. Clinical Psychology
clinicName: Mind Wellness Clinic
state: California
experienceYears: 8
hourlyRate: 150
rating: 4.8
available: true
workingDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
workingHoursStart: 09:00
workingHoursEnd: 18:00
sessionDuration: 60
breakTime: 15
image: [file upload]
```

---

## Frontend Integration

The Flutter frontend can use these endpoints to:

1. **Load psychologist data for editing:**
   - Call `GET /admin/psychologist/:id` to populate form fields
   - Display current image and details

2. **Update psychologist details:**
   - Call `PUT /admin/psychologist/:id` with form data
   - Handle image upload using multipart/form-data
   - Show success/error messages

3. **Form validation:**
   - Validate all required fields before submission
   - Check email format and password confirmation
   - Ensure username/email uniqueness

---

## Security Features

1. **Admin Authentication:** All endpoints require valid admin JWT token
2. **Input Validation:** Comprehensive validation for all fields
3. **Unique Constraints:** Username and email uniqueness checks
4. **File Management:** Automatic old image deletion when new image uploaded
5. **Error Handling:** Detailed error messages for debugging

---

## Notes

- Password is optional during edit - only updated if provided
- Image is optional during edit - only updated if new file uploaded
- Old image is automatically deleted when new image is uploaded
- All timestamps are preserved during updates
- Working days and hours have default values if not provided 