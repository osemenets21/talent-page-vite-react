<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');
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
        // Debug: Log what we found
        file_put_contents("debug.log", "FOUND ENTRY: " . json_encode($entry) . PHP_EOL, FILE_APPEND);
        file_put_contents("debug.log", "FILES BEFORE UPDATE: " . json_encode($entry['files'] ?? 'NO FILES') . PHP_EOL, FILE_APPEND);
        file_put_contents("debug.log", "POST DATA: " . json_encode($_POST) . PHP_EOL, FILE_APPEND);
        file_put_contents("debug.log", "FILES DATA: " . json_encode($_FILES) . PHP_EOL, FILE_APPEND);
        
        // Update only fields present in $_POST (but NEVER update 'files' field via POST)
        foreach ($_POST as $key => $value) {
            if ($key !== "submissionId" && $key !== "files") {
                $entry[$key] = $value;
            }
        }
        // Ensure 'files' object exists (not array)
        if (!isset($entry['files']) || !is_array($entry['files']) || array_values($entry['files']) === $entry['files']) {
            // If files is an array (numeric keys), convert to object
            $entry['files'] = [];
        }
        
        // CRITICAL: Preserve existing files before any modifications
        $existingFiles = $entry['files'];
        file_put_contents("debug.log", "EXISTING FILES PRESERVED: " . json_encode($existingFiles) . PHP_EOL, FILE_APPEND);
        // Handle file uploads - only update files that are actually uploaded
        $firstName = isset($entry['firstName']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $entry['firstName']) : 'user';
        $lastName = isset($entry['lastName']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $entry['lastName']) : 'user';
        $uploadDir = "$baseDir/uploads/{$submissionId}";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Start with existing files - PRESERVE EVERYTHING FIRST
        $entry['files'] = $existingFiles;
        file_put_contents("debug.log", "FILES INITIALIZED WITH EXISTING: " . json_encode($entry['files']) . PHP_EOL, FILE_APPEND);
        
        // Only update photo if a new photo file is uploaded
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            file_put_contents("debug.log", "UPDATING PHOTO" . PHP_EOL, FILE_APPEND);
            $photoName = uniqid('photo_') . '_' . basename($_FILES['photo']['name']);
            $photoPath = "$uploadDir/$photoName";
            if (move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath)) {
                $entry['files']['photo'] = $photoName;
                file_put_contents("debug.log", "PHOTO UPDATED TO: " . $photoName . PHP_EOL, FILE_APPEND);
            }
        } else {
            file_put_contents("debug.log", "NO NEW PHOTO - KEEPING EXISTING: " . json_encode($existingFiles['photo'] ?? 'none') . PHP_EOL, FILE_APPEND);
        }
        
        // Only update taxForm if a new tax form file is uploaded
        if (isset($_FILES['taxForm']) && $_FILES['taxForm']['error'] === UPLOAD_ERR_OK) {
            file_put_contents("debug.log", "UPDATING TAX FORM" . PHP_EOL, FILE_APPEND);
            $taxName = uniqid('tax_') . '_' . basename($_FILES['taxForm']['name']);
            $taxPath = "$uploadDir/$taxName";
            if (move_uploaded_file($_FILES['taxForm']['tmp_name'], $taxPath)) {
                $entry['files']['taxForm'] = $taxName;
                file_put_contents("debug.log", "TAX FORM UPDATED TO: " . $taxName . PHP_EOL, FILE_APPEND);
            }
        } else {
            file_put_contents("debug.log", "NO NEW TAX FORM - KEEPING EXISTING: " . json_encode($existingFiles['taxForm'] ?? 'none') . PHP_EOL, FILE_APPEND);
        }
        
        // Handle performerImages - only update if new images are uploaded
        if (isset($_FILES['performerImages'])) {
            file_put_contents("debug.log", "PROCESSING PERFORMER IMAGES" . PHP_EOL, FILE_APPEND);
            $newImages = [];
            $filesField = $_FILES['performerImages'];
            
            if (is_array($filesField['name'])) {
                $filesCount = count($filesField['name']);
                for ($i = 0; $i < $filesCount; $i++) {
                    if ($filesField['error'][$i] === UPLOAD_ERR_OK) {
                        $imgName = uniqid('performer_') . '_' . basename($filesField['name'][$i]);
                        $imgPath = "$uploadDir/$imgName";
                        if (move_uploaded_file($filesField['tmp_name'][$i], $imgPath)) {
                            $newImages[] = $imgName;
                        }
                    }
                }
            } else if ($filesField['error'] === UPLOAD_ERR_OK && !empty($filesField['name'])) {
                // Single file upload
                $imgName = uniqid('performer_') . '_' . basename($filesField['name']);
                $imgPath = "$uploadDir/$imgName";
                if (move_uploaded_file($filesField['tmp_name'], $imgPath)) {
                    $newImages[] = $imgName;
                }
            }
            
            // Only replace performerImages if new images were actually uploaded
            if (count($newImages) > 0) {
                $entry['files']['performerImages'] = $newImages;
                file_put_contents("debug.log", "PERFORMER IMAGES UPDATED TO: " . json_encode($newImages) . PHP_EOL, FILE_APPEND);
            } else {
                file_put_contents("debug.log", "NO NEW PERFORMER IMAGES - KEEPING EXISTING: " . json_encode($existingFiles['performerImages'] ?? 'none') . PHP_EOL, FILE_APPEND);
            }
        } else {
            file_put_contents("debug.log", "NO PERFORMER IMAGES IN REQUEST - KEEPING EXISTING: " . json_encode($existingFiles['performerImages'] ?? 'none') . PHP_EOL, FILE_APPEND);
        }
        
        file_put_contents("debug.log", "FINAL FILES AFTER PROCESSING: " . json_encode($entry['files']) . PHP_EOL, FILE_APPEND);
        
        // Set updated_at timestamp in Eastern Time
        date_default_timezone_set('America/New_York');
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
