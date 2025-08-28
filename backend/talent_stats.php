<?php
// Talent statistics endpoint
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once 'TalentMysqlDB.php';

try {
    $db = new TalentMysqlDB();
    
    // Get total number of talents
    $stmt = $db->getConnection()->prepare("SELECT COUNT(*) as total FROM talent");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalTalents = $result['total'] ?? 0;
    
    echo json_encode([
        'success' => true,
        'total' => $totalTalents
    ]);
    
} catch (Exception $e) {
    error_log("Talent stats error: " . $e->getMessage());
    echo json_encode([
        'success' => true,
        'total' => 0
    ]);
}
?>
