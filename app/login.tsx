import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('priya.sharma@student.com');
  const [password, setPassword] = useState('Priya@123');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(email, password, 'student');
    if (result.success) {
      router.replace('/(tab)');
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
      console.log('Login error details:', result);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your placement portal</Text>
          </View>

          {/* Demo Credentials */}
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>Email: priya.sharma@student.com</Text>
            <Text style={styles.demoText}>Password: Priya@123</Text>
            <Text style={styles.demoSubtext}>Or use any of the 5 student accounts</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signUpText}>Contact Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Login Link */}
          <View style={styles.adminSection}>
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={() => router.push('/admin-login' as any)}
            >
              <Text style={styles.adminButtonText}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 48 : isSmallScreen ? 16 : 24,
    justifyContent: 'center',
    maxWidth: isTablet ? 500 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: isTablet ? 48 : 32,
  },
  title: {
    fontSize: isTablet ? 36 : isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 20 : isSmallScreen ? 14 : 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  demoCard: {
    backgroundColor: '#EEF2FF',
    padding: isTablet ? 24 : 16,
    borderRadius: isTablet ? 16 : 12,
    marginBottom: isTablet ? 48 : 32,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  demoTitle: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: isTablet ? 12 : 8,
  },
  demoText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#4F46E5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  demoSubtext: {
    fontSize: isTablet ? 12 : isSmallScreen ? 9 : 11,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  form: {
    marginBottom: isTablet ? 48 : 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 20 : 16,
    marginBottom: isTablet ? 20 : 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#111827',
    marginLeft: isTablet ? 16 : 12,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: isTablet ? 32 : 24,
  },
  forgotPasswordText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#6366F1',
    paddingVertical: isTablet ? 20 : 16,
    borderRadius: isTablet ? 16 : 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6B7280',
  },
  signUpText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  adminSection: {
    marginTop: isTablet ? 32 : 24,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 32 : 24,
    borderRadius: isTablet ? 12 : 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adminButtonText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});