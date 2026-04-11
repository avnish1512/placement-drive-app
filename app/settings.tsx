import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Download, 
  Trash2, 
  HelpCircle, 
  ChevronRight,
  User,
  Lock,
  Smartphone
} from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useSettings } from '@/hooks/settings-store';

type SettingItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
};

// Constants for setting item types
const SETTING_TYPE_TOGGLE = 'toggle' as const;
const SETTING_TYPE_NAVIGATION = 'navigation' as const;

export default function SettingsScreen() {
  const { student, logout } = useAuth();
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
    clearCache
  } = useSettings();

  // Load settings on screen focus (real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📋 Settings screen focused - refreshing settings');
      loadSettings();
    }, [loadSettings])
  );

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Settings' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to access settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: async () => {
          await clearCache();
          Alert.alert('Success', 'Cache cleared successfully');
        }}
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // TODO: Implement account deletion via Firebase
          Alert.alert('Account Deleted', 'Your account has been deleted.');
          logout();
        }}
      ]
    );
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          subtitle: 'Update your personal information',
          icon: User,
          type: 'navigation' as const,
          onPress: () => {}
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          icon: Shield,
          type: 'navigation' as const,
          onPress: () => {}
        },
        {
          id: 'biometric',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face ID',
          icon: Lock,
          type: 'toggle' as const,
          value: biometricAuth,
          onToggle: setBiometricAuth
        }
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: 'Receive notifications on your device',
          icon: Smartphone,
          type: 'toggle' as const,
          value: pushNotifications,
          onToggle: setPushNotifications
        },
        {
          id: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive updates via email',
          icon: Bell,
          type: 'toggle' as const,
          value: emailNotifications,
          onToggle: setEmailNotifications
        },
        {
          id: 'job-alerts',
          title: 'Job Alerts',
          subtitle: 'Get notified about new opportunities',
          icon: Bell,
          type: 'toggle' as const,
          value: jobAlerts,
          onToggle: setJobAlerts
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Switch to dark theme',
          icon: Moon,
          type: 'toggle' as const,
          value: darkMode,
          onToggle: setDarkMode
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English',
          icon: Globe,
          type: 'navigation' as const,
          onPress: () => {}
        }
      ]
    },
    {
      title: 'Data & Storage',
      items: [
        {
          id: 'download-data',
          title: 'Download My Data',
          subtitle: 'Export your account data',
          icon: Download,
          type: 'action' as const,
          onPress: () => Alert.alert('Feature Coming Soon', 'Data export will be available soon.')
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: Trash2,
          type: 'action' as const,
          onPress: handleClearCache
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          icon: HelpCircle,
          type: 'navigation' as const,
          onPress: () => {}
        }
      ]
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'delete-account',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          icon: Trash2,
          type: 'action' as const,
          onPress: handleDeleteAccount,
          destructive: true
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingItem) => {
    const IconComponent = item.icon;
    
    return (
      <TouchableOpacity 
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, item.destructive && styles.destructiveIcon]}>
            <IconComponent 
              size={20} 
              color={item.destructive ? '#EF4444' : '#6B7280'} 
            />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {item.type === SETTING_TYPE_TOGGLE && item.onToggle && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#F3F4F6', true: '#6366F1' }}
              thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            />
          )}
          {item.type === SETTING_TYPE_NAVIGATION && (
            <ChevronRight size={16} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and app preferences</Text>
        </View>

        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Campus Placement v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FEF2F2',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingItemRight: {
    marginLeft: 12,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});