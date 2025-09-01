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
error_log("edit_talent_mysql.php: Starting profile update");
error_log("POST data: " . json_encode($_POST));
error_log("FILES data: " . json_encode(array_keys($_FILES)));

try {
    $db = new TalentMysqlDB();
    
    // Get the talent ID or submission ID
    $email = $_REQUEST['jwt_user_email'] ?? null;     
    error_log("Authenticated user email: " . ($email ?? 'null'));
    
    $talent = $db->selectByEmail($email);
    
    if (!$talent) {
        error_log("Talent not found for email: " . ($email ?? 'null'));
        echo json_encode(["status" => "error", "message" => "Talent not found"]);
        exit;
    }
    
    error_log("Found talent: " . $talent['submission_id']);
    
    // Prepare update data
    $updateData = [];
    $allowedFields = [
        'first_name', 'last_name', 'phone', 'email', 'instagram', 'facebook',
        'soundcloud', 'spotify', 'youtube', 'tiktok', 'performer_name', 
        'city', 'country', 'bio', 'role', 'role_other', 'payment_method',
        'venmo', 'zelle', 'paypal', 'bank_info', 'status', 'notes'
    ];
    
    // Legacy field mapping
    $fieldMap = [
        'firstName' => 'first_name',
        'lastName' => 'last_name',
        'performerName' => 'performer_name',
        'roleOther' => 'role_other',
        'paymentMethod' => 'payment_method'
    ];
    
    foreach ($_POST as $key => $value) {
        // Map legacy field names
        $dbField = $fieldMap[$key] ?? $key;
        
        if (in_array($dbField, $allowedFields)) {
            $updateData[$dbField] = $value;
        }
    }
    
    // Handle file uploads
    $uploadDir = __DIR__ . '/uploads/' . $talent['submission_id'];
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Handle photo upload
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $photoExtension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $photoFilename = 'profile_photo.' . $photoExtension;
        $photoPath = $uploadDir . '/' . $photoFilename;
        
        // Delete ALL existing photo files to ensure clean replacement
        $photoPatterns = ['photo.*', 'profile_photo.*', '*_profile_photo.*'];
        foreach ($photoPatterns as $pattern) {
            $existingPhotos = glob($uploadDir . '/' . $pattern);
            foreach ($existingPhotos as $oldPhoto) {
                if (file_exists($oldPhoto)) {
                    @unlink($oldPhoto);
                }
            }
        }
        
        // Also check database field for specific filename
        if (!empty($talent['photo_filename'])) {
            $oldPhotoPath = $uploadDir . '/' . $talent['photo_filename'];
            if (file_exists($oldPhotoPath)) {
                @unlink($oldPhotoPath);
            }
        }
        
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath)) {
            $updateData['photo_filename'] = $photoFilename;
        }
    }

    // Handle tax form upload
    if (isset($_FILES['taxForm']) && $_FILES['taxForm']['error'] === UPLOAD_ERR_OK) {
        $taxExtension = pathinfo($_FILES['taxForm']['name'], PATHINFO_EXTENSION);
        $taxFilename = 'tax_form.' . $taxExtension;
        $taxPath = $uploadDir . '/' . $taxFilename;
        
        // Delete ALL existing tax form files to ensure clean replacement
        $taxPatterns = ['tax_form.*', '*_W9.*', '*_tax_form.*'];
        foreach ($taxPatterns as $pattern) {
            $existingTaxForms = glob($uploadDir . '/' . $pattern);
            foreach ($existingTaxForms as $oldTaxForm) {
                if (file_exists($oldTaxForm)) {
                    @unlink($oldTaxForm);
                }
            }
        }
        
        // Also check database field for specific filename
        if (!empty($talent['tax_form_filename'])) {
            $oldTaxPath = $uploadDir . '/' . $talent['tax_form_filename'];
            if (file_exists($oldTaxPath)) {
                @unlink($oldTaxPath);
            }
        }
        
        if (move_uploaded_file($_FILES['taxForm']['tmp_name'], $taxPath)) {
            $updateData['tax_form_filename'] = $taxFilename;
        }
    }

    // Handle performer images upload
    if (isset($_FILES['performerImages']) && is_array($_FILES['performerImages']['name'])) {
        $performerImages = [];
        $existingFiles = !empty($talent['performer_images']) ? json_decode($talent['performer_images'], true) : [];
        
        // Keep existing files
        if (is_array($existingFiles)) {
            $performerImages = $existingFiles;
        }
        
        $uploadedCount = 0;
        for ($i = 0; $i < count($_FILES['performerImages']['name']); $i++) {
            if ($_FILES['performerImages']['error'][$i] === UPLOAD_ERR_OK) {
                $originalName = $_FILES['performerImages']['name'][$i];
                $extension = pathinfo($originalName, PATHINFO_EXTENSION);
                $filename = 'performer_' . (count($performerImages) + $uploadedCount + 1) . '.' . $extension;
                $path = $uploadDir . '/' . $filename;
                
                if (move_uploaded_file($_FILES['performerImages']['tmp_name'][$i], $path)) {
                    $performerImages[] = $filename;
                    $uploadedCount++;
                }
            }
        }
        
        $updateData['performer_images'] = !empty($performerImages) ? json_encode($performerImages) : null;
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
            "message" => "Talent updated successfully",
            "data" => $result
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update talent"]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Update failed: " . $e->getMessage()
    ]);
}
?>
