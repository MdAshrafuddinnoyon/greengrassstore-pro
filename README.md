# Green Grass Store

Premium home and garden e-commerce storefront for the UAE market.

## About

Green Grass Store is a modern e-commerce platform specializing in plants, pots, vases, and home décor products. The platform is built with React, TypeScript, Supabase, Zustand, and Tailwind CSS, and is designed for a seamless, dynamic, and admin-controllable shopping experience.

## Key Features & Functionality

### 🛒 Dynamic Product Catalog
- Products are managed in the Supabase backend and displayed dynamically on the frontend
- Real-time updates for product stock, price, and details
- **Inline Editing**: Quick edit product name, description, price, and stock directly from the product table
- Variable products with multiple variants support
- Bulk product actions (activate, deactivate, delete, category assignment)
- CSV import/export functionality

### 🛍️ Shopping Cart & Checkout
- Full shopping cart with add/remove/update quantity
- Checkout supports multiple payment methods:
  - Cash on Delivery
  - WhatsApp Order
  - Online Payment (Stripe/PayPal)
  - Direct Bank Transfer
- Coupon/discount code support with validation and usage tracking
- Order summary, shipping calculation, and order confirmation with unique order number
- **Dynamic Payment Banner**: Admin-controlled payment gateway banner displayed on checkout

### 📂 Category Management
- **Main Categories & Sub-Categories**: Hierarchical category structure
- **Dynamic Category Display**: Categories appear dynamically in navigation, shop page, and homepage
- **Category Grid Settings**: Control desktop and mobile display counts separately
- Drag-and-drop category reordering

### 🏠 Homepage Sections (Admin Controlled)
- **Hero Slider**: Customizable hero banners with images, text, and CTAs
- **Category Grid (Browse by Category)**: 
  - Configurable desktop/mobile display counts
  - Category selection and filtering
  - Image scale and autoplay settings
- **Featured Categories Section**: 
  - Dynamic category banners with product carousels
  - Admin-selectable images per category
  - Products from selected categories displayed automatically
- **Gift Section**: 
  - Dynamic product display from "gift" category/tags
  - Manual product selection option
  - Configurable product count
- **Promo/Sale Banner**: Customizable promotional banners
- **Instagram Feed**: Social media integration

### 💳 Payment Gateway Settings
- **Cash on Delivery (COD)**: Enable/disable, custom labels
- **WhatsApp Orders**: Custom phone number and labels
- **Online Payment**: Stripe and PayPal integration
- **Bank Transfer**: Bank details, IBAN, instructions
- **Payoneer**: API integration support
- All payment methods dynamically appear on checkout when enabled

### 📦 Order Management
- Complete order lifecycle management
- Order status updates with email notifications
- Invoice and delivery slip printing
- Bulk order actions
- Responsive order table for mobile admin access

### 👤 Customer Management
- Customer profiles with order history
- VIP membership program
- Address management

### 📝 Blog System
- Blog post management with categories
- Rich text editor (TipTap)
- Featured images and SEO meta

### 🎨 Branding & Design
- **Logo & Identity**: Customizable logo, favicon, site name
- **Theme Colors**: Primary, secondary, accent colors
- **Typography**: Font selection for headings and body
- **Payment Banner**: Admin-controlled banner for checkout page
- **Security/Return Badges**: Customizable trust badges

### 🌐 Multi-language Support
- English and Arabic language support throughout the site
- All product, category, and UI text is localized
- RTL support for Arabic

### ❤️ Wishlist & Compare
- Users can add products to wishlist
- Product comparison feature

### 👤 Customer Accounts
- User registration, login, and profile management
- Order history and tracking

### 📱 Mobile Responsive
- **Fully Responsive Design**: All pages optimized for mobile
- **Admin Dashboard Responsive**: Tables with horizontal scroll, hidden columns on mobile
- **Mobile Bottom Navigation**: Easy access navigation for mobile users

### 📣 Marketing Features
- Newsletter subscription and popups
- Announcement bar with multiple messages
- Discount coupon management
- Custom request forms

### 📊 Analytics & Reports
- Dashboard overview with key metrics
- Order analytics
- Product performance tracking

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Drag & Drop**: @hello-pangea/dnd
- **Rich Text**: TipTap Editor
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Admin Dashboard Features

| Feature | Description |
|---------|-------------|
| Products | Add, edit, delete, bulk actions, inline editing |
| Categories | Main + sub-categories, drag-drop reorder |
| Orders | Status management, invoices, delivery slips |
| Customers | Profile management, VIP program |
| Blog | Posts with categories, rich text editor |
| Media | Image upload and management |
| Homepage | All sections configurable |
| Payments | Multiple gateway configuration |
| Branding | Logo, colors, typography |
| Settings | General, security, API keys |

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase project and configure environment variables
4. Start development server: `npm run dev`

## Development & Credits

This project was developed by:

**Web Search BD**  
Software Company  
Web Design & Development Agency  
*"Where Ideas Meet Innovation"*

Website: [www.websearchbd.com](https://www.websearchbd.com)

## Contact

For development inquiries:
- Website: www.websearchbd.com
- Company: Web Search BD

---

© 2025 Green Grass Store. Developed by Web Search BD.
