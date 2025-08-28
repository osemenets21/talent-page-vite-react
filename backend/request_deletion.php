<?php
// Profile deletion request handler
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    $submissionId = $input['submissionId'] ?? null;
    $firstName = $input['firstName'] ?? null;
    $lastName = $input['lastName'] ?? null;
    
    if (!$submissionId || !$firstName || !$lastName) {
        echo json_encode([
            "status" => "error", 
            "message" => "Missing required information: submissionId, firstName, or lastName"
        ]);
        exit;
    }
    
    // Email details
    $to = "contact@bunker.com";
    $subject = "Profile Deletion Request - Talent Database";
    $message = "A talent has requested deletion of their profile from the database.\n\n";
    $message .= "Details:\n";
    $message .= "First Name: " . $firstName . "\n";
    $message .= "Last Name: " . $lastName . "\n";
    $message .= "Submission ID: " . $submissionId . "\n\n";
    $message .= "Please review this request and take appropriate action.\n\n";
    $message .= "Request submitted on: " . date('Y-m-d H:i:s T');
    
    // Email headers
    $headers = "From: noreply@bunker.com\r\n";
    $headers .= "Reply-To: noreply@bunker.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email
    $emailSent = mail($to, $subject, $message, $headers);
    
    if ($emailSent) {
        echo json_encode([
            "status" => "success",
            "message" => "Deletion request has been sent successfully. Our team will review your request."
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to send deletion request. Please try again later or contact support directly."
        ]);
    }
    
} catch (Exception $e) {
    error_log("Profile deletion request error: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Failed to process deletion request: " . $e->getMessage()
    ]);
}
?>
