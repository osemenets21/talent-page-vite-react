<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once 'validate_jwt.php';
require_once 'TalentMysqlDB.php';

try {
    $email = $_REQUEST['jwt_user_email'] ?? null;
    $submissionId = $_REQUEST['submissionId'] ?? $_GET['submissionId'] ?? null;
    
    if (!$email && !$submissionId) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email or submissionId parameter is required'
        ]);
        exit;
    }
    
    // Use the working database credentials from diagnostic
    $db = new TalentMysqlDB('localhost', 'talent_db', 'talent_user', 'en(x5z@ADuv*');
    
    // Try to get talent by email first (from JWT), then by submissionId
    if ($email) {
        error_log("[DEBUG] Searched email: '" . $email . "'");
        $talent = $db->selectByEmail($email);
        error_log("[DEBUG] Query result: " . print_r($talent, true));
    } else if ($submissionId) {
        error_log("[DEBUG] Searched submissionId: '" . $submissionId . "'");
        $talent = $db->selectBySubmissionId($submissionId);
        error_log("[DEBUG] Query result: " . print_r($talent, true));
    } else {
        $talent = null;
    }
    
    if ($talent) {
        $legacyFormat = [
            'id' => $talent['id'],
            'firstName' => $talent['first_name'],
            'lastName' => $talent['last_name'],
            'phone' => $talent['phone'],
            'email' => $talent['email'],
            'instagram' => $talent['instagram'],
            // 'facebook' => $talent['facebook'],
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
                'performerImages' => $talent['performer_images'] ? json_decode($talent['performer_images'], true) : []
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
        // Always return 200 OK, even if not found
        $searchParam = $email ? "email: $email" : "submissionId: $submissionId";
        echo json_encode([
            'status' => 'error',
            'message' => "Talent not found with $searchParam"
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
