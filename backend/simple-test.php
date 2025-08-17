<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

echo json_encode(['success' => true, 'message' => 'Simple API test works!']);
?>
