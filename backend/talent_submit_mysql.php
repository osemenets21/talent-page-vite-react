<?php
// MySQL-based talent submission handler
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'TalentMysqlDB.php';

try {
    // 1. Validate submissionId
    $submissionId = isset($_POST["submissionId"]) ? $_POST["submissionId"] : null;
    if (!$submissionId || !preg_match('/^[a-zA-Z0-9]+$/', $submissionId)) {
        echo json_encode(["status" => "error", "message" => "Missing or invalid submission ID"]);
        exit;
    }

    // 2. Initialize database
    $db = new TalentMysqlDB();

    // 3. Check if submission already exists
    $existing = null;
    try {
        $existing = $db->selectBySubmissionId($submissionId);
    } catch (Exception $e) {
        // Continue if not found
    }

    // 4. Define folders and paths
    $baseDir = __DIR__;
    $firstName = isset($_POST["firstName"]) ? preg_replace('/[^a-zA-Z0-9]/', '', $_POST["firstName"]) : "unknown";
    $lastName = isset($_POST["lastName"]) ? preg_replace('/[^a-zA-Z0-9]/', '', $_POST["lastName"]) : "unknown";
    $uploadFolder = $submissionId;
    $userUploadDir = "$baseDir/uploads/$uploadFolder";
    $submissionsFile = "$baseDir/submissions/talent_data.json"; // Keep as backup

    // 5. Create upload directory if it doesn't exist
    if (!file_exists($userUploadDir)) {
        @mkdir($userUploadDir, 0755, true);
    }

    // 6. Handle file uploads
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

    // 7. Handle additional files (if any)
    $additionalFiles = [];
    for ($i = 0; $i <= 10; $i++) {
        $fieldName = "additionalFile$i";
        if (isset($_FILES[$fieldName])) {
            $filename = basename($_FILES[$fieldName]["name"]);
            $uniqueName = time() . "_$i" . "_" . $filename;
            $targetPath = $userUploadDir . "/" . $uniqueName;
            if (@move_uploaded_file($_FILES[$fieldName]["tmp_name"], $targetPath)) {
                $additionalFiles[] = $uniqueName;
            }
        }
    }

    // 8. Prepare talent data for MySQL
    $talentData = [
        'submission_id' => $submissionId,
        'first_name' => $_POST["firstName"] ?? '',
        'last_name' => $_POST["lastName"] ?? '',
        'phone' => $_POST["phone"] ?? '',
        'email' => $_POST["email"] ?? '',
        'instagram' => $_POST["instagram"] ?? '',
        'facebook' => $_POST["facebook"] ?? '',
        'soundcloud' => $_POST["soundcloud"] ?? '',
        'spotify' => $_POST["spotify"] ?? '',
        'youtube' => $_POST["youtube"] ?? '',
        'tiktok' => $_POST["tiktok"] ?? '',
        'performer_name' => $_POST["performerName"] ?? '',
        'city' => $_POST["city"] ?? '',
        'country' => $_POST["country"] ?? '',
        'bio' => $_POST["bio"] ?? '',
        'role' => $_POST["role"] ?? 'Other',
        'role_other' => $_POST["roleOther"] ?? '',
        'payment_method' => $_POST["paymentMethod"] ?? 'Venmo',
        'venmo' => $_POST["venmo"] ?? '',
        'zelle' => $_POST["zelle"] ?? '',
        'photo_filename' => $savedFiles["photo"] ?? '',
        'tax_form_filename' => $savedFiles["taxForm"] ?? '',
        'additional_files' => !empty($additionalFiles) ? json_encode($additionalFiles) : null,
        'status' => 'pending',
        'notes' => ''
    ];

    // 9. Save to MySQL database
    if ($existing) {
        // Update existing record
        $result = $db->update($existing['id'], $talentData);
        $action = 'updated';
    } else {
        // Create new record
        $result = $db->insert($talentData);
        $action = 'created';
    }

    if ($result) {
        // 10. Also save to JSON as backup (legacy support)
        $legacyData = [
            "firstName" => $_POST["firstName"] ?? '',
            "lastName" => $_POST["lastName"] ?? '',
            "phone" => $_POST["phone"] ?? '',
            "email" => $_POST["email"] ?? '',
            "instagram" => $_POST["instagram"] ?? '',
            "facebook" => $_POST["facebook"] ?? '',
            "soundcloud" => $_POST["soundcloud"] ?? '',
            "spotify" => $_POST["spotify"] ?? '',
            "youtube" => $_POST["youtube"] ?? '',
            "tiktok" => $_POST["tiktok"] ?? '',
            "performerName" => $_POST["performerName"] ?? '',
            "city" => $_POST["city"] ?? '',
            "country" => $_POST["country"] ?? '',
            "bio" => $_POST["bio"] ?? '',
            "role" => $_POST["role"] ?? 'Other',
            "roleOther" => $_POST["roleOther"] ?? '',
            "paymentMethod" => $_POST["paymentMethod"] ?? 'Venmo',
            "venmo" => $_POST["venmo"] ?? '',
            "zelle" => $_POST["zelle"] ?? '',
            "submissionId" => $submissionId,
            "timestamp" => date("m\/d\/Y, h:i:s A"),
            "files" => [
                "photo" => $savedFiles["photo"] ?? '',
                "taxForm" => $savedFiles["taxForm"] ?? ''
            ],
            "updated_at" => date("Y-m-d H:i:s")
        ];

        // Update JSON file as backup
        $jsonData = [];
        if (file_exists($submissionsFile)) {
            $jsonContent = @file_get_contents($submissionsFile);
            if ($jsonContent) {
                $jsonData = json_decode($jsonContent, true) ?: [];
            }
        }

        // Find and update existing entry or add new one
        $found = false;
        foreach ($jsonData as &$entry) {
            if ($entry['submissionId'] === $submissionId) {
                $entry = $legacyData;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $jsonData[] = $legacyData;
        }

        @file_put_contents($submissionsFile, json_encode($jsonData, JSON_PRETTY_PRINT));

        // 11. Send success response
        echo json_encode([
            "status" => "success",
            "message" => "Talent profile $action successfully",
            "data" => [
                "submissionId" => $submissionId,
                "mysql_id" => $result['id'],
                "action" => $action,
                "files" => $savedFiles,
                "additional_files" => $additionalFiles
            ]
        ]);

    } else {
        throw new Exception("Failed to save talent data to database");
    }

} catch (Exception $e) {
    error_log("Talent submission error: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Failed to save talent data: " . $e->getMessage()
    ]);
}
?>
