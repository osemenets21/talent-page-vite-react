# Unified Backend API Documentation

## 🌐 **Base URL:** `http://localhost:8000`

## 📋 **API Endpoints**

### 🎭 **Events API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/events` | Get all events (direct) |
| GET | `/events?search=jazz` | Search events |
| GET | `/events?club=The Phoenix` | Get events by club |
| GET | `/events?upcoming=true&limit=5` | Get upcoming events |
| GET | `/events?id=1` | Get specific event |
| POST | `/events` | Create new event |
| PUT | `/events?id=1` | Update event |
| DELETE | `/events?id=1` | Delete event |

### 👥 **Talent API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/talent/submit` | Submit talent form |
| POST | `/talent/submit` | Submit talent form (direct) |
| GET | `/talent/all` | Get all talent submissions |
| GET | `/talent/get?email=user@email.com` | Get talent by email |
| POST | `/talent/edit` | Edit talent submission |
| DELETE | `/talent/delete` | Delete talent submission |

### 📁 **File Uploads**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/uploads/{folder}/{filename}` | Access uploaded files |

## 📊 **Event API Examples**

### Get All Events
```bash
curl http://localhost:8000/events
```

### Create Event
```bash
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "club": "The Phoenix",
    "event_name": "Jazz Night",
    "event_date": "2025-08-15",
    "doors_open_time": "19:00",
    "show_start_time": "20:30",
    "cover_charge": "$15"
  }'
```

### Search Events
```bash
curl "http://localhost:8000/events?search=jazz"
```

### Update Event
```bash
curl -X PUT "http://localhost:8000/events?id=1" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "Updated Jazz Night"}'
```

### Delete Event
```bash
curl -X DELETE "http://localhost:8000/events?id=1"
```

## 👥 **Talent API Examples**

### Get All Talent
```bash
curl http://localhost:8000/talent/all
```

### Get Talent by Email
```bash
curl "http://localhost:8000/talent/get?email=artist@example.com"
```

## 🚀 **Starting the Server**

### Windows (Batch)
```cmd
cd backend
start-server.bat
```

### Git Bash / Linux
```bash
cd backend
./start-server.sh
```

### Manual Start
```bash
cd backend

# With XAMPP (recommended - has MySQL)
"C:\xampp\php\php.exe" -S localhost:8000 -t .

# With standalone PHP
php -S localhost:8000 -t .
```

## 🗄️ **Database Support**

The unified server automatically detects and uses the best available database:

1. **MySQL** (via XAMPP) - Full SQL database with indexing
2. **SQLite** - Lightweight SQL database 
3. **File-based** - JSON storage with SQL-like operations

## 🔧 **Configuration**

### Database Settings
- **MySQL**: Edit connection in `event-content-manager/mysql_config.php`
- **File-based**: Data stored in `event-content-manager/events_data.json`

### CORS Settings
- Configured for React dev server: `http://localhost:5173`
- Edit `index.php` to change allowed origins

## 📁 **File Structure**

```
backend/
├── index.php              # Main router
├── start-server.bat       # Windows startup script
├── start-server.sh        # Bash startup script
├── talent_submit.php      # Talent form handler
├── get_all_talent.php     # Get all talent
├── get_talent.php         # Get talent by ID
├── uploads/               # File uploads directory
└── event-content-manager/ # Events system
    ├── EventsMysqlDB.php  # MySQL database class
    ├── EventsFileDB.php   # File-based database
    └── events_data.json   # Event data storage
```

## 🛠️ **Development**

### Adding New Endpoints
1. Edit `index.php` router
2. Add new route handling function
3. Create corresponding PHP file if needed

### Frontend Integration
Update your React app to use:
```javascript
const API_BASE = 'http://localhost:8000';

// Events
fetch(`${API_BASE}/events`)
fetch(`${API_BASE}/events`, { method: 'POST', body: JSON.stringify(data) })

// Talent
fetch(`${API_BASE}/talent/all`)
fetch(`${API_BASE}/talent/submit`, { method: 'POST', body: formData })
```

## 🔍 **Troubleshooting**

### Port Already in Use
- Change PORT in startup scripts
- Kill existing processes: `taskkill /f /im php.exe`

### MySQL Connection Failed
- Ensure XAMPP is running
- Check MySQL service in XAMPP Control Panel
- Use XAMPP's PHP: `"C:\xampp\php\php.exe"`

### CORS Errors
- Check frontend URL in `index.php` CORS headers
- Ensure server is running on correct port
