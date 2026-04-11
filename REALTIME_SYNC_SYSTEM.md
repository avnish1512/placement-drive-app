# Real-Time Sync System Documentation

## Overview

The Rock AI app now features a comprehensive real-time synchronization system that keeps user data consistent across devices and sessions. This system uses Firebase Firestore for real-time updates and AsyncStorage for offline fallback.

## Architecture

### Three-Layer Sync System

```
┌─────────────────────────────────────────────┐
│         Real-Time Firebase Listeners        │
│    (onAuthStateChanged, onSnapshot)         │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│        Zustand State Management Stores       │
│  (auth-store, jobs-store, messaging-store)  │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│     AsyncStorage Local Cache Layer          │
│   (Offline support & fallback storage)      │
└─────────────────────────────────────────────┘
```

## Core Stores

### 1. Auth Store (`hooks/auth-store.ts`)

**Purpose**: Manages user authentication state and profile data

**Real-Time Features**:
- `onAuthStateChanged` listener for Firebase Auth changes
- Automatic sync when user logs in/out
- Persistent authentication across app restarts

**Key Methods**:
- `loadAuthState()` - Loads initial auth state from Firebase or AsyncStorage
- `setUser()` - Updates user info and syncs to Firebase
- `clearAuth()` - Clears auth data on logout

**Storage**:
- Firebase: `users/{userId}` collection
- AsyncStorage: `current_user` key

### 2. Jobs Store (`hooks/jobs-store.ts`)

**Purpose**: Manages job listings, applications, and saved jobs

**Real-Time Features**:
- `onSnapshot` listeners for job data changes
- Real-time application updates with status changes
- Multi-user coordination for job applications

**Key Methods**:
- `loadJobs()` - Real-time job listener with automatic updates
- `applyForJob()` - Application with real-time status sync
- `loadApplicationStatus()` - Queries current application state
- `subscribeToApplications()` - Real-time application updates

**Storage**:
- Firebase: `jobs`, `job_applications`, `saved_jobs` collections
- AsyncStorage: `jobs_cache`, `applications_cache` keys

### 3. Messaging Store (`hooks/messaging-store.ts`)

**Purpose**: Manages user messaging and notifications

**Real-Time Features**:
- `onSnapshot` listeners for incoming messages
- Real-time conversation updates
- Automatic message status updates

**Key Methods**:
- `loadConversations()` - Real-time conversation listener
- `sendMessage()` - Message with real-time propagation
- `loadMessages()` - Real-time message updates for active conversation

**Storage**:
- Firebase: `messages`, `conversations` collections
- AsyncStorage: `conversations_cache`, `messages_cache` keys

### 4. Settings Store (`hooks/settings-store.ts`)

**Purpose**: Manages user preferences and app settings

**Real-Time Features**:
- Optional Firebase sync for settings
- Local storage fallback for quick access
- Automatic persistence on each change

**Key Methods**:
- `loadSettings(userId)` - Loads settings from Firebase or AsyncStorage
- `saveSettings(userId)` - Saves settings to both Firebase and AsyncStorage

**Storage**:
- Firebase: `settings/{userId}` document
- AsyncStorage: `app_settings` key

## Implementation Details

### Real-Time Listener Pattern

All stores use the same listener pattern:

```typescript
// Firebase listener with error handling
const unsubscribe = onSnapshot(
  query(...),
  (snapshot) => {
    // Update state with new data
    set({ data: processedData });
    // Sync to AsyncStorage
    await AsyncStorage.setItem('cache_key', JSON.stringify(data));
  },
  (error) => {
    console.error('Listener error:', error);
    // Fallback to AsyncStorage
    handleAsyncStorageFallback();
  }
);
```

### Offline-First Architecture

1. **Online Mode**: Firebase listeners provide real-time updates
2. **Connection Loss**: AsyncStorage fallback keeps app functional
3. **Reconnection**: Automatic sync when connection restored
4. **Conflict Resolution**: Latest timestamp wins for conflicts

### Data Consistency

Each store maintains consistency through:

- **Atomic Updates**: Single source of truth in Zustand
- **Timestamp Tracking**: Each record includes `updatedAt`
- **Merge Operations**: Firebase `setDoc` with `{ merge: true }`
- **Validation**: Data validation on read and write

## Usage Examples

### Loading Initial Data

```typescript
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';

export function HomeScreen() {
  const { user, loadAuthState } = useAuth();
  const { loadJobs } = useJobs();

  useEffect(() => {
    // Load auth first
    loadAuthState();
    
    // Then load jobs with real-time listening
    loadJobs();
  }, []);

  return <View>{/* UI */}</View>;
}
```

### Real-Time Updates

```typescript
import { useJobs } from '@/hooks/jobs-store';

export function JobsScreen() {
  const { jobs } = useJobs();
  
  // jobs automatically updates when Firebase data changes
  // UI re-renders through Zustand subscription
  return (
    <FlatList
      data={jobs}
      renderItem={({ item }) => <JobCard job={item} />}
    />
  );
}
```

### Settings Management

```typescript
import { useSettings } from '@/hooks/settings-store';
import { useAuth } from '@/hooks/auth-store';

export function SettingsScreen() {
  const { user } = useAuth();
  const { pushNotifications, setPushNotifications, loadSettings, saveSettings } = useSettings();

  useEffect(() => {
    // Load settings when component mounts
    loadSettings(user?.id);
  }, [user?.id]);

  const handleToggle = async () => {
    // This automatically saves to both Firebase and AsyncStorage
    setPushNotifications(!pushNotifications);
  };

  return <Switch value={pushNotifications} onValueChange={handleToggle} />;
}
```

## Firestore Structure

### Collections

#### users
```json
{
  "userId": {
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "profile": {...},
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### jobs
```json
{
  "jobId": {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "description": "...",
    "postedBy": "adminId",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### job_applications
```json
{
  "applicationId": {
    "jobId": "...",
    "studentId": "...",
    "status": "pending|accepted|rejected",
    "appliedAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### conversations
```json
{
  "conversationId": {
    "participants": ["userId1", "userId2"],
    "lastMessage": "...",
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### messages
```json
{
  "messageId": {
    "conversationId": "...",
    "senderId": "...",
    "content": "...",
    "read": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### settings
```json
{
  "userId": {
    "pushNotifications": true,
    "emailNotifications": true,
    "jobAlerts": true,
    "darkMode": false,
    "language": "en",
    "biometricAuth": false,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling

### Network Errors

```typescript
// Listener catches connection errors automatically
const unsubscribe = onSnapshot(
  query(...),
  (snapshot) => { /* success */ },
  (error) => {
    if (error.code === 'PERMISSION_DENIED') {
      console.error('User not authorized');
    } else if (error.code === 'UNAVAILABLE') {
      console.error('Service unavailable, using cache');
    }
    // Fall back to AsyncStorage
  }
);
```

### Data Validation

```typescript
// Validate before syncing
const validateJob = (job: any): job is Job => {
  return (
    job.id &&
    job.title &&
    job.company &&
    typeof job.title === 'string'
  );
};
```

## Performance Optimization

### Query Optimization

```typescript
// ✅ Good - Filtered query
const q = query(
  collection(db, 'jobs'),
  where('status', '==', 'active'),
  limit(50)
);

// ❌ Bad - Full collection fetch
const q = collection(db, 'jobs');
```

### Listener Cleanup

```typescript
// Always unsubscribe to prevent memory leaks
useEffect(() => {
  const unsubscribe = subscribeToJobs();
  
  return () => {
    unsubscribe?.();
  };
}, []);
```

### Batch Operations

```typescript
// For multiple updates
const batch = writeBatch(db);

jobs.forEach((job) => {
  batch.update(doc(db, 'jobs', job.id), { status: 'active' });
});

await batch.commit();
```

## Testing

### Mock Firebase for Tests

```typescript
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

if (useEmulator) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Test Stores with AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear before each test
beforeEach(() => {
  AsyncStorage.clear();
});

// Test store updates
test('should load jobs from AsyncStorage', async () => {
  await AsyncStorage.setItem('jobs_cache', JSON.stringify(mockJobs));
  await loadJobs();
  expect(jobs).toEqual(mockJobs);
});
```

## Debugging

### Enable Console Logging

```typescript
// In production build, logs are helpful for monitoring
if (__DEV__) {
  console.log('🔥 Firebase listener active');
  console.log('💾 Data synced to AsyncStorage');
}
```

### Monitor Sync Status

```typescript
// Track sync state
const [syncStatus, setSyncStatus] = useState('idle');

useEffect(() => {
  setSyncStatus('loading');
  loadData().then(() => setSyncStatus('synced'));
}, []);

return <SyncStatusIndicator status={syncStatus} />;
```

## Migration Guide

If integrating real-time sync into existing code:

1. **Install dependencies** (already done):
   ```bash
   npm install zustand firebase @react-native-async-storage/async-storage
   ```

2. **Update imports**:
   ```typescript
   import { useAuth } from '@/hooks/auth-store';
   // Instead of: import { getAuthState } from '@/utils/auth';
   ```

3. **Replace context providers**:
   - Remove Redux store if present
   - Remove Context API providers
   - Zustand stores work globally without providers

4. **Update component subscriptions**:
   ```typescript
   // Before
   const [jobs, setJobs] = useState([]);
   useEffect(() => {
     fetchJobs().then(setJobs);
   }, []);

   // After
   const { jobs } = useJobs(); // Automatically real-time
   ```

## Best Practices

1. **Always unsubscribe**: Clean up listeners in useEffect cleanup
2. **Use query filters**: Request only needed data
3. **Cache strategically**: Balance freshness vs. performance
4. **Handle offline**: Test with network disabled
5. **Monitor performance**: Watch Firestore read/write counts
6. **Validate data**: Never trust external data
7. **Update timestamps**: Always include updatedAt in records
8. **Use batch writes**: For multiple document updates

## Troubleshooting

### Data Not Updating

- Check Firebase rules allow access
- Verify listener is subscribed (check console logs)
- Check AsyncStorage contains fallback data
- Verify network connection

### Memory Leaks

- Ensure listeners are unsubscribed in useEffect cleanup
- Check for circular dependencies in stores
- Monitor React DevTools for component re-renders

### Performance Issues

- Check query complexity
- Limit number of active listeners
- Use pagination for large collections
- Monitor Firestore usage in Firebase Console

## Future Enhancements

- [ ] Offline queue for write operations
- [ ] Automatic retry logic with exponential backoff
- [ ] Data conflict resolution strategy
- [ ] Real-time presence indicators
- [ ] End-to-end encryption for messages
- [ ] Compression for large payloads
