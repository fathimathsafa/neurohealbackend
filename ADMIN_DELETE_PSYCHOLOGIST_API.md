# Admin Delete Psychologist API Documentation

This document describes the API endpoints for admin to delete psychologist profiles.

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

## 1. Delete Psychologist (Safe Delete)

**Endpoint:** `DELETE /admin/psychologist/:id`

**Description:** Delete a psychologist profile. This is a safe delete that prevents deletion if the psychologist has active bookings.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter): Psychologist ID

**Example Request:**
```bash
curl -X DELETE \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Psychologist deleted successfully",
  "deletedPsychologist": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@clinic.com",
    "specialization": "Clinical Psychology",
    "clinicName": "Mind Wellness Clinic",
    "state": "California"
  },
  "summary": {
    "totalBookings": 15,
    "activeBookings": 0,
    "imageDeleted": true
  }
}
```

**Error Responses:**

**400 Bad Request - Active Bookings Exist:**
```json
{
  "status": false,
  "message": "Cannot delete psychologist with active bookings",
  "activeBookingsCount": 3,
  "suggestion": "Please cancel or complete all active bookings before deleting the psychologist"
}
```

**404 Not Found:**
```json
{
  "status": false,
  "message": "Psychologist not found"
}
```

**401 Unauthorized:**
```json
{
  "status": false,
  "message": "Access denied. Admin authentication required."
}
```

**500 Internal Server Error:**
```json
{
  "status": false,
  "message": "Error deleting psychologist",
  "error": "Database connection error"
}
```

---

## 2. Force Delete Psychologist

**Endpoint:** `DELETE /admin/psychologist/:id/force`

**Description:** Force delete a psychologist profile and all associated bookings. This is a destructive operation that permanently removes all data.

**⚠️ WARNING:** This endpoint will permanently delete:
- The psychologist profile
- All bookings associated with the psychologist (including active ones)
- The psychologist's profile image

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter): Psychologist ID

**Example Request:**
```bash
curl -X DELETE \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0/force \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Psychologist and all related data deleted successfully",
  "deletedPsychologist": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@clinic.com",
    "specialization": "Clinical Psychology",
    "clinicName": "Mind Wellness Clinic",
    "state": "California"
  },
  "summary": {
    "totalBookingsDeleted": 15,
    "activeBookingsDeleted": 3,
    "imageDeleted": true,
    "warning": "All bookings associated with this psychologist have been permanently deleted"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "status": false,
  "message": "Psychologist not found"
}
```

**401 Unauthorized:**
```json
{
  "status": false,
  "message": "Access denied. Admin authentication required."
}
```

**500 Internal Server Error:**
```json
{
  "status": false,
  "message": "Error force deleting psychologist",
  "error": "Database connection error"
}
```

---

## Usage Guidelines

### When to Use Safe Delete
- Use the regular delete endpoint when you want to ensure data integrity
- The system will prevent deletion if there are active bookings
- This is the recommended approach for most cases

### When to Use Force Delete
- Use force delete only when you need to completely remove a psychologist and all their data
- This should be used sparingly and with extreme caution
- Consider the impact on users who may have booked sessions with this psychologist

### Pre-deletion Checklist
Before deleting a psychologist, consider:

1. **Check Active Bookings:** Verify if the psychologist has any pending, confirmed, or rescheduled bookings
2. **Notify Users:** If there are active bookings, consider notifying affected users before deletion
3. **Data Backup:** Consider backing up important data before force deletion
4. **Legal Compliance:** Ensure deletion complies with data retention policies

### Post-deletion Actions
After successful deletion:

1. **Update Frontend:** Remove the psychologist from admin listings
2. **Clear Cache:** Clear any cached data related to the deleted psychologist
3. **Audit Log:** Log the deletion action for audit purposes
4. **User Communication:** If users were affected, consider sending notifications

---

## Testing Examples

### Test 1: Safe Delete with No Active Bookings
```bash
# First, get a psychologist ID
curl -X GET \
  http://localhost:3000/allpsychologist \
  -H 'Content-Type: application/json'

# Then delete the psychologist
curl -X DELETE \
  http://localhost:3000/admin/psychologist/PSYCHOLOGIST_ID_HERE \
  -H 'Authorization: Bearer ADMIN_TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

### Test 2: Safe Delete with Active Bookings (Should Fail)
```bash
curl -X DELETE \
  http://localhost:3000/admin/psychologist/PSYCHOLOGIST_WITH_ACTIVE_BOOKINGS \
  -H 'Authorization: Bearer ADMIN_TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

### Test 3: Force Delete (Destructive)
```bash
curl -X DELETE \
  http://localhost:3000/admin/psychologist/PSYCHOLOGIST_ID_HERE/force \
  -H 'Authorization: Bearer ADMIN_TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

### Test 4: Delete Non-existent Psychologist
```bash
curl -X DELETE \
  http://localhost:3000/admin/psychologist/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer ADMIN_TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

---

## Error Handling

The API includes comprehensive error handling for:

- **Authentication Errors:** Invalid or missing admin tokens
- **Authorization Errors:** Non-admin users attempting to delete
- **Validation Errors:** Invalid psychologist IDs
- **Business Logic Errors:** Attempting to delete psychologists with active bookings
- **Database Errors:** Connection issues or data corruption
- **File System Errors:** Issues deleting profile images

All error responses include:
- Clear error messages
- Appropriate HTTP status codes
- Additional context when helpful (e.g., booking counts)
- Suggestions for resolution when applicable 