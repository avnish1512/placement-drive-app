# 📋 LOGIN CREDENTIALS REFERENCE

**App**: Placement Drive Management System  
**University**: Sanjay Ghodawat University (SGU)  
**Last Updated**: April 2, 2026

---

## 🔐 ADMIN LOGIN

### Admin Account

| Field | Value |
|-------|-------|
| **Role** | Administrator |
| **Email** | `admin@sgu.edu.in` |
| **Password** | `admin123` |
| **Status** | ✅ Active |

### Admin Capabilities
- View all applications
- Manage companies
- Manage students
- Post new jobs
- Update application status
- Send messages to students
- View analytics and reports

---

## 👨‍🎓 STUDENT LOGIN CREDENTIALS

### Option 1: Production Students (Recommended for Testing)

These are the official seed students configured in the system:

#### Student 1: Priya Sharma
| Field | Value |
|-------|-------|
| **Student ID** | STU001 |
| **Name** | Priya Sharma |
| **Email** | `priya.sharma@student.com` |
| **Password** | `Priya@123` |
| **Course** | Computer Science Engineering |
| **Year** | Final Year |
| **CGPA** | 8.7 |
| **Phone** | +91 9876543210 |
| **Status** | ✅ Active |

#### Student 2: Rahul Kumar
| Field | Value |
|-------|-------|
| **Student ID** | STU002 |
| **Name** | Rahul Kumar |
| **Email** | `rahul.kumar@student.com` |
| **Password** | `Rahul@123` |
| **Course** | Computer Science Engineering |
| **Year** | Final Year |
| **CGPA** | 8.4 |
| **Phone** | +91 9876543211 |
| **Status** | ✅ Active |

#### Student 3: Aisha Patel
| Field | Value |
|-------|-------|
| **Student ID** | STU003 |
| **Name** | Aisha Patel |
| **Email** | `aisha.patel@student.com` |
| **Password** | `Aisha@123` |
| **Course** | Information Technology |
| **Year** | Final Year |
| **CGPA** | 9.1 |
| **Phone** | +91 9876543212 |
| **Status** | ✅ Active |

#### Student 4: Vikram Singh
| Field | Value |
|-------|-------|
| **Student ID** | STU004 |
| **Name** | Vikram Singh |
| **Email** | `vikram.singh@student.com` |
| **Password** | `Vikram@123` |
| **Course** | Computer Science Engineering |
| **Year** | Final Year |
| **CGPA** | 8.2 |
| **Phone** | +91 9876543213 |
| **Status** | ✅ Active |

#### Student 5: Neha Gupta
| Field | Value |
|-------|-------|
| **Student ID** | STU005 |
| **Name** | Neha Gupta |
| **Email** | `neha.gupta@student.com` |
| **Password** | `Neha@123` |
| **Course** | Electronics and Communication |
| **Year** | Final Year |
| **CGPA** | 8.8 |
| **Phone** | +91 9876543214 |
| **Status** | ✅ Active |

---

### Option 2: Mock UI Students (For Testing Admin Dashboard)

These students appear in the admin dashboard UI but may not have backend accounts:

#### Mock Student 1: Rahul Sharma
| Field | Value |
|-------|-------|
| **Email** | `rahul.sharma@sgu.edu.in` |
| **Name** | Rahul Sharma |
| **Course** | B.Tech Computer Science |
| **Year** | 4th Year |
| **CGPA** | 8.5 |
| **Status** | Active |
| **Phone** | +91 9876543210 |

#### Mock Student 2: Priya Patel
| Field | Value |
|-------|-------|
| **Email** | `priya.patel@sgu.edu.in` |
| **Name** | Priya Patel |
| **Course** | B.Tech Information Technology |
| **Year** | 3rd Year |
| **CGPA** | 9.2 |
| **Status** | Active |
| **Phone** | +91 9876543211 |

#### Mock Student 3: Amit Kumar
| Field | Value |
|-------|-------|
| **Email** | `amit.kumar@sgu.edu.in` |
| **Name** | Amit Kumar |
| **Course** | B.Tech Mechanical |
| **Year** | 4th Year |
| **CGPA** | 7.8 |
| **Status** | Inactive |
| **Phone** | +91 9876543212 |

#### Mock Student 4: Sneha Desai
| Field | Value |
|-------|-------|
| **Email** | `sneha.desai@sgu.edu.in` |
| **Name** | Sneha Desai |
| **Course** | B.Tech Electronics |
| **Year** | 2nd Year |
| **CGPA** | 8.9 |
| **Status** | Active |
| **Phone** | +91 9876543213 |

#### Mock Student 5: Vikram Singh
| Field | Value |
|-------|-------|
| **Email** | `vikram.singh@sgu.edu.in` |
| **Name** | Vikram Singh |
| **Course** | B.Tech Civil |
| **Year** | 4th Year |
| **CGPA** | 8.1 |
| **Status** | Active |
| **Phone** | +91 9876543214 |

---

## 📝 Testing Scenarios

### Scenario 1: Student Testing (Recommended)
```
1. Login with: priya.sharma@student.com / Priya@123
2. View jobs
3. Apply to jobs
4. Check applications status
5. Send message to admin
6. Update profile
```

### Scenario 2: Admin Testing
```
1. Login with: admin@sgu.edu.in / admin123
2. View all applications
3. Filter and manage applications
4. Send messages to students
5. Post new job
6. Manage companies
```

### Scenario 3: End-to-End Testing
```
1. Student login and apply to job
2. Admin login and review application
3. Admin updates status (Shortlist/Reject)
4. Student receives status update
5. Admin and student exchange messages
6. Student updates profile
```

---

## 🔑 Password Policy

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character

### Example Passwords
- **Strong**: `Password@123` ✅
- **Strong**: `MyPass#2024` ✅
- **Weak**: `password123` ❌
- **Weak**: `12345678` ❌

---

## 🔐 Security Notes

⚠️ **Production Security**
- Passwords shown here are for **TESTING ONLY**
- Do NOT use demo passwords in production
- Implement proper password hashing (bcrypt/argon2)
- Use Firebase Authentication for secure login
- Enable 2FA for admin accounts
- Rotate test credentials regularly

### Password Hashing in Production
```typescript
// ✅ DO THIS in production
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ DON'T DO THIS in production
const plainPassword = "admin123"; // Never store plain text!
```

---

## 🔄 Creating New Accounts

### For Students
```bash
# 1. Go to Firebase Console
# 2. Authentication → Users
# 3. Click "Add User"
# 4. Enter email: student@sgu.edu.in
# 5. Set password
# 6. Create Firestore document in /students collection
```

### For Admins
```bash
# 1. Go to Firebase Console
# 2. Authentication → Users
# 3. Click "Add User"
# 4. Enter email: admin@sgu.edu.in
# 5. Set password
# 6. Mark as admin in custom claims
```

---

## 🧪 Test Cases

### Login Test Cases

| Test Case | Email | Password | Expected Result |
|-----------|-------|----------|-----------------|
| Admin valid login | admin@sgu.edu.in | admin123 | ✅ Login success |
| Student valid login | priya.sharma@student.com | Priya@123 | ✅ Login success |
| Invalid password | admin@sgu.edu.in | wrong123 | ❌ Login failed |
| Invalid email | wrong@sgu.edu.in | admin123 | ❌ Login failed |
| Empty email | (blank) | admin123 | ❌ Validation error |
| Empty password | admin@sgu.edu.in | (blank) | ❌ Validation error |

---

## 🚀 Quick Start Guide

### Step 1: Admin Login
1. Open app → Unified Login
2. Click "Admin Login"
3. Email: `admin@sgu.edu.in`
4. Password: `admin123`
5. Click "Login"

### Step 2: Student Login
1. Open app → Unified Login
2. Email: `priya.sharma@student.com` (or any from list)
3. Password: `Priya@123` (corresponding password)
4. Click "Login"

### Step 3: Test Features
- **Browse Jobs** → Jobs tab
- **Apply to Job** → Click job → Apply
- **Send Message** → Messages → Type & Send
- **Update Profile** → Profile tab → Edit

---

## 📱 Multi-Device Testing

### Device 1: Admin
- Email: `admin@sgu.edu.in`
- Password: `admin123`
- Role: Administrator

### Device 2: Student
- Email: `priya.sharma@student.com`
- Password: `Priya@123`
- Role: Student

### Test Real-Time Features
1. Send message from student
2. Receive on admin device instantly ✅
3. Admin replies
4. Receives on student device instantly ✅

---

## ✅ What's Included in This File

✅ Admin credentials (1 account)  
✅ Student credentials (5 accounts)  
✅ Mock student data (UI reference)  
✅ Login testing scenarios  
✅ Password requirements  
✅ Security guidelines  
✅ Test cases  
✅ Quick start guide  

---

## 🔗 Related Files

- `DEPLOYMENT_READY.md` - Deployment instructions
- `VERIFICATION.md` - System verification
- `scripts/seed-students.js` - Student seeding script
- `/app/admin-login.tsx` - Admin login screen
- `/app/unified-login.tsx` - Student login screen
- `/hooks/auth-store.ts` - Authentication logic

---

## 📞 Support

### Issue: "Invalid credentials"
- **Solution**: Check password capitalization
- **Example**: `Priya@123` (not `priya@123`)

### Issue: "User not found"
- **Solution**: Ensure student is created in Firestore
- **Check**: Firebase Console → Firestore → students collection

### Issue: "Email not verified"
- **Solution**: Skip for demo; configure email verification in production

---

**Last Updated**: April 2, 2026  
**Status**: ✅ Ready for Testing  
**Version**: 1.0.0  

---

## 📊 Credential Summary

| Account Type | Total | Active | Inactive |
|-------------|-------|--------|----------|
| Admin | 1 | 1 | 0 |
| Students | 5 | 5 | 0 |
| **Total** | **6** | **6** | **0** |

---

**For Production Deployment**: 
- Update all demo passwords
- Enable Firebase Authentication rules
- Implement password hashing
- Setup email verification
- Enable 2FA for admin accounts
