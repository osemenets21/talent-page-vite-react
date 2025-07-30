<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$submissionId = $_GET["submissionId"] ?? null;
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
if (!is_array($data)) {
    echo json_encode(["status" => "error", "message" => "Invalid data structure"]);
    exit;
}

foreach ($data as $entry) {
    if (isset($entry["submissionId"]) && $entry["submissionId"] === $submissionId) {
        echo json_encode($entry);
        exit;
    }
}

echo json_encode(["status" => "error", "message" => "Profile not found"]);
exit;
