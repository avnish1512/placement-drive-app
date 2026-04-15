import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react-native';
import { auth, db } from '@/config/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/auth-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function AdminCreateStudent() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const validate = () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter the student\'s full name'); return false; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address'); return false;
    }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return false; }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      // Save the admin credentials before creating student
      // (Firebase will auto-sign-in as the new student)
      const ADMIN_EMAIL = 'admin@sgu.edu.in';
      const ADMIN_PASSWORD = 'admin123';

      // Create Firebase Auth account for student
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const newUid = credential.user.uid;
      await updateProfile(credential.user, { displayName: name.trim() });

      // Write student Firestore doc BEFORE signing back in as admin
      await setDoc(doc(db, 'students', newUid), {
        id: newUid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: '',
        course: '',
        year: '',
        cgpa: 0,
        prnNumber: '',
        enrollmentNo: '',
        skills: [],
        resume: '',
        address: '',
        profileCompleted: false,   // Forces profile-setup on first login
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      // ⚠️ Firebase auto-signed-in as student after createUserWithEmailAndPassword.
      // Sign back in as admin immediately so admin session is restored.
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);

      setCreated({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (error: any) {
      let message = 'Failed to create student account.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak (min 6 characters).';
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreated(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  // ── Success State ─────────────────────────────────────────
  if (created) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <CheckCircle size={52} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Account Created!</Text>
          <Text style={styles.successSubtitle}>
            Share these credentials with the student.{'\n'}They will be asked to fill their profile on first login.
          </Text>

          <View style={styles.credentialsCard}>
            <Text style={styles.credLabel}>Student Name</Text>
            <Text style={styles.credValue}>{created.name}</Text>
            <View style={styles.credDivider} />
            <Text style={styles.credLabel}>Email (Login ID)</Text>
            <Text style={styles.credValue}>{created.email}</Text>
            <View style={styles.credDivider} />
            <Text style={styles.credLabel}>Password</Text>
            <Text style={styles.credValue}>{created.password}</Text>
          </View>

          <TouchableOpacity style={styles.createAnotherBtn} onPress={handleCreateAnother}>
            <UserPlus size={18} color="#FFFFFF" />
            <Text style={styles.createAnotherText}>Create Another Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backDashBtn} onPress={() => router.back()}>
            <Text style={styles.backDashText}>← Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form State ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Student</Text>
          <Text style={styles.headerSub}>Create login credentials for a student</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              📋 Create a student account. The student will use these credentials to log in and complete their profile (name, PRN, course, etc.) on first login.
            </Text>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Student Full Name <Text style={styles.req}>*</Text></Text>
            <View style={styles.inputRow}>
              <User size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address (Login ID) <Text style={styles.req}>*</Text></Text>
            <View style={styles.inputRow}>
              <Mail size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="e.g. priya.sharma@college.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password <Text style={styles.req}>*</Text></Text>
            <Text style={styles.fieldHint}>Min 6 characters. Share this with the student.</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#9CA3AF" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. Student@2024"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Create Student Account</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 6, marginRight: 10 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  formContent: { padding: 20, paddingBottom: 60 },

  infoBanner: {
    backgroundColor: '#EEF2FF', borderRadius: 12,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  infoText: { fontSize: 13, color: '#4338CA', lineHeight: 20 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  req: { color: '#EF4444' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, gap: 10,
  },
  input: {
    flex: 1, fontSize: 15, color: '#1F2937',
  },
  eyeBtn: { padding: 4 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#6366F1', borderRadius: 14,
    paddingVertical: 16, marginTop: 8,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Success screen
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  successIconBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  successSubtitle: {
    fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  credentialsCard: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    marginBottom: 28,
  },
  credLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  credValue: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginTop: 4 },
  credDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  createAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, width: '100%', justifyContent: 'center', marginBottom: 12,
  },
  createAnotherText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  backDashBtn: { paddingVertical: 10 },
  backDashText: { color: '#6366F1', fontWeight: '600', fontSize: 15 },
});
