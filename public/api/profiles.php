<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['user_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM profiles WHERE user_id = ?");
            $stmt->execute([$_GET['user_id']]);
            jsonResponse($stmt->fetch() ?: null);
        } else {
            jsonError('User ID required', 400);
        }
        break;

    case 'POST':
    case 'PUT':
        $data = getRequestBody();
        $userId = $_GET['user_id'] ?? $data['user_id'] ?? null;
        
        if (!$userId) {
            jsonError('User ID required', 400);
        }
        
        // Check if profile exists
        $stmt = $pdo->prepare("SELECT id FROM profiles WHERE user_id = ?");
        $stmt->execute([$userId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update
            $fields = [];
            $values = [];
            
            $allowedFields = ['full_name', 'phone', 'address', 'city', 'country', 'avatar_url'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                jsonResponse(['success' => true]);
                break;
            }
            
            $fields[] = "updated_at = NOW()";
            $values[] = $userId;
            
            $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE user_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
        } else {
            // Insert
            $stmt = $pdo->prepare("
                INSERT INTO profiles (id, user_id, full_name, phone, address, city, country, avatar_url, created_at, updated_at)
                VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $userId,
                $data['full_name'] ?? null,
                $data['phone'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['country'] ?? 'UAE',
                $data['avatar_url'] ?? null,
            ]);
        }
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
