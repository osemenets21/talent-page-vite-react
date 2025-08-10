<?php
// Suppress PHP warnings and errors that could interfere with JSON output
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. Validate submissionId
    $submissionId = isset($_POST["submissionId"]) ? $_POST["submissionId"] : null;
    if (!$submissionId || !preg_match('/^[a-zA-Z0-9]+$/', $submissionId)) {
        echo json_encode(["status" => "error", "message" => "Missing or invalid submission ID"]);
        exit;
    }

// 2. Define folders and paths
$baseDir = __DIR__;
$firstName = isset($_POST["firstName"]) ? preg_replace('/[^a-zA-Z0-9]/', '', $_POST["firstName"]) : "unknown";
$lastName = isset($_POST["lastName"]) ? preg_replace('/[^a-zA-Z0-9]/', '', $_POST["lastName"]) : "unknown";
$uploadFolder = $submissionId;
$userUploadDir = "$baseDir/uploads/$uploadFolder";
$submissionsFile = "$baseDir/submissions/talent_data.json";

// 3. Create upload directory if it doesn't exist
if (!file_exists($userUploadDir)) {
    @mkdir($userUploadDir, 0755, true);
}

// 4. Handle file uploads
$savedFiles = [];
foreach (["photo", "taxForm"] as $field) {
    if (isset($_FILES[$field])) {
        $filename = basename($_FILES[$field]["name"]);
        $uniqueName = time() . "_" . $filename;
        $targetPath = $userUploadDir . "/" . $uniqueName;
        if (@move_uploaded_file($_FILES[$field]["tmp_name"], $targetPath)) {
            $savedFiles[$field] = $uniqueName;
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to save $field"]);
            exit;
        }
    }
}

// Handle performerImages[] multiple upload
$performerImages = [];
if (isset($_FILES["performerImages"])) {
    $files = $_FILES["performerImages"];
    $count = is_array($files["name"]) ? count($files["name"]) : 0;
    for ($i = 0; $i < $count; $i++) {
        if ($files["error"][$i] === UPLOAD_ERR_OK) {
            $filename = basename($files["name"][$i]);
            $uniqueName = time() . "_" . $i . "_" . $filename;
            $targetPath = $userUploadDir . "/" . $uniqueName;
            if (@move_uploaded_file($files["tmp_name"][$i], $targetPath)) {
                $performerImages[] = $uniqueName;
            }
        }
    }
}

// 5. Prepare submission data
$data = $_POST;
$data["files"] = $savedFiles;
if (!empty($performerImages)) {
    $data["files"]["performerImages"] = $performerImages;
}
// Use timestamp from frontend if provided, otherwise use PHP timestamp in Eastern Time
if (!isset($data["timestamp"]) || empty($data["timestamp"])) {
    date_default_timezone_set('America/New_York');
    $data["timestamp"] = date("m/d/Y, g:i:s A");
}
// Always overwrite portfolio field: set to empty string if not uploaded, or filename if uploaded
// Portfolio removed

// 6. Load existing submissions
$existingData = [];
if (file_exists($submissionsFile)) {
    $json = @file_get_contents($submissionsFile);
    if ($json !== false) {
        $existingData = @json_decode($json, true);
        if (!is_array($existingData)) {
            $existingData = [];
        }
    }
}

// 7. Remove any existing submission with the same ID
$existingData = array_filter($existingData, function ($entry) use ($submissionId) {
    return !(isset($entry["submissionId"]) && $entry["submissionId"] === $submissionId);
});

// 8. Append the new submission
$existingData[] = $data;

// 9. Save updated JSON
@file_put_contents($submissionsFile, json_encode(array_values($existingData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 10. Send email notification
$to = "oleg@luckyhospitality.com";
$subject = "New Talent Profile Submitted";
$firstName = isset($_POST["firstName"]) ? $_POST["firstName"] : "Unknown";
$lastName = isset($_POST["lastName"]) ? $_POST["lastName"] : "Unknown";
$role = isset($_POST["role"]) ? $_POST["role"] : "Unknown";
$email = isset($_POST["email"]) ? $_POST["email"] : "Not provided";
$phone = isset($_POST["phone"]) ? $_POST["phone"] : "Not provided";

$message = "A new talent profile has been submitted:\n\n";
$message .= "Name: $firstName $lastName\n";
$message .= "Role: $role\n";
$message .= "Email: $email\n";
$message .= "Phone: $phone\n";
$message .= "Submission ID: $submissionId\n";
$message .= "Submitted on: " . $data["timestamp"] . "\n\n";
$message .= "Please log into the supervisor panel to review and approve this profile.";

$headers = "From: noreply@luckyhospitality.com\r\n";
$headers .= "Reply-To: noreply@luckyhospitality.com\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send the email (mail function returns true/false but we won't fail if email fails)
@mail($to, $subject, $message, $headers);

// 11. Return success
echo json_encode(["status" => "success"]);

} catch (Exception $e) {
    // Return error as JSON
    echo json_encode(["status" => "error", "message" => "Server error occurred"]);
}
