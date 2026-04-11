import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Search, FileText, User, Building2, Calendar, Filter, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

// Constants for UI options
const APPLICATION_STATUS_FILTERS = ['All', 'Applied', 'Shortlisted', 'Rejected'] as const;
const SORT_OPTIONS = [
  { key: 'date' as const, label: 'Date' },
  { key: 'name' as const, label: 'Name' },
  { key: 'company' as const, label: 'Company' }
] as const;
const APPLIED_STATUS = 'Applied' as const;

// Mock applications data (fallback only)
const mockApplications = [
  {
    id: '1',
    studentName: 'Rahul Sharma',
    studentEmail: 'rahul.sharma@sgu.edu.in',
    jobTitle: 'Software Engineer',
    companyName: 'TCS',
    appliedDate: '2024-02-15',
    status: 'Applied' as const,
    studentCourse: 'B.Tech Computer Science',
    studentYear: '4th Year',
    studentCGPA: '8.5'
  },
  {
    id: '2',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@sgu.edu.in',
    jobTitle: 'Data Analyst',
    companyName: 'Infosys',
    appliedDate: '2024-02-14',
    status: 'Shortlisted' as const,
    studentCourse: 'B.Tech Information Technology',
    studentYear: '3rd Year',
    studentCGPA: '9.2'
  },
  {
    id: '3',
    studentName: 'Amit Kumar',
    studentEmail: 'amit.kumar@sgu.edu.in',
    jobTitle: 'Frontend Developer',
    companyName: 'Wipro',
    appliedDate: '2024-02-13',
    status: 'Rejected' as const,
    studentCourse: 'B.Tech Computer Science',
    studentYear: '4th Year',
    studentCGPA: '7.8'
  },
  {
    id: '4',
    studentName: 'Sneha Desai',
    studentEmail: 'sneha.desai@sgu.edu.in',
    jobTitle: 'UI/UX Designer',
    companyName: 'Tech Mahindra',
    appliedDate: '2024-02-12',
    status: 'Applied' as const,
    studentCourse: 'B.Tech Electronics',
    studentYear: '2nd Year',
    studentCGPA: '8.9'
  },
  {
    id: '5',
    studentName: 'Vikram Singh',
    studentEmail: 'vikram.singh@sgu.edu.in',
    jobTitle: 'Software Engineer',
    companyName: 'HCL',
    appliedDate: '2024-02-11',
    status: 'Shortlisted' as const,
    studentCourse: 'B.Tech Computer Science',
    studentYear: '4th Year',
    studentCGPA: '8.1'
  }
];

export default function AdminApplications() {
  const { applications, jobs, updateApplicationStatus } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof APPLICATION_STATUS_FILTERS[number]>('All');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]['key']>('date');
  const [updating, setUpdating] = useState(false);

  // Map real applications to include job and student details
  const applicationsWithDetails = (applications && applications.length > 0 ? applications : []).map(app => {
    const job = jobs.find(j => j.id === app.jobId);
    
    return {
      id: app.id,
      jobId: app.jobId,
      studentId: app.studentId,
      studentName: app.studentName || `Student ${app.studentId.slice(0, 4)}`,
      studentEmail: app.studentEmail || `student${app.studentId}@sgu.edu.in`,
      jobTitle: job?.title || 'Job Removed',
      companyName: job?.company || 'Unknown Company',
      appliedDate: app.appliedDate,
      status: app.status as 'Applied' | 'Shortlisted' | 'Rejected' | 'Under Review' | 'Selected',
      studentCourse: app.studentCourse || 'B.Tech (Course Info Pending)',
      studentYear: app.studentYear || '3rd Year',
      studentCGPA: app.studentCGPA || 8.0,
      adminNotes: app.adminNotes || ''
    };
  });

  const filteredApplications = applicationsWithDetails
    .filter(app => {
      const matchesSearch = app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || 
                           (filterStatus === 'Applied' && app.status === 'Applied') ||
                           (filterStatus === 'Shortlisted' && app.status === 'Shortlisted') ||
                           (filterStatus === 'Rejected' && app.status === 'Rejected');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        default:
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
    });

  const handleStatusChange = async (applicationId: string, newStatus: 'Applied' | 'Shortlisted' | 'Rejected' | 'Under Review' | 'Selected') => {
    try {
      setUpdating(true);
      console.log('Attempting to update application:', applicationId, 'to status:', newStatus);
      const result = await updateApplicationStatus(applicationId, newStatus);
      setUpdating(false);
      
      if (result.success) {
        console.log('Application status updated successfully');
        Alert.alert('Success', `Application status updated to ${newStatus}`);
      } else {
        console.log('Failed to update application:', result.error);
        Alert.alert('Error', result.error || 'Failed to update status');
      }
    } catch (error) {
      setUpdating(false);
      console.error('Error in handleStatusChange:', error);
      Alert.alert('Error', 'An unexpected error occurred while updating status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock size={16} color="#F59E0B" />;
      case 'Shortlisted':
        return <CheckCircle size={16} color="#10B981" />;
      case 'Rejected':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return '#F59E0B';
      case 'Shortlisted':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const ApplicationCard = ({ 
    application 
  }: { 
    application: {
      id: string;
      jobId: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      jobTitle: string;
      companyName: string;
      appliedDate: string;
      status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Under Review' | 'Selected';
      studentCourse: string;
      studentYear: string;
      studentCGPA: number | string;
      adminNotes: string;
    }
  }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <Text style={styles.studentName}>{application.studentName}</Text>
          <Text style={styles.jobTitle}>{application.jobTitle} at {application.companyName}</Text>
          <View style={styles.applicationMeta}>
            <View style={styles.metaItem}>
              <User size={14} color="#6B7280" />
              <Text style={styles.metaText}>{application.studentCourse}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.metaText}>{new Date(application.appliedDate).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
          {getStatusIcon(application.status)}
          <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
            {application.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.studentDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{application.studentEmail}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CGPA:</Text>
          <Text style={styles.detailValue}>{application.studentCGPA}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Year:</Text>
          <Text style={styles.detailValue}>{application.studentYear}</Text>
        </View>
      </View>
      
      {(application.status === APPLIED_STATUS) && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shortlistButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Shortlisted')}
            disabled={updating}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.shortlistButtonText}>{updating ? 'Updating...' : 'Shortlist'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Rejected')}
            disabled={updating}
          >
            <XCircle size={16} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>{updating ? 'Updating...' : 'Reject'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const FilterButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity 
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const stats = {
    total: applicationsWithDetails.length,
    applied: applicationsWithDetails.filter(app => app.status === 'Applied').length,
    shortlisted: applicationsWithDetails.filter(app => app.status === 'Shortlisted').length,
    rejected: applicationsWithDetails.filter(app => app.status === 'Rejected').length
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Applications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827', fontWeight: 'bold' }
        }}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <FileText size={24} color="#6366F1" />
          </View>
          <Text style={styles.headerTitle}>Application Management</Text>
          <Text style={styles.headerSubtitle}>Review and manage student applications</Text>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search applications..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersLabel}>Filter by status:</Text>
            <View style={styles.filterButtons}>
              {APPLICATION_STATUS_FILTERS.map((status) => (
                <FilterButton
                  key={status}
                  title={status}
                  isActive={filterStatus === status}
                  onPress={() => setFilterStatus(status)}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {SORT_OPTIONS.map((sort) => (
                <FilterButton
                  key={sort.key}
                  title={sort.label}
                  isActive={sortBy === sort.key}
                  onPress={() => setSortBy(sort.key)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statTitle}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.applied}</Text>
            <Text style={styles.statTitle}>Applied</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.shortlisted}</Text>
            <Text style={styles.statTitle}>Shortlisted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.rejected}</Text>
            <Text style={styles.statTitle}>Rejected</Text>
          </View>
        </View>

        {/* Applications List */}
        <View style={styles.applicationsListContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredApplications.length} of {applicationsWithDetails.length} applications
          </Text>
          
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
          
          {filteredApplications.length === 0 && (
            <View style={styles.emptyState}>
              <FileText size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No applications found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your search or filter criteria</Text>
            </View>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: isTablet ? 32 : 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? 0 : -16,
    paddingHorizontal: isTablet ? 24 : 16,
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
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 24 : 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: isTablet ? 16 : 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    color: '#111827',
    marginLeft: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    marginTop: 8,
  },
  sortLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: isTablet ? 12 : 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  applicationsList: {
    flex: 1,
  },
  applicationsListContainer: {
    paddingBottom: 24,
  },
  resultsText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  applicationMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: isTablet ? 12 : 11,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
  },
  studentDetails: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: isTablet ? 14 : 12,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
    gap: 4,
  },
  shortlistButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  shortlistButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});