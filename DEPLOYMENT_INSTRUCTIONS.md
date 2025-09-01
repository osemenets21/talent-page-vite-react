# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE
## Lucky Hospitality Talent Page → GoDaddy Hosting

### ✅ PRE-DEPLOYMENT CHECKLIST

#### 1. Verify Your Project is Ready
- [ ] All code changes committed
- [ ] Environment variables configured for production
- [ ] Firebase configuration correct
- [ ] Database schema ready

---

## 📦 STEP 1: BUILD YOUR PROJECT

### 1.1 Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd "d:\Luckyhospitality\talent-page-vite-react"
```

### 1.2 Install Dependencies (if needed)
```bash
npm install
```

### 1.3 Build Production Version
```bash
npm run build
```

**✅ Success Check:** You should see a `dist` folder created with your website files.

---

## 🌐 STEP 2: PREPARE GODADDY HOSTING

### 2.1 Access Your GoDaddy Account
1. Go to [godaddy.com](https://godaddy.com)
2. Sign in to your account
3. Navigate to "My Products"
4. Find your hosting account for luckyhospitality.com
5. Click "Manage" or "cPanel"

### 2.2 Open cPanel File Manager
1. In cPanel, find "File Manager" (usually under "Files" section)
2. Click "File Manager"
3. Navigate to `public_html` folder (this is your website root)

---

## 📁 STEP 3: UPLOAD FRONTEND FILES

### 3.1 Clear Existing Files (if any)
1. In `public_html`, select all existing files
2. Delete them (keep any important files you need)

### 3.2 Upload Your Website Files
1. **Upload index.html:**
   - From your `dist` folder, upload `index.html` directly to `public_html`

2. **Upload assets folder:**
   - From your `dist` folder, upload the entire `assets` folder to `public_html`

3. **Upload other files:**
   - Upload `vite.svg` and any other files from `dist` to `public_html`

**Final structure should look like:**
```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── logo-[hash].png
└── vite.svg
```

---

## 🔧 STEP 4: UPLOAD BACKEND FILES

### 4.1 Create Backend Folder
1. In `public_html`, create a new folder called `backend`
2. Enter the `backend` folder

### 4.2 Upload PHP Files
Upload these files from your local `backend` folder to `public_html/backend/`:

**Core Files:**
- `index.php`
- `validate_jwt.php`
- `TalentMysqlDB.php`
- `.htaccess`

**API Endpoints:**
- `talent_submit_mysql.php`
- `edit_talent_mysql.php`
- `supervisor_edit_talent_mysql.php`
- `get_all_talent_mysql.php`
- `get_talent_by_email_mysql.php`
- `delete_talent_mysql.php`
- `delete_file_mysql.php`
- `request_deletion.php`
- `talent_stats.php`

**Dependencies:**
- Upload entire `vendor` folder
- `composer.json`
- `composer.lock`

### 4.3 Create Required Folders
In `public_html/backend/`, create these folders:
- `uploads` (set permissions to 755)
- `submissions` (set permissions to 755)

### 4.4 Upload Configuration Files
- Upload your `.htaccess` file to `backend` folder
- Upload `submissions/.htaccess` to `backend/submissions/`

---

## 🗄️ STEP 5: SET UP DATABASE

### 5.1 Create MySQL Database
1. In cPanel, find "MySQL Databases"
2. Create new database: `luckyhospitality_talent`
3. Create database user with strong password
4. Add user to database with "ALL PRIVILEGES"
5. **Write down:** Database name, username, password

### 5.2 Create Database Configuration
Create file `public_html/backend/mysql_config.php`:

```php
<?php
// GoDaddy MySQL Configuration
$host = 'localhost';
$dbname = 'your_database_name';     // Replace with your actual database name
$username = 'your_db_username';     // Replace with your actual username
$password = 'your_db_password';     // Replace with your actual password

$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    throw new PDOException($e->getMessage(), (int)$e->getCode());
}
?>
```

### 5.3 Import Database Schema
1. In cPanel, open "phpMyAdmin"
2. Select your database
3. Go to "SQL" tab
4. Run this SQL to create the talents table:

```sql
CREATE TABLE talents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    soundcloud VARCHAR(100),
    spotify VARCHAR(100),
    youtube VARCHAR(100),
    tiktok VARCHAR(100),
    performer_name VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    bio TEXT,
    role VARCHAR(50),
    role_other VARCHAR(100),
    payment_method VARCHAR(50),
    venmo VARCHAR(100),
    zelle VARCHAR(100),
    paypal VARCHAR(100),
    bank_info TEXT,
    photo_filename VARCHAR(255),
    tax_form_filename VARCHAR(255),
    performer_images JSON,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## ⚙️ STEP 6: CONFIGURE URL ROUTING

### 6.1 Create Main .htaccess
Create `public_html/.htaccess`:

```apache
# React Router support
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Force HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css
    AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

---

## 🔒 STEP 7: CONFIGURE SSL & SECURITY

### 7.1 Enable SSL Certificate
1. In cPanel, find "SSL/TLS"
2. Click "Let's Encrypt" or use GoDaddy SSL
3. Install SSL certificate for luckyhospitality.com
4. Enable "Force HTTPS Redirects"

### 7.2 Set Folder Permissions
Set these permissions in File Manager:
- `public_html/backend/uploads/` → 755 or 777
- `public_html/backend/submissions/` → 755
- All PHP files → 644

---

## 🧪 STEP 8: TEST YOUR DEPLOYMENT

### 8.1 Test Website Loading
1. Visit: `https://luckyhospitality.com`
2. Verify the React app loads correctly
3. Test navigation between pages (refresh any page to test routing)

### 8.2 Test API Endpoints
1. Visit: `https://luckyhospitality.com/backend/`
2. Should show API working message
3. Test: `https://luckyhospitality.com/backend/talent/all`

### 8.3 Test Full Functionality
- [ ] Firebase authentication works
- [ ] Talent form submission works
- [ ] File uploads work (photos, tax forms)
- [ ] Supervisor panel accessible
- [ ] Edit profile functionality works
- [ ] No console errors in browser

---

## 🚨 TROUBLESHOOTING COMMON ISSUES

### Issue 1: 404 Errors on Page Refresh
**Solution:** Check that `.htaccess` file is in `public_html` with correct React Router rules

### Issue 2: API Calls Failing
**Solutions:**
- Verify `mysql_config.php` has correct database credentials
- Check database connection in phpMyAdmin
- Verify all PHP files uploaded correctly

### Issue 3: File Uploads Not Working
**Solutions:**
- Set `uploads` folder permissions to 755 or 777
- Check PHP upload limits in cPanel (increase if needed)

### Issue 4: SSL/HTTPS Issues
**Solutions:**
- Ensure SSL certificate is properly installed
- Force HTTPS redirects in cPanel
- Update all HTTP references to HTTPS

---

## 📋 FINAL CHECKLIST

- [ ] Website loads at https://luckyhospitality.com
- [ ] All pages accessible and routing works
- [ ] API endpoints respond correctly
- [ ] Database connection working
- [ ] File uploads functional
- [ ] SSL certificate active
- [ ] No console errors
- [ ] Mobile responsive design works
- [ ] Authentication system functional
- [ ] All forms submit successfully

---

## 🎉 CONGRATULATIONS!

Your Lucky Hospitality Talent Page is now live at:
**https://luckyhospitality.com**

### For Future Updates:
1. Make changes locally
2. Run `npm run build`
3. Upload new `dist` files to replace old ones
4. Upload any updated PHP files

### Support:
If you encounter issues, check the browser console for errors and verify all steps above were completed correctly.
