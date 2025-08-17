<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Try SQLite first, fallback to file-based DB
try {
    require_once 'EventsDB.php';
    $db = new EventsDB();
} catch (Exception $e) {
    // SQLite not available, use file-based database
    require_once 'EventsFileDB.php';
    $db = new EventsFileDB();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            // Get all events or search/filter
            if (isset($_GET['search'])) {
                $events = $db->search($_GET['search']);
            } elseif (isset($_GET['club'])) {
                $events = $db->getEventsByClub($_GET['club']);
            } elseif (isset($_GET['upcoming'])) {
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                $events = $db->getUpcomingEvents($limit);
            } elseif (isset($_GET['start_date']) && isset($_GET['end_date'])) {
                $events = $db->getEventsByDateRange($_GET['start_date'], $_GET['end_date']);
            } elseif (isset($_GET['id'])) {
                $event = $db->selectById($_GET['id']);
                if ($event) {
                    echo json_encode(['success' => true, 'event' => $event]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Event not found']);
                }
                exit;
            } else {
                // Get all events with optional pagination
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
                $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
                $orderBy = isset($_GET['order_by']) ? $_GET['order_by'] : 'event_date DESC';
                
                $events = $db->selectAll([], $orderBy, $limit, $offset);
            }
            
            echo json_encode(['success' => true, 'events' => $events]);
            break;
            
        case 'POST':
            // Create new event
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input data']);
                exit;
            }
            
            // Validate required fields
            $requiredFields = ['club', 'event_name', 'event_date'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
                    exit;
                }
            }
            
            // Validate date format
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['event_date'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }
            
            $eventId = $db->insert($input);
            echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $eventId]);
            break;
            
        case 'PUT':
            // Update existing event
            if (!isset($_GET['id']) || !$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Event ID and input data required']);
                exit;
            }
            
            $eventId = $_GET['id'];
            
            // Validate date format if provided
            if (isset($input['event_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['event_date'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }
            
            $updated = $db->update($eventId, $input);
            
            if ($updated) {
                echo json_encode(['success' => true, 'message' => 'Event updated successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
            }
            break;
            
        case 'DELETE':
            // Delete event
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Event ID required']);
                exit;
            }
            
            $eventId = $_GET['id'];
            $deleted = $db->delete($eventId);
            
            if ($deleted) {
                echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
