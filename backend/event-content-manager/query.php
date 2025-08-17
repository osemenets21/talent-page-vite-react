<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'EventsDB.php';

try {
    $db = new EventsDB();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['sql'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'SQL query required']);
        exit;
    }
    
    $sql = $input['sql'];
    $params = isset($input['params']) ? $input['params'] : [];
    
    // Security: Only allow SELECT queries for safety
    if (stripos(trim($sql), 'SELECT') !== 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only SELECT queries are allowed']);
        exit;
    }
    
    $result = $db->query($sql, $params);
    
    echo json_encode([
        'success' => true,
        'result' => $result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Query error: ' . $e->getMessage()
    ]);
}
?>
