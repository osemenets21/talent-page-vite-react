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
    try {
        $jwks = json_decode(file_get_contents(
            'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
        ), true);

        if ($jwks === null) {
            throw new Exception("Failed to parse JSON response from Google JWK endpoint");
        }

        // Save to cache
        file_put_contents($cacheFile, json_encode($jwks));
        return $jwks;
    } catch (Exception $e) {
        // If fetching fails and we have a cached file, use it regardless of age
        if (file_exists($cacheFile)) {
            error_log("Warning: Using stale Google JWK cache due to fetch error: " . $e->getMessage());
            return json_decode(file_get_contents($cacheFile), true);
        }
        
        // No cache available, throw detailed error
        throw new Exception("Unable to fetch Google public keys: " . $e->getMessage());
    }
}

// Function to validate JWT and set user data in request
function validateJWTAndSetUser($projectId) {
    $idToken = getBearerToken();

    if (!$idToken) {
        http_response_code(401);
        echo json_encode([
            "error" => "Authentication failed",
            "error_code" => "MISSING_TOKEN",
            "message" => "Authorization header with Bearer token is required",
            "details" => "No Authorization header found or Bearer token not present",
            "timestamp" => date('c'),
            "suggestion" => "Include 'Authorization: Bearer <your-firebase-token>' in the request headers"
        ]);
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
            // Check if this is a key fetching error
            if (strpos($inner->getMessage(), 'Unable to fetch Google public keys') !== false) {
                http_response_code(503);
                echo json_encode([
                    "error" => "Service temporarily unavailable",
                    "error_code" => "GOOGLE_KEYS_UNAVAILABLE",
                    "message" => "Unable to fetch Google's public keys for token verification",
                    "details" => $inner->getMessage(),
                    "timestamp" => date('c'),
                    "debug_info" => [
                        "google_jwk_endpoint" => "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
                        "cache_file_exists" => file_exists(__DIR__ . '/google_jwks_cache.json')
                    ],
                    "suggestion" => "This is likely a temporary network issue. Please try again in a few moments."
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    "error" => "Token validation failed",
                    "error_code" => "INVALID_TOKEN_SIGNATURE",
                    "message" => "The provided JWT token could not be validated",
                    "details" => $inner->getMessage(),
                    "timestamp" => date('c'),
                    "debug_info" => [
                        "token_prefix" => substr($idToken, 0, 20) . "...",
                        "attempted_key_refresh" => true,
                        "firebase_project_id" => $projectId
                    ],
                    "suggestion" => "Ensure you're using a valid Firebase ID token. Try refreshing the token or re-authenticating."
                ]);
            }
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
        echo json_encode([
            "error" => "Token claims validation failed",
            "error_code" => "INVALID_TOKEN_CLAIMS",
            "message" => "The JWT token claims are invalid for this application",
            "details" => $e->getMessage(),
            "timestamp" => date('c'),
            "debug_info" => [
                "expected_audience" => $projectId,
                "expected_issuer" => "https://securetoken.google.com/{$projectId}",
                "actual_audience" => $decoded->aud ?? 'not_set',
                "actual_issuer" => $decoded->iss ?? 'not_set'
            ],
            "suggestion" => "Ensure the token was issued for the correct Firebase project and is not expired"
        ]);
        exit;
    }
}

// If this file is called directly (not included), run validation and output result
if (basename($_SERVER['PHP_SELF']) === 'validate_jwt.php') {
    try {
        $result = validateJWTAndSetUser($projectId);
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Token is valid",
            "uid" => $result['uid'],
            "email" => $result['email'],
            "claims" => $result['claims'],
            "timestamp" => date('c')
        ]);
    } catch (Exception $e) {
        // This shouldn't happen since validateJWTAndSetUser handles its own errors,
        // but just in case there's an unexpected error
        http_response_code(500);
        echo json_encode([
            "error" => "Unexpected validation error",
            "error_code" => "INTERNAL_ERROR",
            "message" => "An unexpected error occurred during token validation",
            "details" => $e->getMessage(),
            "timestamp" => date('c'),
            "suggestion" => "Please contact support if this error persists"
        ]);
    }
} else {
    // If included by another file, just run validation and set user data
    validateJWTAndSetUser($projectId);
}
