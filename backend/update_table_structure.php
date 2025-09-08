<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=event_db;charset=utf8mb4', 'event_user', 'ZLK&h,Dc5Hvn');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add missing columns to match EventsMysqlDB expectations
    $alterQueries = [
        "ALTER TABLE event_data ADD COLUMN club VARCHAR(255) NOT NULL DEFAULT 'District Eagle' AFTER id",
        "ALTER TABLE event_data ADD COLUMN event_date DATE NOT NULL DEFAULT '2025-01-01' AFTER club", 
        "ALTER TABLE event_data ADD COLUMN doors_open_time TIME AFTER event_date",
        "ALTER TABLE event_data ADD COLUMN show_start_time TIME AFTER doors_open_time",
        "ALTER TABLE event_data ADD COLUMN show_end_time TIME AFTER show_start_time", 
        "ALTER TABLE event_data ADD COLUMN cover_charge VARCHAR(100) DEFAULT 'Free' AFTER show_end_time",
        "ALTER TABLE event_data ADD COLUMN cover_charge_details TEXT AFTER cover_charge",
        "ALTER TABLE event_data ADD COLUMN advance_tickets_url TEXT AFTER cover_charge_details",
        "ALTER TABLE event_data ADD COLUMN eagle_xl TEXT AFTER advance_tickets_url",
        "ALTER TABLE event_data ADD COLUMN short_description TEXT AFTER eagle_xl",
        "ALTER TABLE event_data ADD COLUMN long_description LONGTEXT AFTER short_description"
    ];
    
    $results = [];
    
    foreach ($alterQueries as $query) {
        try {
            $pdo->exec($query);
            $results[] = "✅ " . $query;
        } catch (Exception $e) {
            // Column might already exist
            $results[] = "⚠️ " . $query . " - " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Table update completed',
        'results' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
