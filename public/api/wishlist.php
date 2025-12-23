<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['user_id'])) {
            jsonError('User ID required', 400);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$_GET['user_id']]);
        
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getRequestBody();
        
        $userId = $data['user_id'] ?? null;
        $productId = $data['product_id'] ?? null;
        
        if (!$userId || !$productId) {
            jsonError('User ID and Product ID required', 400);
        }
        
        // Check if already in wishlist
        $stmt = $pdo->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $productId]);
        
        if ($stmt->fetch()) {
            jsonError('Product already in wishlist', 400);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO wishlist (id, user_id, product_id, product_title, product_price, product_image, created_at)
            VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $productId,
            $data['product_title'] ?? '',
            $data['product_price'] ?? null,
            $data['product_image'] ?? null,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'DELETE':
        $userId = $_GET['user_id'] ?? null;
        $productId = $_GET['product_id'] ?? null;
        
        if (!$userId || !$productId) {
            jsonError('User ID and Product ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $productId]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
