<?php
require_once 'backend/TalentMysqlDB.php';

try {
    $db = new TalentMysqlDB();
    $result = $db->selectByEmail('oleg.min.vin@gmail.com');
    
    if ($result) {
        echo "SUCCESS: Found user data\n";
        echo "User ID: " . $result['id'] . "\n";
        echo "Name: " . $result['first_name'] . " " . $result['last_name'] . "\n";
        echo "Email: " . $result['email'] . "\n";
    } else {
        echo "ERROR: No user found with email oleg.min.vin@gmail.com\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
