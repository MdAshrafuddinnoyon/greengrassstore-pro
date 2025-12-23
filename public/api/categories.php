<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['slug'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ? AND is_active = 1");
            $stmt->execute([$_GET['slug']]);
            $category = $stmt->fetch();
            jsonResponse($category ?: null);
        } elseif (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            jsonResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC");
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO categories (
                id, name, name_ar, slug, description, description_ar,
                image, parent_id, is_active, display_order, created_at, updated_at
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $data['name'] ?? '',
            $data['name_ar'] ?? null,
            $data['slug'] ?? '',
            $data['description'] ?? null,
            $data['description_ar'] ?? null,
            $data['image'] ?? null,
            $data['parent_id'] ?? null,
            $data['is_active'] ?? true,
            $data['display_order'] ?? 0,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Category ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'name', 'name_ar', 'slug', 'description', 'description_ar',
            'image', 'parent_id', 'is_active', 'display_order'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Category ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
