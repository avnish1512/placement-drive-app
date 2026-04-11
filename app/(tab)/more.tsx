import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell,
  Shield,
  Star,
  Share2,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { router } from 'expo-router';

export default function MoreScreen() {
  const { student, logout } = useAuth();

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      onPress: () => router.push('/profile' as any),
    },
    {
      id: 'applications',
      title: 'My Applications',
      icon: FileText,
      onPress: () => router.push('/applications' as any),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      onPress: () => router.push('/notifications' as any),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      onPress: () => router.push('/settings' as any),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: Shield,
      onPress: () => {},
    },
    {
      id: 'rate',
      title: 'Rate App',
      icon: Star,
      onPress: () => {},
    },
    {
      id: 'share',
      title: 'Share App',
      icon: Share2,
      onPress: () => {},
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      onPress: () => {},
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/unified-login' as any);
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>Please Login</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login' as any)}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.profileSection} onPress={() => router.push('/profile' as any)}>
          <View style={styles.profileAvatarPlaceholder}>
            <Text style={styles.profileAvatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{student.name}</Text>
            <Text style={styles.profileEmail}>{student.email}</Text>
            <Text style={styles.profileCourse}>{student.course} • {student.year}</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <IconComponent size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Campus Placement v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 16 : 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: isTablet ? 32 : isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isTablet ? 32 : 20,
  },
  loginTitle: {
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: isTablet ? 20 : 16,
  },
  loginButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 24 : 16,
    marginTop: isTablet ? 12 : 8,
    marginBottom: isTablet ? 12 : 8,
  },
  profileAvatar: {
    width: isTablet ? 80 : isSmallScreen ? 56 : 64,
    height: isTablet ? 80 : isSmallScreen ? 56 : 64,
    borderRadius: isTablet ? 40 : isSmallScreen ? 28 : 32,
    marginRight: isSmallScreen ? 0 : isTablet ? 20 : 16,
    marginBottom: isSmallScreen ? 12 : 0,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarPlaceholder: {
    width: isTablet ? 80 : isSmallScreen ? 56 : 64,
    height: isTablet ? 80 : isSmallScreen ? 56 : 64,
    borderRadius: isTablet ? 40 : isSmallScreen ? 28 : 32,
    marginRight: isSmallScreen ? 0 : isTablet ? 20 : 16,
    marginBottom: isSmallScreen ? 12 : 0,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: isTablet ? 32 : isSmallScreen ? 24 : 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileCourse: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#9CA3AF',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: isTablet ? 12 : 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: isTablet ? 40 : 32,
    height: isTablet ? 40 : 32,
    borderRadius: isTablet ? 20 : 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  menuItemText: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#111827',
    fontWeight: '500',
  },
  logoutSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: isTablet ? 12 : 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 20 : 16,
  },
  logoutText: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: isTablet ? 16 : 12,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: isTablet ? 24 : 16,
  },
  versionText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#9CA3AF',
  },
});