<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['user_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM custom_requirements WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$_GET['user_id']]);
            jsonResponse($stmt->fetchAll());
        } elseif (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM custom_requirements WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            jsonResponse($stmt->fetch() ?: null);
        } else {
            // Admin: Get all requirements
            $stmt = $pdo->query("SELECT * FROM custom_requirements ORDER BY created_at DESC");
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO custom_requirements (
                id, user_id, name, email, phone, title, description,
                requirement_type, budget, timeline, status, created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $data['user_id'] ?? '',
            $data['name'] ?? '',
            $data['email'] ?? '',
            $data['phone'] ?? null,
            $data['title'] ?? '',
            $data['description'] ?? '',
            $data['requirement_type'] ?? 'custom',
            $data['budget'] ?? null,
            $data['timeline'] ?? null,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Requirement ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'name', 'email', 'phone', 'title', 'description',
            'requirement_type', 'budget', 'timeline', 'status', 'admin_notes'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE custom_requirements SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Requirement ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM custom_requirements WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
