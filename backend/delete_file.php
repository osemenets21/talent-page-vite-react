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
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    $submissionId = $input['submissionId'] ?? null;
    $fileType = $input['fileType'] ?? null;
    $fileName = $input['fileName'] ?? null;
    
    if (!$submissionId || !$fileType) {
        echo json_encode(["status" => "error", "message" => "Missing submissionId or fileType"]);
        exit;
    }
    
    $baseDir = __DIR__;
    $submissionsFile = "$baseDir/submissions/talent_data.json";
    $uploadDir = "$baseDir/uploads/$submissionId";
    
    // Load existing submissions
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
    
    // Find the submission
    $submissionIndex = -1;
    for ($i = 0; $i < count($existingData); $i++) {
        if (isset($existingData[$i]["submissionId"]) && $existingData[$i]["submissionId"] === $submissionId) {
            $submissionIndex = $i;
            break;
        }
    }
    
    if ($submissionIndex === -1) {
        echo json_encode(["status" => "error", "message" => "Submission not found"]);
        exit;
    }
    
    $submission = &$existingData[$submissionIndex];
    
    // Handle different file types
    switch ($fileType) {
        case 'photo':
            if (isset($submission['files']['photo'])) {
                $photoFile = $submission['files']['photo'];
                $filePath = "$uploadDir/$photoFile";
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                unset($submission['files']['photo']);
            }
            break;
            
        case 'taxForm':
            if (isset($submission['files']['taxForm'])) {
                $taxFile = $submission['files']['taxForm'];
                $filePath = "$uploadDir/$taxFile";
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                unset($submission['files']['taxForm']);
            }
            break;
            
        case 'performerImage':
            if ($fileName && isset($submission['files']['performerImages'])) {
                $performerImages = $submission['files']['performerImages'];
                if (is_array($performerImages)) {
                    // Remove the specific image from array
                    $newImages = array_filter($performerImages, function($img) use ($fileName) {
                        return $img !== $fileName;
                    });
                    
                    // Delete the physical file
                    $filePath = "$uploadDir/$fileName";
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                    
                    // Update the array (reindex to avoid gaps)
                    $submission['files']['performerImages'] = array_values($newImages);
                    
                    // If no images left, remove the key
                    if (empty($submission['files']['performerImages'])) {
                        unset($submission['files']['performerImages']);
                    }
                }
            }
            break;
            
        default:
            echo json_encode(["status" => "error", "message" => "Invalid file type"]);
            exit;
    }
    
    // Add updated timestamp
    date_default_timezone_set('America/New_York');
    $submission['updated_at'] = date('Y-m-d H:i:s');
    
    // Save updated JSON
    @file_put_contents($submissionsFile, json_encode(array_values($existingData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo json_encode(["status" => "success", "message" => "File deleted successfully"]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error occurred"]);
}
?>
