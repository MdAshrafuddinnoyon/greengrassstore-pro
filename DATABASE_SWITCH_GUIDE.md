# 🔄 Database Switch Guide (ডাটাবেস পরিবর্তন গাইড)

## বর্তমান Architecture

```
src/lib/database/
├── config.ts          ← Database selection করুন এখানে
├── types.ts           ← Common types
├── supabase-adapter.ts ← Supabase implementation
├── mysql-adapter.ts    ← MySQL implementation
└── index.ts           ← Active client export

public/api/
├── config.php         ← MySQL credentials (আপডেট করুন)
├── auth.php           ← Authentication API
├── products.php       ← Products API
└── setup.sql          ← Database schema
```

---

## 🔄 Database Switch করার পদ্ধতি

### Step 1: MySQL Database Setup (Hostinger এ)

1. **phpMyAdmin এ Login করুন**
   - Hostinger hPanel → Databases → phpMyAdmin

2. **Database Select করুন**
   - Database: `u897176289_green`

3. **SQL Query Run করুন**
   - `public/api/setup.sql` ফাইলের সম্পূর্ণ content copy করুন
   - phpMyAdmin → SQL tab → Paste → Go

### Step 2: PHP API Files Upload করুন

1. **FileZilla বা Hostinger File Manager ব্যবহার করুন**

2. **`public/api/` folder এর সব files upload করুন**:
   ```
   public_html/
   └── api/
       ├── config.php
       ├── auth.php
       ├── products.php
       ├── categories.php
       ├── orders.php
       ├── blog.php
       ├── settings.php
       ├── profiles.php
       ├── wishlist.php
       ├── requirements.php
       └── newsletter.php
   ```

3. **config.php এ credentials verify করুন**:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u897176289_green');
   define('DB_USER', 'u897176289_greenr');
   define('DB_PASS', 'G|iIEHU6');
   ```

### Step 3: Frontend Config পরিবর্তন করুন

**`src/lib/database/config.ts`** ফাইলে:

```typescript
// এই line পরিবর্তন করুন:
export const ACTIVE_DATABASE: DatabaseType = 'mysql';  // 'supabase' থেকে 'mysql' করুন
```

### Step 4: Rebuild & Deploy

```bash
npm run build
```

`dist/` folder এর content Hostinger `public_html` এ upload করুন।

---

## 📁 PHP API Files তৈরি করুন

### categories.php
```php
<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['slug'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ? AND is_active = 1");
            $stmt->execute([$_GET['slug']]);
            jsonResponse($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order");
            jsonResponse($stmt->fetchAll());
        }
        break;
    // ... POST, PUT, DELETE similar to products.php
}
?>
```

### orders.php, blog.php, settings.php
(Similar pattern - আমি প্রয়োজনে তৈরি করে দিতে পারি)

---

## ⚠️ গুরুত্বপূর্ণ Notes

### Supabase এ ফিরে যেতে হলে:
```typescript
// config.ts এ:
export const ACTIVE_DATABASE: DatabaseType = 'supabase';
```

### MySQL Limitations:
- ❌ Real-time subscriptions (Supabase এর মতো) নেই
- ❌ Built-in Auth নেই (PHP session/JWT ব্যবহার করতে হবে)
- ❌ RLS policies নেই (PHP এ manually check করতে হবে)
- ❌ Storage bucket নেই (PHP file upload ব্যবহার করতে হবে)

### যা কাজ করবে:
- ✅ Products, Categories CRUD
- ✅ Orders management
- ✅ Blog posts
- ✅ User authentication (basic)
- ✅ Site settings

---

## 🚀 Quick Switch Commands

### Supabase → MySQL:
1. Edit `src/lib/database/config.ts`: `ACTIVE_DATABASE = 'mysql'`
2. `npm run build`
3. Upload `dist/` to Hostinger
4. Upload `public/api/*.php` to Hostinger `public_html/api/`

### MySQL → Supabase:
1. Edit `src/lib/database/config.ts`: `ACTIVE_DATABASE = 'supabase'`
2. `npm run build`
3. Upload `dist/` to Hostinger (or use Lovable Cloud)

---

## 📞 Support

প্রশ্ন থাকলে জানান, আমি বাকি PHP API files তৈরি করে দিতে পারি।
