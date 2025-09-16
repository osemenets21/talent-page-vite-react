<?php
declare(strict_types=1);


// Load environment variables (if using env.php, uncomment below)
require_once __DIR__ . '/env.php';

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

// ---------- Load AWS SDK ----------
require __DIR__ . '/../vendor/autoload.php';
use Aws\Ses\SesClient;
use Aws\Exception\AwsException;

// ---------- SES API config ----------
$toEmail   = 'oleg@luckyhospitality.com';
$fromEmail = 'oleg@luckyhospitality.com';
$fromName  = 'Lucky Hospitality';
$awsRegion = 'us-east-2'; // Ohio region
$awsKey    = getenv('AWS_ACCESS_KEY_ID');
$awsSecret = getenv('AWS_SECRET_ACCESS_KEY');

// ---------- Build email ----------
$subject = 'Profile Deletion Request';
$plainBody =
    "A user has requested deletion of their profile.\n\n" .
    "Submission ID: {$submissionId}\n" .
    "First Name:    {$firstName}\n" .
    "Last Name:     {$lastName}\n\n" .
    "Please review and process this request.";

// ---------- Send with AWS SES API ----------
$SesClient = new SesClient([
    'version'     => '2010-12-01',
    'region'      => $awsRegion,
    'credentials' => [
        'key'    => $awsKey,
        'secret' => $awsSecret,
    ],
]);

try {
    $result = $SesClient->sendEmail([
        'Source' => $fromEmail,
        'Destination' => [
            'ToAddresses' => [$toEmail],
        ],
        'Message' => [
            'Subject' => [
                'Data' => $subject,
                'Charset' => 'UTF-8',
            ],
            'Body' => [
                'Text' => [
                    'Data' => $plainBody,
                    'Charset' => 'UTF-8',
                ],
            ],
        ],
        // 'ReplyToAddresses' => [$fromEmail],
    ]);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Deletion request sent. Our team will review your request.'
    ]);
} catch (AwsException $e) {
    error_log('SES API error: ' . $e->getAwsErrorMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send email. Please try again later.'
    ]);
}
