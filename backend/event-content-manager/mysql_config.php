<?php
// MySQL Database Configuration
return [
    'host' => 'localhost',
    'port' => 3306,
    'dbname' => 'talent_events_db',
    'username' => 'root',
    'password' => '', // Default XAMPP password is empty
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
?>
