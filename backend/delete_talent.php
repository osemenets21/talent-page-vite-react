<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
$lines = file($sourceFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$updated = array_filter($lines, function($line) use ($submissionId) {
  $entry = json_decode($line, true);
  return $entry['submissionId'] !== $submissionId;
});

file_put_contents($sourceFile, implode("\n", $updated));
echo json_encode(["status" => "success"]);
