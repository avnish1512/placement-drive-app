import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('admin@sgu.edu.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(email, password, 'admin');
    if (result.success) {
      router.replace('/admin-dashboard' as any);
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid admin credentials');
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
            <View style={styles.iconContainer}>
              <Shield size={48} color="#DC2626" />
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>Sanjay Ghodawat University</Text>
            <Text style={styles.description}>Placement Management System</Text>
          </View>

          {/* Demo Credentials */}
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Admin Credentials</Text>
            <Text style={styles.demoText}>Email: admin@sgu.edu.in</Text>
            <Text style={styles.demoText}>Password: admin123</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Admin email address"
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
                placeholder="Admin password"
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

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Admin Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>← Back to Student Login</Text>
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
    backgroundColor: '#FEF2F2',
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
  iconContainer: {
    width: isTablet ? 100 : isSmallScreen ? 64 : 80,
    height: isTablet ? 100 : isSmallScreen ? 64 : 80,
    borderRadius: isTablet ? 50 : isSmallScreen ? 32 : 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 24 : 16,
  },
  title: {
    fontSize: isTablet ? 36 : isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#7F1D1D',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  demoCard: {
    backgroundColor: '#FEE2E2',
    padding: isTablet ? 24 : 16,
    borderRadius: isTablet ? 16 : 12,
    marginBottom: isTablet ? 48 : 32,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  demoTitle: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: isTablet ? 12 : 8,
  },
  demoText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#B91C1C',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    borderColor: '#FECACA',
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
  loginButton: {
    backgroundColor: '#DC2626',
    paddingVertical: isTablet ? 20 : 16,
    borderRadius: isTablet ? 16 : 12,
    alignItems: 'center',
    marginTop: isTablet ? 12 : 8,
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
    alignItems: 'center',
  },
  backText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});