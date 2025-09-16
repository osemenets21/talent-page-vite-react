<?php
declare(strict_types=1);

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

// ---------- Load PHPMailer ----------
require __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ---------- SES SMTP config ----------
$toEmail   = 'oleg@luckyhospitality.com';
$fromEmail = 'oleg@luckyhospitality.com';
$fromName  = 'Lucky Hospitality';
$smtpHost = 'email-smtp.us-east-1.amazonaws.com'; // Change if your SES region is different
$smtpUser = 'AKIAQHSVOQ6YEGHVVOVC';
$smtpPass = 'BCW2/HGBTA4rMzeeDdFWl3NT5T4fcwvSxJh28I1R6QIN';
$smtpPort = 587;

// ---------- Build email ----------
$subject = 'Profile Deletion Request';
$plainBody =
    "A user has requested deletion of their profile.\n\n" .
    "Submission ID: {$submissionId}\n" .
    "First Name:    {$firstName}\n" .
    "Last Name:     {$lastName}\n\n" .
    "Please review and process this request.";

// ---------- Send with PHPMailer/SES SMTP ----------
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpPort;

    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail);
    $mail->Subject = $subject;
    $mail->Body    = $plainBody;
    $mail->AltBody = $plainBody;

    $mail->send();
    echo json_encode([
        'status'  => 'success',
        'message' => 'Deletion request sent. Our team will review your request.'
    ]);
} catch (Exception $e) {
    error_log('SES email failed: ' . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send email. Please try again later.'
    ]);
}
