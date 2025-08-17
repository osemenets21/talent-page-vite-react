<?php
// File-based database operations for events (backup solution)
class EventsFileDB {
    private $dataFile;
    private $indexFile;
    
    public function __construct() {
        $this->dataFile = __DIR__ . '/events_data.json';
        $this->indexFile = __DIR__ . '/events_index.json';
        
        // Ensure directory exists
        if (!file_exists(dirname($this->dataFile))) {
            mkdir(dirname($this->dataFile), 0755, true);
        }
        
        // Initialize files if they don't exist
        if (!file_exists($this->dataFile)) {
            $this->initializeDB();
        }
    }
    
    private function initializeDB() {
        $initialData = [
            'events' => [],
            'next_id' => 1,
            'created_at' => $this->getCurrentTimestamp()
        ];
        file_put_contents($this->dataFile, json_encode($initialData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        // Initialize index for fast searches
        $initialIndex = [
            'by_date' => [],
            'by_club' => [],
            'by_name' => []
        ];
        file_put_contents($this->indexFile, json_encode($initialIndex, JSON_PRETTY_PRINT));
    }
    
    // SELECT operations
    public function selectAll($conditions = [], $orderBy = null, $limit = null, $offset = 0) {
        $data = $this->loadData();
        $events = $data['events'];
        
        // Apply conditions
        if (!empty($conditions)) {
            $events = array_filter($events, function($event) use ($conditions) {
                foreach ($conditions as $key => $value) {
                    if (!isset($event[$key]) || $event[$key] != $value) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        // Apply ordering
        if ($orderBy) {
            $this->sortEvents($events, $orderBy);
        }
        
        // Apply pagination
        if ($limit) {
            $events = array_slice($events, $offset, $limit);
        }
        
        return array_values($events);
    }
    
    public function selectById($id) {
        $data = $this->loadData();
        foreach ($data['events'] as $event) {
            if ($event['id'] == $id) {
                return $event;
            }
        }
        return null;
    }
    
    public function selectWhere($field, $operator, $value) {
        $data = $this->loadData();
        $events = $data['events'];
        
        return array_filter($events, function($event) use ($field, $operator, $value) {
            if (!isset($event[$field])) return false;
            
            switch ($operator) {
                case '=':
                    return $event[$field] == $value;
                case '!=':
                    return $event[$field] != $value;
                case '>':
                    return $event[$field] > $value;
                case '>=':
                    return $event[$field] >= $value;
                case '<':
                    return $event[$field] < $value;
                case '<=':
                    return $event[$field] <= $value;
                case 'LIKE':
                    return stripos($event[$field], $value) !== false;
                default:
                    return false;
            }
        });
    }
    
    // INSERT operation
    public function insert($eventData) {
        $data = $this->loadData();
        
        $eventData['id'] = $data['next_id'];
        $eventData['created_at'] = $this->getCurrentTimestamp();
        $eventData['updated_at'] = $this->getCurrentTimestamp();
        
        $data['events'][] = $eventData;
        $data['next_id']++;
        
        $this->saveData($data);
        $this->updateIndexes($eventData, 'insert');
        
        return $eventData['id'];
    }
    
    // UPDATE operation
    public function update($id, $updateData) {
        $data = $this->loadData();
        $updated = false;
        
        for ($i = 0; $i < count($data['events']); $i++) {
            if ($data['events'][$i]['id'] == $id) {
                $oldEvent = $data['events'][$i];
                $updateData['updated_at'] = $this->getCurrentTimestamp();
                $data['events'][$i] = array_merge($data['events'][$i], $updateData);
                $updated = true;
                
                $this->updateIndexes($oldEvent, 'delete');
                $this->updateIndexes($data['events'][$i], 'insert');
                break;
            }
        }
        
        if ($updated) {
            $this->saveData($data);
            return true;
        }
        
        return false;
    }
    
    // DELETE operation
    public function delete($id) {
        $data = $this->loadData();
        $originalCount = count($data['events']);
        
        $data['events'] = array_filter($data['events'], function($event) use ($id) {
            if ($event['id'] == $id) {
                $this->updateIndexes($event, 'delete');
                return false;
            }
            return true;
        });
        
        if (count($data['events']) < $originalCount) {
            $data['events'] = array_values($data['events']); // Reindex array
            $this->saveData($data);
            return true;
        }
        
        return false;
    }
    
    // COUNT operation
    public function count($conditions = []) {
        return count($this->selectAll($conditions));
    }
    
    // Search events
    public function search($searchTerm) {
        $data = $this->loadData();
        $events = $data['events'];
        
        return array_filter($events, function($event) use ($searchTerm) {
            $searchFields = ['event_name', 'club', 'short_description', 'long_description'];
            foreach ($searchFields as $field) {
                if (isset($event[$field]) && stripos($event[$field], $searchTerm) !== false) {
                    return true;
                }
            }
            return false;
        });
    }
    
    // Get events by date range
    public function getEventsByDateRange($startDate, $endDate) {
        $data = $this->loadData();
        $events = $data['events'];
        
        return array_filter($events, function($event) use ($startDate, $endDate) {
            return isset($event['event_date']) && 
                   $event['event_date'] >= $startDate && 
                   $event['event_date'] <= $endDate;
        });
    }
    
    // Get upcoming events
    public function getUpcomingEvents($limit = 10) {
        date_default_timezone_set('America/New_York');
        $currentDate = date('Y-m-d');
        
        $upcomingEvents = $this->getEventsByDateRange($currentDate, '2030-12-31');
        $this->sortEvents($upcomingEvents, 'event_date ASC');
        
        return array_slice($upcomingEvents, 0, $limit);
    }
    
    // Get events by club
    public function getEventsByClub($club) {
        return $this->selectAll(['club' => $club]);
    }
    
    // Get database statistics
    public function getStats() {
        $data = $this->loadData();
        $events = $data['events'];
        
        $stats = [];
        $stats['total_events'] = count($events);
        
        // Events by club
        $clubCounts = [];
        foreach ($events as $event) {
            $club = $event['club'] ?? 'Unknown';
            $clubCounts[$club] = ($clubCounts[$club] ?? 0) + 1;
        }
        
        arsort($clubCounts);
        $stats['events_by_club'] = [];
        foreach ($clubCounts as $club => $count) {
            $stats['events_by_club'][] = ['club' => $club, 'count' => $count];
        }
        
        // Upcoming events count
        $stats['upcoming_events'] = count($this->getUpcomingEvents(1000));
        
        // File size
        if (file_exists($this->dataFile)) {
            $stats['db_size_mb'] = round(filesize($this->dataFile) / 1024 / 1024, 2);
        }
        
        return $stats;
    }
    
    // Helper methods
    private function loadData() {
        if (!file_exists($this->dataFile)) {
            $this->initializeDB();
        }
        
        $json = file_get_contents($this->dataFile);
        $data = json_decode($json, true);
        
        return is_array($data) ? $data : ['events' => [], 'next_id' => 1];
    }
    
    private function saveData($data) {
        file_put_contents($this->dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    
    private function getCurrentTimestamp() {
        date_default_timezone_set('America/New_York');
        return date('Y-m-d H:i:s');
    }
    
    private function sortEvents(&$events, $orderBy) {
        if (!$orderBy) return;
        
        $parts = explode(' ', trim($orderBy));
        $field = $parts[0];
        $direction = isset($parts[1]) && strtoupper($parts[1]) === 'DESC' ? 'DESC' : 'ASC';
        
        usort($events, function($a, $b) use ($field, $direction) {
            $valueA = $a[$field] ?? '';
            $valueB = $b[$field] ?? '';
            
            if ($direction === 'DESC') {
                return $valueB <=> $valueA;
            }
            return $valueA <=> $valueB;
        });
    }
    
    private function updateIndexes($event, $operation) {
        // For performance optimization - could implement search indexes
        // This is a placeholder for future optimization
    }
    
    // Backup functionality
    public function backup($backupPath = null) {
        if (!$backupPath) {
            $backupPath = dirname($this->dataFile) . '/events_backup_' . date('Y-m-d_H-i-s') . '.json';
        }
        
        if (copy($this->dataFile, $backupPath)) {
            return $backupPath;
        }
        
        throw new Exception("Backup failed");
    }
}
?>
