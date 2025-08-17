<?php
require_once 'EventsMysqlDB.php';

try {
    echo "Setting up MySQL database for events...\n";
    
    // Database configuration
    $config = [
        'host' => 'localhost',
        'dbname' => 'talent_events_db',
        'username' => 'root',
        'password' => '' // Default XAMPP MySQL password is empty
    ];
    
    echo "Connecting to MySQL server...\n";
    $db = new EventsMysqlDB($config['host'], $config['dbname'], $config['username'], $config['password']);
    
    echo "Database and table created successfully!\n";
    
    // Sample events data
    $sampleEvents = [
        [
            'club' => 'The Phoenix',
            'event_name' => 'Jazz Night with Sarah Connor',
            'event_date' => '2025-08-15',
            'doors_open_time' => '19:00:00',
            'show_start_time' => '20:30:00',
            'show_end_time' => '23:00:00',
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
            'doors_open_time' => '18:30:00',
            'show_start_time' => '21:00:00',
            'show_end_time' => '00:00:00',
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
            'doors_open_time' => '17:00:00',
            'show_start_time' => '18:00:00',
            'show_end_time' => '21:00:00',
            'cover_charge' => 'Free',
            'cover_charge_details' => 'No cover charge, drink minimums apply',
            'advance_tickets_url' => '',
            'eagle_xl' => 'Intimate acoustic performances in a cozy setting',
            'short_description' => 'Unplugged acoustic performances by local artists',
            'long_description' => 'Join us every Sunday for intimate acoustic performances featuring the best local singer-songwriters and musicians. A perfect way to unwind and discover new talent.'
        ],
        [
            'club' => 'Midnight Lounge',
            'event_name' => 'Electronic Dance Night',
            'event_date' => '2025-08-22',
            'doors_open_time' => '21:00:00',
            'show_start_time' => '22:00:00',
            'show_end_time' => '03:00:00',
            'cover_charge' => '$25',
            'cover_charge_details' => '$20 advance, $25 at door, VIP table service available',
            'advance_tickets_url' => 'https://example.com/tickets/edm-night',
            'eagle_xl' => 'High-energy electronic music with top DJs',
            'short_description' => 'Electronic dance music with international DJs',
            'long_description' => 'Get ready to dance the night away with the hottest electronic beats. Featuring international DJs, state-of-the-art sound system, and immersive lighting effects.'
        ],
        [
            'club' => 'Blue Moon Lounge',
            'event_name' => 'Comedy Night Special',
            'event_date' => '2025-08-25',
            'doors_open_time' => '19:30:00',
            'show_start_time' => '20:00:00',
            'show_end_time' => '22:30:00',
            'cover_charge' => '$18',
            'cover_charge_details' => '$15 advance, $18 at door, includes 2-drink minimum',
            'advance_tickets_url' => 'https://example.com/tickets/comedy-night',
            'eagle_xl' => 'Stand-up comedy featuring local and touring comedians',
            'short_description' => 'Stand-up comedy night with hilarious performers',
            'long_description' => 'Laugh until your sides hurt with our monthly comedy showcase featuring both established and up-and-coming comedians. Perfect for date night or hanging out with friends.'
        ]
    ];
    
    echo "Inserting sample events...\n";
    foreach ($sampleEvents as $event) {
        $eventId = $db->insert($event);
        echo "Created event: {$event['event_name']} (ID: $eventId)\n";
    }
    
    // Display stats
    $stats = $db->getStats();
    echo "\nMySQL Database Statistics:\n";
    echo "Total events: {$stats['total_events']}\n";
    echo "Upcoming events: {$stats['upcoming_events']}\n";
    
    echo "\nEvents by club:\n";
    foreach ($stats['events_by_club'] as $clubStat) {
        echo "- {$clubStat['club']}: {$clubStat['count']} events\n";
    }
    
    // Test some queries
    echo "\nTesting MySQL queries:\n";
    
    // Search test
    $jazzEvents = $db->search('jazz');
    echo "Jazz events found: " . count($jazzEvents) . "\n";
    
    // Upcoming events test
    $upcoming = $db->getUpcomingEvents(5);
    echo "Next 5 upcoming events: " . count($upcoming) . "\n";
    
    // Club events test
    $phoenixEvents = $db->getEventsByClub('The Phoenix');
    echo "The Phoenix events: " . count($phoenixEvents) . "\n";
    
    echo "\nMySQL Database setup complete!\n";
    echo "Database: talent_events_db\n";
    echo "Table: events\n";
    echo "Access phpMyAdmin at: http://localhost/phpmyadmin\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. Make sure XAMPP is installed and running\n";
    echo "2. Start MySQL service in XAMPP Control Panel\n";
    echo "3. Check if MySQL is running on port 3306\n";
    echo "4. Verify database credentials (default: root with no password)\n";
}
?>
