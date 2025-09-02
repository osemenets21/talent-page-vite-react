<?php
// Unified Backend Router
// Routes all requests to appropriate handlers

// Handle CORS for production and development
$allowed_origins = [
    'https://luckyhospitality.com',
    'https://www.luckyhospitality.com',
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

// Remove /backend prefix if present
if (strpos($path, '/backend') === 0) {
    $path = substr($path, 8); // Remove '/backend'
}

// Remove leading slash and split path
$pathParts = array_filter(explode('/', trim($path, '/')));

// Handle static files (images, CSS, JS, etc.)
if (preg_match('/\.(png|jpg|jpeg|gif|css|js|ico|svg)$/i', $path)) {
    // Since document root is project root, construct path from project root
    $filePath = dirname(__DIR__) . $path; // Go up one level from backend to project root
    if (file_exists($filePath)) {
        // Get file extension and set appropriate MIME type
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'ico' => 'image/x-icon'
        ];
        
        $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo "File not found: " . $filePath;
        exit;
    }
}

// Route requests
try {
    switch ($pathParts[0] ?? '') {
        case 'talent':
            handleTalentRoutes($pathParts, $method);
            break;
            
        case 'events':
            handleEventRoutes($pathParts, $method);
            break;
            
        case 'uploads':
            handleUploads($pathParts);
            break;
            
        case 'admin':
            handleAdminRoutes($pathParts, $method);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Not found',
                'path' => $path,
                'pathParts' => $pathParts,
                'available_endpoints' => [
                    '/backend/talent/get',
                    '/backend/talent/submit',
                    '/backend/talent/all',
                    '/backend/admin/login'
                ]
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleAdminRoutes($pathParts, $method) {
    $action = $pathParts[1] ?? '';
    
    switch ($action) {
        case 'login':
            if ($method === 'POST') {
                require_once __DIR__ . '/admin_login.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Admin endpoint not found']);
    }
}

function handleEventRoutes($pathParts, $method) {
    header('Content-Type: application/json');
    
    // Try MySQL first, fallback to file-based DB
    try {
        require_once __DIR__ . '/event-content-manager/EventsMysqlDB.php';
        $db = new EventsMysqlDB('localhost', 'event_db', 'event_user', 'ZLK&h,Dc5Hvn');
    } catch (Exception $e) {
        try {
            require_once __DIR__ . '/event-content-manager/EventsDB.php';
            $db = new EventsDB();
        } catch (Exception $e2) {
            require_once __DIR__ . '/event-content-manager/EventsFileDB.php';
            $db = new EventsFileDB();
        }
    }
    
    // Handle different content types
    if (($method === 'POST' || $method === 'PUT') && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        // Handle file upload in POST/PUT
        
        if ($method === 'PUT') {
            // For PUT requests, we need to manually parse the multipart data
            // PHP doesn't populate $_POST and $_FILES for PUT requests
            $input = null;
            
            // Get the raw input
            $rawInput = file_get_contents('php://input');
            
            // Parse boundary from Content-Type header
            $boundary = '';
            if (preg_match('/boundary=(.+)$/', $_SERVER['CONTENT_TYPE'], $matches)) {
                $boundary = $matches[1];
            }
            
            if ($boundary && $rawInput) {
                // Parse multipart data manually for PUT requests
                $parts = explode('--' . $boundary, $rawInput);
                $putData = [];
                $putFiles = [];
                
                foreach ($parts as $part) {
                    if (trim($part) === '' || trim($part) === '--') continue;
                    
                    $part = ltrim($part, "\r\n");
                    list($headers, $body) = explode("\r\n\r\n", $part, 2);
                    $body = rtrim($body, "\r\n");
                    
                    // Parse headers
                    $headerLines = explode("\r\n", $headers);
                    $disposition = '';
                    $name = '';
                    $filename = '';
                    
                    foreach ($headerLines as $headerLine) {
                        if (strpos($headerLine, 'Content-Disposition:') === 0) {
                            $disposition = $headerLine;
                            if (preg_match('/name="([^"]+)"/', $disposition, $matches)) {
                                $name = $matches[1];
                            }
                            if (preg_match('/filename="([^"]+)"/', $disposition, $matches)) {
                                $filename = $matches[1];
                            }
                        }
                    }
                    
                    if ($name) {
                        if ($filename) {
                            // This is a file
                            $tempFile = tempnam(sys_get_temp_dir(), 'upload');
                            file_put_contents($tempFile, $body);
                            $putFiles[$name] = [
                                'name' => $filename,
                                'tmp_name' => $tempFile,
                                'size' => strlen($body),
                                'error' => UPLOAD_ERR_OK
                            ];
                        } else {
                            // This is regular form data
                            $putData[$name] = $body;
                        }
                    }
                }
                
                // Set the parsed data
                $_POST = $putData;
                $_FILES = $putFiles;
            }
        }
        
        $input = null;
        if (isset($_POST['eventData'])) {
            $input = json_decode($_POST['eventData'], true);
        }
    } else {
        // Handle JSON input
        $input = json_decode(file_get_contents('php://input'), true);
    }
    
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
    
    // Handle stats request
    if (isset($_GET['stats']) || strpos($_SERVER['REQUEST_URI'], '/events/stats') !== false) {
        try {
            $totalEvents = $db->getTotalCount();
            $activeEvents = $db->getActiveCount();
            echo json_encode([
                'success' => true, 
                'total' => $totalEvents,
                'active' => $activeEvents
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => true, 
                'total' => 0,
                'active' => 0
            ]);
        }
        return;
    }
    
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
    
    // Handle cover photo upload if present
    if (isset($_FILES['cover_photo']) && $_FILES['cover_photo']['error'] === UPLOAD_ERR_OK) {
        $eventName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $input['event_name']);
        
        $eventFolder = __DIR__ . "/event-content-manager/{$eventName}";
        
        // Create event folder if it doesn't exist
        if (!file_exists($eventFolder)) {
            if (!mkdir($eventFolder, 0755, true)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create event folder']);
                return;
            }
        }
        
        $file = $_FILES['cover_photo'];
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.']);
            return;
        }
        
        $fileName = 'cover_photo.' . $fileExtension;
        $filePath = $eventFolder . '/' . $fileName;
        
        // For PUT requests with manually parsed files, use copy instead of move_uploaded_file
        $fileUploaded = false;
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'PUT') {
            // For PUT requests, we manually created the temp file, so use copy
            if (file_exists($file['tmp_name'])) {
                $fileUploaded = copy($file['tmp_name'], $filePath);
                if ($fileUploaded) {
                    unlink($file['tmp_name']); // Clean up temp file
                }
            }
        } else {
            // For POST requests, use the standard move_uploaded_file
            $fileUploaded = move_uploaded_file($file['tmp_name'], $filePath);
        }
        
        if ($fileUploaded) {
            $input['cover_photo'] = "/backend/event-content-manager/{$eventName}/{$fileName}";
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to upload cover photo']);
            return;
        }
    }
    
    $eventId = $db->insert($input);
    echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $eventId]);
}

function handleEventPut($db, $input) {
    header('Content-Type: application/json');
    
    error_log("=== START handleEventPut ===");
    
    // Debug logging
    error_log("PUT request - GET ID: " . ($_GET['id'] ?? 'not set'));
    error_log("PUT request - Input: " . ($input ? json_encode($input) : 'null'));
    error_log("PUT request - POST data: " . json_encode($_POST));
    error_log("PUT request - FILES: " . json_encode($_FILES));
    
    if (!isset($_GET['id']) || !$input) {
        error_log("EARLY RETURN: Missing ID or input");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Event ID and input data required']);
        return;
    }
    
    $eventId = $_GET['id'];
    
    error_log("About to check cover photo processing");
    error_log("FILES array isset cover_photo: " . (isset($_FILES['cover_photo']) ? 'yes' : 'no'));
    if (isset($_FILES['cover_photo'])) {
        error_log("Cover photo error code: " . $_FILES['cover_photo']['error']);
        error_log("UPLOAD_ERR_OK value: " . UPLOAD_ERR_OK);
        error_log("Error comparison result: " . ($_FILES['cover_photo']['error'] === UPLOAD_ERR_OK ? 'true' : 'false'));
        error_log("Combined condition result: " . ((isset($_FILES['cover_photo']) && $_FILES['cover_photo']['error'] === UPLOAD_ERR_OK) ? 'true' : 'false'));
    }
    
    // Handle cover photo upload if present
    if (isset($_FILES['cover_photo']) && $_FILES['cover_photo']['error'] === UPLOAD_ERR_OK) {
        error_log("PUT: ENTERING cover photo processing block");
        
        $eventName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $input['event_name']);
        error_log("PUT: Sanitized event name: " . $eventName);
        
        $eventFolder = __DIR__ . "/event-content-manager/{$eventName}";
        error_log("PUT: Event folder path: " . $eventFolder);
        
        // Create event folder if it doesn't exist
        if (!file_exists($eventFolder)) {
            if (!mkdir($eventFolder, 0755, true)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create event folder']);
                return;
            }
        }
        
        $file = $_FILES['cover_photo'];
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.']);
            return;
        }
        
        $fileName = 'cover_photo.' . $fileExtension;
        $filePath = $eventFolder . '/' . $fileName;
        
        // Remove old cover photo if it exists
        foreach (['jpg', 'jpeg', 'png', 'gif'] as $ext) {
            $oldFile = $eventFolder . '/cover_photo.' . $ext;
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }
        
        error_log("PUT: Attempting to move file from: " . $file['tmp_name']);
        error_log("PUT: To: " . $filePath);
        error_log("PUT: Event folder exists: " . (file_exists($eventFolder) ? 'yes' : 'no'));
        error_log("PUT: Temp file exists: " . (file_exists($file['tmp_name']) ? 'yes' : 'no'));
        
        // For PUT requests with manually parsed files, use copy instead of move_uploaded_file
        $fileUploaded = false;
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'PUT') {
            // For PUT requests, we manually created the temp file, so use copy
            if (file_exists($file['tmp_name'])) {
                $fileUploaded = copy($file['tmp_name'], $filePath);
                if ($fileUploaded) {
                    unlink($file['tmp_name']); // Clean up temp file
                }
            }
        } else {
            // For POST requests, use the standard move_uploaded_file
            $fileUploaded = move_uploaded_file($file['tmp_name'], $filePath);
        }
        
        if ($fileUploaded) {
            error_log("PUT: File moved successfully");
            $input['cover_photo'] = "/backend/event-content-manager/{$eventName}/{$fileName}";
        } else {
            error_log("PUT: Failed to move file");
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to upload cover photo']);
            return;
        }
    }
    
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
    
    // Get event details before deletion to clean up files
    $event = $db->selectById($eventId);
    if ($event && isset($event['event_name'])) {
        $eventName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $event['event_name']);
        $eventFolder = __DIR__ . "/event-content-manager/{$eventName}";
        
        // Delete the event folder and its contents
        if (file_exists($eventFolder)) {
            deleteDirectory($eventFolder);
        }
    }
    
    $deleted = $db->delete($eventId);
    
    if ($deleted) {
        echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Event not found']);
    }
}

// Utility function to recursively delete a directory
function deleteDirectory($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        $filePath = $dir . DIRECTORY_SEPARATOR . $file;
        if (is_dir($filePath)) {
            deleteDirectory($filePath);
        } else {
            unlink($filePath);
        }
    }
    
    return rmdir($dir);
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
                require_once __DIR__ . '/get_talent_by_email_mysql.php';
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
            
        case 'supervisor-edit':
            if ($method === 'POST') {
                require_once __DIR__ . '/supervisor_edit_talent_mysql.php';
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
            
        case 'delete-file':
            if ($method === 'POST') {
                require_once __DIR__ . '/delete_file_mysql.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'request-deletion':
            if ($method === 'POST') {
                require_once __DIR__ . '/request_deletion.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;
            
        case 'stats':
            if ($method === 'GET') {
                require_once __DIR__ . '/talent_stats.php';
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
