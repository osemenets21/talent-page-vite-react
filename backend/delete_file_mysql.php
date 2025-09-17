<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'TalentMysqlDB.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $submissionId = $input['submissionId'] ?? null;
    $fileType = $input['fileType'] ?? null;
    $fileName = $input['fileName'] ?? null;
    
    if (!$submissionId || !$fileType) {
        echo json_encode(["status" => "error", "message" => "Missing submissionId or fileType"]);
        exit;
    }
    
    // Initialize database
    $db = new TalentMysqlDB('localhost', 'talent_db', 'talent_user', 'en(x5z@ADuv*');
    
    // Get current talent record
    $talent = $db->selectBySubmissionId($submissionId);
    if (!$talent) {
        echo json_encode(["status" => "error", "message" => "Talent profile not found"]);
        exit;
    }
    
    $baseDir = __DIR__;
    $uploadDir = "$baseDir/uploads/$submissionId";
    
    // Handle different file types and update database
    $updateData = [];
    
    switch ($fileType) {
        case 'photo':
            if ($talent['photo_filename']) {
                $filePath = "$uploadDir/{$talent['photo_filename']}";
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                $updateData['photo_filename'] = '';
            }
            break;
            
        case 'taxForm':
            if ($talent['tax_form_filename']) {
                $filePath = "$uploadDir/{$talent['tax_form_filename']}";
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                $updateData['tax_form_filename'] = '';
            }
            break;
            
        case 'performerImage':
            if ($fileName && $talent['performer_images']) {
                $performerImages = json_decode($talent['performer_images'], true);
                if (is_array($performerImages)) {
                    // Remove the specific image from array
                    $newFiles = array_filter($performerImages, function($file) use ($fileName) {
                        return $file !== $fileName;
                    });
                    
                    // Delete the physical file
                    $filePath = "$uploadDir/$fileName";
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                    
                    // Update the array (reindex to avoid gaps)
                    $newFiles = array_values($newFiles);
                    $updateData['performer_images'] = !empty($newFiles) ? json_encode($newFiles) : null;
                }
            }
            break;
            
        default:
            echo json_encode(["status" => "error", "message" => "Invalid file type"]);
            exit;
    }
    
    // Update the database record
    if (!empty($updateData)) {
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        $result = $db->update($talent['id'], $updateData);
        
        if ($result) {
            echo json_encode(["status" => "success", "message" => "File deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update database"]);
        }
    } else {
        echo json_encode(["status" => "success", "message" => "No file to delete"]);
    }
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
