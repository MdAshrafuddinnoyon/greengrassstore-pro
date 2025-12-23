<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Admin: Get all subscribers
        $stmt = $pdo->query("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC");
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getRequestBody();
        $email = $data['email'] ?? null;
        
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Valid email required', 400);
        }
        
        // Check if already subscribed
        $stmt = $pdo->prepare("SELECT id, is_active FROM newsletter_subscribers WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            if ($existing['is_active']) {
                jsonError('Email already subscribed', 400);
            } else {
                // Reactivate subscription
                $stmt = $pdo->prepare("UPDATE newsletter_subscribers SET is_active = 1 WHERE email = ?");
                $stmt->execute([$email]);
                jsonResponse(['success' => true, 'message' => 'Subscription reactivated']);
            }
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO newsletter_subscribers (id, email, is_active, source, subscribed_at)
                VALUES (UUID(), ?, 1, ?, NOW())
            ");
            
            $stmt->execute([
                $email,
                $data['source'] ?? 'website',
            ]);
            
            jsonResponse(['id' => $pdo->lastInsertId()], 201);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Subscriber ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $stmt = $pdo->prepare("UPDATE newsletter_subscribers SET is_active = ? WHERE id = ?");
        $stmt->execute([$data['is_active'] ?? true, $id]);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Subscriber ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM newsletter_subscribers WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
