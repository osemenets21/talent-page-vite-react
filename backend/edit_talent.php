<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$submissionId = $_POST["submissionId"] ?? null;
if (!$submissionId || !preg_match('/^[a-zA-Z0-9]+$/', $submissionId)) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid submission ID"]);
    exit;
}

$baseDir = __DIR__;
$dataFile = "$baseDir/submissions/talent_data.json";
$tempFile = "$baseDir/submissions/talent_data_temp.json";

if (!file_exists($dataFile)) {
    echo json_encode(["status" => "error", "message" => "Data file not found"]);
    exit;
}

$updated = false;
$in = fopen($dataFile, "r");
$out = fopen($tempFile, "w");

while ($line = fgets($in)) {
    $entry = json_decode($line, true);
    if ($entry && $entry["submissionId"] === $submissionId) {
        // Update only fields present in $_POST
        foreach ($_POST as $key => $value) {
            if ($key !== "submissionId") {
                $entry[$key] = $value;
            }
        }
        $entry["updated_at"] = date("Y-m-d H:i:s");
        fwrite($out, json_encode($entry) . "\n");
        $updated = true;
    } else {
        fwrite($out, $line);
    }
}

fclose($in);
fclose($out);

if ($updated) {
    rename($tempFile, $dataFile);
    echo json_encode(["status" => "success", "message" => "Profile updated"]);
} else {
    unlink($tempFile);
    echo json_encode(["status" => "error", "message" => "Submission ID not found"]);
}
