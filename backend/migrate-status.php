<?php
// Migration script to add status column and set default values
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=talent_events_db", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Starting migration...\n";
    
    // Check if status column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM events LIKE 'status'");
    $columnExists = $stmt->rowCount() > 0;
    
    if (!$columnExists) {
        echo "Adding status column...\n";
        $pdo->exec("ALTER TABLE events ADD COLUMN status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'active'");
        echo "Status column added!\n";
    } else {
        echo "Status column already exists.\n";
    }
    
    // Set default status for existing events
    echo "Setting default status for existing events...\n";
    $pdo->exec("UPDATE events SET status = 'active' WHERE status IS NULL OR status = ''");
    
    // Get updated events count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM events WHERE status = 'active'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully',
        'events_updated' => $result['count']
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
