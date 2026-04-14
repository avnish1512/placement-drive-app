import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Phone, MapPin, GraduationCap, AlertCircle, GraduationCap as CapIcon } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const COURSE_OPTIONS = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.Tech Electronics & Communication',
  'B.Tech Mechanical Engineering',
  'B.Tech Civil Engineering',
  'B.Tech Electrical Engineering',
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication',
  'MBA',
  'MCA',
  'M.Tech',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Passout'];

export default function ProfileSetupScreen() {
  const { student, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only collect fields the student must fill — name & email come from Firebase Auth
  const [phone, setPhone] = useState(student?.phone || '');
  const [course, setCourse] = useState(student?.course || '');
  const [year, setYear] = useState(student?.year || '');
  const [cgpa, setCgpa] = useState(student?.cgpa ? String(student.cgpa) : '');
  const [address, setAddress] = useState(student?.address || '');
  const [enrollmentNo, setEnrollmentNo] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[\d\s\+\-\(\)]{8,15}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number';
    if (!course) errs.course = 'Please select your course';
    if (!year) errs.year = 'Please select your year of study';
    if (!cgpa) errs.cgpa = 'CGPA is required';
    else {
      const val = parseFloat(cgpa);
      if (isNaN(val) || val < 0 || val > 10) errs.cgpa = 'CGPA must be between 0 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) {
      Alert.alert('Missing Info', 'Please fill all required fields before continuing.');
      return;
    }
    if (!student) return;

    setLoading(true);
    try {
      const updatedProfile = {
        ...student,
        phone: phone.trim(),
        course,
        year,
        cgpa: parseFloat(cgpa),
        address: address.trim(),
        enrollmentNo: enrollmentNo.trim(),
        profileCompleted: true,
      };
      await completeProfile(updatedProfile);
      // Navigate to the student dashboard
      router.replace('/(tab)');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <View style={styles.iconWrap}>
            <CapIcon size={32} color="#6366F1" />
          </View>
          <Text style={styles.welcomeText}>Welcome, {student.name}! 👋</Text>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Fill in your academic details to start applying for placements
          </Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            📧 Logged in as <Text style={styles.emailHighlight}>{student.email}</Text>
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Phone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputRow, errors.phone && styles.inputError]}>
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChangeText={v => { setPhone(v); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.phone && <ErrorMsg msg={errors.phone} />}
          </View>

          {/* Enrollment No (optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Enrollment Number <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, { marginLeft: 0 }]}
                placeholder="e.g. SGU2024CS001"
                value={enrollmentNo}
                onChangeText={setEnrollmentNo}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Course */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Course / Program <Text style={styles.req}>*</Text></Text>
            <View style={styles.optionsWrap}>
              {COURSE_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, course === c && styles.chipActive]}
                  onPress={() => { setCourse(c); if (errors.course) setErrors(p => ({ ...p, course: '' })); }}
                >
                  <Text style={[styles.chipText, course === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Also allow typing a custom course */}
            <View style={[styles.inputRow, { marginTop: 8 }, errors.course && styles.inputError]}>
              <GraduationCap size={18} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                placeholder="Or type your course..."
                value={course}
                onChangeText={v => { setCourse(v); if (errors.course) setErrors(p => ({ ...p, course: '' })); }}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.course && <ErrorMsg msg={errors.course} />}
          </View>

          {/* Year */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Year of Study <Text style={styles.req}>*</Text></Text>
            <View style={styles.yearRow}>
              {YEAR_OPTIONS.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearChip, year === y && styles.chipActive]}
                  onPress={() => { setYear(y); if (errors.year) setErrors(p => ({ ...p, year: '' })); }}
                >
                  <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.year && <ErrorMsg msg={errors.year} />}
          </View>

          {/* CGPA */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>CGPA <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputRow, errors.cgpa && styles.inputError]}>
              <TextInput
                style={[styles.textInput, { marginLeft: 0 }]}
                placeholder="e.g. 8.5 (out of 10)"
                value={cgpa}
                onChangeText={v => { setCgpa(v); if (errors.cgpa) setErrors(p => ({ ...p, cgpa: '' })); }}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.cgpa && <ErrorMsg msg={errors.cgpa} />}
          </View>

          {/* Address (optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address <Text style={styles.optional}>(optional)</Text></Text>
            <View style={[styles.inputRow, styles.multilineRow]}>
              <MapPin size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="City, State"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitBtnText}>🎓 Go to Dashboard</Text>
          }
        </TouchableOpacity>

        <Text style={styles.footer}>
          You can always update this information from your profile settings later.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <View style={styles.errRow}>
      <AlertCircle size={13} color="#EF4444" />
      <Text style={styles.errText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingHorizontal: isTablet ? 32 : 20, paddingVertical: 28, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerBlock: { alignItems: 'center', marginBottom: 24 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  title: { fontSize: isTablet ? 26 : 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  infoBanner: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoBannerText: { fontSize: 13, color: '#4F46E5' },
  emailHighlight: { fontWeight: '700' },

  form: { marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  req: { color: '#EF4444' },
  optional: { color: '#9CA3AF', fontWeight: '400', fontSize: 12 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: isTablet ? 14 : 12,
    gap: 8,
  },
  inputError: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  textInput: { flex: 1, fontSize: 14, color: '#111827' },

  multilineRow: { alignItems: 'flex-start', paddingVertical: 10 },
  multilineInput: { textAlignVertical: 'top', paddingTop: 2 },

  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 0 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },

  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  errText: { fontSize: 12, color: '#EF4444' },

  submitBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  footer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
