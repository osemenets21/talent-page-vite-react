<?php
// MySQL database operations for events
class EventsMysqlDB {
    private $pdo;
    private $host;
    private $dbname;
    private $username;
    private $password;
    
    public function __construct($host = 'localhost', $dbname = 'talent_events_db', $username = 'root', $password = '') {
        $this->host = $host;
        $this->dbname = $dbname;
        $this->username = $username;
        $this->password = $password;
        
        $this->initializeDB();
    }
    
    private function initializeDB() {
        try {
            // First connect without database to create it if needed
            $this->pdo = new PDO("mysql:host={$this->host}", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create database if it doesn't exist
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS {$this->dbname} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Connect to the database
            $this->pdo = new PDO("mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create events table if it doesn't exist
            $sql = "CREATE TABLE IF NOT EXISTS events (
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
                status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_event_date (event_date),
                INDEX idx_club (club),
                INDEX idx_event_name (event_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

            $this->pdo->exec($sql);
            
            // Add status column if it doesn't exist (for existing tables)
            try {
                $this->pdo->exec("ALTER TABLE events ADD COLUMN status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'active'");
            } catch (PDOException $e) {
                // Column probably already exists, ignore error
            }        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    // All the same methods as EventsDB.php but for MySQL
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
    
    public function insert($data) {
        try {
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
    
    public function update($id, $data) {
        try {
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
    
    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM events WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            throw new Exception("Delete failed: " . $e->getMessage());
        }
    }
    
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
    
    public function getUpcomingEvents($limit = 10) {
        try {
            $sql = "SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC LIMIT :limit";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            throw new Exception("Upcoming events query failed: " . $e->getMessage());
        }
    }
    
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
            $sql = "SELECT COUNT(*) as count FROM events WHERE event_date >= CURDATE()";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['upcoming_events'] = (int)$result['count'];
            
            return $stats;
            
        } catch (PDOException $e) {
            throw new Exception("Stats query failed: " . $e->getMessage());
        }
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            if (stripos(trim($sql), 'SELECT') === 0) {
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            return $stmt->rowCount();
            
        } catch (PDOException $e) {
            throw new Exception("Query execution failed: " . $e->getMessage());
        }
    }
}
?>
