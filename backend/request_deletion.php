<?php
// Handle profile deletion request and send email notification
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
	exit;
}

$data = $_POST;
$submissionId = $data['submissionId'] ?? '';
$firstName = $data['firstName'] ?? '';
$lastName = $data['lastName'] ?? '';

if (!$submissionId || !$firstName || !$lastName) {
	http_response_code(400);
	echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
	exit;
}

$to = 'oleg@luckyhospitality.com';
$subject = 'Profile Deletion Request';
$message = "A user has requested deletion of their profile.\n\nSubmission ID: $submissionId\nFirst Name: $firstName\nLast Name: $lastName\n\nPlease review and process this request.";
$headers = 'From: noreply@luckyhospitality.com' . "\r\n" .
		   'Reply-To: noreply@luckyhospitality.com' . "\r\n" .
		   'X-Mailer: PHP/' . phpversion();

$mailSent = mail($to, $subject, $message, $headers);

if ($mailSent) {
	echo json_encode(['status' => 'success', 'message' => 'Deletion request sent. Our team will review your request.']);
} else {
	http_response_code(500);
	echo json_encode(['status' => 'error', 'message' => 'Failed to send email. Please try again later.']);
}
