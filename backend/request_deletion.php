<?php
declare(strict_types=1);

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

// ---------- Load PHPMailer ----------
require __DIR__ . '/../vendor/autoload.php'; // request-deletion.php is in backend/talent/
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ---------- Gmail SMTP config (App Password) ----------
$smtpHost = 'smtp.gmail.com';
$smtpUser = getenv('SMTP_USER') ?: 'oleg@luckyhospitality.com';
$smtpPass = getenv('SMTP_PASS') ?: 'xrfv dgcv yano xwxr'; 
$smtpPort = (int) (getenv('SMTP_PORT') ?: 587); // 465 also works with SMTPS
$smtpEnc  = getenv('SMTP_SECURE') ?: PHPMailer::ENCRYPTION_STARTTLS;   // use ENCRYPTION_SMTPS if port 465

$toEmail   = 'oleg@luckyhospitality.com';
$fromEmail = 'oleg@luckyhospitality.com'; // MUST match/auth user for Gmail
$fromName  = 'Lucky Hospitality';

// ---------- Build email ----------
$subject = 'Profile Deletion Request';
$plainBody =
    "A user has requested deletion of their profile.\n\n" .
    "Submission ID: {$submissionId}\n" .
    "First Name:    {$firstName}\n" .
    "Last Name:     {$lastName}\n\n" .
    "Please review and process this request.";

// ---------- Send ----------
$mail = new PHPMailer(true);

try {

    $mail->SMTPDebug = 2; // 0=off, 2=client logs
    $mail->Debugoutput = function ($str, $level) { error_log("SMTP[$level]: " . $str); };
    
    
    
    // Transport
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;         // e.g., glzdbezbyynrzehm (no spaces needed)
    $mail->SMTPSecure = $smtpEnc;          // STARTTLS for 587
    $mail->Port       = $smtpPort;

    // Headers
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail);
    // Optional: have replies go elsewhere (e.g., support)
    // $mail->addReplyTo('support@luckyhospitality.com', 'Support');

    // Body
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body    = $plainBody;

    $mail->send();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Deletion request sent. Our team will review your request.'
    ]);
} catch (Exception $e) {
    error_log('Deletion email failed: ' . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to send email. Please try again later.'
    ]);
}
