<?php
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
    $email = $_GET['email'] ?? null;
    $submissionId = $_GET['submissionId'] ?? null;
    
    if (!$email && !$submissionId) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email or submissionId parameter is required'
        ]);
        exit;
    }
    
    $db = new TalentMysqlDB();
    
    if ($email) {
        $talent = $db->selectByEmail($email);
    } else {
        $talent = $db->selectBySubmissionId($submissionId);
    }
    
    if ($talent) {
        $legacyFormat = [
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
                'taxForm' => $talent['tax_form_filename']
            ],
            'updated_at' => $talent['updated_at'],
            'status' => $talent['status'],
            'notes' => $talent['notes'],
            'mysql_data' => $talent
        ];
        
        echo json_encode([
            'status' => 'success',
            'data' => $legacyFormat
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Talent not found with email: ' . $email
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to retrieve talent data: ' . $e->getMessage()
    ]);
}
?>
