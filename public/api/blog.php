<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['slug'])) {
            $stmt = $pdo->prepare("SELECT * FROM blog_posts WHERE slug = ?");
            $stmt->execute([$_GET['slug']]);
            $post = $stmt->fetch();
            
            if ($post) {
                $post['tags'] = json_decode($post['tags'] ?? '[]');
                
                // Increment view count
                $updateStmt = $pdo->prepare("UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = ?");
                $updateStmt->execute([$_GET['slug']]);
                
                jsonResponse($post);
            } else {
                jsonError('Post not found', 404);
            }
        } elseif (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM blog_posts WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $post = $stmt->fetch();
            
            if ($post) {
                $post['tags'] = json_decode($post['tags'] ?? '[]');
                jsonResponse($post);
            } else {
                jsonError('Post not found', 404);
            }
        } elseif (isset($_GET['all'])) {
            // Admin: Get all posts
            $stmt = $pdo->query("SELECT * FROM blog_posts ORDER BY created_at DESC");
            $posts = $stmt->fetchAll();
            
            foreach ($posts as &$post) {
                $post['tags'] = json_decode($post['tags'] ?? '[]');
            }
            
            jsonResponse($posts);
        } else {
            // Public: Get published posts only
            $stmt = $pdo->query("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC");
            $posts = $stmt->fetchAll();
            
            foreach ($posts as &$post) {
                $post['tags'] = json_decode($post['tags'] ?? '[]');
            }
            
            jsonResponse($posts);
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO blog_posts (
                id, title, title_ar, slug, excerpt, excerpt_ar, content, content_ar,
                featured_image, author_name, category, tags, status, is_featured,
                reading_time, meta_title, meta_description, published_at, created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
            )
        ");
        
        $publishedAt = ($data['status'] ?? 'draft') === 'published' ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([
            $data['title'] ?? '',
            $data['title_ar'] ?? null,
            $data['slug'] ?? '',
            $data['excerpt'] ?? '',
            $data['excerpt_ar'] ?? null,
            $data['content'] ?? '',
            $data['content_ar'] ?? null,
            $data['featured_image'] ?? null,
            $data['author_name'] ?? 'Green Grass Team',
            $data['category'] ?? 'General',
            json_encode($data['tags'] ?? []),
            $data['status'] ?? 'draft',
            $data['is_featured'] ?? false,
            $data['reading_time'] ?? 5,
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            $publishedAt,
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Post ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'title', 'title_ar', 'slug', 'excerpt', 'excerpt_ar',
            'content', 'content_ar', 'featured_image', 'author_name',
            'category', 'status', 'is_featured', 'reading_time',
            'meta_title', 'meta_description'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        if (isset($data['tags'])) {
            $fields[] = "tags = ?";
            $values[] = json_encode($data['tags']);
        }
        
        // Update published_at if status changes to published
        if (isset($data['status']) && $data['status'] === 'published') {
            $fields[] = "published_at = COALESCE(published_at, NOW())";
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE blog_posts SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Post ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM blog_posts WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
