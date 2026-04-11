# Real-Time Sync Quick Reference

Fast lookup guide for common real-time sync tasks.

## Imports

```typescript
// Auth
import { useAuth } from '@/hooks/auth-store';

// Jobs & Applications
import { useJobs } from '@/hooks/jobs-store';

// Messaging
import { useMessaging } from '@/hooks/messaging-store';

// Settings
import { useSettings } from '@/hooks/settings-store';
```

## Common Tasks

### Authentication

```typescript
// Login
const { loginStudent, loginAdmin } = useAuth();
await loginStudent(email, password);
await loginAdmin(email, password);

// Get current user
const { user } = useAuth();
console.log(user?.id, user?.email, user?.name);

// Logout
const { logout } = useAuth();
await logout();

// Update profile
const { setUser } = useAuth();
await setUser({ name: 'New Name', phone: '1234567890' });

// Load auth on app start
const { loadAuthState } = useAuth();
useEffect(() => {
  loadAuthState();
}, []);
```

### Jobs

```typescript
// Load all jobs (real-time)
const { loadJobs, jobs } = useJobs();
useEffect(() => {
  loadJobs();
}, []);

// Search jobs
const { searchJobs } = useJobs();
await searchJobs('Software Engineer');

// Filter jobs
const { filterJobs } = useJobs();
await filterJobs({ minSalary: 50000, location: 'NYC' });

// Apply for job
const { applyForJob } = useJobs();
try {
  await applyForJob(jobId);
  // Application submitted with real-time status updates
} catch (error) {
  console.error('Application failed:', error);
}

// Check application status
const { loadApplicationStatus } = useJobs();
const status = await loadApplicationStatus(jobId);
console.log(status); // 'pending' | 'accepted' | 'rejected'

// Save job
const { saveJob } = useJobs();
await saveJob(jobId);

// Unsave job
const { unsaveJob } = useJobs();
await unsaveJob(jobId);

// Get saved jobs
const { savedJobs } = useJobs();
console.log(savedJobs);

// Subscribe to application updates (real-time)
const { subscribeToApplications } = useJobs();
useEffect(() => {
  if (user?.id) {
    const unsubscribe = subscribeToApplications(user.id);
    return () => unsubscribe?.();
  }
}, [user?.id]);
```

### Messaging

```typescript
// Load conversations (real-time)
const { loadConversations, conversations } = useMessaging();
useEffect(() => {
  if (user?.id) {
    const unsubscribe = loadConversations(user.id);
    return () => unsubscribe?.();
  }
}, [user?.id]);

// Load messages in conversation (real-time)
const { loadMessages, messages } = useMessaging();
useEffect(() => {
  if (conversationId) {
    const unsubscribe = loadMessages(conversationId);
    return () => unsubscribe?.();
  }
}, [conversationId]);

// Send message
const { sendMessage } = useMessaging();
await sendMessage(conversationId, 'message content');

// Mark as read
const { markAsRead } = useMessaging();
await markAsRead(conversationId);

// Create conversation
const { createConversation } = useMessaging();
const conversationId = await createConversation(participantId);
```

### Settings

```typescript
// Load settings on app start
const { loadSettings } = useSettings();
useEffect(() => {
  if (user?.id) {
    loadSettings(user.id);
  }
}, [user?.id]);

// Get current settings
const {
  pushNotifications,
  emailNotifications,
  jobAlerts,
  darkMode,
  language,
  biometricAuth
} = useSettings();

// Update individual settings
const { setPushNotifications } = useSettings();
setPushNotifications(false); // Auto-saves to Firebase + AsyncStorage

const { setEmailNotifications } = useSettings();
setEmailNotifications(true);

const { setJobAlerts } = useSettings();
setJobAlerts(true);

const { setDarkMode } = useSettings();
setDarkMode(true);

const { setLanguage } = useSettings();
setLanguage('en');

const { setBiometricAuth } = useSettings();
setBiometricAuth(true);

// Clear cache
const { clearCache } = useSettings();
await clearCache();

// Save all settings
const { saveSettings } = useSettings();
await saveSettings(user?.id);
```

## Store State Access

```typescript
// Get store state directly
import { useAuth } from '@/hooks/auth-store';

const authStore = useAuth.getState();
console.log(authStore.user);
console.log(authStore.isLoading);

// Subscribe to store changes
const unsubscribe = useAuth.subscribe(
  (state) => state.user,
  (user) => {
    console.log('User changed:', user);
  }
);

// Shallow comparison for better performance
import { useShallow } from 'zustand/react/shallow';

const { jobs, loading } = useJobs(
  useShallow((state) => ({
    jobs: state.jobs,
    loading: state.loading
  }))
);
```

## UI Patterns

### Loading State

```typescript
const { jobs, loadingJobs } = useJobs();

if (loadingJobs && !jobs.length) {
  return <ActivityIndicator size="large" />;
}

return <FlatList data={jobs} />;
```

### Error Handling

```typescript
const { jobs, loadingJobs, error } = useJobs();

if (error) {
  return (
    <View>
      <Text>Error: {error.message}</Text>
      <Button
        title="Retry"
        onPress={() => loadJobs()}
      />
    </View>
  );
}
```

### Empty State

```typescript
<FlatList
  data={jobs}
  renderItem={({ item }) => <JobCard job={item} />}
  ListEmptyComponent={
    <Text>No jobs found</Text>
  }
/>
```

### Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);
const { loadJobs } = useJobs();

const onRefresh = async () => {
  setRefreshing(true);
  await loadJobs();
  setRefreshing(false);
};

<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  }
/>
```

### Pagination

```typescript
const { jobs, hasMore, loadMoreJobs } = useJobs();

const onEndReached = () => {
  if (hasMore && !loading) {
    loadMoreJobs();
  }
};

<FlatList
  data={jobs}
  onEndReached={onEndReached}
  onEndReachedThreshold={0.7}
/>
```

## Hooks Cheatsheet

### useAuth

```typescript
{
  user: User | null,
  isLoading: boolean,
  error: Error | null,
  loginStudent: (email: string, password: string) => Promise<void>,
  loginAdmin: (email: string, password: string) => Promise<void>,
  logout: () => Promise<void>,
  setUser: (user: Partial<User>) => Promise<void>,
  loadAuthState: () => Promise<void>,
  updateProfile: (data: ProfileData) => Promise<void>,
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>,
}
```

### useJobs

```typescript
{
  jobs: Job[],
  applications: Application[],
  savedJobs: Job[],
  loadingJobs: boolean,
  loadingApplications: boolean,
  error: Error | null,
  
  loadJobs: () => void,
  searchJobs: (query: string) => Promise<void>,
  filterJobs: (filters: JobFilters) => Promise<void>,
  applyForJob: (jobId: string) => Promise<Application>,
  loadApplicationStatus: (jobId: string) => Promise<ApplicationStatus>,
  subscribeToApplications: (userId: string) => () => void,
  saveJob: (jobId: string) => Promise<void>,
  unsaveJob: (jobId: string) => Promise<void>,
}
```

### useMessaging

```typescript
{
  conversations: Conversation[],
  messages: Message[],
  loadingConversations: boolean,
  loadingMessages: boolean,
  error: Error | null,
  
  loadConversations: (userId: string) => () => void,
  loadMessages: (conversationId: string) => () => void,
  sendMessage: (conversationId: string, content: string) => Promise<Message>,
  markAsRead: (conversationId: string) => Promise<void>,
  createConversation: (participantId: string) => Promise<string>,
}
```

### useSettings

```typescript
{
  pushNotifications: boolean,
  emailNotifications: boolean,
  jobAlerts: boolean,
  darkMode: boolean,
  language: string,
  biometricAuth: boolean,
  appVersion: string,
  
  setPushNotifications: (value: boolean) => void,
  setEmailNotifications: (value: boolean) => void,
  setJobAlerts: (value: boolean) => void,
  setDarkMode: (value: boolean) => void,
  setLanguage: (value: string) => void,
  setBiometricAuth: (value: boolean) => void,
  
  loadSettings: (userId?: string) => Promise<void>,
  saveSettings: (userId?: string) => Promise<void>,
  clearCache: () => Promise<void>,
}
```

## Firebase Collections & Fields

### users
```
- id: string
- email: string
- name: string
- role: 'student' | 'admin' | 'company'
- profile: ProfileData
- createdAt: timestamp
- updatedAt: timestamp
```

### jobs
```
- id: string
- title: string
- company: string
- description: string
- location: string
- salary?: number
- postedBy: string (admin/company id)
- status: 'active' | 'closed'
- createdAt: timestamp
- updatedAt: timestamp
```

### job_applications
```
- id: string
- jobId: string
- studentId: string
- status: 'pending' | 'accepted' | 'rejected'
- appliedAt: timestamp
- updatedAt: timestamp
```

### conversations
```
- id: string
- participants: string[]
- lastMessage: string
- lastMessageAt: timestamp
- createdAt: timestamp
```

### messages
```
- id: string
- conversationId: string
- senderId: string
- content: string
- read: boolean
- createdAt: timestamp
```

### settings
```
- userId: string (document id)
- pushNotifications: boolean
- emailNotifications: boolean
- jobAlerts: boolean
- darkMode: boolean
- language: string
- biometricAuth: boolean
- updatedAt: timestamp
```

## Debugging Commands

```typescript
// Check store state
import { useAuth } from '@/hooks/auth-store';
const state = useAuth.getState();
console.log(state);

// Export logs
import { logger } from '@/utils/logger';
console.log(logger.export());

// Get metrics
import { metrics } from '@/utils/metrics';
console.log(metrics.getStats());

// Force refresh
const { loadJobs } = useJobs();
await loadJobs();

// Check AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
const data = await AsyncStorage.getAllKeys();
console.log(data);

// Clear all cache
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## Common Issues & Fixed

| Issue | Solution |
|-------|----------|
| Data not updating | Check Firebase rules, verify listener is active |
| Memory leak warning | Unsubscribe listeners in useEffect cleanup |
| No offline data | Ensure AsyncStorage cache is populated |
| Duplicate items | Use unique key extractor in FlatList |
| Slow performance | Paginate data, optimize queries, memoize |
| App crashes on logout | Clear all listeners on logout |
| Settings not persisting | Call saveSettings() after updates |
| Firestore over quota | Check query count in Firebase console |

## Performance Checklist

- [ ] Listeners unsubscribed on unmount
- [ ] Large lists paginated (≤50 items per page)
- [ ] Expensive computations memoized
- [ ] Search query debounced
- [ ] Firebase rules optimized
- [ ] AsyncStorage cache populated
- [ ] Active listeners count < 10
- [ ] App load time < 2 seconds
- [ ] Real-time updates < 2 seconds latency

## Troubleshooting Flow

1. **App won't load**
   - [ ] Check Firebase connection
   - [ ] Verify Firebase rules
   - [ ] Check AsyncStorage has data

2. **Data not updating**
   - [ ] Verify listener is subscribed
   - [ ] Check Firestore has data
   - [ ] Check browser console for errors
   - [ ] Try manual refresh

3. **Performance issue**
   - [ ] Use React DevTools Profiler
   - [ ] Check Firestore read/write count
   - [ ] Enable pagination
   - [ ] Memoize expensive computations

4. **Memory leak**
   - [ ] Check useEffect cleanup
   - [ ] Verify listeners unsubscribed
   - [ ] Check for circular dependencies
   - [ ] Monitor active listener count

## File Structure

```
hooks/
├── auth-store.ts           # Authentication + user data
├── jobs-store.ts           # Jobs + applications
├── messaging-store.ts      # Messages + conversations
└── settings-store.ts       # User settings + preferences

config/
└── firebase.ts             # Firebase initialization

utils/
├── logger.ts               # Logging utility
└── metrics.ts              # Performance metrics

__tests__/
├── stores/
├── components/
├── integration/
└── fixtures/
```

## Key Concepts

- **Real-Time Listeners**: Auto-update when Firebase data changes
- **AsyncStorage**: Local cache fallback for offline mode
- **Zustand Stores**: Global state management without providers
- **Merge Operations**: `{ merge: true }` prevents data loss
- **Unsubscribe**: Always cleanup listeners to prevent memory leaks
- **Timestamp-Based Conflicts**: Latest `updatedAt` wins
- **Atomic Updates**: Single source of truth in store

## Next Steps

1. Review [REALTIME_SYNC_SYSTEM.md](REALTIME_SYNC_SYSTEM.md) for architecture
2. Follow [REALTIME_SYNC_INTEGRATION_GUIDE.md](REALTIME_SYNC_INTEGRATION_GUIDE.md) for implementation
3. Use [REALTIME_SYNC_TROUBLESHOOTING.md](REALTIME_SYNC_TROUBLESHOOTING.md) for debugging
4. Check this guide for quick reference

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready ✅
