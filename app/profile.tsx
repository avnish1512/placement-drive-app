import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Mail, Phone, MapPin, GraduationCap, Calendar, Edit3, Save, X, AlertCircle, Upload, Download, Trash2, FileText } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { ValidationRules, formatPhoneNumber } from '@/hooks/validation-utils';
import { useResumeUpload } from '@/hooks/resume-upload';

export default function ProfileScreen() {
  const { student, updateStudent } = useAuth();
  const { uploading, uploadProgress, uploadResume, deleteResume } = useResumeUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editedProfile, setEditedProfile] = useState(student || {
    id: '',
    name: '',
    email: '',
    phone: '',
    course: '',
    year: '',
    cgpa: 0,
    skills: [],
    address: ''
  });
  const [resumeError, setResumeError] = useState<string | null>(null);

  const validateProfile = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = ValidationRules.name(editedProfile.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || '';
    }

    // Validate email
    const emailValidation = ValidationRules.email(editedProfile.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || '';
    }

    // Validate phone
    if (editedProfile.phone) {
      const phoneValidation = ValidationRules.phone(editedProfile.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error || '';
      }
    }

    // Validate CGPA
    const cgpaValidation = ValidationRules.cgpa(editedProfile.cgpa);
    if (!cgpaValidation.valid) {
      newErrors.cgpa = cgpaValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editedProfile]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to view profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!validateProfile()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }
    try {
      await updateStudent(editedProfile);
      setIsEditing(false);
      setErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancel = () => {
    setEditedProfile(student);
    setIsEditing(false);
    setErrors({});
  };

  const handleDeleteResume = useCallback(async () => {
    if (!student) return;

    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteResume(student.id, student.resume || '');
            if (result.success) {
              updateStudent({
                ...student,
                resume: undefined
              });
              Alert.alert('Success', 'Resume deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete resume');
            }
          }
        }
      ]
    );
  }, [student, deleteResume, updateStudent]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              style={styles.headerButton}
            >
              {isEditing ? (
                <Save size={20} color="#6366F1" />
              ) : (
                <Edit3 size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Default Profile Photo */}
          <View style={styles.photoContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileAvatarText}>👤</Text>
            </View>
          </View>

          {isEditing ? (
            <>
              <TextInput
                style={[styles.nameInput, errors.name && styles.inputError]}
                value={editedProfile.name}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                placeholder="Full Name"
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.profileName}>{student.name}</Text>
          )}
          <Text style={styles.profileCourse}>{student.course} • {student.year}</Text>
          <View style={styles.cgpaContainer}>
            <Text style={styles.cgpaLabel}>CGPA</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.cgpaInput, errors.cgpa && styles.inputError]}
                  value={editedProfile.cgpa.toString()}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, cgpa: parseFloat(text) || 0 }))}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                />
                {errors.cgpa && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.cgpa}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.cgpaValue}>{student.cgpa}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <X size={16} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Mail size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.detailInput, errors.email && styles.inputError]}
                    value={editedProfile.email}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
                    placeholder="Email address"
                    keyboardType="email-address"
                  />
                  {errors.email && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.detailValue}>{student.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Phone size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.detailInput, errors.phone && styles.inputError]}
                    value={editedProfile.phone}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
                    placeholder="10-digit phone number"
                    keyboardType="phone-pad"
                  />
                  {errors.phone && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.detailValue}>{student.phone || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MapPin size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.address}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, address: text }))}
                  placeholder="Address"
                  multiline
                />
              ) : (
                <Text style={styles.detailValue}>{student.address || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <GraduationCap size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Course</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.course}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, course: text }))}
                  placeholder="Course name"
                />
              ) : (
                <Text style={styles.detailValue}>{student.course}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Year</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.year}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, year: text }))}
                  placeholder="Academic year"
                />
              ) : (
                <Text style={styles.detailValue}>{student.year}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {student.skills && student.skills.length > 0 ? (
              student.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noSkillsText}>No skills added yet</Text>
            )}
          </View>
        </View>

        {/* Resume Section */}
        <View style={styles.detailsSection}>
          <View style={styles.resumeHeader}>
            <Text style={styles.sectionTitle}>Resume</Text>
            {uploading && (
              <ActivityIndicator size="small" color="#6366F1" />
            )}
          </View>

          {resumeError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{resumeError}</Text>
            </View>
          )}

          {student.resume ? (
            <View style={styles.resumeCard}>
              <View style={styles.resumeContent}>
                <View style={styles.resumeIcon}>
                  <FileText size={24} color="#6366F1" />
                </View>
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeFileName}>Your Resume</Text>
                  <Text style={styles.resumeUploadedText}>
                    Uploaded: {student.resume ? new Date().toLocaleDateString() : 'Never'}
                  </Text>
                </View>
              </View>
              <View style={styles.resumeActions}>
                <TouchableOpacity
                  style={styles.resumeActionButton}
                  onPress={() => {
                    if (student.resume) {
                      // Open resume in browser/viewer
                      Alert.alert('Resume', 'Opening resume...');
                    }
                  }}
                  disabled={uploading}
                >
                  <Download size={18} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resumeActionButton, styles.deleteButton]}
                  onPress={handleDeleteResume}
                  disabled={uploading}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadButton}>
              <Upload size={20} color="#9CA3AF" />
              <Text style={styles.uploadButtonTextDisabled}>
                Resume upload coming soon
              </Text>
            </View>
          )}

          {student.resume && (
            <TouchableOpacity
              style={[styles.changeResumeButton, styles.disabledButton]}
              disabled={true}
            >
              <Upload size={16} color="#9CA3AF" />
              <Text style={styles.changeResumeTextDisabled}>
                Resume upload coming soon
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.resumeHint}>
            Max file size: 5MB • Format: PDF only
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
  headerButton: {
    padding: 8,
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
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photoActionOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    flexDirection: 'row',
    gap: 6,
  },
  photoOverlayButton: {
    backgroundColor: '#6366F1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cancelPhotoButton: {
    backgroundColor: '#EF4444',
  },
  deletePhotoButton: {
    backgroundColor: '#EF4444',
  },
  photoEditButtons: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    flexDirection: 'row',
    gap: 6,
  },
  photoEditSmallButton: {
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
    minWidth: 200,
  },
  profileCourse: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  cgpaContainer: {
    alignItems: 'center',
  },
  cgpaLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cgpaValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  cgpaInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
    minWidth: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  detailInput: {
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  noSkillsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputError: {
    borderBottomColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: -10,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  resumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resumeUploadedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6366F1',
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  uploadButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 48,
  },
  changeResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  changeResumeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  changeResumeTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  disabledButton: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  resumeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});