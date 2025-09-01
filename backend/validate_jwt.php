<?php
require __DIR__ . '/vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

$projectId = "talent-luckyhospitality"; // replace with your Firebase Project ID

// Get Bearer token from Authorization header
function getBearerToken() {
    $headers = null;

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Fetch Google's JWKs with caching
function getGooglePublicKeys($forceRefresh = false) {
    $cacheFile = __DIR__ . '/google_jwks_cache.json';
    $cacheTTL = 60 * 60 * 6; // 6 hours

    // If cached file exists and is still fresh, use it
    if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
        return json_decode(file_get_contents($cacheFile), true);
    }

    // Otherwise fetch fresh keys from Google
    $jwks = json_decode(file_get_contents(
        'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    ), true);

    // Save to cache
    file_put_contents($cacheFile, json_encode($jwks));
    return $jwks;
}

// Function to validate JWT and set user data in request
function validateJWTAndSetUser($projectId) {
    $idToken = getBearerToken();

    if (!$idToken) {
        http_response_code(401);
        echo json_encode(["error" => "Missing token"]);
        exit;
    }

    try {
        // Try with cached/fresh keys
        $jwks = getGooglePublicKeys(false);
        $publicKeys = JWK::parseKeySet($jwks);
        $decoded = JWT::decode($idToken, $publicKeys);
    } catch (Exception $e) {
        try {
            // Retry with forced refresh (in case of key rotation)
            $jwks = getGooglePublicKeys(true);
            $publicKeys = JWK::parseKeySet($jwks);
            $decoded = JWT::decode($idToken, $publicKeys);
        } catch (Exception $inner) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid token", "details" => $inner->getMessage()]);
            exit;
        }
    }

    try {
        // Validate standard claims
        if ($decoded->aud !== $projectId) {
            throw new Exception("Invalid audience");
        }
        if ($decoded->iss !== "https://securetoken.google.com/{$projectId}") {
            throw new Exception("Invalid issuer");
        }

        // ✅ Token is valid - Set user data in global variables for access by other scripts
        global $jwt_user_email, $jwt_user_uid, $jwt_user_claims;
        $jwt_user_email = $decoded->email ?? null;
        $jwt_user_uid = $decoded->sub ?? null;
        $jwt_user_claims = $decoded;

        // Also set in $_REQUEST superglobal for easy access
        $_REQUEST['jwt_user_email'] = $jwt_user_email;
        $_REQUEST['jwt_user_uid'] = $jwt_user_uid;
        $_REQUEST['jwt_user_claims'] = $decoded;

        return [
            "valid" => true,
            "email" => $jwt_user_email,
            "uid" => $jwt_user_uid,
            "claims" => $decoded
        ];

    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid token", "details" => $e->getMessage()]);
        exit;
    }
}

// If this file is called directly (not included), run validation and output result
if (basename($_SERVER['PHP_SELF']) === 'validate_jwt.php') {
    $result = validateJWTAndSetUser($projectId);
    
    http_response_code(200);
    echo json_encode([
        "message" => "Token is valid",
        "uid" => $result['uid'],
        "email" => $result['email'],
        "claims" => $result['claims']
    ]);
} else {
    // If included by another file, just run validation and set user data
    validateJWTAndSetUser($projectId);
}
