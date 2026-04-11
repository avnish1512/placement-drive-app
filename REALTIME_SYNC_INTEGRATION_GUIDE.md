# Real-Time Sync Integration Guide

Complete step-by-step guide to integrate real-time sync into your screens and components.

## Table of Contents

1. [Setup](#setup)
2. [Authentication Flow](#authentication-flow)
3. [Loading Data](#loading-data)
4. [Real-Time Updates](#real-time-updates)
5. [User Settings](#user-settings)
6. [Messaging](#messaging)
7. [Error Handling](#error-handling)
8. [Performance Tips](#performance-tips)

## Setup

### Step 1: Initialize Stores on App Launch

Update your root layout to load all data on startup:

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';
import { useSettings } from '@/hooks/settings-store';
import { useMessaging } from '@/hooks/messaging-store';

export default function RootLayout() {
  const { user, loadAuthState } = useAuth();
  const { loadJobs } = useJobs();
  const { loadSettings } = useSettings();
  const { loadConversations } = useMessaging();

  useEffect(() => {
    // Initialize all stores in sequence
    const initializeApp = async () => {
      // 1. First load auth state
      await loadAuthState();
      
      // 2. Then load user-specific data
      // (This will auto-trigger when user is loaded)
    };

    initializeApp();
  }, []);

  // Set up real-time listeners when user changes
  useEffect(() => {
    if (user?.id) {
      // Load user-specific data
      loadJobs();
      loadConversations(user.id);
      loadSettings(user.id);
    }
  }, [user?.id]);

  return (
    <Stack screenOptions={{...}}>
      {/* Your screens */}
    </Stack>
  );
}
```

## Authentication Flow

### Step 2: Login Screen with Real-Time Sync

```typescript
// app/login.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { useAuth } from '@/hooks/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginStudent, loginAdmin } = useAuth();

  const handleStudentLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      
      // This automatically:
      // 1. Authenticates with Firebase
      // 2. Loads user data from Firestore
      // 3. Syncs to AsyncStorage
      // 4. Triggers all real-time listeners
      await loginStudent(email, password);
      
      // Navigation happens automatically via auth state change
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      await loginAdmin(email, password);
    } catch (error) {
      Alert.alert('Admin login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity 
        onPress={handleStudentLogin}
        disabled={loading}
      >
        <Text>{loading ? 'Logging in...' : 'Student Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={handleAdminLogin}
        disabled={loading}
      >
        <Text>Admin Login</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Loading Data

### Step 3: Jobs Screen with Real-Time Updates

```typescript
// app/(tab)/jobs.tsx
import { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useJobs } from '@/hooks/jobs-store';
import { JobCard } from '@/components/JobCard';

export default function JobsScreen() {
  const {
    jobs,
    loadingJobs,
    loadJobs,
    filterJobs,
    searchJobs,
  } = useJobs();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Initial load
  useEffect(() => {
    loadJobs();
  }, []);

  // Handle search with real-time debouncing
  useEffect(() => {
    if (searchText.trim()) {
      searchJobs(searchText);
    } else {
      // Show all jobs if search cleared
      loadJobs();
    }
  }, [searchText]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleApply = async (jobId: string) => {
    try {
      const { applyForJob } = useJobs();
      await applyForJob(jobId);
      
      // Show success - data updates automatically via real-time listener
    } catch (error) {
      console.error('Application failed:', error);
    }
  };

  if (loadingJobs && !jobs.length) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search jobs..."
        value={searchText}
        onChangeText={setSearchText}
        style={{ padding: 10, borderBottomWidth: 1 }}
      />

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onApply={() => handleApply(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No jobs available
          </Text>
        }
      />
    </View>
  );
}
```

## Real-Time Updates

### Step 4: Applications Screen

```typescript
// app/applications.tsx
import { useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useJobs } from '@/hooks/jobs-store';
import { useAuth } from '@/hooks/auth-store';

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const {
    applications,
    loadingApplications,
    subscribeToApplications,
    loadApplicationStatus,
  } = useJobs();

  useEffect(() => {
    if (user?.id) {
      // Subscribe to real-time application updates
      const unsubscribe = subscribeToApplications(user.id);

      // Cleanup subscription on unmount
      return () => {
        unsubscribe?.();
      };
    }
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Applications</Text>
      
      {loadingApplications && applications.length === 0 ? (
        <Text>Loading applications...</Text>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.applicationCard}>
              <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              <Text style={styles.company}>{item.company}</Text>
              
              <View style={styles.statusRow}>
                <Text>Status:</Text>
                <Text
                  style={[
                    styles.status,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.appliedDate}>
                Applied: {new Date(item.appliedAt).toLocaleDateString()}
              </Text>

              {/* Auto-updates when Firebase changes */}
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.withdrawBtn}>
                  <Text>Withdraw Application</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text>You haven't applied to any jobs yet</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  company: {
    color: '#666',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  status: {
    fontWeight: 'bold',
  },
  appliedDate: {
    color: '#999',
    fontSize: 12,
  },
  withdrawBtn: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
```

## User Settings

### Step 5: Settings Screen with Real-Time Sync

```typescript
// app/settings.tsx
import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useSettings } from '@/hooks/settings-store';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const {
    pushNotifications,
    emailNotifications,
    jobAlerts,
    darkMode,
    language,
    biometricAuth,
    setPushNotifications,
    setEmailNotifications,
    setJobAlerts,
    setDarkMode,
    setLanguage,
    setBiometricAuth,
    loadSettings,
    clearCache,
  } = useSettings();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings when user changes
    if (user?.id) {
      loadSettings(user.id).then(() => setLoading(false));
    }
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Logout',
        onPress: logout,
      },
    ]);
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      Alert.alert('Cache Cleared', 'App cache has been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  if (loading) {
    return <Text>Loading settings...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <Text>Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
        </View>

        <View style={styles.settingRow}>
          <Text>Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
        </View>

        <View style={styles.settingRow}>
          <Text>Job Alerts</Text>
          <Switch
            value={jobAlerts}
            onValueChange={setJobAlerts}
          />
        </View>
      </View>

      {/* Display Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.settingRow}>
          <Text>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        <View style={styles.settingRow}>
          <Text>Language</Text>
          <Text>{language === 'en' ? 'English' : 'Other'}</Text>
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <View style={styles.settingRow}>
          <Text>Biometric Authentication</Text>
          <Switch
            value={biometricAuth}
            onValueChange={setBiometricAuth}
          />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleClearCache}
        >
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, styles.dangerText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dangerText: {
    color: '#fff',
  },
});
```

## Messaging

### Step 6: Messaging Screen with Real-Time Sync

```typescript
// app/(tab)/messages.tsx
import { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useMessaging } from '@/hooks/messaging-store';
import { useAuth } from '@/hooks/auth-store';

export default function MessagesScreen() {
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    loadConversations: subscribeConversations,
  } = useMessaging();

  useEffect(() => {
    if (user?.id) {
      // Real-time subscription to conversations
      const unsubscribe = subscribeConversations(user.id);
      
      return () => {
        unsubscribe?.();
      };
    }
  }, [user?.id]);

  const handleOpenConversation = (conversationId: string) => {
    // Navigate to conversation detail
    router.push(`/messages/${conversationId}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationCard}
            onPress={() => handleOpenConversation(item.id)}
          >
            <View>
              <Text style={styles.participantName}>
                {item.participantName}
              </Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No conversations yet
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  participantName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  lastMessage: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
});
```

## Error Handling

### Step 7: Implement Error Boundaries

```typescript
// components/ErrorBoundary.tsx
import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
          >
            <Text>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

## Performance Tips

### Tip 1: Unsubscribe from Listeners

```typescript
useEffect(() => {
  const unsubscribe = loadConversations(user.id);
  
  // Always cleanup on unmount
  return () => {
    unsubscribe?.();
  };
}, [user?.id]);
```

### Tip 2: Debounce Search

```typescript
import { useEffect, useState } from 'react';

export function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// In component:
const searchText = useDebounce(input, 300);

useEffect(() => {
  if (searchText) {
    searchJobs(searchText);
  }
}, [searchText]);
```

### Tip 3: Batch Updates

```typescript
const [jobs, setJobs] = useState([]);

// Avoid multiple small updates - batch them
const handleMultipleUpdates = async () => {
  const updates = await Promise.all([
    loadJobs(),
    loadApplications(),
    loadSavedJobs(),
  ]);

  // Single re-render from all updates
  setJobs(updates[0]);
};
```

### Tip 4: Use Memoization

```typescript
import { useMemo } from 'react';

export function JobsScreen() {
  const { jobs } = useJobs();

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [jobs]);

  // Prevents recalculating on every render
  return <FlatList data={sortedJobs} {...} />;
}
```

## Checklist

- [ ] Stores are initialized in root layout
- [ ] All listeners are unsubscribed on component unmount
- [ ] Error handling is implemented
- [ ] AsyncStorage fallback works
- [ ] Firebase rules allow access
- [ ] Real-time UI updates are working
- [ ] Network disconnection is handled
- [ ] Performance is acceptable

That's it! Your app is now fully integrated with real-time sync.
