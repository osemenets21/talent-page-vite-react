<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'validate_jwt.php';
require_once 'TalentMysqlDB.php';

// Add debug logging
error_log("supervisor_edit_talent_mysql.php: Starting supervisor edit");

// Read JSON input for supervisor edits
$input = file_get_contents('php://input');
$jsonData = json_decode($input, true);

error_log("Raw input: " . $input);
error_log("JSON data: " . json_encode($jsonData));
error_log("POST data: " . json_encode($_POST));

try {
    $db = new TalentMysqlDB();
    
    // Get the authenticated user email (set by validate_jwt.php)
    $userEmail = $_REQUEST['jwt_user_email'] ?? null;
    error_log("Supervisor edit by user: " . ($userEmail ?? 'null'));
    
    // Get the submission ID for the talent to edit
    $submissionId = $jsonData['submissionId'] ?? null;
    if (!$submissionId) {
        echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
        exit;
    }
    
    $db = new TalentMysqlDB();
    
    // Find talent by submission ID (different from regular edit which uses user's email)
    $talent = $db->selectBySubmissionId($submissionId);
    
    if (!$talent) {
        error_log("Talent not found for submission ID: " . $submissionId);
        echo json_encode(["status" => "error", "message" => "Talent not found with submission ID: " . $submissionId]);
        exit;
    }
    
    error_log("Found talent: " . $talent['submission_id'] . " for supervisor edit");
    
    // Prepare update data
    $updateData = [];
    $allowedFields = [
        'first_name', 'last_name', 'phone', 'email', 'instagram', 'facebook',
        'soundcloud', 'spotify', 'youtube', 'tiktok', 'performer_name', 
        'city', 'country', 'bio', 'role', 'role_other', 'payment_method',
        'venmo', 'zelle', 'paypal', 'bank_info', 'status', 'notes'
    ];
    
    // Legacy field mapping for supervisor panel compatibility
    $fieldMap = [
        'firstName' => 'first_name',
        'lastName' => 'last_name',
        'performerName' => 'performer_name',
        'roleOther' => 'role_other',
        'paymentMethod' => 'payment_method'
    ];
    
    foreach ($jsonData as $key => $value) {
        // Skip non-editable fields
        if ($key === 'submissionId') continue;
        
        // Map legacy field names
        $dbField = $fieldMap[$key] ?? $key;
        
        if (in_array($dbField, $allowedFields)) {
            $updateData[$dbField] = $value;
        }
    }

    if (empty($updateData)) {
        error_log("No valid fields to update");
        echo json_encode(["status" => "error", "message" => "No valid fields to update"]);
        exit;
    }

    // Add updated timestamp
    $updateData['updated_at'] = date('Y-m-d H:i:s');
    
    error_log("Update data: " . json_encode($updateData));

    // Update the record
    $result = $db->update($talent['id'], $updateData);
    
    error_log("Database update result: " . ($result ? 'success' : 'failed'));
    
    if ($result) {
        // Also update JSON backup
        $jsonFile = __DIR__ . '/submissions/talent_data.json';
        if (file_exists($jsonFile)) {
            $jsonData = json_decode(file_get_contents($jsonFile), true) ?: [];
            
            // Find and update the JSON record
            foreach ($jsonData as &$entry) {
                if ($entry['submissionId'] === $talent['submission_id']) {
                    // Update JSON with new values using legacy field names
                    if (isset($updateData['first_name'])) $entry['firstName'] = $updateData['first_name'];
                    if (isset($updateData['last_name'])) $entry['lastName'] = $updateData['last_name'];
                    if (isset($updateData['performer_name'])) $entry['performerName'] = $updateData['performer_name'];
                    if (isset($updateData['role_other'])) $entry['roleOther'] = $updateData['role_other'];
                    if (isset($updateData['payment_method'])) $entry['paymentMethod'] = $updateData['payment_method'];
                    
                    // Direct field mappings
                    $directFields = ['phone', 'email', 'instagram', 'facebook', 'soundcloud', 
                                   'spotify', 'youtube', 'tiktok', 'city', 'country', 'bio', 
                                   'role', 'venmo', 'zelle'];
                    foreach ($directFields as $field) {
                        if (isset($updateData[$field])) {
                            $entry[$field] = $updateData[$field];
                        }
                    }
                    
                    $entry['updated_at'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            
            file_put_contents($jsonFile, json_encode($jsonData, JSON_PRETTY_PRINT));
        }
        
        echo json_encode([
            "status" => "success", 
            "message" => "Talent updated successfully by supervisor",
            "data" => $result
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update talent"]);
    }
    
} catch (Exception $e) {
    error_log("Supervisor edit error: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Update failed: " . $e->getMessage()
    ]);
}
?>
