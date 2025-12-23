# 📘 Database Switchable Architecture & Deployment Guideline

**For Lovable.dev Based Application - Green Grass Store**

---

## 🎯 লক্ষ্য (Objective)

এই অ্যাপ্লিকেশনটি এমনভাবে ডিজাইন করা হয়েছে যেন:

- ✅ ডিফল্টভাবে **Supabase (Cloud PostgreSQL)** ব্যবহার করে
- ✅ ভবিষ্যতে **MySQL / MariaDB** (Hostinger, SiteGround, cPanel Hosting)-এ সুইচ করা যায়
- ✅ ইউজার ডিপ্লয়মেন্টের সময় ডাটাবেজ নির্বাচন করতে পারে
- ✅ ডাটাবেজ পরিবর্তন হলেও অ্যাপের কোড পরিবর্তন করতে না হয়
- ✅ প্রয়োজনীয় টেবিল, রিলেশন ও ডাটা অটো-ক্রিয়েট হয়

---

## 🧠 Core Architecture Concept

### ✅ Database Abstraction Layer (DAL)

অ্যাপ কখনোই সরাসরি Supabase বা MySQL কল করে না। সব DB অপারেশন যায় একটি **Common Interface Layer** দিয়ে।

```
┌─────────────────────────────────────────────┐
│              UI / Application               │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│      Database Interface (Adapter Layer)     │
│              src/lib/database/              │
└─────────────────────┬───────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Supabase Adapter│     │  MySQL Adapter  │
│   (PostgreSQL)  │     │   (via PHP API) │
└─────────────────┘     └─────────────────┘
```

---

## 🧩 Supported Databases

| Platform | Database | Status | Notes |
|----------|----------|--------|-------|
| Supabase / Lovable Cloud | PostgreSQL | ✅ **Default** | Cloud-hosted, real-time |
| Hostinger | MySQL / MariaDB | ✅ Supported | Via PHP API |
| SiteGround | MySQL | ✅ Supported | Via PHP API |
| Self Hosting | MySQL | ✅ Supported | Via PHP API |
| Future | Any SQL DB | 🔄 Extendable | Add new adapter |

---

## ⚙️ Configuration Files

### Database Configuration

**File:** `src/lib/database/config.ts`

```typescript
// 🔄 CHANGE THIS VALUE TO SWITCH DATABASE
// 'supabase' = Lovable Cloud / Supabase (current)
// 'mysql' = Hostinger MySQL via PHP API
export const ACTIVE_DATABASE: DatabaseType = 'supabase';
```

### Environment Variables (.env)

#### Option 1: Supabase Configuration (Default)

```env
# Database Driver
VITE_DB_DRIVER=supabase

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=public-anon-key
```

#### Option 2: MySQL Configuration (Hostinger / SiteGround)

```env
# Database Driver  
VITE_DB_DRIVER=mysql

# MySQL API Endpoint
VITE_API_URL=/api

# PHP Backend will use these (in separate .env or config.php)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=your_database_name
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password
```

---

## 🧱 Database Adapter System

### File Structure

```
src/lib/database/
├── config.ts           # Database configuration
├── types.ts            # Interface definitions
├── index.ts            # Adapter resolver
├── supabase-adapter.ts # Supabase implementation
└── mysql-adapter.ts    # MySQL implementation
```

### Interface (Common)

**File:** `src/lib/database/types.ts`

```typescript
interface DatabaseClient {
  // Products
  getProducts(): Promise<DatabaseResponse<any[]>>;
  getProductBySlug(slug: string): Promise<DatabaseResponse<any>>;
  createProduct(product: any): Promise<DatabaseResponse<any>>;
  updateProduct(id: string, product: any): Promise<DatabaseResponse<any>>;
  deleteProduct(id: string): Promise<DatabaseResponse<any>>;

  // Categories
  getCategories(): Promise<DatabaseResponse<any[]>>;
  getCategoryBySlug(slug: string): Promise<DatabaseResponse<any>>;
  
  // Orders
  getOrders(userId?: string): Promise<DatabaseResponse<any[]>>;
  createOrder(order: any): Promise<DatabaseResponse<any>>;
  
  // ... more methods
  
  // Auth
  signUp(email: string, password: string): Promise<DatabaseResponse<any>>;
  signIn(email: string, password: string): Promise<DatabaseResponse<any>>;
  signOut(): Promise<DatabaseResponse<any>>;
}
```

### Adapter Resolver

**File:** `src/lib/database/index.ts`

```typescript
import { ACTIVE_DATABASE } from './config';
import { supabaseAdapter } from './supabase-adapter';
import { mysqlAdapter } from './mysql-adapter';

export const db: DatabaseClient = ACTIVE_DATABASE === 'supabase' 
  ? supabaseAdapter 
  : mysqlAdapter;
```

👉 **পুরো অ্যাপ এই `db` object ব্যবহার করে**

---

## 🏗️ Database Schema

### Required Tables

| Table | Description |
|-------|-------------|
| `users` / `profiles` | User information |
| `user_roles` | User roles (admin, customer, etc.) |
| `products` | Product catalog |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Order line items |
| `blog_posts` | Blog articles |
| `site_settings` | Configuration storage |
| `newsletter_subscribers` | Email subscriptions |
| `custom_requests` | Customer inquiries |
| `coupons` | Discount codes |
| `media_files` | Uploaded media |

### PostgreSQL Schema (Supabase)

```sql
-- Users/Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  currency TEXT DEFAULT 'AED',
  category TEXT,
  featured_image TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  items JSONB,
  subtotal DECIMAL(10,2),
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### MySQL Schema (Hostinger / SiteGround)

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'AED',
  category VARCHAR(100),
  featured_image TEXT,
  images JSON,
  is_active TINYINT(1) DEFAULT 1,
  stock_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  customer_id VARCHAR(36),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  shipping_address TEXT,
  items JSON,
  subtotal DECIMAL(10,2),
  total DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id)
);
```

---

## 🪄 Installation Wizard

### Access URL

```
https://your-domain.com/install
```

### Step-by-Step Process

1. **Database Selection**
   - Supabase (Default)
   - MySQL (Hostinger / SiteGround)

2. **Database Credentials Input**
   - For Supabase: URL & Anon Key
   - For MySQL: Host, Database, Username, Password

3. **Connection Test**
   - Live database connectivity test

4. **Auto Schema Setup**
   - Create all required tables
   - Set up indexes and relations

5. **Admin User Creation**
   - Email, Password, Full Name
   - Assign admin role

6. **Finish & Lock Installer**
   - Mark installation complete
   - Disable `/install` route

---

## 🔐 Security Rules

### Installation Security

- ✅ Installer runs **only once**
- ✅ After installation: `/install` route is disabled
- ✅ Installation status stored in `site_settings` table
- ✅ DB credentials **never exposed** to frontend

### API Security (MySQL Mode)

```php
// public/api/config.php
<?php
// Database credentials - keep this file secure
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
```

---

## 🚀 Hosting Compatibility

### ✅ Lovable Cloud / Supabase

- **Database:** PostgreSQL (managed)
- **Auth:** Built-in Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supported
- **Setup:** Automatic

### ✅ Hostinger

- **Database:** MySQL / MariaDB
- **Auth:** Custom PHP JWT
- **Storage:** Local or CDN
- **Setup:** Upload PHP files, run installer

### ✅ SiteGround

- **Database:** MySQL
- **Auth:** Custom PHP JWT
- **Storage:** Local or CDN
- **Setup:** Upload PHP files, run installer

### ✅ cPanel Hosting (Any)

- **Database:** MySQL
- **Requirements:** PHP 7.4+, MySQL 5.7+
- **Setup:** Standard shared hosting

---

## 🔄 Database Switch Process

### From Supabase → MySQL

1. **Update Configuration**
   ```typescript
   // src/lib/database/config.ts
   export const ACTIVE_DATABASE: DatabaseType = 'mysql';
   ```

2. **Deploy PHP API Files**
   - Upload `public/api/` folder to hosting

3. **Create MySQL Database**
   - Via cPanel or hosting panel

4. **Update PHP Config**
   ```php
   // public/api/config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_db_name');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

5. **Run Installer**
   - Visit `/install`
   - Tables will be created automatically

6. **Done!** ✅

### From MySQL → Supabase

1. **Update Configuration**
   ```typescript
   export const ACTIVE_DATABASE: DatabaseType = 'supabase';
   ```

2. **Update Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-key
   ```

3. **Run Supabase Migrations**
   - Tables created via migrations

4. **Done!** ✅

👉 **কোড পরিবর্তনের দরকার নেই** - শুধু configuration পরিবর্তন

---

## 📦 Deployment Checklist

### Pre-Deployment

- [ ] Database type selected
- [ ] Configuration files updated
- [ ] Environment variables set
- [ ] PHP API files uploaded (if MySQL)

### Installation

- [ ] Visit `/install`
- [ ] Database connection successful
- [ ] Tables created
- [ ] Admin account created
- [ ] Default settings initialized

### Post-Installation

- [ ] Installer route disabled
- [ ] Admin panel accessible
- [ ] Products can be added
- [ ] Orders can be placed
- [ ] All features working

---

## 📁 PHP API Structure (MySQL Mode)

```
public/api/
├── config.php          # Database configuration
├── setup.sql           # Table creation SQL
├── auth.php            # Authentication endpoints
├── products.php        # Product CRUD
├── categories.php      # Category CRUD
├── orders.php          # Order management
├── blog.php            # Blog posts
├── settings.php        # Site settings
├── media.php           # File uploads
├── newsletter.php      # Subscriptions
├── coupons.php         # Coupon management
├── profiles.php        # User profiles
├── popups.php          # Popup management
├── requirements.php    # Custom requests
└── wishlist.php        # Wishlist management
```

---

## 🔧 Adding New Adapter

To add support for a new database (e.g., MongoDB):

1. **Create Adapter File**
   ```
   src/lib/database/mongodb-adapter.ts
   ```

2. **Implement Interface**
   ```typescript
   import { DatabaseClient } from './types';
   
   export const mongodbAdapter: DatabaseClient = {
     getProducts: async () => { /* implementation */ },
     // ... implement all methods
   };
   ```

3. **Update Resolver**
   ```typescript
   // src/lib/database/index.ts
   import { mongodbAdapter } from './mongodb-adapter';
   
   export const db = ACTIVE_DATABASE === 'mongodb' 
     ? mongodbAdapter 
     : ACTIVE_DATABASE === 'mysql'
       ? mysqlAdapter
       : supabaseAdapter;
   ```

4. **Add Configuration**
   ```typescript
   // src/lib/database/config.ts
   export type DatabaseType = 'supabase' | 'mysql' | 'mongodb';
   ```

---

## 🏁 Summary

এই আর্কিটেকচার অনুসরণ করলে আপনার অ্যাপ হবে:

| Feature | Status |
|---------|--------|
| 🔓 Vendor lock-free | ✅ |
| 🔄 Database switchable | ✅ |
| 🏗️ Hosting independent | ✅ |
| 🚀 Production-grade | ✅ |
| 📦 Easy deployment | ✅ |
| 🔐 Secure by design | ✅ |

---

## 📞 Support

For technical support or questions:

- **Email:** support@websearchbd.com
- **Website:** https://websearchbd.com

---

**© 2024 Green Grass Store. All rights reserved.**
