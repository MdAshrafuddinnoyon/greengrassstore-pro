<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

session_start();

switch ($action) {
    case 'signup':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        
        $data = getRequestBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $fullName = $data['full_name'] ?? '';
        
        if (empty($email) || empty($password)) {
            jsonError('Email and password required', 400);
        }
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonError('User already exists', 400);
        }
        
        // Create user
        $userId = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (id, email, password, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$userId, $email, $hashedPassword]);
        
        // Create profile
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, user_id, full_name, created_at, updated_at)
            VALUES (UUID(), ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$userId, $fullName]);
        
        // Assign default role
        $stmt = $pdo->prepare("
            INSERT INTO user_roles (id, user_id, role, created_at)
            VALUES (UUID(), ?, 'user', NOW())
        ");
        $stmt->execute([$userId]);
        
        $token = generateToken($userId);
        $_SESSION['user_id'] = $userId;
        
        jsonResponse([
            'user' => [
                'id' => $userId,
                'email' => $email,
            ],
            'access_token' => $token,
        ]);
        break;

    case 'signin':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        
        $data = getRequestBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT id, email, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            jsonError('Invalid credentials', 401);
        }
        
        $token = generateToken($user['id']);
        $_SESSION['user_id'] = $user['id'];
        
        // Get user role
        $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $role = $stmt->fetch();
        
        jsonResponse([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $role['role'] ?? 'user',
            ],
            'access_token' => $token,
        ]);
        break;

    case 'signout':
        session_destroy();
        jsonResponse(['success' => true]);
        break;

    case 'user':
        $userId = getCurrentUserId();
        if (!$userId) {
            jsonResponse(null);
            break;
        }
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, p.full_name, p.phone, p.address, p.city, p.country, p.avatar_url
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Get role
            $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $role = $stmt->fetch();
            $user['role'] = $role['role'] ?? 'user';
        }
        
        jsonResponse($user);
        break;

    case 'update-password':
        if ($method !== 'POST') jsonError('Method not allowed', 405);
        
        $userId = getCurrentUserId();
        if (!$userId) {
            jsonError('Unauthorized', 401);
        }
        
        $data = getRequestBody();
        $newPassword = $data['password'] ?? '';
        
        if (strlen($newPassword) < 6) {
            jsonError('Password must be at least 6 characters', 400);
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$hashedPassword, $userId]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Invalid action', 400);
}
?>
