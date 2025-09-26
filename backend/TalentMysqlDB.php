<?php
// MySQL database operations for talent management
class TalentMysqlDB {
    private $pdo;
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $tableName = 'talent_data';  // Updated to match actual table name
    
    public function __construct($host = 'localhost', $dbname = 'talent_db', $username = 'talent_user', $password = 'en(x5z@ADuv*') {
        $this->host = $host;
        $this->dbname = $dbname;
        $this->username = $username;
        $this->password = $password;
        
        $this->initializeDB();
    }
    
    private function initializeDB() {
        try {
            // Connect to MySQL server first
            $pdo = new PDO("mysql:host={$this->host}", $this->username, $this->password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create database if it doesn't exist
            $pdo->exec("CREATE DATABASE IF NOT EXISTS {$this->dbname} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Connect to the specific database
            $this->pdo = new PDO("mysql:host={$this->host};dbname={$this->dbname}", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create talent_data table if it doesn't exist
            $sql = "CREATE TABLE IF NOT EXISTS {$this->tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                submission_id VARCHAR(50) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(255) NOT NULL,
                instagram VARCHAR(255),
                /* facebook VARCHAR(255), */
                soundcloud VARCHAR(255),
                spotify VARCHAR(255),
                youtube VARCHAR(255),
                tiktok VARCHAR(255),
                performer_name VARCHAR(255),
                city VARCHAR(100),
                country VARCHAR(100),
                bio TEXT,
                role ENUM('DJ', 'Singer', 'Rapper', 'Producer', 'Band', 'Other') NOT NULL,
                role_other VARCHAR(255),
                payment_method ENUM('Venmo', 'Zelle', 'PayPal', 'Bank Transfer', 'Cash') NOT NULL,
                venmo VARCHAR(255),
                zelle VARCHAR(255),
                photo_filename VARCHAR(255),
                tax_form_filename VARCHAR(255),
                performer_images JSON,
                additional_files JSON,
                status ENUM('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
                notes TEXT,
                agreements TEXT,
                music_genres VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_performer_name (performer_name),
                INDEX idx_role (role),
                INDEX idx_status (status),
                INDEX idx_submission_id (submission_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

            $this->pdo->exec($sql);
            
            // Add performer_images column if it doesn't exist
            $this->addPerformerImagesColumn();
            
            // Migrate performer images from additional_files to performer_images
            $this->migratePerformerImages();
            
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    // Migrate performer images from additional_files to performer_images
    private function migratePerformerImages() {
        try {
            // Check if migration is needed
            $stmt = $this->pdo->prepare("SELECT id, additional_files, performer_images FROM {$this->tableName} WHERE additional_files IS NOT NULL AND performer_images IS NULL");
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($records as $record) {
                $additionalFiles = json_decode($record['additional_files'], true);
                if (is_array($additionalFiles) && !empty($additionalFiles)) {
                    // Assume these are performer images and migrate them
                    $updateStmt = $this->pdo->prepare("UPDATE {$this->tableName} SET performer_images = ?, additional_files = NULL WHERE id = ?");
                    $updateStmt->execute([json_encode($additionalFiles), $record['id']]);
                }
            }
        } catch (PDOException $e) {
            // If migration fails, it's not critical
            error_log("Could not migrate performer images: " . $e->getMessage());
        }
    }
    
    // Get database connection for external access
    public function getConnection() {
        return $this->pdo;
    }
    
    // Add performer_images column if it doesn't exist
    private function addPerformerImagesColumn() {
        try {
            // Check if column exists
            $stmt = $this->pdo->prepare("SHOW COLUMNS FROM {$this->tableName} LIKE 'performer_images'");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if (!$result) {
                // Column doesn't exist, add it
                $sql = "ALTER TABLE {$this->tableName} ADD COLUMN performer_images JSON AFTER tax_form_filename";
                $this->pdo->exec($sql);
            }
        } catch (PDOException $e) {
            // If this fails, it's not critical - the column might already exist
            error_log("Could not add performer_images column: " . $e->getMessage());
        }
    }
    
    // Insert new talent
    public function insert($data) {
        try {
            $sql = "INSERT INTO {$this->tableName} (
                submission_id, first_name, last_name, phone, email, instagram, 
                soundcloud, spotify, youtube, tiktok, performer_name, city, country, bio, 
                role, role_other, payment_method, venmo, zelle, photo_filename, tax_form_filename, performer_images, additional_files, status, notes, agreements, music_genres
            ) VALUES (
                :submission_id, :first_name, :last_name, :phone, :email, :instagram,
                :soundcloud, :spotify, :youtube, :tiktok, :performer_name, :city, :country, :bio,
                :role, :role_other, :payment_method, :venmo, :zelle, :photo_filename, :tax_form_filename, :performer_images, :additional_files, :status, :notes, :agreements, :music_genres
            )";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Prepare data
            $params = [
                'submission_id' => $data['submission_id'] ?? uniqid(),
                'first_name' => $data['first_name'] ?? $data['firstName'] ?? '',
                'last_name' => $data['last_name'] ?? $data['lastName'] ?? '',
                'phone' => $data['phone'] ?? '',
                'email' => $data['email'] ?? '',
                'instagram' => $data['instagram'] ?? '',
                // 'facebook' => $data['facebook'] ?? '',
                'soundcloud' => $data['soundcloud'] ?? '',
                'spotify' => $data['spotify'] ?? '',
                'youtube' => $data['youtube'] ?? '',
                'tiktok' => $data['tiktok'] ?? '',
                'performer_name' => $data['performer_name'] ?? $data['performerName'] ?? '',
                'city' => $data['city'] ?? '',
                'country' => $data['country'] ?? '',
                'bio' => $data['bio'] ?? '',
                'role' => $data['role'] ?? 'Other',
                'role_other' => $data['role_other'] ?? $data['roleOther'] ?? '',
                'payment_method' => $data['payment_method'] ?? $data['paymentMethod'] ?? 'Venmo',
                'venmo' => $data['venmo'] ?? '',
                'zelle' => $data['zelle'] ?? '',
                'photo_filename' => $data['photo_filename'] ?? ($data['files']['photo'] ?? ''),
                'tax_form_filename' => $data['tax_form_filename'] ?? ($data['files']['taxForm'] ?? ''),
                'performer_images' => $data['performer_images'] ?? null,
                'additional_files' => isset($data['additional_files']) ? json_encode($data['additional_files']) : null,
                'status' => $data['status'] ?? 'pending',
                'notes' => $data['notes'] ?? '',
                'agreements' => isset($data['agreements']) ? json_encode($data['agreements']) : null,
                'music_genres' => $data['music_genres'] ?? '',
            ];
            
            $stmt->execute($params);
            
            return $this->selectById($this->pdo->lastInsertId());
            
        } catch (PDOException $e) {
            throw new Exception("Insert failed: " . $e->getMessage());
        }
    }
    
    // Get all talent
    public function selectAll($conditions = [], $orderBy = 'created_at DESC', $limit = null, $offset = 0) {
        try {
            $sql = "SELECT * FROM {$this->tableName}";
            $params = [];
            
            if (!empty($conditions)) {
                $whereClause = [];
                foreach ($conditions as $key => $value) {
                    $whereClause[] = "$key = :$key";
                    $params[$key] = $value;
                }
                $sql .= " WHERE " . implode(" AND ", $whereClause);
            }
            
            if ($orderBy) {
                $sql .= " ORDER BY $orderBy";
            }
            
            if ($limit) {
                $sql .= " LIMIT $limit OFFSET $offset";
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select all failed: " . $e->getMessage());
        }
    }
    
    // Get talent by ID
    public function selectById($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->tableName} WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select by ID failed: " . $e->getMessage());
        }
    }
    
    // Get talent by email
    public function selectByEmail($email) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->tableName} WHERE email = :email");
            $stmt->execute(['email' => $email]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select by email failed: " . $e->getMessage());
        }
    }
    
    // Get talent by submission ID
    public function selectBySubmissionId($submissionId) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->tableName} WHERE submission_id = :submission_id");
            $stmt->execute(['submission_id' => $submissionId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select by submission ID failed: " . $e->getMessage());
        }
    }
    
    // Update talent
    public function update($id, $data) {
        try {
            $fields = [];
            $params = ['id' => $id];
            
            foreach ($data as $key => $value) {
                if ($key !== 'id') {
                    $fields[] = "$key = :$key";
                    $params[$key] = $value;
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No data to update");
            }
            
            $sql = "UPDATE {$this->tableName} SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $this->selectById($id);
            
        } catch (PDOException $e) {
            throw new Exception("Update failed: " . $e->getMessage());
        }
    }
    
    // Delete talent
    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM {$this->tableName} WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            throw new Exception("Delete failed: " . $e->getMessage());
        }
    }
    
    // Search talent
    public function search($query) {
        try {
            $sql = "SELECT * FROM {$this->tableName} WHERE 
                    first_name LIKE :query OR 
                    last_name LIKE :query OR 
                    email LIKE :query OR 
                    performer_name LIKE :query OR 
                    city LIKE :query OR 
                    role LIKE :query 
                    ORDER BY created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['query' => "%$query%"]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Search failed: " . $e->getMessage());
        }
    }
    
    // Get stats
    public function getStats() {
        try {
            $stats = [];
            
            // Total count
            $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM {$this->tableName}");
            $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // By status
            $stmt = $this->pdo->query("SELECT status, COUNT(*) as count FROM {$this->tableName} GROUP BY status");
            $stats['by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // By role
            $stmt = $this->pdo->query("SELECT role, COUNT(*) as count FROM {$this->tableName} GROUP BY role ORDER BY count DESC");
            $stats['by_role'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Recent submissions (last 30 days)
            $stmt = $this->pdo->query("SELECT COUNT(*) as recent FROM {$this->tableName} WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $stats['recent_submissions'] = $stmt->fetch(PDO::FETCH_ASSOC)['recent'];
            
            return $stats;
            
        } catch (PDOException $e) {
            throw new Exception("Stats failed: " . $e->getMessage());
        }
    }
}
?>
