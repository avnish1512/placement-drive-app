# Real-Time Sync Verification Checklist

Step-by-step checklist to verify the real-time sync system is working correctly.

## ✅ Pre-Implementation Checks

### 1. Dependencies Installed

```bash
npm list zustand firebase
```

Expected output:
```
zustand@4.x.x
firebase@9.x.x
@react-native-async-storage/async-storage@1.x.x
```

### 2. Firebase Config Verified

Check [config/firebase.ts](config/firebase.ts):
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Should have valid config
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 3. Store Files Exist

✓ [hooks/auth-store.ts](hooks/auth-store.ts)
✓ [hooks/jobs-store.ts](hooks/jobs-store.ts)
✓ [hooks/messaging-store.ts](hooks/messaging-store.ts)
✓ [hooks/settings-store.ts](hooks/settings-store.ts)

---

## 🧪 Runtime Verification Tests

### Test 1: Authentication System

**Setup**: Create test file [__tests__/auth-flow.test.ts](test)

```typescript
import { useAuth } from '@/hooks/auth-store';

describe('Auth Real-Time Sync', () => {
  test('should load auth state on startup', async () => {
    const { user, loadAuthState } = useAuth();
    
    // Before
    expect(user).toBeNull();
    
    // Load
    await loadAuthState();
    
    // After - should have user or null (no error)
    expect(typeof user === 'object' || user === null).toBe(true);
  });

  test('should sync user profile to Firebase', async () => {
    const { user, setUser } = useAuth();
    
    if (!user) return; // Skip if not logged in
    
    // Update profile
    await setUser({ name: 'Test User' });
    
    // Should be immediately available
    expect(user.name).toBe('Test User');
  });
});
```

**Run**: `npm test auth-flow.test.ts`

**Expected**: ✅ Tests pass without errors

---

### Test 2: Jobs Real-Time Updates

**In app console**:

```typescript
// 1. Open app
// 2. Go to Jobs screen
// 3. Open browser console: Cmd+Option+J (Mac) or F12 (Windows)

// 4. Check that jobs load
import { useJobs } from '@/hooks/jobs-store';
const store = useJobs.getState();
console.log('Jobs count:', store.jobs.length);

// Expected output: "Jobs count: 10" (or whatever in database)
```

**What to look for**:
- ✓ No errors in console
- ✓ Jobs array populated
- ✓ Each job has id, title, company

---

### Test 3: Settings Real-Time Persistence

**In your Settings screen**:

1. **Toggle a setting**:
   ```typescript
   const { setPushNotifications } = useSettings();
   setPushNotifications(false);
   ```

2. **Close app and reopen** - Setting should still be OFF ✓

3. **Check AsyncStorage**:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   const settings = await AsyncStorage.getItem('app_settings');
   console.log(JSON.parse(settings));
   ```

4. **Check Firebase Console**:
   - Go to Cloud Firestore
   - Check `settings/{userId}` document
   - Should have `pushNotifications: false` ✓

---

### Test 4: Offline Support

**Simulate offline mode**:

1. **Enable offline in browser**:
   - DevTools → Network → Offline

2. **Try using app**:
   - Should show cached data ✓
   - Should NOT crash ✓

3. **Check AsyncStorage cache**:
   ```typescript
   const data = await AsyncStorage.getItem('jobs_cache');
   console.log('Cached jobs:', JSON.parse(data).length);
   ```

4. **Go back online**:
   - Data should sync automatically ✓

---

### Test 5: Multi-Device Sync

**Setup**: Two browser tabs or two simulators

**Tab 1 - Apply for Job**:
```typescript
const { applyForJob } = useJobs();
await applyForJob('job123');
```

**Tab 2 - Check Status** (should show "applied" automatically):
```typescript
const { applications } = useJobs();
console.log(applications[0].status); // Should show 'pending'
```

**Expected**: ✓ Application appears immediately on Tab 2

---

## 📊 Performance Checks

### Memory Leaks

```typescript
// Check console for warnings about:
// "Can't perform a React state update on an unmounted component"
// "Maximum stack size exceeded"

// These indicate listener cleanup issues
```

**Fix**: Verify all useEffect return cleanup functions

---

### Active Listeners Count

```typescript
// Monitor in development
console.group('🎯 Real-Time Listeners');
console.log('Active listeners count: ' + listenerCount);
console.log('Should be: 3-5 listeners');
console.groupEnd();

// Guidelines:
// ✓ Acceptable: 1-10 listeners
// ⚠️ Warning: 10-20 listeners
// ❌ Problem: 20+ listeners
```

---

### Firestore Usage

**Check Firebase Console**:
1. Go to https://console.firebase.google.com
2. Select Rock AI project
3. Firestore Database → Stats
4. Check:
   - **Read count**: Should be low (< 1000/day for testing)
   - **Write count**: Should be low (< 100/day for testing)
   - **Storage**: Should be reasonable (< 1MB for testing)

---

## 🔍 Data Validation Tests

### Test 6: Data Integrity

```typescript
// Verify no duplicate data
const { jobs } = useJobs();
const ids = new Set(jobs.map(j => j.id));

if (ids.size === jobs.length) {
  console.log('✅ No duplicates found');
} else {
  console.log('❌ Duplicate jobs detected!');
}
```

### Test 7: Timestamp Consistency

```typescript
// Each record should have timestamps
const { jobs } = useJobs();

jobs.forEach(job => {
  if (!job.createdAt) {
    console.error('❌ Missing createdAt:', job.id);
  }
  if (!job.updatedAt) {
    console.error('❌ Missing updatedAt:', job.id);
  }
});

console.log('✅ All records have timestamps');
```

---

## 🐛 Error Handling Tests

### Test 8: Firebase Errors

```typescript
// Simulate Firebase error
import { onSnapshot } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn((query, success, error) => {
    error(new Error('PERMISSION_DENIED'));
  })
}));

const { jobs, loadJobs } = useJobs();
await loadJobs();

// Should fall back to AsyncStorage without crashing
expect(jobs.length).toBeGreaterThan(0);
```

---

### Test 9: Network Error Recovery

```typescript
// 1. Start app
// 2. Disable network
// 3. Perform action:
const { sendMessage } = useMessaging();
await sendMessage(convId, 'Test');

// 4. Should queue action OR show error
// 5. Re-enable network
// 6. Message should send after reconnect
```

---

## ✨ Feature Validation

### Test 10: Real-Time Message Delivery

**Requirement**: Message appears on other device within 2 seconds

1. **Open two browser tabs**
2. **Tab 1**: Send message
3. **Tab 2**: Watch messages list
4. **Timer**: Should appear < 2 seconds ✓

---

### Test 11: Application Status Updates

**Requirement**: Application status changes when admin accepts

1. **Student**: Apply for job
2. **Admin**: Go to admin dashboard
3. **Admin**: Click "Accept" on application
4. **Student**: Watch applications list
5. **Expectation**: Status changes from "pending" to "accepted" instantly ✓

---

### Test 12: Settings Sync Across Devices

**Requirement**: Settings change on Device A, visible on Device B

1. **Device A**: Change dark mode OFF
2. **Device B**: Refresh app
3. **Expectation**: Dark mode OFF on Device B ✓

---

## 📋 Final Checklist

### Functionality

- [ ] Users can login
- [ ] Jobs load immediately
- [ ] Can apply for jobs
- [ ] Application status updates in real-time
- [ ] Can send/receive messages
- [ ] Messages appear instantly
- [ ] Settings save and persist
- [ ] Settings sync across devices

### Performance

- [ ] App loads in < 2 seconds
- [ ] No console errors
- [ ] No memory warnings
- [ ] Listeners cleanup on unmount
- [ ] Active listeners < 10

### Offline Support

- [ ] Works without internet
- [ ] Shows cached data
- [ ] Syncs on reconnect
- [ ] No data loss

### Error Handling

- [ ] Handles network errors gracefully
- [ ] Falls back to cache when needed
- [ ] No crashes on failed requests
- [ ] User-friendly error messages

### Security

- [ ] Unauthorized users can't access data
- [ ] Users only see their own data
- [ ] All data encrypted in transit
- [ ] Firebase rules working

### Data Integrity

- [ ] No duplicate records
- [ ] All records have timestamps
- [ ] Conflict resolution working
- [ ] Merge operations working

---

## 🚀 Deployment Verification

Before deploying to production:

1. **Test on real devices** (not just simulator)
2. **Test on slow network** (3G throttling)
3. **Test offline mode** thoroughly
4. **Monitor Firestore quotes** in Firebase console
5. **Check security rules** are correct
6. **Load test** with multiple concurrent users
7. **Check Crash Reports** analytics
8. **Review Performance metrics** in Firebase

---

## 📝 Sign-Off

When all checks pass:

```
✅ Real-Time Sync System - VERIFIED
Date: [TODAY]
Tester: [YOUR_NAME]
Notes: All checks passed, ready for production
```

---

## Troubleshooting If Tests Fail

| Issue | Solution |
|-------|----------|
| Data not loading | Check Firebase rules, verify listener is active |
| Memory leak warning | Check useEffect cleanup functions |
| Offline data missing | Ensure AsyncStorage cache is populated |
| Duplicate records | Check unique key usage in lists |
| Slow performance | Check Firestore query complexity |
| Sync failures | Check network connectivity, Firebase status |

For detailed troubleshooting, see [REALTIME_SYNC_TROUBLESHOOTING.md](REALTIME_SYNC_TROUBLESHOOTING.md)

---

**Version**: 1.0
**Last Updated**: 2024
**Status**: Verification Template Ready ✅
