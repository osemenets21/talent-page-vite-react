<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
$uploadFolder = $firstName . "_" . $lastName;
$userUploadDir = "$baseDir/uploads/$uploadFolder";
$submissionsFile = "$baseDir/submissions/talent_data.json";

// 3. Create upload directory if it doesn't exist
if (!file_exists($userUploadDir)) {
    mkdir($userUploadDir, 0755, true);
}

// 4. Handle file uploads
$savedFiles = [];
foreach (["portfolio", "photo", "taxForm"] as $field) {
    if (isset($_FILES[$field])) {
        $filename = basename($_FILES[$field]["name"]);
        $uniqueName = time() . "_" . $filename;
        $targetPath = $userUploadDir . "/" . $uniqueName;
        if (move_uploaded_file($_FILES[$field]["tmp_name"], $targetPath)) {
            $savedFiles[$field] = $uniqueName;
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to save $field"]);
            exit;
        }
    }
}

// 5. Prepare submission data
$data = $_POST;
$data["files"] = $savedFiles;
$data["timestamp"] = date("Y-m-d H:i:s");

// 6. Load existing submissions
$existingData = [];
if (file_exists($submissionsFile)) {
    $json = file_get_contents($submissionsFile);
    $existingData = json_decode($json, true);
    if (!is_array($existingData)) {
        $existingData = [];
    }
}

// 7. Remove any existing submission with the same ID
$existingData = array_filter($existingData, function ($entry) use ($submissionId) {
    return !(isset($entry["submissionId"]) && $entry["submissionId"] === $submissionId);
});

// 8. Append the new submission
$existingData[] = $data;

// 9. Save updated JSON
file_put_contents($submissionsFile, json_encode(array_values($existingData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 10. Return success
echo json_encode(["status" => "success"]);
