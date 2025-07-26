<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$submissionId = $_GET['submissionId'] ?? null;
if (!$submissionId) {
  echo json_encode(["error" => "Missing ID"]);
  exit;
}

$file = __DIR__ . "/submissions/talent_data.json";
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
  $data = json_decode($line, true);
  if ($data['submissionId'] === $submissionId) {
    echo json_encode($data);
    exit;
  }
}
echo json_encode(["error" => "Profile not found"]);
