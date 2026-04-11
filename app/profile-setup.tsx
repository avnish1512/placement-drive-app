import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Mail, Phone, MapPin, GraduationCap, Calendar, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { ValidationRules } from '@/hooks/validation-utils';

export default function ProfileSetupScreen() {
  const { student, completeProfile } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    course: student?.course || '',
    year: student?.year || '',
    cgpa: student?.cgpa?.toString() || '0',
    address: student?.address || '',
  });

  const validateProfile = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    } else {
      const nameValidation = ValidationRules.name(profileData.name);
      if (!nameValidation.valid) {
        newErrors.name = nameValidation.error || '';
      }
    }

    // Validate email
    const emailValidation = ValidationRules.email(profileData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || '';
    }

    // Validate phone
    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneValidation = ValidationRules.phone(profileData.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error || '';
      }
    }

    // Validate course
    if (!profileData.course.trim()) {
      newErrors.course = 'Course is required';
    }

    // Validate year
    if (!profileData.year.trim()) {
      newErrors.year = 'Year/Semester is required';
    }

    // Validate CGPA
    if (!profileData.cgpa) {
      newErrors.cgpa = 'CGPA is required';
    } else {
      const cgpaValidation = ValidationRules.cgpa(parseFloat(profileData.cgpa));
      if (!cgpaValidation.valid) {
        newErrors.cgpa = cgpaValidation.error || '';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileData]);

  const handleSave = async () => {
    if (!validateProfile()) {
      Alert.alert('Validation Error', 'Please fix all errors before continuing');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile: any = {
        ...student,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        course: profileData.course,
        year: profileData.year,
        cgpa: parseFloat(profileData.cgpa),
        address: profileData.address,
        profileCompleted: true,
      };

      await completeProfile(updatedProfile);
      Alert.alert(
        'Success',
        'Profile setup completed! You can now access the placement portal.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tab)'),
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Setup Profile', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Complete Your Profile', headerShown: true }} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Campus Placement Portal</Text>
          <Text style={styles.subtitle}>
            Please complete your profile to get started with job applications
          </Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            📋 This information will be used for job applications and communications
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={profileData.name}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, name: text }))
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.name && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Mail size={18} color="#9CA3AF" />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Email address"
                value={profileData.email}
                editable={false}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.email && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
            <Text style={styles.helperText}>Cannot be changed</Text>
          </View>

          {/* Phone */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="10-digit mobile number"
                value={profileData.phone}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.phone && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.phone}</Text>
              </View>
            )}
          </View>

          {/* Course */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Course/Program</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.course && styles.inputError]}>
              <GraduationCap size={18} color="#9CA3AF" />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="e.g., B.Tech CSE"
                value={profileData.course}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, course: text }))
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.course && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.course}</Text>
              </View>
            )}
          </View>

          {/* Year/Semester */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Academic Year</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.year && styles.inputError]}>
              <Calendar size={18} color="#9CA3AF" />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="e.g., 4th Year, Semester 7"
                value={profileData.year}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, year: text }))
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.year && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.year}</Text>
              </View>
            )}
          </View>

          {/* CGPA */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>CGPA</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputContainer, errors.cgpa && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="0.0 - 10.0"
                value={profileData.cgpa}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, cgpa: text }))
                }
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.cgpa && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errors.cgpa}</Text>
              </View>
            )}
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Address</Text>
            </View>
            <View style={[styles.inputContainer, styles.multilineInput]}>
              <MapPin size={18} color="#9CA3AF" style={styles.mapPinIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon, styles.multilineText]}
                placeholder="Your residential address"
                value={profileData.address}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, address: text }))
                }
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue to Portal</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            You can update this information and photo later in your profile settings
          </Text>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoBanner: {
    backgroundColor: '#ECE7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 24,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 18,
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  photoContainer: {
    marginBottom: 12,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  photoActionButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
  },
  photoActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cameraButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  galleryButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#EF4444',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  inputWithIcon: {
    marginLeft: 8,
  },
  multilineInput: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  mapPinIcon: {
    marginTop: 4,
  },
  multilineText: {
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
