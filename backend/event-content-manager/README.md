# Events SQLite Database System

This system provides a robust SQLite-based storage solution for event management, replacing the previous JSON-based storage for better performance with large datasets.

## Features

- **SQLite Database**: Fast, reliable, and lightweight SQL database
- **Full CRUD Operations**: Create, Read, Update, Delete events
- **Advanced Querying**: Search, date ranges, club filtering
- **Performance Optimized**: Indexed fields for fast queries
- **New York Timezone**: All timestamps in America/New_York timezone
- **RESTful API**: Clean HTTP API endpoints
- **Data Validation**: Input validation and error handling

## Database Schema

```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    doors_open_time TEXT,
    show_start_time TEXT,
    show_end_time TEXT,
    cover_charge TEXT,
    cover_charge_details TEXT,
    advance_tickets_url TEXT,
    eagle_xl TEXT,
    short_description TEXT,
    long_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Events API (`api.php`)

**GET** - Retrieve events
```
GET /api.php                           # Get all events
GET /api.php?id=1                      # Get specific event
GET /api.php?search=jazz               # Search events
GET /api.php?club=The Phoenix          # Get events by club
GET /api.php?upcoming=true&limit=5     # Get upcoming events
GET /api.php?start_date=2025-08-01&end_date=2025-08-31  # Date range
GET /api.php?limit=10&offset=20        # Pagination
GET /api.php?order_by=event_date ASC   # Custom ordering
```

**POST** - Create new event
```json
{
    "club": "The Phoenix",
    "event_name": "Jazz Night",
    "event_date": "2025-08-15",
    "doors_open_time": "19:00",
    "show_start_time": "20:30",
    "show_end_time": "23:00",
    "cover_charge": "$15",
    "cover_charge_details": "$10 advance, $15 at door",
    "advance_tickets_url": "https://example.com/tickets",
    "eagle_xl": "Jazz at its finest",
    "short_description": "Evening of smooth jazz",
    "long_description": "Join us for an unforgettable evening..."
}
```

**PUT** - Update event
```
PUT /api.php?id=1
```

**DELETE** - Delete event
```
DELETE /api.php?id=1
```

### 2. Statistics API (`stats.php`)

**GET** - Get database statistics
```json
{
    "success": true,
    "stats": {
        "total_events": 25,
        "upcoming_events": 12,
        "db_size_mb": 0.05,
        "events_by_club": [
            {"club": "The Phoenix", "count": 15},
            {"club": "Blue Moon Lounge", "count": 10}
        ]
    }
}
```

### 3. Custom Query API (`query.php`)

**POST** - Execute custom SELECT queries
```json
{
    "sql": "SELECT * FROM events WHERE event_date > ? ORDER BY event_date",
    "params": ["2025-08-01"]
}
```

## Setup Instructions

1. **Initialize Database**
   ```bash
   cd backend/event-content-manager
   php init_db.php
   ```

2. **Test API Endpoints**
   ```bash
   # Start a local PHP server
   php -S localhost:8000
   
   # Test the API
   curl http://localhost:8000/api.php
   ```

3. **Update Frontend**
   Update your React EventsContentManager component to use the new API endpoints instead of local state.

## EventsDB Class Methods

### Basic Operations
- `selectAll($conditions, $orderBy, $limit, $offset)` - Get events with optional filtering
- `selectById($id)` - Get single event by ID
- `selectWhere($field, $operator, $value)` - Query with WHERE conditions
- `insert($data)` - Create new event
- `update($id, $data)` - Update existing event
- `delete($id)` - Delete event
- `count($conditions)` - Count events

### Advanced Operations
- `search($searchTerm)` - Full-text search across event fields
- `getEventsByDateRange($startDate, $endDate)` - Get events in date range
- `getUpcomingEvents($limit)` - Get future events
- `getEventsByClub($club)` - Get events for specific club
- `query($sql, $params)` - Execute raw SQL queries
- `getStats()` - Get database statistics
- `backup($backupPath)` - Create database backup

## Performance Benefits

### Compared to JSON Storage:
- **Indexing**: Fast lookups on event_date, club, and event_name
- **Memory Efficiency**: Only loads requested data, not entire dataset
- **Concurrent Access**: SQLite handles multiple simultaneous requests
- **Query Optimization**: SQL engine optimizes complex queries
- **Data Integrity**: ACID transactions ensure data consistency

### Scalability:
- Can handle thousands of events efficiently
- Pagination support for large datasets
- Optimized search across multiple fields
- Built-in backup and restore capabilities

## Security Features

- **Input Validation**: All inputs are validated and sanitized
- **Prepared Statements**: Protection against SQL injection
- **CORS Headers**: Proper cross-origin resource sharing
- **Query Restrictions**: Custom query endpoint only allows SELECT statements
- **Error Handling**: Graceful error responses

## File Structure

```
backend/event-content-manager/
├── EventsDB.php          # Main database class
├── api.php               # RESTful API endpoints
├── stats.php             # Statistics endpoint
├── query.php             # Custom query endpoint
├── init_db.php           # Database initialization script
├── events.db             # SQLite database file (created automatically)
└── README.md             # This documentation
```

## Next Steps

1. Update the React frontend to use these API endpoints
2. Add authentication/authorization for admin operations
3. Implement caching for frequently accessed data
4. Add database migration scripts for schema updates
5. Set up automated backups

## Example Frontend Integration

```javascript
// Get all events
const response = await fetch('http://localhost:8000/api.php');
const data = await response.json();

// Create new event
const response = await fetch('http://localhost:8000/api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
});

// Search events
const response = await fetch('http://localhost:8000/api.php?search=jazz');
const data = await response.json();
```
