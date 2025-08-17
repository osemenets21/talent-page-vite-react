# MySQL Setup Instructions for Talent Events System

## 📥 **Step 1: Install XAMPP**

1. **Download XAMPP:**
   - Go to: https://www.apachefriends.org/download.html
   - Download "XAMPP for Windows" (PHP 8.x version)

2. **Install XAMPP:**
   - Run installer as Administrator
   - Select components:
     - ✅ Apache
     - ✅ MySQL
     - ✅ PHP
     - ✅ phpMyAdmin
   - Install to default location: `C:\xampp`

3. **Start Services:**
   - Open XAMPP Control Panel
   - Click "Start" for Apache
   - Click "Start" for MySQL
   - Both should show green "Running" status

## 🗄️ **Step 2: Setup Database**

1. **Run Database Setup:**
   ```bash
   cd backend/event-content-manager
   
   # Use XAMPP's PHP (has MySQL drivers)
   "C:\xampp\php\php.exe" setup_mysql.php
   
   # OR use the helper script
   ./xampp-php.bat setup_mysql.php
   ```

2. **Verify Installation:**
   - Open browser: http://localhost/phpmyadmin
   - Login: username=`root`, password=`(empty)`
   - Look for database: `talent_events_db`
   - Check table: `events` with sample data

## 🚀 **Step 3: Test API**

1. **Start PHP Server:**
   ```bash
   # Use XAMPP's PHP for MySQL support
   "C:\xampp\php\php.exe" -S localhost:8001
   
   # OR use the helper script
   ./xampp-php.bat -S localhost:8001
   ```

2. **Test Endpoints:**
   ```bash
   # Get all events
   curl http://localhost:8001/backend/event-content-manager/api_mysql.php
   
   # Search events
   curl "http://localhost:8001/backend/event-content-manager/api_mysql.php?search=jazz"
   
   # Get upcoming events
   curl "http://localhost:8001/backend/event-content-manager/api_mysql.php?upcoming=true"
   ```

## 📊 **Database Schema**

```sql
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    club VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    doors_open_time TIME,
    show_start_time TIME,
    show_end_time TIME,
    cover_charge VARCHAR(100),
    cover_charge_details TEXT,
    advance_tickets_url TEXT,
    eagle_xl TEXT,
    short_description TEXT,
    long_description LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🛠️ **Configuration Files**

- **`mysql_config.php`** - Database connection settings
- **`EventsMysqlDB.php`** - MySQL database class
- **`api_mysql.php`** - MySQL-enabled API endpoints
- **`setup_mysql.php`** - Database initialization script

## 🔧 **Troubleshooting**

### MySQL Connection Failed:
1. Check XAMPP Control Panel - MySQL should be green/running
2. Verify port 3306 is not blocked
3. Check mysql_config.php credentials

### Permission Denied:
1. Run XAMPP as Administrator
2. Check Windows Firewall settings
3. Ensure antivirus isn't blocking MySQL

### Database Not Found:
1. Re-run `php setup_mysql.php`
2. Check phpMyAdmin for database creation
3. Verify MySQL service is running

## 🌐 **Access Points**

- **API Endpoint:** http://localhost:8000/api_mysql.php
- **phpMyAdmin:** http://localhost/phpmyadmin
- **XAMPP Control:** C:\xampp\xampp-control.exe

## ⚡ **Performance Benefits**

- **Indexing:** Fast queries on date, club, event_name
- **Joins:** Complex relational queries when needed
- **Transactions:** ACID compliance for data integrity
- **Scaling:** Can handle thousands of events efficiently
- **Backup:** Built-in MySQL backup/restore tools

## 🔄 **Migration from File DB**

To migrate existing events from JSON to MySQL:
1. Export current events from file system
2. Run MySQL setup
3. Import events via API or direct SQL insert
4. Update frontend to use api_mysql.php endpoints

## 🚀 **Next Steps**

1. Install XAMPP and start services
2. Run setup_mysql.php to create database
3. Test API endpoints work correctly
4. Update React frontend to use MySQL API
5. Configure production MySQL server when ready
