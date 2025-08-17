<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

try {
    // Test connection to both databases
    $databases = ['events_db', 'talent_events_db'];
    $results = [];
    
    foreach ($databases as $dbname) {
        try {
            $pdo = new PDO("mysql:host=localhost;dbname=$dbname", 'root', '');
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM events");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $results[$dbname] = $result['count'];
        } catch (Exception $e) {
            $results[$dbname] = 'Error: ' . $e->getMessage();
        }
    }
    
    echo json_encode(['database_check' => $results]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
