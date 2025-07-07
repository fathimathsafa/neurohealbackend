# Psychologist Booking Count API Documentation

This document describes the API endpoint for psychologists to view their total booking count and related statistics.

## Authentication

The endpoint requires psychologist authentication using JWT token in the Authorization header:
```
Authorization: Bearer <psychologist_jwt_token>
```

## Endpoint

### Get Booking Count Statistics

**Endpoint:** `GET /api/psychologist/bookings/count`

**Description:** Returns comprehensive statistics about the psychologist's bookings including total count, recent bookings, and breakdowns by status and booking method.

**Headers:**
```
Authorization: Bearer <psychologist_jwt_token>
```

**Response:**
```json
{
  "status": true,
  "message": "Booking count statistics retrieved successfully",
  "data": {
    "totalBookings": 150,
    "recentBookings": 25,
    "todayBookings": 3,
    "thisWeekBookings": 12,
    "thisMonthBookings": 45,
    "bookingsByStatus": {
      "pending": 15,
      "confirmed": 45,
      "completed": 80,
      "cancelled": 8,
      "rescheduled": 2
    },
    "bookingsByBookingMethod": {
      "automatic": 120,
      "manual": 30
    }
  }
}
```

**Response Fields:**
- `totalBookings`: Total number of bookings for this psychologist (all time)
- `recentBookings`: Number of bookings created in the last 30 days
- `todayBookings`: Number of bookings scheduled for today
- `thisWeekBookings`: Number of bookings scheduled for this week (Sunday to Saturday)
- `thisMonthBookings`: Number of bookings scheduled for this month
- `bookingsByStatus`: Breakdown of bookings by status
  - `pending`: Bookings awaiting confirmation
  - `confirmed`: Bookings that have been confirmed
  - `completed`: Bookings that have been completed
  - `cancelled`: Bookings that have been cancelled
  - `rescheduled`: Bookings that have been rescheduled
- `bookingsByBookingMethod`: Breakdown of bookings by method
  - `automatic`: Bookings created through questionnaire/automatic matching
  - `manual`: Bookings created manually with patient details

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
  "message": "Error retrieving booking count statistics",
  "error": "Error details"
}
```

## Usage Examples

### Example 1: Get Basic Booking Count
```bash
curl -X GET \
  http://localhost:3001/api/psychologist/bookings/count \
  -H 'Authorization: Bearer <psychologist_token>'
```

### Example 2: Using JavaScript/Fetch
```javascript
const response = await fetch('/api/psychologist/bookings/count', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('psychologistToken')}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.status) {
  console.log('Total bookings:', data.data.totalBookings);
  console.log('Today\'s bookings:', data.data.todayBookings);
  console.log('This week\'s bookings:', data.data.thisWeekBookings);
}
```

### Example 3: Using Axios
```javascript
import axios from 'axios';

const getBookingCount = async () => {
  try {
    const response = await axios.get('/api/psychologist/bookings/count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('psychologistToken')}`
      }
    });
    
    if (response.data.status) {
      const stats = response.data.data;
      console.log('Booking Statistics:', stats);
    }
  } catch (error) {
    console.error('Error fetching booking count:', error);
  }
};
```

## Frontend Integration Examples

### React Component Example
```javascript
import React, { useState, useEffect } from 'react';

const BookingCountDashboard = () => {
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingStats();
  }, []);

  const fetchBookingStats = async () => {
    try {
      const response = await fetch('/api/psychologist/bookings/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('psychologistToken')}`
        }
      });
      const data = await response.json();
      if (data.status) {
        setBookingStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="booking-stats-dashboard">
      <h2>Booking Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-number">{bookingStats?.totalBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Bookings</h3>
          <p className="stat-number">{bookingStats?.todayBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>This Week</h3>
          <p className="stat-number">{bookingStats?.thisWeekBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="stat-number">{bookingStats?.thisMonthBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Recent (30 days)</h3>
          <p className="stat-number">{bookingStats?.recentBookings || 0}</p>
        </div>
      </div>
      
      <div className="breakdown-section">
        <div className="breakdown-card">
          <h3>By Status</h3>
          <ul>
            {Object.entries(bookingStats?.bookingsByStatus || {}).map(([status, count]) => (
              <li key={status} className={`status-${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="breakdown-card">
          <h3>By Booking Method</h3>
          <ul>
            {Object.entries(bookingStats?.bookingsByBookingMethod || {}).map(([method, count]) => (
              <li key={method} className={`method-${method}`}>
                {method.charAt(0).toUpperCase() + method.slice(1)}: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingCountDashboard;
```

### CSS Styling Example
```css
.booking-stats-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  color: #2c3e50;
}

.breakdown-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.breakdown-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.breakdown-card h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.breakdown-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.breakdown-card li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.status-pending { color: #f39c12; }
.status-confirmed { color: #27ae60; }
.status-completed { color: #2980b9; }
.status-cancelled { color: #e74c3c; }
.status-rescheduled { color: #9b59b6; }

.method-automatic { color: #27ae60; }
.method-manual { color: #3498db; }
```

## Notes

1. **Real-time Data**: All statistics are calculated in real-time from the booking database.

2. **Time Periods**:
   - **Today**: Bookings scheduled for the current day (00:00 to 23:59)
   - **This Week**: Bookings from Sunday to Saturday of the current week
   - **This Month**: Bookings from the 1st to the last day of the current month
   - **Recent**: Bookings created in the last 30 days

3. **Booking Statuses**: The system tracks five main statuses - pending, confirmed, completed, cancelled, and rescheduled.

4. **Booking Methods**: Bookings can be either automatic (through questionnaire) or manual (with patient details).

5. **Security**: Only authenticated psychologists can access their own booking statistics.

6. **Performance**: The endpoint uses efficient database queries and aggregation to provide quick responses.

## Use Cases

- **Dashboard Overview**: Display key metrics on psychologist dashboard
- **Performance Tracking**: Monitor booking trends over time
- **Workload Management**: Understand current and upcoming workload
- **Business Analytics**: Analyze booking patterns and methods
- **Reporting**: Generate reports for administrative purposes 