<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['key'])) {
            $stmt = $pdo->prepare("SELECT * FROM site_settings WHERE setting_key = ?");
            $stmt->execute([$_GET['key']]);
            $setting = $stmt->fetch();
            
            if ($setting) {
                $setting['setting_value'] = json_decode($setting['setting_value'] ?? '{}');
                jsonResponse($setting);
            } else {
                jsonResponse(null);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM site_settings");
            $settings = $stmt->fetchAll();
            
            foreach ($settings as &$setting) {
                $setting['setting_value'] = json_decode($setting['setting_value'] ?? '{}');
            }
            
            jsonResponse($settings);
        }
        break;

    case 'POST':
    case 'PUT':
        $data = getRequestBody();
        $key = $data['key'] ?? $_GET['key'] ?? null;
        $value = $data['value'] ?? null;
        
        if (!$key) {
            jsonError('Setting key required', 400);
        }
        
        // Check if setting exists
        $stmt = $pdo->prepare("SELECT id FROM site_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update
            $stmt = $pdo->prepare("
                UPDATE site_settings 
                SET setting_value = ?, updated_at = NOW() 
                WHERE setting_key = ?
            ");
            $stmt->execute([json_encode($value), $key]);
        } else {
            // Insert
            $stmt = $pdo->prepare("
                INSERT INTO site_settings (id, setting_key, setting_value, created_at, updated_at)
                VALUES (UUID(), ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$key, json_encode($value)]);
        }
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['key'])) {
            jsonError('Setting key required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM site_settings WHERE setting_key = ?");
        $stmt->execute([$_GET['key']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
