<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'TalentMysqlDB.php';

try {
    $db = new TalentMysqlDB();
    
    // Get input from JSON body or POST data
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    
    // Get the talent ID or submission ID from multiple sources
    $id = $input["id"] ?? $_POST["id"] ?? $_GET["id"] ?? null;
    $submissionId = $input["submissionId"] ?? $_POST["submissionId"] ?? $_GET["submissionId"] ?? null;
    
    if (!$id && !$submissionId) {
        echo json_encode(["status" => "error", "message" => "Missing talent ID or submission ID"]);
        exit;
    }
    
    // Find the talent record first
    $talent = null;
    if ($id) {
        $talent = $db->selectById($id);
    } elseif ($submissionId) {
        $talent = $db->selectBySubmissionId($submissionId);
    }
    
    if (!$talent) {
        echo json_encode(["status" => "error", "message" => "Talent not found"]);
        exit;
    }
    
    // Delete from MySQL
    $result = $db->delete($talent['id']);
    
    if ($result) {
        // Delete the uploads folder for this submission
        $uploadsFolder = __DIR__ . '/uploads/' . $talent['submission_id'];
        if (is_dir($uploadsFolder)) {
            // Recursively delete all files and subdirectories
            function deleteDirectory($dir) {
                if (!is_dir($dir)) return false;
                
                $files = array_diff(scandir($dir), array('.', '..'));
                foreach ($files as $file) {
                    $filePath = $dir . DIRECTORY_SEPARATOR . $file;
                    if (is_dir($filePath)) {
                        deleteDirectory($filePath);
                    } else {
                        @unlink($filePath);
                    }
                }
                return @rmdir($dir);
            }
            
            deleteDirectory($uploadsFolder);
        }
        
        // Also remove from JSON backup
        $jsonFile = __DIR__ . '/submissions/talent_data.json';
        if (file_exists($jsonFile)) {
            $jsonData = json_decode(file_get_contents($jsonFile), true) ?: [];
            
            // Filter out the deleted record
            $jsonData = array_filter($jsonData, function($entry) use ($talent) {
                return $entry['submissionId'] !== $talent['submission_id'];
            });
            
            // Re-index array
            $jsonData = array_values($jsonData);
            
            file_put_contents($jsonFile, json_encode($jsonData, JSON_PRETTY_PRINT));
        }
        
        echo json_encode([
            "status" => "success", 
            "message" => "Talent deleted successfully"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to delete talent"]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Delete failed: " . $e->getMessage()
    ]);
}
?>
