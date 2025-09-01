<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Include JWT validation - this will validate the token and set user data
require_once 'validate_jwt.php';

// At this point, if we reach here, the JWT token is valid
// and user data is available in the request

try {
    // Get user data from the request (set by validate_jwt.php)
    $userEmail = $_REQUEST['jwt_user_email'] ?? null;
    $userUid = $_REQUEST['jwt_user_uid'] ?? null;
    $userClaims = $_REQUEST['jwt_user_claims'] ?? null;

    // Validate that we have the required user data
    if (!$userEmail) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email claim not found in token'
        ]);
        exit;
    }

    // Test endpoint logic - return user info and a success message
    $response = [
        'status' => 'success',
        'message' => 'This is a protected endpoint - JWT validation successful!',
        'authenticated_user' => [
            'email' => $userEmail,
            'uid' => $userUid,
            'token_issued_at' => date('Y-m-d H:i:s', $userClaims->iat ?? 0),
            'token_expires_at' => date('Y-m-d H:i:s', $userClaims->exp ?? 0)
        ],
        'server_time' => date('Y-m-d H:i:s'),
        'endpoint_info' => [
            'name' => 'Test Protected Endpoint',
            'description' => 'This endpoint requires a valid Firebase JWT token',
            'method' => $_SERVER['REQUEST_METHOD'],
            'path' => $_SERVER['REQUEST_URI']
        ]
    ];

    // Optional: Add any query parameters that were sent
    if (!empty($_GET)) {
        $response['query_parameters'] = $_GET;
    }

    // Optional: Add any POST data that was sent
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST)) {
        $response['post_data'] = $_POST;
    }

    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>
