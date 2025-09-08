<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Test events stats directly
    require_once __DIR__ . '/event-content-manager/EventsMysqlDB.php';
    $db = new EventsMysqlDB('localhost', 'event_db', 'event_user', 'ZLK&h,Dc5Hvn');
    
    $totalEvents = $db->getTotalCount();
    $activeEvents = $db->getActiveCount();
    
    echo json_encode([
        'success' => true,
        'total' => $totalEvents,
        'active' => $activeEvents,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
