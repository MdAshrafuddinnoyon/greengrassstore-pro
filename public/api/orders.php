<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $order = $stmt->fetch();
            
            if ($order) {
                $order['items'] = json_decode($order['items'] ?? '[]');
                jsonResponse($order);
            } else {
                jsonError('Order not found', 404);
            }
        } elseif (isset($_GET['user_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$_GET['user_id']]);
            $orders = $stmt->fetchAll();
            
            foreach ($orders as &$order) {
                $order['items'] = json_decode($order['items'] ?? '[]');
            }
            
            jsonResponse($orders);
        } elseif (isset($_GET['order_number'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ?");
            $stmt->execute([$_GET['order_number']]);
            $order = $stmt->fetch();
            
            if ($order) {
                $order['items'] = json_decode($order['items'] ?? '[]');
                jsonResponse($order);
            } else {
                jsonError('Order not found', 404);
            }
        } else {
            // Admin: Get all orders
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
            $orders = $stmt->fetchAll();
            
            foreach ($orders as &$order) {
                $order['items'] = json_decode($order['items'] ?? '[]');
            }
            
            jsonResponse($orders);
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        // Generate order number
        $orderNumber = 'GG-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                id, order_number, user_id, customer_name, customer_email, 
                customer_phone, customer_address, items, subtotal, tax, 
                shipping, total, status, payment_method, notes, created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $orderNumber,
            $data['user_id'] ?? null,
            $data['customer_name'] ?? '',
            $data['customer_email'] ?? '',
            $data['customer_phone'] ?? null,
            $data['customer_address'] ?? null,
            json_encode($data['items'] ?? []),
            $data['subtotal'] ?? 0,
            $data['tax'] ?? 0,
            $data['shipping'] ?? 0,
            $data['total'] ?? 0,
            $data['status'] ?? 'pending',
            $data['payment_method'] ?? null,
            $data['notes'] ?? null,
        ]);
        
        jsonResponse([
            'id' => $pdo->lastInsertId(),
            'order_number' => $orderNumber,
        ], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Order ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'customer_name', 'customer_email', 'customer_phone', 
            'customer_address', 'subtotal', 'tax', 'shipping', 
            'total', 'status', 'payment_method', 'notes'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        if (isset($data['items'])) {
            $fields[] = "items = ?";
            $values[] = json_encode($data['items']);
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Order ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
