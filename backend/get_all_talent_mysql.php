<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

// Handle preflight quickly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once 'TalentMysqlDB.php';

try {
    $db = new TalentMysqlDB();
    
    // Get query parameters
    $status = $_GET['status'] ?? null;
    $role = $_GET['role'] ?? null;
    $search = $_GET['search'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    if ($search) {
        // Search functionality
        $talents = $db->search($search);
    } else {
        // Build conditions
        $conditions = [];
        if ($status) {
            $conditions['status'] = $status;
        }
        if ($role) {
            $conditions['role'] = $role;
        }
        
        $talents = $db->selectAll($conditions, 'created_at DESC', $limit, $offset);
    }
    
    // Convert to legacy format for backward compatibility
    $legacyFormat = [];
    foreach ($talents as $talent) {
        $legacyFormat[] = [
            'id' => $talent['id'],
            'firstName' => $talent['first_name'],
            'lastName' => $talent['last_name'],
            'phone' => $talent['phone'],
            'email' => $talent['email'],
            'instagram' => $talent['instagram'],
            'facebook' => $talent['facebook'],
            'soundcloud' => $talent['soundcloud'],
            'spotify' => $talent['spotify'],
            'youtube' => $talent['youtube'],
            'tiktok' => $talent['tiktok'],
            'performerName' => $talent['performer_name'],
            'city' => $talent['city'],
            'country' => $talent['country'],
            'bio' => $talent['bio'],
            'role' => $talent['role'],
            'roleOther' => $talent['role_other'],
            'paymentMethod' => $talent['payment_method'],
            'venmo' => $talent['venmo'],
            'zelle' => $talent['zelle'],
            'submissionId' => $talent['submission_id'],
            'timestamp' => date("m/d/Y, h:i:s A", strtotime($talent['created_at'])),
            'files' => [
                'photo' => $talent['photo_filename'],
                'taxForm' => $talent['tax_form_filename'],
                'performerImages' => $talent['additional_files'] ? json_decode($talent['additional_files'], true) : []
            ],
            'updated_at' => $talent['updated_at'],
            'status' => $talent['status'],
            'notes' => $talent['notes'],
            'mysql_data' => $talent // Include full MySQL data
        ];
    }
    
    // Get stats
    $stats = $db->getStats();
    
    echo json_encode([
        'status' => 'success',
        'data' => $legacyFormat,
        'stats' => $stats,
        'count' => count($legacyFormat)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to retrieve talent data: ' . $e->getMessage()
    ]);
}
?>
