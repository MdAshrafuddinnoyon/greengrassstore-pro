# Green Grass Store - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Installation & Setup](#installation--setup)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Admin Dashboard](#admin-dashboard)
7. [Database Schema](#database-schema)
8. [API Integration](#api-integration)
9. [Configuration Guide](#configuration-guide)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Support](#support)

---

## Overview

Green Grass Store is a modern, full-featured e-commerce platform designed for plants, home décor, and lifestyle products. Built with React and Supabase, it offers a complete solution for online retail businesses with multi-language support, comprehensive admin controls, and seamless customer experience.

### Key Highlights

- 🛒 Complete E-commerce Solution
- 🌐 Multi-language Support (English & Arabic)
- 📱 Fully Responsive Design
- 🔐 Secure Authentication
- 💳 Multiple Payment Options
- 📊 Analytics & Reporting
- 📧 Email Notification System
- 🎨 Customizable Design System

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 12.x | Animations |
| React Router | 6.x | Navigation |
| Zustand | 5.x | State Management |
| React Query | 5.x | Data Fetching |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Storage |
| PostgreSQL | Database Engine |
| Edge Functions | Serverless Backend |

### UI Components
| Library | Purpose |
|---------|---------|
| Shadcn/UI | Component Library |
| Radix UI | Primitives |
| Lucide React | Icons |
| Recharts | Charts & Analytics |

---

## Installation & Setup

### Prerequisites

- Node.js 18+ or Bun
- Git
- Supabase Account

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd green-grass-store
```

### Step 2: Install Dependencies

```bash
npm install
# or
bun install
```

### Step 3: Environment Configuration

Create `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Step 4: Database Setup

1. Create a new Supabase project
2. Run the SQL migrations from `supabase/migrations/`
3. Enable Row Level Security (RLS) policies

### Step 5: Start Development Server

```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

---

## Project Structure

```
├── public/                    # Static assets
│   ├── api/                   # PHP API endpoints (optional)
│   └── images/               # Public images
├── src/
│   ├── assets/               # Application assets
│   ├── components/           # React components
│   │   ├── admin/           # Admin dashboard components
│   │   ├── cart/            # Shopping cart
│   │   ├── chat/            # Chat & messaging
│   │   ├── compare/         # Product comparison
│   │   ├── home/            # Homepage sections
│   │   ├── layout/          # Layout components
│   │   ├── products/        # Product components
│   │   ├── search/          # Search functionality
│   │   ├── shared/          # Shared components
│   │   └── ui/              # UI primitives
│   ├── contexts/            # React contexts
│   ├── data/                # Static data
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Third-party integrations
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── stores/              # Zustand stores
│   └── utils/               # Utility functions
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migrations
└── Configuration files
```

---

## Features

### 🛍️ Customer Features

#### Product Browsing
- Grid/List view options
- Advanced filtering (category, price, availability)
- Search with suggestions
- Product quick view modal
- Related products

#### Shopping Cart
- Add/remove items
- Quantity adjustment
- Coupon code support
- Cart persistence
- Order summary

#### Wishlist
- Save favorite products
- Quick add to cart
- Persistent storage

#### Product Comparison
- Compare up to 4 products
- Side-by-side feature comparison
- Quick actions

#### User Account
- Registration & Login
- Profile management
- Order history
- Address management
- VIP membership program

#### Checkout
- Guest checkout option
- Multiple payment methods
- Order notes
- Terms acceptance
- Real-time validation

### 📱 Communication Features

#### WhatsApp Integration
- Direct order via WhatsApp
- Quick product inquiry
- Floating WhatsApp button

#### Messenger Integration
- Facebook Messenger chat
- Customer support

#### Newsletter
- Email subscription
- Popup subscription forms

---

## Admin Dashboard

### 🎛️ Dashboard Overview

Access the admin panel at `/admin` with admin credentials.

### Main Sections

#### 1. Overview
- Sales statistics
- Order summaries
- Recent activities
- Analytics charts

#### 2. Products Management
- Add/Edit/Delete products
- Bulk operations
- CSV import/export
- Image management
- Inventory tracking

#### 3. Categories Management
- Create categories
- Subcategories
- Category images
- Display order

#### 4. Orders Management
- Order listing
- Status updates
- Order details
- Invoice generation
- Print orders

#### 5. Customer Management
- Customer list
- Order history per customer
- Customer analytics
- Export customers

#### 6. Blog Management
- Create/Edit posts
- Categories
- Featured images
- SEO settings

#### 7. Subscribers
- Newsletter subscribers
- Export functionality
- Subscriber analytics

#### 8. Custom Requests
- View customer inquiries
- Response management
- Status tracking

### Content Management

#### 9. Media Library
- File upload
- Image organization
- Media picker integration
- Bulk upload

#### 10. Announcements (Top Bar)
- Promotional messages
- Multi-language support
- Enable/Disable

#### 11. Homepage Settings
- Hero slider management
- Featured sections
- Category banners
- Product sections

#### 12. Menu Management
- Mega menu builder
- Navigation links
- Mobile menu

#### 13. Pages Content
- FAQ management
- Return policy
- Privacy policy
- Terms of service
- About page
- Contact page
- **Product Detail Settings** (Trust badges)

#### 14. Branding
- Logo management
- Favicon
- Brand colors
- Social links

#### 15. Footer Management
- Footer menus
- Contact info
- Social links
- Copyright text

#### 16. Popups
- Promotional popups
- Newsletter popups
- Timing settings
- Display conditions

#### 17. Coupons
- Create discount codes
- Percentage/Fixed discounts
- Validity period
- Usage limits

### System Settings

#### 18. VIP Program
- Membership tiers
- Benefits configuration
- Points system

#### 19. Social Integration
- WhatsApp settings
- Messenger settings
- Instagram feed

#### 20. Settings Panel

##### General Settings
- Store name
- Contact info
- Currency
- Language settings

##### Users & Roles
- User management
- Role assignment (Admin, Store Manager, Moderator, Customer)
- Permissions

##### Email Settings
- Notification settings
- Additional recipients
- Telegram integration
- Email templates
- Branding (Logo, colors, social links)
- Template customization

##### Payment Settings
- Cash on Delivery
- Stripe integration
- PayPal integration
- Bank Transfer settings

##### Checkout Settings
- Layout options
- Form field requirements
- Trust badges
- Terms configuration
- Thank You page customization

##### Invoice Template
- Invoice design
- Company info
- Logo placement

##### Tracking Pixels
- Facebook Pixel
- Google Analytics
- TikTok Pixel
- Snapchat Pixel

##### API & Security
- API key management
- Security settings

##### Social Login
- Google OAuth
- Facebook Login
- GitHub OAuth
- Twitter/X OAuth
- Enable/Disable each provider

##### Image Checker
- Scan for broken images
- Fix missing URLs

##### SMTP Settings
- Email server configuration
- Test email sending

---

## Database Schema

### Core Tables

```sql
-- Products
products (
  id UUID PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_ar TEXT,
  price DECIMAL,
  compare_at_price DECIMAL,
  currency TEXT DEFAULT 'AED',
  category TEXT,
  subcategory TEXT,
  featured_image TEXT,
  images TEXT[],
  is_featured BOOLEAN,
  is_on_sale BOOLEAN,
  is_new BOOLEAN,
  is_active BOOLEAN,
  stock_quantity INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  order_number TEXT UNIQUE,
  customer_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  city TEXT,
  items JSONB,
  subtotal DECIMAL,
  discount DECIMAL,
  shipping_cost DECIMAL,
  total DECIMAL,
  payment_method TEXT,
  payment_status TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP
)

-- Profiles
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  vip_tier TEXT,
  vip_points INTEGER,
  created_at TIMESTAMP
)

-- Categories
categories (
  id UUID PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  image TEXT,
  parent_id UUID,
  display_order INTEGER
)

-- Blog Posts
blog_posts (
  id UUID PRIMARY KEY,
  title TEXT,
  title_ar TEXT,
  slug TEXT UNIQUE,
  content TEXT,
  content_ar TEXT,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT,
  is_published BOOLEAN,
  published_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Site Settings
site_settings (
  id UUID PRIMARY KEY,
  setting_key TEXT UNIQUE,
  setting_value JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User Roles
user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP
)

-- Coupons
coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,
  type TEXT,
  value DECIMAL,
  min_order_amount DECIMAL,
  max_uses INTEGER,
  used_count INTEGER,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN
)

-- Newsletter Subscribers
newsletter_subscribers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  subscribed_at TIMESTAMP,
  is_active BOOLEAN
)

-- Custom Requests
custom_requests (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP
)

-- Media Files
media_files (
  id UUID PRIMARY KEY,
  name TEXT,
  url TEXT,
  type TEXT,
  size INTEGER,
  folder TEXT,
  created_at TIMESTAMP
)
```

---

## API Integration

### Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";

// Fetch products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);

// Create order
const { data, error } = await supabase
  .from('orders')
  .insert({ ...orderData });
```

### Edge Functions

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `send-order-email` | Order confirmation emails |
| `generate-ai-content` | AI content generation |
| `generate-image` | AI image generation |
| `admin-user-management` | User administration |

---

## Configuration Guide

### Payment Gateway Setup

#### Stripe
1. Go to Admin → Settings → Payments
2. Enable Stripe
3. Add Stripe Publishable Key
4. Add Stripe Secret Key (via Supabase secrets)

#### PayPal
1. Enable PayPal in payment settings
2. Add PayPal Client ID
3. Configure environment (Sandbox/Live)

#### Bank Transfer
1. Enable Bank Transfer
2. Add bank account details
3. Configure instructions

### Email Setup

#### SMTP Configuration
1. Go to Admin → Settings → SMTP
2. Enter SMTP server details:
   - Host
   - Port
   - Username
   - Password
3. Test email sending

#### Email Templates
1. Go to Admin → Settings → Email Settings
2. Configure notification recipients
3. Customize email templates
4. Add branding (logo, colors)

### Social Login Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `your-domain/auth/callback`
4. Copy Client ID and Secret
5. Enable in Admin → Settings → Social Login

#### Facebook Login
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create an app
3. Configure OAuth settings
4. Add redirect URI
5. Enable in admin

---

## Deployment

### Option 1: Lovable Publish

1. Click "Publish" button in Lovable
2. Your app is deployed to `*.lovable.app`

### Option 2: Custom Domain

1. Deploy via Lovable
2. Go to Project Settings → Domains
3. Add your custom domain
4. Configure DNS records

### Option 3: Self-Hosting

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Configure environment variables on your server

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Yes |

---

## Troubleshooting

### Common Issues

#### Images Not Loading
1. Check image URLs in products
2. Use Admin → Settings → Image Checker
3. Verify Supabase storage bucket settings

#### Social Login Not Working
1. Verify OAuth credentials in admin
2. Check redirect URLs match
3. Ensure provider is enabled

#### Emails Not Sending
1. Verify SMTP settings
2. Check edge function logs
3. Test SMTP connection

#### Payment Gateway Errors
1. Verify API keys
2. Check payment provider dashboard
3. Review transaction logs

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `PGRST116` | No rows returned | Check RLS policies |
| `AUTH_INVALID` | Invalid credentials | Reset password |
| `PAYMENT_FAILED` | Payment declined | Contact payment provider |

---

## Support

### Contact Information

- **Email**: support@websearchbd.com
- **Website**: https://websearchbd.com

### Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release |
| 1.1.0 | 2024 | Added VIP system |
| 1.2.0 | 2024 | Multi-language support |
| 1.3.0 | 2024 | Social login integration |
| 1.4.0 | 2024 | Checkout customization |
| 1.5.0 | 2024 | Trust badges, Email templates |

---

**© 2024 Green Grass Store. All rights reserved.**
