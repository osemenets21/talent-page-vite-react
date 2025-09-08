<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

try {
    // Test the EventsMysqlDB class specifically
    require_once __DIR__ . '/event-content-manager/EventsMysqlDB.php';
    $db = new EventsMysqlDB('localhost', 'event_db', 'event_user', 'ZLK&h,Dc5Hvn');
    
    // Test selectAll method
    $events = $db->selectAll();
    
    echo json_encode([
        'success' => true,
        'message' => 'EventsMysqlDB class working',
        'events_count' => count($events),
        'events' => $events,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
