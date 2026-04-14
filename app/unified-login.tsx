import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function UnifiedLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Detect admin by email
    const isAdminEmail = email.trim().toLowerCase().includes('admin');
    const role: 'student' | 'admin' = isAdminEmail ? 'admin' : 'student';
    const result = await login(email, password, role);

    if (result.success) {
      if (role === 'admin') {
        router.replace('/admin-dashboard' as any);
      } else {
        // Check if student has completed their profile in Firestore
        try {
          const { getAuth } = await import('firebase/auth');
          const firebaseUser = getAuth().currentUser;
          if (firebaseUser) {
            const studentSnap = await getDoc(doc(db, 'students', firebaseUser.uid));
            if (studentSnap.exists() && studentSnap.data()?.profileCompleted === true) {
              router.replace('/(tab)');
            } else {
              router.replace('/profile-setup' as any);
            }
          } else {
            router.replace('/(tab)');
          }
        } catch {
          // Fallback — let _layout.tsx handle the redirect
          router.replace('/(tab)');
        }
      }
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://www.sanjayghodawatuniversity.ac.in/assets/images/logo.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Sanjay{'\n'}Ghodawat{'\n'}University</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome to SGU</Text>
            <Text style={styles.subtitle}>Placement Management System</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.signInButton, 
                isLoading && styles.signInButtonDisabled
              ]} 
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    flexDirection: 'column',
  },
  logo: {
    width: isTablet ? 80 : 64,
    height: isTablet ? 80 : 64,
    marginBottom: 12,
  },
  logoText: {
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: isTablet ? 28 : 28,
    fontWeight: '700',
    color: '#002B5B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: 16,
    fontSize: isTablet ? 16 : 15,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 48,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  signInButton: {
    backgroundColor: '#E2231A',
    width: '100%',
    paddingVertical: isTablet ? 18 : 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E2231A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLink: {
    alignItems: 'center',
    paddingTop: 16,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLinkHighlight: {
    color: '#6366F1',
    fontWeight: '600',
  },
});
