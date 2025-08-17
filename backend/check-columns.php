<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=talent_events_db", 'root', '');
    
    // Get table structure
    $stmt = $pdo->query("DESCRIBE events");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample event data
    $stmt = $pdo->query("SELECT * FROM events LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'columns' => $columns,
        'sample_event' => $sample
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
