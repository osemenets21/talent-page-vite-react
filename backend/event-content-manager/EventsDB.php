<?php
// SQLite database operations for events
class EventsDB {
    private $pdo;
    private $dbPath;
    
    public function __construct() {
        $this->dbPath = __DIR__ . '/events.db';
        
        // Ensure directory exists
        if (!file_exists(dirname($this->dbPath))) {
            mkdir(dirname($this->dbPath), 0755, true);
        }
        
        $this->initializeDB();
    }
    
    private function initializeDB() {
        try {
            $this->pdo = new PDO('sqlite:' . $this->dbPath);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create events table if it doesn't exist
            $sql = "CREATE TABLE IF NOT EXISTS events (
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
            )";
            
            $this->pdo->exec($sql);
            
            // Create indexes for better performance
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_event_date ON events(event_date)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_club ON events(club)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_event_name ON events(event_name)");
            
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    // SELECT operations
    public function selectAll($conditions = [], $orderBy = null, $limit = null, $offset = 0) {
        try {
            $sql = "SELECT * FROM events";
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
    
    public function selectById($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM events WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select by ID failed: " . $e->getMessage());
        }
    }
    
    public function selectWhere($field, $operator, $value) {
        try {
            $allowedOperators = ['=', '!=', '>', '>=', '<', '<=', 'LIKE'];
            if (!in_array($operator, $allowedOperators)) {
                throw new Exception("Invalid operator");
            }
            
            $sql = "SELECT * FROM events WHERE $field $operator :value";
            $stmt = $this->pdo->prepare($sql);
            
            if ($operator === 'LIKE') {
                $value = "%$value%";
            }
            
            $stmt->execute(['value' => $value]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Select where failed: " . $e->getMessage());
        }
    }
    
    // INSERT operation
    public function insert($data) {
        try {
            // Set current timestamp for NY timezone
            date_default_timezone_set('America/New_York');
            $currentTime = date('Y-m-d H:i:s');
            
            $data['created_at'] = $currentTime;
            $data['updated_at'] = $currentTime;
            
            $fields = array_keys($data);
            $placeholders = array_map(function($field) { return ":$field"; }, $fields);
            
            $sql = "INSERT INTO events (" . implode(", ", $fields) . ") VALUES (" . implode(", ", $placeholders) . ")";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($data);
            
            return $this->pdo->lastInsertId();
            
        } catch (PDOException $e) {
            throw new Exception("Insert failed: " . $e->getMessage());
        }
    }
    
    // UPDATE operation
    public function update($id, $data) {
        try {
            // Set current timestamp for NY timezone
            date_default_timezone_set('America/New_York');
            $data['updated_at'] = date('Y-m-d H:i:s');
            
            $setClause = [];
            foreach (array_keys($data) as $field) {
                $setClause[] = "$field = :$field";
            }
            
            $sql = "UPDATE events SET " . implode(", ", $setClause) . " WHERE id = :id";
            $data['id'] = $id;
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($data);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            throw new Exception("Update failed: " . $e->getMessage());
        }
    }
    
    // DELETE operation
    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM events WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            throw new Exception("Delete failed: " . $e->getMessage());
        }
    }
    
    // COUNT operation
    public function count($conditions = []) {
        try {
            $sql = "SELECT COUNT(*) as count FROM events";
            $params = [];
            
            if (!empty($conditions)) {
                $whereClause = [];
                foreach ($conditions as $key => $value) {
                    $whereClause[] = "$key = :$key";
                    $params[$key] = $value;
                }
                $sql .= " WHERE " . implode(" AND ", $whereClause);
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['count'];
            
        } catch (PDOException $e) {
            throw new Exception("Count failed: " . $e->getMessage());
        }
    }
    
    // Search events (useful for finding events by name, club, or description)
    public function search($searchTerm) {
        try {
            $sql = "SELECT * FROM events WHERE 
                    event_name LIKE :term OR 
                    club LIKE :term OR 
                    short_description LIKE :term OR 
                    long_description LIKE :term
                    ORDER BY event_date DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['term' => "%$searchTerm%"]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Search failed: " . $e->getMessage());
        }
    }
    
    // Get events by date range
    public function getEventsByDateRange($startDate, $endDate) {
        try {
            $sql = "SELECT * FROM events WHERE event_date BETWEEN :start_date AND :end_date ORDER BY event_date ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Date range query failed: " . $e->getMessage());
        }
    }
    
    // Get upcoming events
    public function getUpcomingEvents($limit = 10) {
        try {
            date_default_timezone_set('America/New_York');
            $currentDate = date('Y-m-d');
            
            $sql = "SELECT * FROM events WHERE event_date >= :current_date ORDER BY event_date ASC LIMIT :limit";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':current_date', $currentDate);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Upcoming events query failed: " . $e->getMessage());
        }
    }
    
    // Get events by club
    public function getEventsByClub($club) {
        try {
            $sql = "SELECT * FROM events WHERE club = :club ORDER BY event_date DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['club' => $club]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Club events query failed: " . $e->getMessage());
        }
    }
    
    // Execute raw SQL queries (for advanced operations)
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            // Check if it's a SELECT query
            if (stripos(trim($sql), 'SELECT') === 0) {
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            // For INSERT, UPDATE, DELETE operations
            return $stmt->rowCount();
            
        } catch (PDOException $e) {
            throw new Exception("Query execution failed: " . $e->getMessage());
        }
    }
    
    // Get database statistics
    public function getStats() {
        try {
            $stats = [];
            
            // Total events
            $stats['total_events'] = $this->count();
            
            // Events by club
            $sql = "SELECT club, COUNT(*) as count FROM events GROUP BY club ORDER BY count DESC";
            $stmt = $this->pdo->query($sql);
            $stats['events_by_club'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Upcoming events count
            date_default_timezone_set('America/New_York');
            $currentDate = date('Y-m-d');
            $sql = "SELECT COUNT(*) as count FROM events WHERE event_date >= :current_date";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['current_date' => $currentDate]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['upcoming_events'] = (int)$result['count'];
            
            // Database file size
            if (file_exists($this->dbPath)) {
                $stats['db_size_mb'] = round(filesize($this->dbPath) / 1024 / 1024, 2);
            }
            
            return $stats;
            
        } catch (PDOException $e) {
            throw new Exception("Stats query failed: " . $e->getMessage());
        }
    }
    
    // Close database connection
    public function close() {
        $this->pdo = null;
    }
    
    // Backup database
    public function backup($backupPath = null) {
        if (!$backupPath) {
            $backupPath = dirname($this->dbPath) . '/events_backup_' . date('Y-m-d_H-i-s') . '.db';
        }
        
        if (copy($this->dbPath, $backupPath)) {
            return $backupPath;
        }
        
        throw new Exception("Backup failed");
    }
}
?>
