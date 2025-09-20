<?php
// send_confirmation.php: Sends confirmation email to user after profile submission
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/env.php';
require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$firstName = trim($input['firstName'] ?? '');
$agreements = $input['agreements'] ?? [];

if ($email === '' || $firstName === '' || !is_array($agreements)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

use Aws\Ses\SesClient;
use Aws\Exception\AwsException;

$fromEmail = 'contact@bunkerdc.com';
$fromName  = 'Lucky Hospitality Group';
$awsRegion = 'us-east-2';
$awsKey    = getenv('AWS_ACCESS_KEY_ID');
$awsSecret = getenv('AWS_SECRET_ACCESS_KEY');

$subject = 'Welcome to Lucky Hospitality Group!';

$agreementsText = "";
foreach ($agreements as $a) {
    $agreementsText .= "- $a\n";
}

$plainBody =
    "Dear $firstName,\n\n" .
    "Thank you for registering your profile with Lucky Hospitality Group. We’re excited to have you with us!\n\n" .
    "When creating your account, you agreed to the following:\n\n" .
    $agreementsText .
    "\nIf you have any questions, suggestions, or feedback about our website, please don’t hesitate to reach out at oleg@luckyhospitality.com\n\n" .
    "We look forward to working with you \n\n" .

    "Warm regards,\nLucky Hospitality Group";

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
            'ToAddresses' => [$email],
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
        'message' => 'Confirmation email sent.'
    ]);
} catch (AwsException $e) {
    error_log('SES API error: ' . $e->getAwsErrorMessage());
    error_log('SES Exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send confirmation email. SES error: ' . $e->getAwsErrorMessage() . ' | ' . $e->getMessage()
    ]);
}
