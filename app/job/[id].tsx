import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  Building, 
  Users,
  CheckCircle,
  ArrowLeft,
  Share2,
  Bookmark
} from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';
import { useAuth } from '@/hooks/auth-store';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJobById, applyToJob } = useJobs();
  const { student } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'Eligible' | 'Not Eligible' | 'Applied' | null>(null);

  const job = getJobById(id!);
  
  // Use local application status if set, otherwise use job status
  const currentEligibilityStatus = applicationStatus || job?.eligibilityStatus;

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCTC = (min: number, max: number) => {
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
      return `${(amount / 1000).toFixed(0)}K`;
    };
    
    return min === max 
      ? `INR ${formatAmount(min)}`
      : `INR ${formatAmount(min)} - ${formatAmount(max)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Eligible': return '#10B981';
      case 'Applied': return '#3B82F6';
      case 'Not Eligible': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleApply = async () => {
    console.log('Apply button clicked. Student:', student);
    
    if (!student) {
      Alert.alert('Login Required', 'Please login to apply for jobs');
      return;
    }

    if (!student.id) {
      Alert.alert('Error', 'Student ID is missing. Please logout and login again.');
      return;
    }

    if (currentEligibilityStatus === 'Applied') {
      Alert.alert('Already Applied', 'You have already applied for this position');
      return;
    }

    if (currentEligibilityStatus === 'Not Eligible') {
      Alert.alert('Not Eligible', 'You do not meet the eligibility criteria for this position');
      return;
    }

    setIsApplying(true);
    try {
      console.log('Calling applyToJob with:', { jobId: job!.id, studentId: student.id });
      
      // Prepare student data to include with application
      const result = await applyToJob(job!.id, student.id, {
        name: student.name,
        email: student.email,
        cgpa: student.cgpa,
        course: student.course,
        year: student.year,
        resume: student.resume
      });
      
      if (result.success) {
        console.log('Application submitted successfully');
        // Update local state immediately to show "Applied"
        setApplicationStatus('Applied');
        Alert.alert('Success', 'Your application has been submitted successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]);
      } else {
        console.log('Application failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Unexpected error during application:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Share2 size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Bookmark size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <View style={styles.logoContainer}>
              {job.companyLogo ? (
                <Image source={{ uri: job.companyLogo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>{job.company.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.companyName}>{job.company}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.locationText}>{job.location}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentEligibilityStatus || 'Eligible') + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(currentEligibilityStatus || 'Eligible') }]}>
              {currentEligibilityStatus || 'Eligible'}
            </Text>
          </View>
        </View>

        {/* Key Details */}
        <View style={styles.keyDetails}>
          <View style={styles.detailCard}>
            <DollarSign size={20} color="#10B981" />
            <Text style={styles.detailLabel}>CTC</Text>
            <Text style={styles.detailValue}>{formatCTC(job.ctc.min, job.ctc.max)}</Text>
          </View>
          <View style={styles.detailCard}>
            <Building size={20} color="#6366F1" />
            <Text style={styles.detailLabel}>Job Type</Text>
            <Text style={styles.detailValue}>{job.jobType}</Text>
          </View>
          <View style={styles.detailCard}>
            <Calendar size={20} color="#F59E0B" />
            <Text style={styles.detailLabel}>Deadline</Text>
            <Text style={styles.detailValue}>
              {new Date(job.registrationDeadline).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
        </View>

        {/* Skills Required */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills Required</Text>
          <View style={styles.skillsContainer}>
            {job.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirementItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}
        </View>

        {/* Company Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <View style={styles.companyDetails}>
            <View style={styles.companyDetailItem}>
              <Text style={styles.companyDetailLabel}>Industry</Text>
              <Text style={styles.companyDetailValue}>{job.industry}</Text>
            </View>
            <View style={styles.companyDetailItem}>
              <Text style={styles.companyDetailLabel}>Location</Text>
              <Text style={styles.companyDetailValue}>{job.location}</Text>
            </View>
          </View>
        </View>

        {/* Application Deadline */}
        <View style={styles.deadlineSection}>
          <Clock size={20} color="#F59E0B" />
          <View style={styles.deadlineInfo}>
            <Text style={styles.deadlineTitle}>Application Deadline</Text>
            <Text style={styles.deadlineText}>
              {new Date(job.registrationDeadline).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} at {new Date(job.registrationDeadline).toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applySection}>
        <TouchableOpacity 
          style={[
            styles.applyButton,
            currentEligibilityStatus === 'Applied' && styles.appliedButton,
            currentEligibilityStatus === 'Not Eligible' && styles.disabledButton
          ]}
          onPress={handleApply}
          disabled={isApplying || currentEligibilityStatus === 'Applied' || currentEligibilityStatus === 'Not Eligible'}
        >
          <Text style={[
            styles.applyButtonText,
            currentEligibilityStatus === 'Applied' && styles.appliedButtonText,
            currentEligibilityStatus === 'Not Eligible' && styles.disabledButtonText
          ]}>
            {isApplying ? 'Applying...' : 
             currentEligibilityStatus === 'Applied' ? 'Applied' :
             currentEligibilityStatus === 'Not Eligible' ? 'Not Eligible' :
             'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  companyHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  logoContainer: {
    marginRight: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  keyDetails: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  companyDetails: {
    gap: 16,
  },
  companyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  companyDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  deadlineSection: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineInfo: {
    marginLeft: 12,
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: '#A16207',
  },
  applySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applyButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
});