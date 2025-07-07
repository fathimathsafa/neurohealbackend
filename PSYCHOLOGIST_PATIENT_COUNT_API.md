# Psychologist Patient Count API Documentation

This document describes the API endpoints for psychologists to view their patient count statistics and patient lists.

## Authentication

All endpoints require psychologist authentication using JWT token in the Authorization header:
```
Authorization: Bearer <psychologist_jwt_token>
```

## Endpoints

### 1. Get Patient Count Statistics

**Endpoint:** `GET /api/psychologist/patients/count`

**Description:** Returns comprehensive statistics about the psychologist's patients including total unique patients, patients by status, booking method, and recent patients.

**Headers:**
```
Authorization: Bearer <psychologist_jwt_token>
```

**Response:**
```json
{
  "status": true,
  "message": "Patient count statistics retrieved successfully",
  "data": {
    "totalUniquePatients": 25,
    "recentPatients": 8,
    "patientsByStatus": {
      "pending": 5,
      "confirmed": 12,
      "completed": 15,
      "cancelled": 3,
      "rescheduled": 2
    },
    "patientsByBookingMethod": {
      "automatic": 18,
      "manual": 7
    }
  }
}
```

**Response Fields:**
- `totalUniquePatients`: Total number of unique patients who have booked with this psychologist
- `recentPatients`: Number of unique patients who booked in the last 30 days
- `patientsByStatus`: Breakdown of patients by booking status
- `patientsByBookingMethod`: Breakdown of patients by booking method (automatic vs manual)

### 2. Get Patient List with Details

**Endpoint:** `GET /api/psychologist/patients/list`

**Description:** Returns a paginated list of patients with detailed information about their bookings.

**Headers:**
```
Authorization: Bearer <psychologist_jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by booking status (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`)
- `bookingMethod` (optional): Filter by booking method (`automatic`, `manual`)
- `limit` (optional): Number of patients per page (default: 50, max: 100)
- `page` (optional): Page number (default: 1)

**Example Request:**
```
GET /api/psychologist/patients/list?status=confirmed&bookingMethod=automatic&limit=20&page=1
```

**Response:**
```json
{
  "status": true,
  "message": "Patient list retrieved successfully",
  "data": {
    "patients": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "patientName": "John Doe",
        "contactNumber": "john.doe@email.com",
        "totalBookings": 3,
        "firstBookingDate": "2024-01-15T10:30:00.000Z",
        "lastBookingDate": "2024-01-25T14:00:00.000Z",
        "latestBookingStatus": "confirmed",
        "latestBookingMethod": "automatic",
        "latestBookingDate": "2024-01-25T14:00:00.000Z"
      },
      {
        "userId": "507f1f77bcf86cd799439012",
        "patientName": "Jane Smith",
        "contactNumber": "+1234567890",
        "totalBookings": 1,
        "firstBookingDate": "2024-01-20T09:00:00.000Z",
        "lastBookingDate": "2024-01-20T09:00:00.000Z",
        "latestBookingStatus": "pending",
        "latestBookingMethod": "manual",
        "latestBookingDate": "2024-01-20T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPatients": 75,
      "limit": 20
    }
  }
}
```

**Response Fields:**

**Patient Object:**
- `userId`: Unique identifier for the patient
- `patientName`: Patient's name (from user profile for automatic bookings, from patient details for manual bookings)
- `contactNumber`: Contact information (email for automatic bookings, phone for manual bookings)
- `totalBookings`: Total number of bookings this patient has made with the psychologist
- `firstBookingDate`: Date of the patient's first booking
- `lastBookingDate`: Date of the patient's most recent booking
- `latestBookingStatus`: Status of the patient's most recent booking
- `latestBookingMethod`: Method used for the most recent booking (automatic/manual)
- `latestBookingDate`: Date of the most recent booking

**Pagination Object:**
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `totalPatients`: Total number of patients matching the filters
- `limit`: Number of patients per page

## Error Responses

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Access denied: Not a psychologist"
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Error retrieving patient count statistics",
  "error": "Error details"
}
```

## Usage Examples

### Example 1: Get Basic Patient Count
```bash
curl -X GET \
  http://localhost:3001/api/psychologist/patients/count \
  -H 'Authorization: Bearer <psychologist_token>'
```

### Example 2: Get Patient List with Filtering
```bash
curl -X GET \
  'http://localhost:3001/api/psychologist/patients/list?status=confirmed&limit=10&page=1' \
  -H 'Authorization: Bearer <psychologist_token>'
```

### Example 3: Get Only Automatic Booking Patients
```bash
curl -X GET \
  'http://localhost:3001/api/psychologist/patients/list?bookingMethod=automatic' \
  -H 'Authorization: Bearer <psychologist_token>'
```

### Example 4: Get Only Manual Booking Patients
```bash
curl -X GET \
  'http://localhost:3001/api/psychologist/patients/list?bookingMethod=manual' \
  -H 'Authorization: Bearer <psychologist_token>'
```

## Frontend Integration Examples

### React Component Example
```javascript
import React, { useState, useEffect } from 'react';

const PatientCountDashboard = () => {
  const [patientStats, setPatientStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientStats();
  }, []);

  const fetchPatientStats = async () => {
    try {
      const response = await fetch('/api/psychologist/patients/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('psychologistToken')}`
        }
      });
      const data = await response.json();
      if (data.status) {
        setPatientStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="patient-stats-dashboard">
      <h2>Patient Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p>{patientStats?.totalUniquePatients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Recent Patients (30 days)</h3>
          <p>{patientStats?.recentPatients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>By Status</h3>
          <ul>
            {Object.entries(patientStats?.patientsByStatus || {}).map(([status, count]) => (
              <li key={status}>{status}: {count}</li>
            ))}
          </ul>
        </div>
        <div className="stat-card">
          <h3>By Booking Method</h3>
          <ul>
            {Object.entries(patientStats?.patientsByBookingMethod || {}).map(([method, count]) => (
              <li key={method}>{method}: {count}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientCountDashboard;
```

### Patient List Component Example
```javascript
import React, { useState, useEffect } from 'react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    bookingMethod: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchPatients();
  }, [filters]);

  const fetchPatients = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/psychologist/patients/list?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('psychologistToken')}`
        }
      });
      const data = await response.json();
      if (data.status) {
        setPatients(data.data.patients);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="patient-list">
      <h2>Patient List</h2>
      
      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        
        <select 
          value={filters.bookingMethod} 
          onChange={(e) => handleFilterChange('bookingMethod', e.target.value)}
        >
          <option value="">All Methods</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Patient Table */}
      <table className="patient-table">
        <thead>
          <tr>
            <th>Patient Name</th>
            <th>Contact</th>
            <th>Total Bookings</th>
            <th>Latest Status</th>
            <th>Booking Method</th>
            <th>Last Booking</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.userId}>
              <td>{patient.patientName}</td>
              <td>{patient.contactNumber}</td>
              <td>{patient.totalBookings}</td>
              <td>{patient.latestBookingStatus}</td>
              <td>{patient.latestBookingMethod}</td>
              <td>{new Date(patient.lastBookingDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
        <button 
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PatientList;
```

## Notes

1. **Patient Identification**: For automatic bookings, patient information comes from the user's profile. For manual bookings, it comes from the patient details provided during booking.

2. **Contact Information**: Automatic bookings show email addresses, while manual bookings show phone numbers.

3. **Pagination**: The patient list endpoint supports pagination to handle large numbers of patients efficiently.

4. **Filtering**: You can filter patients by booking status and booking method to get more specific insights.

5. **Real-time Data**: The statistics are calculated in real-time from the booking database, ensuring accuracy.

6. **Security**: Only authenticated psychologists can access their own patient data. 