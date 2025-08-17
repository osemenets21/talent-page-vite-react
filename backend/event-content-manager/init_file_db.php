<?php
require_once 'EventsFileDB.php';

try {
    $db = new EventsFileDB();
    
    echo "Initializing File-based database for events...\n";
    
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
        ],
        [
            'club' => 'The Phoenix',
            'event_name' => 'Acoustic Sunday Sessions',
            'event_date' => '2025-08-17',
            'doors_open_time' => '17:00',
            'show_start_time' => '18:00',
            'show_end_time' => '21:00',
            'cover_charge' => 'Free',
            'cover_charge_details' => 'No cover charge, drink minimums apply',
            'advance_tickets_url' => '',
            'eagle_xl' => 'Intimate acoustic performances in a cozy setting',
            'short_description' => 'Unplugged acoustic performances by local artists',
            'long_description' => 'Join us every Sunday for intimate acoustic performances featuring the best local singer-songwriters and musicians. A perfect way to unwind and discover new talent.'
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
    
    // Test some queries
    echo "\nTesting queries:\n";
    
    // Search test
    $jazzEvents = $db->search('jazz');
    echo "Jazz events found: " . count($jazzEvents) . "\n";
    
    // Upcoming events test
    $upcoming = $db->getUpcomingEvents(5);
    echo "Next 5 upcoming events: " . count($upcoming) . "\n";
    
    // Club events test
    $phoenixEvents = $db->getEventsByClub('The Phoenix');
    echo "The Phoenix events: " . count($phoenixEvents) . "\n";
    
    echo "\nDatabase initialization complete!\n";
    echo "JSON database created at: " . __DIR__ . "/events_data.json\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
