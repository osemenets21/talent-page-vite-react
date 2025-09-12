<?php
declare(strict_types=1);
// --- DEBUG: Force error display and logging ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("DEBUG: request_deletion.php started");

// ---------- Basic headers ----------
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('log_errors', '1');
$root = rtrim($_SERVER['DOCUMENT_ROOT'], '/');            // e.g. /home/USER/public_html
$logFile = $root . '/php-error.log';
if (!file_exists($logFile)) { @touch($logFile); @chmod($logFile, 0644); }
ini_set('error_log', $logFile);
error_log("request-deletion start @ " . date('c'));

// Optional CORS (enable if not already handled at server level)
// header('Access-Control-Allow-Origin: https://luckyhospitality.com');
// header('Access-Control-Allow-Credentials: true');
// header('Access-Control-Allow-Methods: POST, OPTIONS');
// header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
// if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

// ---------- Method check ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// ---------- Read & validate input ----------
$submissionId = trim($_POST['submissionId'] ?? '');
$firstName    = trim($_POST['firstName'] ?? '');
$lastName     = trim($_POST['lastName'] ?? '');

if ($submissionId === '' || $firstName === '' || $lastName === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// ---------- Load SendGrid ----------
require __DIR__ . '/../vendor/autoload.php'; // Composer autoload


// ---------- SendGrid config ----------
$toEmail   = 'oleg@luckyhospitality.com';
$fromEmail = 'oleg@luckyhospitality.com';
$fromName  = 'Lucky Hospitality';

// ---------- Build email ----------
$subject = 'Profile Deletion Request';
$plainBody =
    "A user has requested deletion of their profile.\n\n" .
    "Submission ID: {$submissionId}\n" .
    "First Name:    {$firstName}\n" .
    "Last Name:     {$lastName}\n\n" .
    "Please review and process this request.";
$htmlBody = nl2br(htmlentities($plainBody));

// ---------- Send with SendGrid ----------
$email = new \SendGrid\Mail\Mail();
$email->setFrom($fromEmail, $fromName);
$email->setSubject($subject);
$email->addTo($toEmail, $fromName);
$email->addContent("text/plain", $plainBody);
$email->addContent("text/html", $htmlBody);
$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
try {
    $response = $sendgrid->send($email);
    if ($response->statusCode() >= 200 && $response->statusCode() < 300) {
        echo json_encode([
            'status'  => 'success',
            'message' => 'Deletion request sent. Our team will review your request.'
        ]);
    } else {
        error_log('SendGrid error: ' . $response->statusCode() . ' ' . $response->body());
        http_response_code(500);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Failed to send email. Please try again later.'
        ]);
    }
} catch (Exception $e) {
    error_log('SendGrid exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send email. Please try again later.'
    ]);
}
