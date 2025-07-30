<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$email = $_GET["email"] ?? null;
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid email"]);
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
    if (isset($entry["email"]) && strtolower($entry["email"]) === strtolower($email)) {
        echo json_encode($entry);
        exit;
    }
}

echo json_encode(["status" => "error", "message" => "Profile not found"]);
exit;
