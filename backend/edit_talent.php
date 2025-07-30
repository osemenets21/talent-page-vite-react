

<?php
// Always send CORS headers, even for preflight
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

file_put_contents("debug.log", json_encode(["reached" => true, "time" => date("c")]) . PHP_EOL, FILE_APPEND);

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);



$submissionId = $_POST["submissionId"] ?? null;
if (!$submissionId || !preg_match('/^[a-zA-Z0-9]+$/', $submissionId)) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid submission ID"]);
    exit;
}


$baseDir = __DIR__;
$dataFile = "$baseDir/submissions/talent_data.json";

if (!file_exists($dataFile)) {
    echo json_encode(["status" => "error", "message" => "Data file not found"]);
    exit;
}


$json = file_get_contents($dataFile);
$data = json_decode($json, true);
if (!is_array($data)) $data = [];

$updated = false;

$found = false;
foreach ($data as &$entry) {
    if (isset($entry["submissionId"]) && $entry["submissionId"] === $submissionId) {
        // Update only fields present in $_POST
        foreach ($_POST as $key => $value) {
            if ($key !== "submissionId") {
                $entry[$key] = $value;
            }
        }
        // Ensure 'files' array exists
        if (!isset($entry['files']) || !is_array($entry['files'])) {
            $entry['files'] = [];
        }
        // Handle file uploads
        $firstName = isset($entry['firstName']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $entry['firstName']) : 'user';
        $lastName = isset($entry['lastName']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $entry['lastName']) : 'user';
        $uploadDir = "$baseDir/uploads/{$firstName}_{$lastName}";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $photoName = uniqid('photo_') . '_' . basename($_FILES['photo']['name']);
            $photoPath = "$uploadDir/$photoName";
            if (move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath)) {
                $entry['files']['photo'] = $photoName;
            }
        }
        if (isset($_FILES['taxForm']) && $_FILES['taxForm']['error'] === UPLOAD_ERR_OK) {
            $taxName = uniqid('tax_') . '_' . basename($_FILES['taxForm']['name']);
            $taxPath = "$uploadDir/$taxName";
            if (move_uploaded_file($_FILES['taxForm']['tmp_name'], $taxPath)) {
                $entry['files']['taxForm'] = $taxName;
            }
        }
        $entry["updated_at"] = date("Y-m-d H:i:s");
        $updated = true;
        $found = true;
        break;
    }
}
unset($entry);


if ($updated) {
    // Save as a JSON array, not as lines
    if (file_put_contents($dataFile, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        echo json_encode(["status" => "error", "message" => "Failed to write data file"]);
        exit;
    }
    echo json_encode(["status" => "success", "message" => "Profile updated"]);
    exit;
} else {
    echo json_encode(["status" => "error", "message" => "Submission ID not found"]);
    exit;
}
