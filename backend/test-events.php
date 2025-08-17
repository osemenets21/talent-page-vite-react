<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

require_once 'event-content-manager/EventsMysqlDB.php';

try {
    $db = new EventsMysqlDB();
    $events = $db->selectAll();
    
    echo json_encode([
        'success' => true, 
        'count' => count($events),
        'events' => $events
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
