# Real-Time Sync Troubleshooting & Monitoring

Complete troubleshooting guide and monitoring strategies for the real-time sync system.

## Common Issues & Solutions

### Issue 1: Data Not Updating in Real-Time

**Symptoms**: UI doesn't reflect changes made in Firebase console or other devices

**Diagnosis**:
```typescript
// Add debug logging to your store
useEffect(() => {
  console.log('Current jobs:', jobs);
  console.log('Jobs listener active:', jobsListener !== null);
}, [jobs, jobsListener]);
```

**Solutions**:

1. **Check Firebase Security Rules**
```javascript
// app/firebase-rules.txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow reading jobs
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow reading applications
    match /job_applications/{appId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.studentId;
    }
  }
}
```

2. **Verify Listener is Active**
```typescript
const { jobs, loadJobs } = useJobs();

useEffect(() => {
  console.log('Loading jobs...');
  const unsubscribe = loadJobs();
  
  // Verify listener is returned
  if (!unsubscribe) {
    console.error('❌ Listener not subscribed!');
  } else {
    console.log('✅ Listener subscribed');
  }
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
      console.log('Listener unsubscribed');
    }
  };
}, []);
```

3. **Check Firestore Connection**
```typescript
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Test connection
const testConnection = async () => {
  try {
    const testRef = doc(db, 'test', 'connection');
    await getDoc(testRef);
    console.log('✅ Connected to Firestore');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
  }
};
```

4. **Inspect Store State**
```typescript
import { useShallow } from 'zustand/react/shallow';

const { jobs, loading, error } = useJobs(
  useShallow((state) => ({
    jobs: state.jobs,
    loading: state.loading,
    error: state.error,
  }))
);

useEffect(() => {
  console.log('Store state:', { jobs: jobs.length, loading, error });
}, [jobs, loading, error]);
```

---

### Issue 2: Memory Leaks from Unsubscribed Listeners

**Symptoms**: App slows down over time, warnings about memory

**Diagnosis**:
```typescript
// Check if listeners are cleaned up
import { StrictMode } from 'react';

// In your root layout, StrictMode will unmount/remount components
// to detect cleanup issues
<StrictMode>
  <App />
</StrictMode>
```

**Solutions**:

1. **Always Cleanup Listeners**
```typescript
useEffect(() => {
  const unsubscribe = loadJobs();
  
  // ✅ Good - cleanup function
  return () => {
    unsubscribe?.();
  };
  
  // ❌ Bad - no cleanup
  // loadJobs(); // Missing return cleanup
}, []);
```

2. **Multiple Listeners Pattern**
```typescript
useEffect(() => {
  if (!user?.id) return;

  // Subscribe to multiple listeners
  const unsubscribers: Array<() => void> = [];

  // Listener 1
  unsubscribers.push(subscribeToJobs());

  // Listener 2
  unsubscribers.push(subscribeToApplications(user.id));

  // Listener 3
  unsubscribers.push(subscribeToMessages(user.id));

  // Cleanup all listeners
  return () => {
    unsubscribers.forEach(unsub => unsub?.());
  };
}, [user?.id]);
```

3. **Monitor Active Listeners**
```typescript
let activeListenerCount = 0;

// In your store
const subscribe = () => {
  activeListenerCount++;
  console.log('Listeners active:', activeListenerCount);
  
  return () => {
    activeListenerCount--;
    console.log('Listeners active:', activeListenerCount);
  };
};
```

---

### Issue 3: Offline Data Not Showing

**Symptoms**: When network disconnected, AsyncStorage fallback doesn't work

**Diagnosis**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugAsyncStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('Available keys:', keys);
  
  const data = await AsyncStorage.multiGet(keys);
  console.log('AsyncStorage data:', data);
};
```

**Solutions**:

1. **Ensure Data is Cached**
```typescript
const saveSettings = async (userId?: string) => {
  const state = get();
  
  // Save to Firebase
  if (userId) {
    try {
      await setDoc(doc(db, 'settings', userId), state);
      console.log('✅ Saved to Firebase');
    } catch (error) {
      console.log('ℹ️ Firebase save failed');
    }
  }

  // Always save to AsyncStorage as fallback
  await AsyncStorage.setItem('app_settings', JSON.stringify(state));
  console.log('✅ Saved to AsyncStorage');
};
```

2. **Load Cached Data on Connection Loss**
```typescript
const loadSettings = async (userId?: string) => {
  try {
    // Try Firebase first
    if (userId) {
      const settings = await getDoc(doc(db, 'settings', userId));
      if (settings.exists()) {
        set(settings.data());
        return;
      }
    }
  } catch (error) {
    console.log('Firebase unavailable, using cache');
  }

  // Fallback to cache
  const cached = await AsyncStorage.getItem('app_settings');
  if (cached) {
    set(JSON.parse(cached));
  }
};
```

3. **Test Offline Mode**
```typescript
// In browser DevTools or React Native debugger
// Simulate offline by:
// 1. Disable network
// 2. Or use network throttling
// 3. Or manually trigger error in listener

// Verify app still shows cached data
```

---

### Issue 4: Duplicate Data or Race Conditions

**Symptoms**: Jobs appear twice, conflicting updates, data inconsistency

**Diagnosis**:
```typescript
// Log all data mutations
const debugJobs = (action: string, jobs: Job[]) => {
  console.log(`[${action}] Jobs count:`, jobs.length);
  console.log('Job IDs:', jobs.map(j => j.id).join(', '));
};

useEffect(() => {
  debugJobs('useEffect', jobs);
}, [jobs]);
```

**Solutions**:

1. **Use Unique Keys**
```typescript
<FlatList
  data={jobs}
  // ✅ Good - unique and stable
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <JobCard job={item} />}
/>

// ❌ Bad - index changes when data reorders
// keyExtractor={(item, index) => index.toString()}
```

2. **Deduplicate Data**
```typescript
const deduplicateJobs = (jobs: Job[]) => {
  const seen = new Set<string>();
  return jobs.filter(job => {
    if (seen.has(job.id)) {
      console.warn('Duplicate job:', job.id);
      return false;
    }
    seen.add(job.id);
    return true;
  });
};

// Use in store
const loadJobs = () => {
  onSnapshot(query(...), (snapshot) => {
    const dedupedJobs = deduplicateJobs(loadedJobs);
    set({ jobs: dedupedJobs });
  });
};
```

3. **Merge Strategies**
```typescript
// When merging local and remote data
const mergeData = (local: Job[], remote: Job[]) => {
  const map = new Map<string, Job>();
  
  // Add remote data (source of truth)
  remote.forEach(job => {
    map.set(job.id, job);
  });
  
  // Keep local data only if not in remote
  local.forEach(job => {
    if (!map.has(job.id)) {
      map.set(job.id, job);
    }
  });
  
  return Array.from(map.values());
};
```

---

### Issue 5: Performance Degradation

**Symptoms**: App becomes slow with large datasets, laggy UI

**Analysis Tools**:
```typescript
// Monitor render performance
import { Profiler } from 'react';

const onRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="jobs-list" onRender={onRenderCallback}>
  <JobsList />
</Profiler>
```

**Solutions**:

1. **Paginate Large Datasets**
```typescript
const PAGE_SIZE = 20;

export const useJobs = create<JobsState>((set) => ({
  jobs: [],
  pageSize: PAGE_SIZE,

  loadJobsPage: async (pageNumber: number) => {
    const startIdx = pageNumber * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;

    const q = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(endIdx)
    );

    const snapshot = await getDocs(q);
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).slice(startIdx);

    set({ jobs });
  }
}));
```

2. **Optimize Listener Queries**
```typescript
// ❌ Bad - fetching all data
const q = query(collection(db, 'jobs'));

// ✅ Good - filtered and limited
const q = query(
  collection(db, 'jobs'),
  where('status', '==', 'active'),
  where('salary', '>=', minSalary),
  orderBy('salary'),
  limit(50)
);
```

3. **Memoize Expensive Computations**
```typescript
import { useMemo } from 'react';

const JobsList = () => {
  const { jobs } = useJobs();

  // Expensive sorting/filtering - memoize it
  const processedJobs = useMemo(() => {
    return jobs
      .filter(job => job.status === 'active')
      .sort((a, b) => b.salary - a.salary);
  }, [jobs]);

  return <FlatList data={processedJobs} />;
};
```

4. **Limit Listener Subscriptions**
```typescript
// ❌ Bad - creating new listener on every render
const JobsScreen = () => {
  const { loadJobs } = useJobs();

  return (
    <View>
      {/* loadJobs called on every render! */}
      <Button onPress={loadJobs} />
    </View>
  );
};

// ✅ Good - listener managed in store
export const useJobs = create((set) => ({
  jobs: [],
  jobsListener: null,

  setupListener: () => {
    // One-time setup
    const unsubscribe = onSnapshot(...);
    set({ jobsListener: unsubscribe });
  }
}));
```

---

## Monitoring & Debugging Tools

### 1. Firebase Console Monitoring

```typescript
// Monitor Firestore usage
// https://console.firebase.google.com/project/rock-ai-prod/firestore

// Check:
// - Read/Write counts
// - Network bandwidth
// - Query performance
// - Storage size
```

### 2. React DevTools Profiler

```typescript
// Identify expensive renders
1. Open React DevTools
2. Go to Profiler tab
3. Record interactions
4. Check flame graph for slow components
5. Identify unnecessary re-renders
```

### 3. Network Monitor

```typescript
// Monitor real-time sync traffic
import { onSnapshot } from 'firebase/firestore';

let snapshotCount = 0;
let totalDataSize = 0;

const monitorSnapshots = (snapshot) => {
  snapshotCount++;
  const dataSize = JSON.stringify(snapshot.docs).length;
  totalDataSize += dataSize;

  console.log(`
    📊 Snapshot #${snapshotCount}
    📦 Data size: ${(dataSize / 1024).toFixed(2)}KB
    📈 Total: ${(totalDataSize / 1024 / 1024).toFixed(2)}MB
    ⏱️  Time: ${new Date().toLocaleTimeString()}
  `);
};
```

### 4. Custom Logger

```typescript
// services/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];

  log(level: LogLevel, category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // Keep last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    console.log(`[${level.toUpperCase()}] ${category}: ${message}`, data);
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Usage
logger.log('info', 'jobs-store', 'Jobs loaded', { count: 50 });
logger.log('error', 'auth-store', 'Login failed', { error: 'Invalid password' });
```

### 5. Performance Metrics

```typescript
// utils/metrics.ts
export const metrics = {
  listeners: {
    active: 0,
    total: 0,
  },
  firestore: {
    reads: 0,
    writes: 0,
    bytes: 0,
  },
  cache: {
    hits: 0,
    misses: 0,
  },

  recordListenerStart() {
    this.listeners.active++;
    this.listeners.total++;
  },

  recordListenerEnd() {
    this.listeners.active--;
  },

  recordRead() {
    this.firestore.reads++;
  },

  recordWrite() {
    this.firestore.writes++;
  },

  recordCacheHit() {
    this.cache.hits++;
  },

  recordCacheMiss() {
    this.cache.misses++;
  },

  getStats() {
    const total = this.cache.hits + this.cache.misses;
    const hitRate = total > 0 ? ((this.cache.hits / total) * 100).toFixed(2) : 0;

    return {
      listeners: this.listeners,
      firestore: this.firestore,
      cache: {
        ...this.cache,
        hitRate: `${hitRate}%`
      }
    };
  },

  reset() {
    this.listeners.total = 0;
    this.firestore.reads = 0;
    this.firestore.writes = 0;
    this.cache.hits = 0;
    this.cache.misses = 0;
  }
};
```

---

## Testing Real-Time Sync

### Unit Tests

```typescript
// __tests__/stores/jobs-store.test.ts
import { useJobs } from '@/hooks/jobs-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Jobs Store', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  test('should load jobs from cache when offline', async () => {
    const mockJobs = [
      { id: '1', title: 'Engineer', company: 'Tech' }
    ];

    await AsyncStorage.setItem('jobs_cache', JSON.stringify(mockJobs));

    const { jobs, loadJobs } = useJobs();
    await loadJobs();

    expect(jobs).toEqual(mockJobs);
  });

  test('should handle Firebase errors gracefully', async () => {
    const { loadJobs } = useJobs();

    // Mock Firebase error
    jest.mock('@/config/firebase', () => ({
      onSnapshot: jest.fn((query, success, error) => {
        error(new Error('Firestore error'));
      })
    }));

    await loadJobs();
    
    // Should fall back to AsyncStorage
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/real-time-sync.test.ts
describe('Real-Time Sync Integration', () => {
  test('should sync data across multiple listeners', async () => {
    // 1. Start listener on jobs
    // 2. Update job in Firestore
    // 3. Verify listener detects change
    // 4. Verify AsyncStorage updated
  });

  test('should merge conflicting updates', async () => {
    // 1. Multiple updates to same document
    // 2. Verify conflict resolution
    // 3. Verify consistency
  });
});
```

---

## Diagnostics Checklist

- [ ] Firebase connection is active
- [ ] All listeners are unsubscribed on unmount
- [ ] AsyncStorage contains cache data
- [ ] Firestore security rules allow access
- [ ] No duplicate data in lists
- [ ] Performance metrics are acceptable
- [ ] Offline mode works with cached data
- [ ] Error handling works as expected
- [ ] Memory usage is stable over time
- [ ] Real-time updates arriving within 1-2 seconds

## Quick Debug Commands

```typescript
// In your app or debugging console:

// 1. Check active listeners
import { metrics } from '@/utils/metrics';
console.log(metrics.getStats());

// 2. Export logs
import { logger } from '@/utils/logger';
console.log(logger.export());

// 3. Check AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getAllKeys().then(keys => {
  AsyncStorage.multiGet(keys).then(data => {
    console.log(data);
  });
});

// 4. Force refresh
const { loadJobs } = useJobs();
await loadJobs();

// 5. Clear cache
const { clearCache } = useSettings();
await clearCache();
```

That's it! Use this guide to troubleshoot and monitor your real-time sync system.
