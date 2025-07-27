<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");


$email = $_GET['email'] ?? null;
if (!$email) {
  echo json_encode(["error" => "Missing email"]);
  exit;
}

$file = __DIR__ . "/submissions/talent_data.json";
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
  $data = json_decode($line, true);
  if (isset($data['email']) && strtolower($data['email']) === strtolower($email)) {
    echo json_encode($data);
    exit;
  }
}
echo json_encode(["error" => "Profile not found"]);
