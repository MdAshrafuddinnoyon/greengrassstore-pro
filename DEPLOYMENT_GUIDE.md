# 🚀 Hostinger Deployment Guide (সম্পূর্ণ বাংলা গাইড)

## 📋 প্রয়োজনীয় তথ্য

### ১. আপনার প্রজেক্টের Backend Information
- **Database URL**: `https://fwkouvwabyftfhcsnfgm.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3a291dndhYnlmdGZoY3NuZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjU0NTMsImV4cCI6MjA4MDQ0MTQ1M30.HYlXLFmk5wwdzrsiG_OxI_Sn8Ncu1jUyBX6yxHlNGJs`
- **Project ID**: `fwkouvwabyftfhcsnfgm`

> ⚠️ **গুরুত্বপূর্ণ**: Database Lovable Cloud-এ থাকবে, শুধু Frontend Hostinger-এ deploy হবে।

---

## 🔧 Step 1: Local Build তৈরি করুন

### Option A: Lovable থেকে Export করুন
1. Lovable-এ আপনার প্রজেক্ট খুলুন
2. **Settings** → **GitHub** ট্যাবে যান
3. GitHub repository-তে connect করুন
4. Repository clone করুন: `git clone <your-repo-url>`

### Option B: Direct Download
1. Lovable-এ **Settings** → **Export** option ব্যবহার করুন
2. ZIP file download করুন
3. Extract করুন

---

## 🔧 Step 2: Environment Variables সেট করুন

প্রজেক্ট ফোল্ডারে `.env.production` ফাইল তৈরি করুন:

```env
VITE_SUPABASE_URL=https://fwkouvwabyftfhcsnfgm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3a291dndhYnlmdGZoY3NuZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjU0NTMsImV4cCI6MjA4MDQ0MTQ1M30.HYlXLFmk5wwdzrsiG_OxI_Sn8Ncu1jUyBX6yxHlNGJs
VITE_SUPABASE_PROJECT_ID=fwkouvwabyftfhcsnfgm
```

---

## 🔧 Step 3: Build Command চালান

Terminal/Command Prompt-এ:

```bash
# Dependencies install করুন
npm install

# Production build তৈরি করুন
npm run build
```

এটি `dist/` ফোল্ডারে build output তৈরি করবে।

---

## 🔧 Step 4: Hostinger-এ Upload করুন

### 4.1 Hostinger Control Panel-এ Login করুন
1. [Hostinger](https://www.hostinger.com) এ login করুন
2. **hPanel** → **Files** → **File Manager** খুলুন

### 4.2 Files Upload করুন
1. `public_html` ফোল্ডারে যান
2. সব পুরাতন files delete করুন (যদি থাকে)
3. আপনার `dist/` ফোল্ডারের **সব content** upload করুন:
   - `index.html`
   - `assets/` folder
   - `.htaccess` (public ফোল্ডার থেকে)
   - অন্যান্য সব files

### 4.3 .htaccess Verify করুন
নিশ্চিত করুন `public_html` এ `.htaccess` ফাইল আছে এবং সঠিক content আছে।

---

## 🔧 Step 5: Domain Configure করুন

### 5.1 DNS Settings (যদি Custom Domain থাকে)
Hostinger-এর DNS Zone Editor-এ:
- **A Record**: `@` → Hostinger IP
- **A Record**: `www` → Hostinger IP

### 5.2 SSL Certificate
1. hPanel → **SSL** section
2. **Install SSL** click করুন
3. Let's Encrypt SSL select করুন

---

## 🔧 Step 6: প্রথমবার Installation

### 6.1 Install Page-এ যান
```
https://yourdomain.com/install
```

### 6.2 Admin Account তৈরি করুন
1. Admin Email দিন
2. Admin Password দিন (শক্তিশালী password)
3. **Install** button click করুন

### 6.3 Installation Complete হলে
- Database tables verify হবে
- Admin user তৈরি হবে
- Site settings initialize হবে

> ⚠️ **Installation এর পর `/install` page disable করুন security এর জন্য।**

---

## 🔧 Step 7: Admin Dashboard Access

Installation complete হলে:
```
https://yourdomain.com/admin
```

Admin credentials দিয়ে login করুন।

---

## 📁 File Structure (Hostinger public_html)

```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ... (other assets)
├── favicon.ico
├── robots.txt
└── ... (other static files)
```

---

## 🛠️ Troubleshooting

### সমস্যা: Page refresh করলে 404 error
**সমাধান**: `.htaccess` ফাইল সঠিকভাবে upload হয়েছে কিনা check করুন।

### সমস্যা: Database connect হচ্ছে না
**সমাধান**: 
1. Browser console check করুন (F12 → Console)
2. Network tab-এ Supabase requests check করুন
3. CORS error থাকলে Supabase dashboard-এ allowed origins add করুন

### সমস্যা: Images load হচ্ছে না
**সমাধান**: 
1. `assets/` folder সঠিকভাবে upload হয়েছে check করুন
2. File permissions 644 আছে কিনা check করুন

### সমস্যা: Admin login করতে পারছি না
**সমাধান**:
1. `/install` page-এ গিয়ে admin তৈরি করুন
2. অথবা Lovable Cloud dashboard থেকে user_roles table check করুন

---

## 🔐 Security Checklist

- [ ] `.htaccess` সঠিকভাবে configure করা
- [ ] SSL certificate active
- [ ] Admin password শক্তিশালী
- [ ] `/install` page disable করা
- [ ] Supabase RLS policies active

---

## 📞 Support

- **Lovable Docs**: https://docs.lovable.dev
- **Hostinger Support**: https://www.hostinger.com/support

---

## 🎉 Deployment Complete!

আপনার website এখন live!
- **Frontend**: Hostinger-এ hosted
- **Backend/Database**: Lovable Cloud (Supabase)-এ hosted
- **Real-time sync**: Active

