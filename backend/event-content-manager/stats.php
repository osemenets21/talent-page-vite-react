<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Try SQLite first, fallback to file-based DB
try {
    require_once 'EventsDB.php';
    $db = new EventsDB();
} catch (Exception $e) {
    // SQLite not available, use file-based database
    require_once 'EventsFileDB.php';
    $db = new EventsFileDB();
}

try {
    $stats = $db->getStats();
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
