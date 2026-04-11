# Firebase Configuration & Rules

## Firebase Firestore Rules

Go to Firebase Console → Firestore Database → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin operations - only admin@sgu.edu.in can write
    match /jobs/{document=**} {
      allow read: if true;  // Everyone can read jobs
      allow create, update, delete: if request.auth.token.email == 'admin@sgu.edu.in';
    }
    
    match /companies/{document=**} {
      allow read: if true;  // Everyone can read companies
      allow create, update, delete: if request.auth.token.email == 'admin@sgu.edu.in';
    }
    
    // Students can read applications and write their own
    match /applications/{document=**} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.token.email == 'admin@sgu.edu.in' || request.auth.uid == resource.data.studentId;
    }
    
    // Student profiles - can read own, admins can read all
    match /students/{userId} {
      allow read: if request.auth.uid == userId || request.auth.token.email == 'admin@sgu.edu.in';
      allow create, update: if request.auth.uid == userId;
      allow delete: if request.auth.token.email == 'admin@sgu.edu.in';
    }
    
    // Conversations - participants and admin can access
    match /conversations/{conversationId} {
      allow read: if request.auth.uid != null && 
        (request.auth.uid in resource.data.participants || request.auth.token.email == 'admin@sgu.edu.in');
      allow create, update: if request.auth.uid != null;
      
      // Messages within conversations
      match /messages/{messageId} {
        allow read: if request.auth.uid != null;
        allow create, update: if request.auth.uid != null;
      }
    }
    
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Firebase Storage Rules

Go to Firebase Console → Storage → Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Profile photos - students can upload their own
    match /profile-photos/{studentId}/{allPaths=**} {
      allow read: if true;  // Everyone can view profile photos
      allow write: if request.auth.uid == studentId;
    }
    
    // Resumes - students can upload their own
    match /resumes/{studentId}/{allPaths=**} {
      allow read: if request.auth.uid == studentId || request.auth.token.email == 'admin@sgu.edu.in';
      allow write: if request.auth.uid == studentId;
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Steps to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "ignite-4d73e" project
3. **For Firestore:**
   - Click "Firestore Database" in left menu
   - Click "Rules" tab
   - Replace all content with Firestore rules above
   - Click "Publish"

4. **For Storage:**
   - Click "Storage" in left menu
   - Click "Rules" tab
   - Replace all content with Storage rules above
   - Click "Publish"

## Testing After Rules Update

### Admin Testing (admin@sgu.edu.in):
- ✅ Post new job
- ✅ Add company
- ✅ Update job details
- ✅ Delete job/company

### Student Testing:
- ✅ Upload profile photo
- ✅ Upload resume
- ✅ Apply to job
- ✅ View applications
- ✅ Send message to admin

## Troubleshooting

If you still get permission errors after updating rules:

1. **Clear browser cache** - Firebase rules can take time to propagate
2. **Re-authenticate** - Logout and login again
3. **Check email** - Make sure admin email is exactly `admin@sgu.edu.in`
4. **Check Firebase Console** - Verify rules were published successfully

