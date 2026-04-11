# ✅ Quick Fix Checklist - Permission Error

## The Problem
You get **"Missing or insufficient permissions"** error when trying to post jobs or add companies.

## The Solution (2 Steps)

### 1️⃣ Update Firebase Firestore Rules
- [ ] Go to https://console.firebase.google.com/
- [ ] Select **ignite-4d73e** project
- [ ] Click **Firestore Database** → **Rules**
- [ ] Delete old rules, copy-paste from **FIREBASE_RULES.md** (Firestore section)
- [ ] Click **Publish**
- [ ] Wait **30 seconds**

### 2️⃣ Update Firebase Storage Rules
- [ ] In Firebase Console, click **Storage** → **Rules**  
- [ ] Delete old rules, copy-paste from **FIREBASE_RULES.md** (Storage section)
- [ ] Click **Publish**
- [ ] Wait **30 seconds**

### 3️⃣ Test
- [ ] Clear browser cache: `Ctrl+Shift+Delete` (Chrome/Firefox)
- [ ] Logout and login again
- [ ] Try posting a job or adding company **✅**

## Still Not Working?

1. **Check admin email**
   - Is it exactly `admin@sgu.edu.in`? (case-sensitive)
   - Wrong email = permission denied

2. **Check rules published**
   - Refresh Firebase Console
   - Verify "Publish" button changed to "Saved"
   - Check there are no syntax errors (red indicator)

3. **Wait longer**
   - Firebase takes 30-60 seconds to propagate
   - Try again after 2 minutes

## Files with Detailed Instructions

- **PERMISSION_FIX.md** - Step-by-step guide with screenshots
- **FIREBASE_RULES.md** - Complete rules code
- **firebase.ts** - Firebase configuration

## Detailed Help

Run into issues? Check these files in your project:
- `PERMISSION_FIX.md` - Full troubleshooting guide
- `FIREBASE_RULES.md` - All rules with explanations

