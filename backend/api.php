<?php
// Apache-compatible API Router
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the route from query parameter
$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Include the event handler
require_once 'event-content-manager/EventsMysqlDB.php';

try {
    switch ($route) {
        case 'events':
            handleEventRoutes($method);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Route not found', 'route' => $route]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function handleEventRoutes($method) {
    $db = new EventsMysqlDB();
    
    switch ($method) {
        case 'GET':
            $events = $db->selectAll();
            echo json_encode(['success' => true, 'events' => $events]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $db->insert($input);
            if ($result) {
                echo json_encode(['success' => true, 'event' => $result]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to create event']);
            }
            break;
            
        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Event ID required']);
                return;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $db->update($id, $input);
            if ($result) {
                echo json_encode(['success' => true, 'event' => $result]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to update event']);
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Event ID required']);
                return;
            }
            
            $result = $db->delete($id);
            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Failed to delete event']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}
?>
