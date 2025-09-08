# GoDaddy Deployment Guide for luckyhospitality.com

## Complete Guide for Deploying React+Vite Talent Management System

### Overview
This guide covers deploying your React/Vite frontend with PHP backend to GoDaddy hosting using an addon domain structure.

**Your Setup:**
- Primary Domain: takeoverpresents.com
- Addon Domain: luckyhospitality.com (target deployment)
- Framework: React + Vite (frontend) + PHP + MySQL (backend)

---

## Step 1: Prepare for Deployment

### 1.1 Build Production Version
```bash
npm run build
```
This creates a `dist/` folder with optimized production files.

### 1.2 Verify Production Environment
Confirm `.env.production` contains:
```
VITE_API_DOMAIN=https://luckyhospitality.com
```

---

## Step 2: GoDaddy cPanel Setup

### 2.1 Access cPanel
1. Log into your GoDaddy account
2. Go to "My Products" → "Web Hosting" 
3. Click "Manage" next to your hosting plan
4. Click "cPanel Admin"

### 2.2 Create Database and User
1. In cPanel, find "MySQL Databases"
2. Create database: `your_cpanel_username_talent_db`
3. Create user: `your_cpanel_username_talent_user`
4. Add user to database with ALL PRIVILEGES
5. **Note down:** Database name, username, password, and hostname

---

## Step 3: File Upload Structure

### 3.1 Understand Directory Structure
Your files go in: `/public_html/luckyhospitality.com/`

**NOT** in `/public_html/` (that's for takeoverpresents.com)

### 3.2 Upload Frontend Files
1. In cPanel File Manager, navigate to: `/public_html/luckyhospitality.com/`
2. Upload all contents from your `dist/` folder to this directory
3. The structure should be:
   ```
   /public_html/luckyhospitality.com/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── index-[hash].css
   │   └── ...
   └── vite.svg
   ```

### 3.3 Upload Backend Files
1. Create `api/` folder in `/public_html/luckyhospitality.com/`
2. Upload your entire `backend/` folder contents to `api/`
3. The structure should be:
   ```
   /public_html/luckyhospitality.com/api/
   ├── index.php
   ├── config.php
   ├── validate_jwt.php
   ├── TalentMysqlDB.php
   ├── talent_mysql.php
   ├── supervisor_edit_talent_mysql.php
   ├── admin_mysql.php
   └── uploads/
   ```

---

## Step 4: Configure Backend for Production

### 4.1 Update config.php
Edit `/public_html/luckyhospitality.com/api/config.php`:
```php
<?php
// Database configuration
$host = 'localhost';  // Usually localhost on GoDaddy
$dbname = 'your_cpanel_username_talent_db';  // Your actual database name
$username = 'your_cpanel_username_talent_user';  // Your actual username
$password = 'your_actual_password';  // Your actual password

// CORS settings for production
$allowed_origins = [
    'https://luckyhospitality.com',
    'https://www.luckyhospitality.com'
];

// Firebase project configuration (your existing values)
$firebase_project_id = 'your_firebase_project_id';
?>
```

### 4.2 Set Upload Directory Permissions
1. In File Manager, navigate to `/public_html/luckyhospitality.com/api/uploads/`
2. Right-click the `uploads` folder → "Change Permissions"
3. Set permissions to `755` or `775`

---

## Step 5: Database Setup

### 5.1 Import Database Structure
1. In cPanel, open "phpMyAdmin"
2. Select your database (`your_cpanel_username_talent_db`)
3. Click "Import" tab
4. Upload your SQL file with table structure, or run this SQL:

```sql
CREATE TABLE talent_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    position_type ENUM('bartender', 'server', 'cook', 'busser', 'host', 'manager', 'other') NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    previous_experience TEXT,
    availability JSON,
    skills JSON,
    languages JSON,
    certifications JSON,
    profile_photo VARCHAR(500),
    resume VARCHAR(500),
    references JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Step 6: Test Deployment

### 6.1 Test Frontend
1. Visit: `https://luckyhospitality.com`
2. Verify the site loads correctly
3. Check that all assets (CSS, JS, images) load properly

### 6.2 Test API Endpoints
Test these URLs in your browser:
- `https://luckyhospitality.com/api/` (should show API info)
- `https://luckyhospitality.com/api/talent/test` (should show test response)

### 6.3 Test Full Application Flow
1. Register a new user account
2. Complete talent form submission
3. Test file uploads (photo, resume)
4. Test supervisor panel login and editing

---

## Step 7: SSL Certificate (Important!)

### 7.1 Enable SSL in cPanel
1. In cPanel, find "SSL/TLS"
2. Click "Let's Encrypt SSL"
3. Select your addon domain: `luckyhospitality.com`
4. Click "Issue" to generate free SSL certificate

### 7.2 Force HTTPS Redirects
Add to `/public_html/luckyhospitality.com/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Step 8: Final Configuration

### 8.1 Update Firebase Settings
In your Firebase Console:
1. Go to Authentication → Settings → Authorized domains
2. Add: `luckyhospitality.com`
3. Ensure your API keys are properly configured

### 8.2 Test Email Functionality
If using email features, configure SMTP settings in your backend.

---

## Troubleshooting

### Common Issues:

**Site shows 404 or doesn't load:**
- Verify files are in `/public_html/luckyhospitality.com/` not `/public_html/`
- Check that `index.html` exists in the addon domain folder

**API calls fail:**
- Verify database credentials in `config.php`
- Check that API files are in `/public_html/luckyhospitality.com/api/`
- Ensure uploads folder has correct permissions

**CORS errors:**
- Verify `$allowed_origins` in `config.php` includes your domain
- Make sure SSL is enabled and working

**File uploads fail:**
- Check uploads folder permissions (755 or 775)
- Verify upload path in backend configuration

---

## Deployment Checklist

- [ ] Production build created (`npm run build`)
- [ ] Database created and configured
- [ ] Files uploaded to correct addon domain directory
- [ ] Backend `config.php` updated with production database credentials
- [ ] Upload folder permissions set correctly
- [ ] SSL certificate installed and enabled
- [ ] Firebase authorized domains updated
- [ ] All API endpoints tested
- [ ] Full application flow tested
- [ ] HTTPS redirects configured

---

## Support

After deployment, monitor:
- Error logs in cPanel → Error Logs
- PHP errors in your API responses  
- Browser console for frontend errors
- Database performance in phpMyAdmin

Your application should now be live at `https://luckyhospitality.com`!
