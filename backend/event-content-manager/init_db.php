<?php
require_once 'EventsDB.php';

try {
    $db = new EventsDB();
    
    echo "Initializing SQLite database for events...\n";
    
    // Sample events data
    $sampleEvents = [
        [
            'club' => 'The Phoenix',
            'event_name' => 'Jazz Night with Sarah Connor',
            'event_date' => '2025-08-15',
            'doors_open_time' => '19:00',
            'show_start_time' => '20:30',
            'show_end_time' => '23:00',
            'cover_charge' => '$15',
            'cover_charge_details' => '$10 advance, $15 at door',
            'advance_tickets_url' => 'https://example.com/tickets/jazz-night',
            'eagle_xl' => 'Jazz music at its finest with acclaimed vocalist Sarah Connor',
            'short_description' => 'An evening of smooth jazz featuring Sarah Connor',
            'long_description' => 'Join us for an unforgettable evening of jazz music featuring the acclaimed vocalist Sarah Connor. Known for her soulful interpretations of jazz standards and contemporary pieces, Sarah will be accompanied by a world-class quartet.'
        ],
        [
            'club' => 'Blue Moon Lounge',
            'event_name' => 'Rock Revival Night',
            'event_date' => '2025-08-20',
            'doors_open_time' => '18:30',
            'show_start_time' => '21:00',
            'show_end_time' => '24:00',
            'cover_charge' => '$20',
            'cover_charge_details' => '$15 advance, $20 at door, VIP packages available',
            'advance_tickets_url' => 'https://example.com/tickets/rock-revival',
            'eagle_xl' => '',
            'short_description' => 'Classic rock hits and modern rock fusion',
            'long_description' => 'Experience the best of classic rock and modern rock fusion in this high-energy evening. Featuring multiple bands and special guest appearances.'
        ]
    ];
    
    foreach ($sampleEvents as $event) {
        $eventId = $db->insert($event);
        echo "Created event: {$event['event_name']} (ID: $eventId)\n";
    }
    
    // Display stats
    $stats = $db->getStats();
    echo "\nDatabase Statistics:\n";
    echo "Total events: {$stats['total_events']}\n";
    echo "Upcoming events: {$stats['upcoming_events']}\n";
    echo "Database size: {$stats['db_size_mb']} MB\n";
    
    echo "\nEvents by club:\n";
    foreach ($stats['events_by_club'] as $clubStat) {
        echo "- {$clubStat['club']}: {$clubStat['count']} events\n";
    }
    
    echo "\nDatabase initialization complete!\n";
    echo "SQLite database created at: " . __DIR__ . "/events.db\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
