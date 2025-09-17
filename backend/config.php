<?php

$talent_host = 'localhost';
$talent_dbname = 'talent_db';
$talent_username = 'talent_user';
$talent_password = 'en(x5z@ADuv*';

$events_host = 'localhost';
$events_dbname = 'event_db';
$events_username = 'event_user';
$events_password = 'ZLK&h,Dc5Hvn';

$charset = 'utf8mb4';


$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];


try {
    $talent_dsn = "mysql:host=$talent_host;dbname=$talent_dbname;charset=$charset";
    $talent_pdo = new PDO($talent_dsn, $talent_username, $talent_password, $options);
} catch (PDOException $e) {
    error_log("Talent database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Talent database connection failed']);
    exit;
}


try {
    $events_dsn = "mysql:host=$events_host;dbname=$events_dbname;charset=$charset";
    $events_pdo = new PDO($events_dsn, $events_username, $events_password, $options);
} catch (PDOException $e) {
    error_log("Events database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Events database connection failed']);
    exit;
}


function getDatabase($type = 'talent') {
    global $talent_pdo, $events_pdo;
    
    switch(strtolower($type)) {
        case 'events':
        case 'event':
            return $events_pdo;
        case 'talent':
        case 'talents':
        default:
            return $talent_pdo;
    }
}


$pdo = $talent_pdo;


$TALENT_TABLE = 'talent_data';  
$EVENTS_TABLE = 'event_data';

$allowed_origins = [
    'https://luckyhospitality.com',
    'https://www.luckyhospitality.com'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}
?>
