<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get coupons
        if (isset($_GET['code'])) {
            $stmt = $pdo->prepare("
                SELECT * FROM discount_coupons 
                WHERE code = ? AND is_active = 1 
                AND (expires_at IS NULL OR expires_at >= NOW())
            ");
            $stmt->execute([$_GET['code']]);
            $coupon = $stmt->fetch();
            
            if ($coupon && ($coupon['max_uses'] === null || $coupon['used_count'] < $coupon['max_uses'])) {
                jsonResponse($coupon);
            } else {
                jsonError('Invalid or expired coupon', 404);
            }
        } elseif (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM discount_coupons WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            jsonResponse($stmt->fetch() ?: null);
        } else {
            // Admin: Get all coupons
            $stmt = $pdo->query("SELECT * FROM discount_coupons ORDER BY created_at DESC");
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO discount_coupons (
                id, code, description, discount_type, discount_value,
                min_order_amount, max_uses, is_active, starts_at, expires_at,
                created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            strtoupper($data['code'] ?? ''),
            $data['description'] ?? null,
            $data['discount_type'] ?? 'percentage',
            $data['discount_value'] ?? 0,
            $data['min_order_amount'] ?? 0,
            $data['max_uses'] ?? null,
            $data['is_active'] ?? true,
            $data['starts_at'] ?? null,
            $data['expires_at'] ?? null,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Coupon ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        // Check if incrementing usage
        if (isset($data['increment_usage']) && $data['increment_usage']) {
            $stmt = $pdo->prepare("UPDATE discount_coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$id]);
            jsonResponse(['success' => true]);
            break;
        }
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'code', 'description', 'discount_type', 'discount_value',
            'min_order_amount', 'max_uses', 'is_active', 'starts_at', 'expires_at'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE discount_coupons SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Coupon ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM discount_coupons WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
