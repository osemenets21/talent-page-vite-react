<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

try {
    // Connect to talent database
    $pdo = new PDO('mysql:host=localhost;dbname=talent_db;charset=utf8mb4', 'talent_user', 'en(x5z@ADuv*');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get total talents count
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM talent_data');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'total' => (int)$result['total']
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'total' => 0,
        'error' => $e->getMessage()
    ]);
}
?>
