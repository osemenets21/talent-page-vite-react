<?php
// request_w9.php: Handles W9 form requests and emails manager
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/env.php';
require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$firstName    = trim($_POST['firstName'] ?? '');
$lastName     = trim($_POST['lastName'] ?? '');
$email        = trim($_POST['email'] ?? '');
$phone        = trim($_POST['phone'] ?? '');
$submissionId = trim($_POST['submissionId'] ?? '');

if ($firstName === '' || $lastName === '' || $email === '' || $phone === '' || $submissionId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

use Aws\Ses\SesClient;
use Aws\Exception\AwsException;

$toEmail  = 'oleg@luckyhospitality.com';
$fromEmail = 'zach@bunkerdc.com';
$fromName  = 'Lucky Hospitality';
$awsRegion = 'us-east-2';
$awsKey    = getenv('AWS_ACCESS_KEY_ID');
$awsSecret = getenv('AWS_SECRET_ACCESS_KEY');

$subject = 'W9 Form Request';
$plainBody =
    "A user has requested a W9 tax form.\n\n" .
    "Submission ID: {$submissionId}\n" .
    "First Name:    {$firstName}\n" .
    "Last Name:     {$lastName}\n" .
    "Email:         {$email}\n" .
    "Phone:         {$phone}\n\n" .
    "Please send the W9 form to this user.";

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
    ]);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Your request for a W9 form has been sent to the manager.'
    ]);
} catch (AwsException $e) {
    error_log('SES API error: ' . $e->getAwsErrorMessage());
    error_log('SES Exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send email. SES error: ' . $e->getAwsErrorMessage() . ' | ' . $e->getMessage()
    ]);
}
