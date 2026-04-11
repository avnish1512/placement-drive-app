# Missing or Insufficient Permissions - FIX GUIDE

## Problem
You're getting this error when trying to:
- Post a new job
- Add a company  
- Upload profile photo
- Apply to jobs

```
❌ Error: Missing or insufficient permissions.
```

## Root Cause
Firebase Firestore/Storage rules are not properly configured to allow your operations.

## Solution: Update Firebase Rules (5 minutes)

### Step 1: Get to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click on **ignite-4d73e** project

### Step 2: Update Firestore Rules
1. Click **Firestore Database** (left menu)
2. Click **Rules** tab
3. Delete all existing content
4. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin can manage jobs and companies
    match /jobs/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth.token.email == 'admin@sgu.edu.in';
    }
    
    match /companies/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth.token.email == 'admin@sgu.edu.in';
    }
    
    // Students can manage applications
    match /applications/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.token.email == 'admin@sgu.edu.in' || request.auth.uid == resource.data.studentId;
    }
    
    // Students can manage own profile
    match /students/{userId} {
      allow read: if request.auth.uid == userId || request.auth.token.email == 'admin@sgu.edu.in';
      allow create, update: if request.auth.uid == userId;
    }
    
    // Conversations for messaging
    match /conversations/{conversationId} {
      allow read: if request.auth.uid != null;
      allow create, update: if request.auth.uid != null;
      match /messages/{messageId} {
        allow read: if request.auth.uid != null;
        allow create, update: if request.auth.uid != null;
      }
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**
6. Wait 30 seconds for changes to take effect

### Step 3: Done ✅
Storage rules not needed (photo upload disabled, using default profile images)

## Step 4: Test
After Firestore rules update:

1. **Admin** - Try posting a job:
   - Go to Admin Dashboard
   - Click "Post New Job"
   - Fill form and submit ✅

2. **Student** - Try applying:
   - Go to Jobs tab
   - Click on a job
   - Click "Apply Now" ✅

3. **Student Profile** - View with default photo:
   - Go to Profile
   - See default profile image (no upload needed) ✅

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Still getting permission error | Clear browser cache (Ctrl+Shift+Delete) and retry |
| Admin can't post jobs | Verify admin email is exactly `admin@sgu.edu.in` |
| Can't apply to jobs | Wait 30 seconds after publishing rules, then refresh |
| Rules show old version | Refresh Firebase Console page |

## Notes
- Firestore rules changes take 30-60 seconds to propagate
- Admin email MUST be `admin@sgu.edu.in` (case-sensitive)
- Student ID comes from authentication UID
- Photo uploads disabled (using default profile images)

