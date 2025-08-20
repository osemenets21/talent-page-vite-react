<?php
// Unified Backend Router
// Routes all requests to appropriate handlers

// Handle CORS for development
$allowed_origins = [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // For development, allow all localhost origins
    if (strpos($origin, 'http://localhost:') === 0 || strpos($origin, 'http://127.0.0.1:') === 0) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: *');
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the request path
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove leading slash and split path
$pathParts = array_filter(explode('/', trim($path, '/')));

// Route requests
try {
    switch ($pathParts[0] ?? '') {
        case 'api':
            handleApiRoutes($pathParts, $method);
            break;
            
        case 'events':
            handleEventRoutes($pathParts, $method);
            break;
            
        case 'talent':
            handleTalentRoutes($pathParts, $method);
            break;
            
        case 'uploads':
            handleUploads($pathParts);
            break;
            
        default:
            // Serve static files or return 404
            if (file_exists(__DIR__ . $request)) {
                $mimeType = getMimeType($request);
                header("Content-Type: $mimeType");
                readfile(__DIR__ . $request);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Not found']);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleApiRoutes($pathParts, $method) {
    $endpoint = $pathParts[1] ?? '';
    
    switch ($endpoint) {
        case 'events':
            // Route to events API
            $_SERVER['REQUEST_URI'] = '/events/' . implode('/', array_slice($pathParts, 2));
            handleEventRoutes(['events'], $method);
            break;
            
        case 'talent':
            // Route to talent API
            $_SERVER['REQUEST_URI'] = '/talent/' . implode('/', array_slice($pathParts, 2));
            handleTalentRoutes(['talent'], $method);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'API endpoint not found']);
    }
}

function handleEventRoutes($pathParts, $method) {
    // Try MySQL first, fallback to file-based DB
    try {
        require_once __DIR__ . '/event-content-manager/EventsMysqlDB.php';
        $db = new EventsMysqlDB('localhost', 'talent_events_db', 'root', '');
    } catch (Exception $e) {
        try {
            require_once __DIR__ . '/event-content-manager/EventsDB.php';
            $db = new EventsDB();
        } catch (Exception $e2) {
            require_once __DIR__ . '/event-content-manager/EventsFileDB.php';
            $db = new EventsFileDB();
        }
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            handleEventGet($db);
            break;
            
        case 'POST':
            handleEventPost($db, $input);
            break;
            
        case 'PUT':
            handleEventPut($db, $input);
            break;
            
        case 'DELETE':
            handleEventDelete($db);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleEventGet($db) {
    header('Content-Type: application/json');
    
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
        return;
    } else {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $orderBy = isset($_GET['order_by']) ? $_GET['order_by'] : 'event_date DESC';
        
        $events = $db->selectAll([], $orderBy, $limit, $offset);
    }
    
    echo json_encode(['success' => true, 'events' => $events]);
}

function handleEventPost($db, $input) {
    header('Content-Type: application/json');
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        return;
    }
    
    // Validate required fields
    $requiredFields = ['club', 'event_name', 'event_date'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
            return;
        }
    }
    
    $eventId = $db->insert($input);
    echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $eventId]);
}

function handleEventPut($db, $input) {
    header('Content-Type: application/json');
    
    if (!isset($_GET['id']) || !$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Event ID and input data required']);
        return;
    }
    
    $eventId = $_GET['id'];
    $updated = $db->update($eventId, $input);
    
    if ($updated) {
        echo json_encode(['success' => true, 'message' => 'Event updated successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Event not found']);
    }
}

function handleEventDelete($db) {
    header('Content-Type: application/json');
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Event ID required']);
        return;
    }
    
    $eventId = $_GET['id'];
    $deleted = $db->delete($eventId);
    
    if ($deleted) {
        echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Event not found']);
    }
}

function handleTalentRoutes($pathParts, $method) {
    $action = $pathParts[1] ?? '';
    
    switch ($action) {
        case 'submit':
            if ($method === 'POST') {
                require_once __DIR__ . '/talent_submit_mysql.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'get':
            if ($method === 'GET') {
                if (isset($_GET['email'])) {
                    require_once __DIR__ . '/get_talent_by_email_mysql.php';
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email parameter required for talent get']);
                }
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'all':
            if ($method === 'GET') {
                require_once __DIR__ . '/get_all_talent_mysql.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'edit':
            if ($method === 'POST') {
                require_once __DIR__ . '/edit_talent_mysql.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'delete':
            if ($method === 'POST' || $method === 'DELETE') {
                require_once __DIR__ . '/delete_talent_mysql.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Talent endpoint not found']);
    }
}

function handleUploads($pathParts) {
    $filePath = __DIR__ . '/uploads/' . implode('/', array_slice($pathParts, 1));
    
    if (file_exists($filePath) && is_file($filePath)) {
        $mimeType = getMimeType($filePath);
        header("Content-Type: $mimeType");
        header("Content-Disposition: inline");
        readfile($filePath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
    }
}

function getMimeType($filename) {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'pdf' => 'application/pdf',
        'json' => 'application/json',
        'txt' => 'text/plain',
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript'
    ];
    
    return $mimeTypes[$extension] ?? 'application/octet-stream';
}
?>
