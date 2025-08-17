<?php
// Debug API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

try {
    // Test basic response
    echo json_encode(['debug' => 'API is accessible', 'time' => date('Y-m-d H:i:s')]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
