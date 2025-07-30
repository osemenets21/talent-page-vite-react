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
$sourceFile = __DIR__ . "/submissions/talent_data.json";
if (!file_exists($sourceFile)) {
  echo json_encode(["status" => "error", "message" => "Data file not found"]);
  exit;
}
$lines = file($sourceFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$updated = array_filter($lines, function($line) use ($submissionId) {
  $entry = json_decode($line, true);
  return $entry && $entry['submissionId'] !== $submissionId;
});

if (count($updated) > 0) {
  file_put_contents($sourceFile, implode("\n", $updated));
} else {
  file_put_contents($sourceFile, "");
}

echo json_encode(["status" => "success"]);
