# Admin Account Setup Instructions

## আপনার Admin Account সেটআপ করার নির্দেশনা

### Account 1: MD ASHRAF UDDIN (Super Admin)
**Email:** md.ashrafuddinnoyon@gmail.com
**Password:** 57585664
**Role:** admin

#### স্টেপগুলি:
1. **Supabase Dashboard এ যান**
   - https://supabase.com
   - আপনার project খুলুন
   - SQL Editor খুলুন

2. **নিচের SQL Query চালান:**
```sql
-- Find the user ID by email
SELECT id, email FROM auth.users WHERE email = 'md.ashrafuddinnoyon@gmail.com';

-- তারপর নিচের query তে উপরের user ID ব্যবহার করুন (copy-paste করুন)
-- Replace 'USER_ID_HERE' with the actual UUID

-- Make sure profile exists
INSERT INTO profiles (user_id, full_name)
VALUES ('USER_ID_HERE', 'MD ASHRAF UDDIN')
ON CONFLICT (user_id) DO UPDATE SET full_name = 'MD ASHRAF UDDIN';

-- Set role as admin
DELETE FROM user_roles WHERE user_id = 'USER_ID_HERE';
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Account 2: NOYON (Store Manager / Customer Account)
**Email:** noyon.cid@gmail.com
**Password:** 57585663
**Roles:** 
- Staff Role: store_manager (admin dashboard access)
- Customer Role: user (customer account access)

#### এই account এর জন্য:
```sql
-- Find the user ID by email
SELECT id, email FROM auth.users WHERE email = 'noyon.cid@gmail.com';

-- তারপর নিচের query তে উপরের user ID ব্যবহার করুন
-- Replace 'USER_ID_HERE' with the actual UUID

-- Make sure profile exists
INSERT INTO profiles (user_id, full_name)
VALUES ('USER_ID_HERE', 'NOYON')
ON CONFLICT (user_id) DO UPDATE SET full_name = 'NOYON';

-- Set role as store_manager
DELETE FROM user_roles WHERE user_id = 'USER_ID_HERE';
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'store_manager');
```

---

## নতুন Staff Account তৈরি করার নিয়ম

### সুপার এডমিন যখন নতুন admin/moderator/store_manager তৈরি করে:

1. **Admin Panel এ:**
   - Settings → Users & Roles → "Add Admin/Moderator" button click করুন
   - Email এবং password দিন
   - Role (admin/store_manager/moderator) সিলেক্ট করুন
   - Save করুন
   - Success message এবং credentials দেখাবে

2. **Staff Member এর জন্য:**
   - দিওয়া email এবং password দিয়ে login করলে:
   - **Admin/Store Manager/Moderator হলে** → `/admin` dashboard এ যাবে
   - কাস্টমার account এ যাবে না

3. **কাস্টমার Account:**
   - যদি customer হিসেবেও register করেন এবং login করেন
   - নিয়মিত customer হিসেবে account পেজ এ যাবে

---

## Login Flow বিস্তারিত

### Login করার সময় কী হয়:

**সিনারিও 1: Admin এ login করেছেন**
- Email: md.ashrafuddinnoyon@gmail.com
- Password: 57585664
- ✅ **Result:** `/admin` dashboard এ যাবেন
- ✅ **Success popup** দেখাবে

**সিনারিও 2: Store Manager এ login করেছেন**
- Email: noyon.cid@gmail.com (as staff)
- Password: 57585663
- ✅ **Result:** `/admin` dashboard এ যাবেন
- ✅ **Success popup** দেখাবে
- ℹ️ **Note:** Store Manager এর permissions অনুযায়ী limited features দেখাবে

**সিনারিও 3: কাস্টমার account এ login করেছেন**
- Email: noyon.cid@gmail.com (customer)
- Password: 57585663
- ✅ **Result:** Home page এ যাবেন
- ✅ **Success popup** দেখাবে
- ✅ Profile page এ যেতে পারবেন

---

## সমস্যা সমাধান

### যদি Admin/Moderator তৈরি করার পর কাজ না করে:

**সমাধান 1:** Browser cache clear করুন এবং reload করুন

**সমাধান 2:** নতুন tab এ login করুন (private/incognito mode এ test করুন)

**সমাধান 3:** Console এ errors check করুন (F12 → Console tab)

**সমাধান 4:** Database এ manually role সেট করুন (উপরের SQL queries ব্যবহার করুন)

---

## খুব গুরুত্বপূর্ণ ⚠️

**Admin Account Protection:**
- Super admin account শুধুমাত্র আপনার নিজের ব্যবহারের জন্য
- এই credentials কাউকে শেয়ার করবেন না
- নিয়মিত password change করুন

**Staff Account:**
- প্রতিটি staff member এর জন্য unique email দিন
- Initial password email এ পাঠান (secure method)
- তারা প্রথম login এর পর password change করতে পারবে

**Customer Account:**
- আলাদা email দিন যদি staff member customer account ও চান
- একই email দিয়ে staff এবং customer account পাওয়া যায় না
