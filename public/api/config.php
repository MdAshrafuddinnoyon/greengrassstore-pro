<?php
// Database Configuration for MySQL (Hostinger)
// Update these values with your actual credentials

define('DB_HOST', 'localhost');
define('DB_NAME', 'u897176289_green');
define('DB_USER', 'u897176289_greenr');
define('DB_PASS', 'G|iIEHU6');

// JWT Secret for authentication
define('JWT_SECRET', 'your-secure-jwt-secret-change-this');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => true, 'message' => 'Database connection failed']);
        exit();
    }
}

// Response helper function
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(['data' => $data, 'error' => null]);
    exit();
}

function jsonError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['data' => null, 'error' => true, 'message' => $message]);
    exit();
}

// Get request body
function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Simple JWT functions
function generateToken($userId) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'exp' => time() + (60 * 60 * 24 * 7) // 7 days
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$signature";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    [$header, $payload, $signature] = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    if ($signature !== $validSignature) return null;
    
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return null;
    
    return $data;
}

function getCurrentUserId() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $data = verifyToken($token);
        return $data['user_id'] ?? null;
    }
    
    // Check session as fallback
    session_start();
    return $_SESSION['user_id'] ?? null;
}
?>
