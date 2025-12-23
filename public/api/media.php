<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Define upload directory
$uploadDir = '../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM media_files WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            jsonResponse($stmt->fetch() ?: null);
        } elseif (isset($_GET['folder'])) {
            $stmt = $pdo->prepare("SELECT * FROM media_files WHERE folder = ? ORDER BY created_at DESC");
            $stmt->execute([$_GET['folder']]);
            jsonResponse($stmt->fetchAll());
        } else {
            $stmt = $pdo->query("SELECT * FROM media_files ORDER BY created_at DESC");
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        $userId = getCurrentUserId();
        if (!$userId) {
            jsonError('Unauthorized', 401);
        }
        
        if (!isset($_FILES['file'])) {
            jsonError('No file uploaded', 400);
        }
        
        $file = $_FILES['file'];
        $folder = $_POST['folder'] ?? 'uploads';
        
        // Validate file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            jsonError('Invalid file type', 400);
        }
        
        // Max 50MB
        if ($file['size'] > 50 * 1024 * 1024) {
            jsonError('File too large (max 50MB)', 400);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newFilename = uniqid() . '_' . time() . '.' . $extension;
        
        // Create folder if not exists
        $folderPath = $uploadDir . $folder . '/';
        if (!file_exists($folderPath)) {
            mkdir($folderPath, 0755, true);
        }
        
        $filePath = $folderPath . $newFilename;
        
        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            $publicPath = '/uploads/' . $folder . '/' . $newFilename;
            
            $stmt = $pdo->prepare("
                INSERT INTO media_files (
                    id, user_id, file_name, file_path, file_type, file_size,
                    folder, alt_text, caption, created_at, updated_at
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $userId,
                $file['name'],
                $publicPath,
                $file['type'],
                $file['size'],
                $folder,
                $_POST['alt_text'] ?? null,
                $_POST['caption'] ?? null,
            ]);
            
            jsonResponse([
                'id' => $pdo->lastInsertId(),
                'file_path' => $publicPath,
            ], 201);
        } else {
            jsonError('Failed to upload file', 500);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('File ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $stmt = $pdo->prepare("
            UPDATE media_files 
            SET alt_text = ?, caption = ?, folder = ?, updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['alt_text'] ?? null,
            $data['caption'] ?? null,
            $data['folder'] ?? 'uploads',
            $id,
        ]);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('File ID required', 400);
        }
        
        // Get file path first
        $stmt = $pdo->prepare("SELECT file_path FROM media_files WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $file = $stmt->fetch();
        
        if ($file) {
            // Delete physical file
            $physicalPath = '..' . $file['file_path'];
            if (file_exists($physicalPath)) {
                unlink($physicalPath);
            }
            
            // Delete from database
            $stmt = $pdo->prepare("DELETE FROM media_files WHERE id = ?");
            $stmt->execute([$_GET['id']]);
        }
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
