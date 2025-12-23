<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['slug'])) {
            // Get single product by slug
            $stmt = $pdo->prepare("SELECT * FROM products WHERE slug = ? AND is_active = 1");
            $stmt->execute([$_GET['slug']]);
            $product = $stmt->fetch();
            
            if ($product) {
                // Parse JSON fields
                $product['images'] = json_decode($product['images'] ?? '[]');
                $product['tags'] = json_decode($product['tags'] ?? '[]');
                $product['option1_values'] = json_decode($product['option1_values'] ?? '[]');
                $product['option2_values'] = json_decode($product['option2_values'] ?? '[]');
                $product['option3_values'] = json_decode($product['option3_values'] ?? '[]');
                jsonResponse($product);
            } else {
                jsonError('Product not found', 404);
            }
        } elseif (isset($_GET['id'])) {
            // Get single product by ID
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            
            if ($product) {
                $product['images'] = json_decode($product['images'] ?? '[]');
                $product['tags'] = json_decode($product['tags'] ?? '[]');
                jsonResponse($product);
            } else {
                jsonError('Product not found', 404);
            }
        } else {
            // Get all products
            $stmt = $pdo->query("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC");
            $products = $stmt->fetchAll();
            
            foreach ($products as &$product) {
                $product['images'] = json_decode($product['images'] ?? '[]');
                $product['tags'] = json_decode($product['tags'] ?? '[]');
            }
            
            jsonResponse($products);
        }
        break;

    case 'POST':
        $data = getRequestBody();
        
        $stmt = $pdo->prepare("
            INSERT INTO products (
                id, name, name_ar, slug, description, description_ar, 
                price, compare_at_price, currency, category, subcategory,
                featured_image, images, is_featured, is_on_sale, is_new, 
                is_active, stock_quantity, sku, tags, product_type,
                option1_name, option1_values, option2_name, option2_values,
                option3_name, option3_values, created_at, updated_at
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $data['name'] ?? '',
            $data['name_ar'] ?? null,
            $data['slug'] ?? '',
            $data['description'] ?? null,
            $data['description_ar'] ?? null,
            $data['price'] ?? 0,
            $data['compare_at_price'] ?? null,
            $data['currency'] ?? 'AED',
            $data['category'] ?? '',
            $data['subcategory'] ?? null,
            $data['featured_image'] ?? null,
            json_encode($data['images'] ?? []),
            $data['is_featured'] ?? false,
            $data['is_on_sale'] ?? false,
            $data['is_new'] ?? false,
            $data['is_active'] ?? true,
            $data['stock_quantity'] ?? 0,
            $data['sku'] ?? null,
            json_encode($data['tags'] ?? []),
            $data['product_type'] ?? 'simple',
            $data['option1_name'] ?? null,
            json_encode($data['option1_values'] ?? []),
            $data['option2_name'] ?? null,
            json_encode($data['option2_values'] ?? []),
            $data['option3_name'] ?? null,
            json_encode($data['option3_values'] ?? []),
        ]);
        
        jsonResponse(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonError('Product ID required', 400);
        }
        
        $data = getRequestBody();
        $id = $_GET['id'];
        
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'name', 'name_ar', 'slug', 'description', 'description_ar',
            'price', 'compare_at_price', 'currency', 'category', 'subcategory',
            'featured_image', 'is_featured', 'is_on_sale', 'is_new',
            'is_active', 'stock_quantity', 'sku', 'product_type',
            'option1_name', 'option2_name', 'option3_name'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        // Handle JSON fields
        $jsonFields = ['images', 'tags', 'option1_values', 'option2_values', 'option3_values'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = json_encode($data[$field]);
            }
        }
        
        $fields[] = "updated_at = NOW()";
        $values[] = $id;
        
        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonError('Product ID required', 400);
        }
        
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
?>
