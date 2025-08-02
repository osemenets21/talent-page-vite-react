<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "ok"]);
    exit();
}


$data = json_decode(file_get_contents("php://input"), true);
$submissionId = $data["submissionId"] ?? null;

if (!$submissionId) {
  echo json_encode(["status" => "error", "message" => "Missing ID"]);
  exit;
}


// Remove directory
$uploadDir = __DIR__ . "/uploads/" . $submissionId;
if (is_dir($uploadDir)) {
  array_map('unlink', glob("$uploadDir/*"));
  rmdir($uploadDir);
}


// Rewrite JSON file without this entry
// Remove entry from JSON array
$sourceFile = __DIR__ . "/submissions/talent_data.json";
if (!file_exists($sourceFile)) {
  echo json_encode(["status" => "error", "message" => "Data file not found"]);
  exit;
}
$json = file_get_contents($sourceFile);
$data = json_decode($json, true);
if (!is_array($data)) $data = [];
$updated = array_filter($data, function($entry) use ($submissionId) {
  return !(isset($entry["submissionId"]) && $entry["submissionId"] === $submissionId);
});
file_put_contents($sourceFile, json_encode(array_values($updated), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo json_encode(["status" => "success"]);
