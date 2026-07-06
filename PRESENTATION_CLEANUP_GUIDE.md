# 🎬 Presentation Database Cleanup Guide

## What Gets Deleted

When you run `npm run db:clean`, **EVERYTHING** gets removed EXCEPT the 2 system accounts:

```
❌ DELETED:
  • All admin quizzes (created and approved)
  • All quiz questions
  • All user quiz attempts and history
  • All games played
  • All hot topics (topic count)
  • All email verification tokens
  • All regular users
  • Everything uploaded

✅ PRESERVED (Always):
  • Owner: waelwzwz@gmail.com (Admin)
  • Admin: tutormiw@gmail.com (Admin)
```

---

## System Accounts

These 2 accounts are **system accounts** that always exist:

| Email | Role | Purpose | Login |
|-------|------|---------|-------|
| `waelwzwz@gmail.com` | Owner/Admin | Presentation owner | Magic link (email) |
| `tutormiw@gmail.com` | Admin | Admin demo account | Magic link (email) |

Both accounts have **verified emails** and **admin permissions** automatically.

---

## Step-by-Step Workflow

### 1️⃣ Clean the Database

```bash
# Delete all user data, keep only system accounts
npm run db:clean
```

**Output:**
```
✨ DATABASE CLEANUP COMPLETE!

📊 RESULT:
  ✅ All quizzes deleted
  ✅ All quiz history deleted
  ✅ All hot topics deleted
  ✅ All users deleted except:
     👑 waelwzwz@gmail.com (Owner/Admin)
     👤 tutormiw@gmail.com (Admin)
```

### 2️⃣ Verify Database is Clean

```bash
# Check current database state
npm run db:verify
```

**Output should show:**
```
📊 Database Status for Presentation:

👥 Users (2):
  👑 waelwzwz@gmail.com (Owner) - Admin: true
  👑 tutormiw@gmail.com (Admin) - Admin: true

📋 Admin Quizzes: 0
❓ Quiz Questions: 0
🎮 Games: 0
📝 Quiz Attempts: 0
🏷️  Hot Topics: 0
```

### 3️⃣ Start the Application

```bash
# Start development server
npm run dev
```

Then open: **http://localhost:3000**

### 4️⃣ Login with System Account

**Method A - Magic Link (Recommended)**
1. Click "Sign In"
2. Enter email: `waelwzwz@gmail.com` OR `tutormiw@gmail.com`
3. Check email inbox
4. Click magic link
5. ✅ Auto-login, Admin access granted

**Method B - Credentials (if configured)**
- Username: `admin`
- Password: `admin`

### 5️⃣ Access Admin Panel

Once logged in, go to: **http://localhost:3000/admin**

From there you can:
- ✅ Create new quizzes from scratch
- ✅ Upload PDF/TXT/JSON files
- ✅ Generate questions automatically
- ✅ Review and approve quizzes
- ✅ Manage quiz categories

### 6️⃣ Create Demo Content

Create fresh quizzes for your presentation:
1. Click "Create New Quiz"
2. Upload a file (PDF/TXT/JSON) OR paste content
3. Select difficulty and quiz type
4. Generate questions
5. Review and approve
6. Ready to present!

---

## How Login Works

### System Accounts Behavior

**When someone tries to login:**

```
User enters: waelwzwz@gmail.com or tutormiw@gmail.com
                           ↓
                    Check database
                           ↓
              Account exists + verified email
                           ↓
                      Login succeeds
                    Admin permissions granted
```

**The app ensures:**
- ✅ Email is verified (no verification needed)
- ✅ User has admin permissions
- ✅ User is not banned
- ✅ User is not revoked

### If Account Gets Deleted Accidentally

Just run `npm run db:clean` again - it will:
1. Delete any non-system users
2. **Recreate** the 2 system accounts
3. Reset email verification
4. Restore admin permissions

---

## For Presentation

### Before Your Demo

```bash
# 1. Clean everything
npm run db:clean

# 2. Verify it's clean
npm run db:verify

# 3. Start the app
npm run dev

# 4. Login and create demo quizzes
```

### During Your Demo

- Login with: `waelwzwz@gmail.com` or `tutormiw@gmail.com`
- Show the admin panel
- Create quizzes, upload files
- Generate questions
- Show the quiz interface
- Demonstrate the features

### What Viewers See

- ✅ Clean dashboard (no old data)
- ✅ Fresh hot topics (empty)
- ✅ Fresh user attempts (empty)
- ✅ Professional, organized system

---

## Troubleshooting

### Data Still Shows in Browser

**Problem:** After cleanup, old data still appears in Vercel production

**Solution:** It's cached in Vercel's CDN
1. Go to https://vercel.com/dashboard
2. Click project "NextQuizAI"
3. Click "Deployments"
4. Click "..." on latest deployment
5. Click "Redeploy"
6. Wait 2-3 minutes
7. Refresh browser with `Ctrl+Shift+R` (hard refresh)

### Database Issues

If something goes wrong:

```bash
# Check database status
npm run db:verify

# Reset everything
npm run db:clean

# Verify again
npm run db:verify
```

---

## Commands Summary

```bash
# Clean database (delete all except system accounts)
npm run db:clean

# Verify database status
npm run db:verify

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

---

## System Account Details

### Owner Account
- **Email:** waelwzwz@gmail.com
- **Role:** Owner/Admin
- **Permissions:** Full admin access
- **Status:** Verified, Never banned

### Admin Account  
- **Email:** tutormiw@gmail.com
- **Role:** Admin
- **Permissions:** Full admin access
- **Status:** Verified, Never banned

---

## Questions?

This cleanup system ensures:
1. ✅ Clean presentation with no old data
2. ✅ System accounts always exist
3. ✅ Easy login for demo
4. ✅ Professional appearance
5. ✅ Repeatable process
