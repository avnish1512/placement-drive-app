import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Building2, DollarSign, Users, Calendar, Briefcase } from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

// Constants for UI options
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship'] as const;

// Input field component extracted outside to prevent re-renders
const InputField = React.memo(({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline={multiline}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={true}
      scrollEnabled={multiline}
      numberOfLines={multiline ? undefined : 1}
      returnKeyType={multiline ? 'default' : 'done'}
    />
  </View>
));

InputField.displayName = 'InputField';

export default function AdminPostJob() {
  const { addJob, loadData } = useJobs();
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    location: '',
    ctc: '',
    jobType: 'Full-time',
    requirements: '',
    description: '',
    applicationDeadline: '',
    driveDate: '',
    eligibilityCriteria: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = () => {
    const required = ['companyName', 'position', 'location', 'ctc', 'requirements', 'description', 'applicationDeadline'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData].trim()) {
        Alert.alert('Validation Error', `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Validate CTC parsing
      const ctcValue = parseInt(formData.ctc.replace(/[^0-9]/g, ''));
      if (isNaN(ctcValue) || ctcValue <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid CTC/Salary amount');
        setIsSubmitting(false);
        return;
      }

      console.log('🚀 Submitting job form...');
      console.log('📝 Job data:', formData);
      
      const result = await addJob({
        id: `job_${Date.now()}`,
        title: formData.position,
        company: formData.companyName,
        location: formData.location,
        ctc: {
          min: ctcValue,
          max: ctcValue
        },
        jobType: formData.jobType === 'Full-time' ? 'Full-Time' : formData.jobType === 'Part-time' ? 'Part-Time' : 'Internship',
        industry: 'Technology',
        requirements: formData.requirements.split(',').map(req => req.trim()).filter(req => req.length > 0),
        description: formData.description,
        skills: formData.requirements.split(',').map(req => req.trim()).filter(req => req.length > 0),
        eligibilityStatus: 'Eligible',
        registrationDeadline: formData.applicationDeadline,
        postedDate: new Date().toISOString(),
        isActive: true,
        driveDate: formData.driveDate && formData.driveDate.trim() ? formData.driveDate : undefined,
        eligibilityCriteria: formData.eligibilityCriteria && formData.eligibilityCriteria.trim() ? formData.eligibilityCriteria : undefined,
        contactEmail: formData.contactEmail && formData.contactEmail.trim() ? formData.contactEmail : undefined,
        contactPhone: formData.contactPhone && formData.contactPhone.trim() ? formData.contactPhone : undefined,
        companyLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.companyName)}&background=6366f1&color=fff&size=200`
      });

      if (result.success) {
        // Reset form
        setFormData({
          companyName: '',
          position: '',
          location: '',
          ctc: '',
          jobType: 'Full-time',
          requirements: '',
          description: '',
          applicationDeadline: '',
          driveDate: '',
          eligibilityCriteria: '',
          contactEmail: '',
          contactPhone: ''
        });
        
        // Refresh jobs data to ensure new job appears immediately
        console.log('📊 Refreshing jobs data...');
        await loadData();
        
        Alert.alert(
          'Success',
          'Job posted successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        console.error('❌ Job posting failed:', result.error);
        const errorMsg = result.error?.toLowerCase().includes('permission') 
          ? `❌ Permission Denied\n\n${result.error}\n\n📌 FIX: Update Firebase Firestore Rules.\n\nSee PERMISSION_FIX.md in project root for step-by-step instructions.`
          : result.error || 'Failed to post job';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `An unexpected error occurred:\n${message}\n\nCheck console for details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const JobTypeSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Job Type</Text>
      <View style={styles.jobTypeContainer}>
        {JOB_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.jobTypeButton, formData.jobType === type && styles.jobTypeButtonActive]}
            onPress={() => handleInputChange('jobType', type)}
          >
            <Text style={[styles.jobTypeText, formData.jobType === type && styles.jobTypeTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Post New Job',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827', fontWeight: 'bold' }
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Briefcase size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Create Job Posting</Text>
            <Text style={styles.headerSubtitle}>Fill in the details to post a new job opportunity</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Company Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Building2 size={20} color="#6366F1" />
                <Text style={styles.sectionTitle}>Company Information</Text>
              </View>
              
              <InputField
                label="Company Name *"
                value={formData.companyName}
                onChangeText={(text) => handleInputChange('companyName', text)}
                placeholder="e.g., TCS, Infosys, Wipro"
              />
              
              <InputField
                label="Position *"
                value={formData.position}
                onChangeText={(text) => handleInputChange('position', text)}
                placeholder="e.g., Software Engineer, Data Analyst"
              />
              
              <InputField
                label="Location *"
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="e.g., Pune, Bangalore, Mumbai"
              />
            </View>

            {/* Job Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <DollarSign size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Job Details</Text>
              </View>
              
              <InputField
                label="CTC/Salary *"
                value={formData.ctc}
                onChangeText={(text) => handleInputChange('ctc', text)}
                placeholder="e.g., ₹3.5 LPA, ₹25,000/month"
              />
              
              <JobTypeSelector />
              
              <InputField
                label="Requirements *"
                value={formData.requirements}
                onChangeText={(text) => handleInputChange('requirements', text)}
                placeholder="e.g., Java, Python, React (comma separated)"
                multiline
              />
              
              <InputField
                label="Job Description *"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Detailed job description, responsibilities, etc."
                multiline
              />
            </View>

            {/* Dates & Eligibility */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Dates & Eligibility</Text>
              </View>
              
              <InputField
                label="Application Deadline *"
                value={formData.applicationDeadline}
                onChangeText={(text) => handleInputChange('applicationDeadline', text)}
                placeholder="e.g., 2024-03-15"
              />
              
              <InputField
                label="Drive Date (Optional)"
                value={formData.driveDate}
                onChangeText={(text) => handleInputChange('driveDate', text)}
                placeholder="e.g., 2024-03-20"
              />
              
              <InputField
                label="Eligibility Criteria (Optional)"
                value={formData.eligibilityCriteria}
                onChangeText={(text) => handleInputChange('eligibilityCriteria', text)}
                placeholder="e.g., 60% in 10th, 12th, and graduation"
                multiline
              />
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={20} color="#EF4444" />
                <Text style={styles.sectionTitle}>Contact Information</Text>
              </View>
              
              <InputField
                label="Contact Email (Optional)"
                value={formData.contactEmail}
                onChangeText={(text) => handleInputChange('contactEmail', text)}
                placeholder="hr@company.com"
                keyboardType="email-address"
              />
              
              <InputField
                label="Contact Phone (Optional)"
                value={formData.contactPhone}
                onChangeText={(text) => handleInputChange('contactPhone', text)}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Posting Job...' : 'Post Job'}
            </Text>
          </TouchableOpacity>
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: isTablet ? 32 : 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? 0 : -16,
    marginTop: -16,
    paddingHorizontal: isTablet ? 32 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
  },
  headerIcon: {
    width: isTablet ? 64 : 48,
    height: isTablet ? 64 : 48,
    borderRadius: isTablet ? 32 : 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 16 : 0,
  },
  form: {
    gap: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: isTablet ? 16 : 12,
    fontSize: isTablet ? 16 : 14,
    color: '#111827',
    width: '100%',
  },
  multilineInput: {
    minHeight: isTablet ? 100 : 80,
    paddingTop: isTablet ? 16 : 12,
    maxHeight: 200,
  },
  jobTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  jobTypeButton: {
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobTypeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  jobTypeText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  jobTypeTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    paddingVertical: isTablet ? 20 : 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});