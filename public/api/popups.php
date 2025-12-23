<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM popup_notifications WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            jsonResponse($stmt->fetch() ?: null);
        } elseif (isset($_GET['active'])) {
            // Get active popups for frontend
            $stmt = $pdo->query("
                SELECT * FROM popup_notifications 
                WHERE is_active = 1 
                AND (start_date IS NULL OR start_date <= NOW())
                AND (end_date IS NULL OR end_date >= NOW())
                ORDER BY created_at DESC
                LIMIT 1
            ");
            jsonResponse($stmt->fetch() ?: null);
        } else {
            // Admin: Get all popups
            $stmt = $pdo->query("SELECT * FROM popup_notifications ORDER BY created_at DESC");
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO popup_notifications (
                id, title, title_ar, description, description_ar, image_url,
                button_text, button_text_ar, button_link, is_active,
                display_frequency, start_date, end_date, created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $data['title'] ?? '',
            $data['title_ar'] ?? null,
            $data['description'] ?? null,
            $data['description_ar'] ?? null,
            $data['image_url'] ?? null,
            $data['button_text'] ?? null,
            $data['button_text_ar'] ?? null,
            $data['button_link'] ?? null,
            $data['is_active'] ?? false,
            $data['display_frequency'] ?? 'once_per_session',
            $data['start_date'] ?? null,
            $data['end_date'] ?? null,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Popup ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'title', 'title_ar', 'description', 'description_ar', 'image_url',
            'button_text', 'button_text_ar', 'button_link', 'is_active',
            'display_frequency', 'start_date', 'end_date'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE popup_notifications SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Popup ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM popup_notifications WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
