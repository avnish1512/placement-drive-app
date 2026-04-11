import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { 
  Plus, 
  Users, 
  Briefcase, 
  FileText, 
  LogOut,
  Building2,
  Calendar,
  TrendingUp,
  Eye,
  Trash2,
  MessageSquare
} from 'lucide-react-native';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const { jobs, applications, deleteJob, loadData } = useJobs();
  
  // Refresh jobs whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📊 Admin Dashboard focused - refreshing jobs data');
      loadData();
    }, [loadData])
  );
  
  const totalApplications = applications.length;
  const uniqueCompanies = new Set(jobs.map(job => job.company)).size;
  
  const stats = {
    totalJobs: jobs.length,
    totalApplications: totalApplications,
    activeStudents: new Set(applications.map(app => app.studentId)).size,
    companiesRegistered: uniqueCompanies
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/unified-login' as any);
          }
        }
      ]
    );
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteJob(jobId);
            if (result.success) {
              Alert.alert('Success', 'Job deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete job');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCTC = (ctc: { min: number; max: number }) => {
    if (ctc.min === ctc.max) {
      return `₹${(ctc.min / 100000).toFixed(1)} LPA`;
    }
    return `₹${(ctc.min / 100000).toFixed(1)} - ${(ctc.max / 100000).toFixed(1)} LPA`;
  };

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: any;
    title: string;
    value: number;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const ActionButton = ({ icon: Icon, title, onPress, color }: {
    icon: any;
    title: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.adminName}>{admin?.name}</Text>
            <Text style={styles.universityName}>Sanjay Ghodawat University</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={Briefcase}
            title="Active Jobs"
            value={stats.totalJobs}
            color="#6366F1"
          />
          <StatCard
            icon={FileText}
            title="Applications"
            value={stats.totalApplications}
            color="#10B981"
          />
          <StatCard
            icon={Users}
            title="Active Students"
            value={stats.activeStudents}
            color="#F59E0B"
          />
          <StatCard
            icon={Building2}
            title="Companies"
            value={stats.companiesRegistered}
            color="#EF4444"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon={Plus}
              title="Post New Job"
              onPress={() => router.push('/admin-post-job' as any)}
              color="#6366F1"
            />
            <ActionButton
              icon={Users}
              title="Manage Students"
              onPress={() => router.push('/admin-manage-students' as any)}
              color="#10B981"
            />
            <ActionButton
              icon={Building2}
              title="Manage Companies"
              onPress={() => router.push('/admin-manage-companies' as any)}
              color="#F59E0B"
            />
            <ActionButton
              icon={FileText}
              title="View Applications"
              onPress={() => router.push('/admin-applications' as any)}
              color="#EF4444"
            />
            <ActionButton
              icon={MessageSquare}
              title="Student Queries"
              onPress={() => router.push('/admin-messaging' as any)}
              color="#EC4899"
            />
            <ActionButton
              icon={Calendar}
              title="Schedule Drives"
              onPress={() => Alert.alert('Coming Soon', 'Drive scheduling feature will be available soon!')}
              color="#8B5CF6"
            />
            <ActionButton
              icon={TrendingUp}
              title="Analytics"
              onPress={() => Alert.alert('Coming Soon', 'Analytics feature will be available soon!')}
              color="#06B6D4"
            />
          </View>
        </View>

        {/* Posted Jobs Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posted Jobs ({jobs.length})</Text>
            <TouchableOpacity 
              style={styles.addJobButton}
              onPress={() => router.push('/admin-post-job' as any)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addJobButtonText}>Add Job</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.jobsContainer}>
            {jobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No jobs posted yet</Text>
                <Text style={styles.emptyStateDescription}>Start by posting your first job opportunity</Text>
              </View>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobCompany}>{job.company}</Text>
                      <Text style={styles.jobLocation}>{job.location}</Text>
                    </View>
                    <View style={styles.jobActions}>
                      <TouchableOpacity 
                        style={[styles.actionButtonSmall, styles.viewButton]}
                        onPress={() => router.push(`/job/${job.id}` as any)}
                      >
                        <Eye size={14} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButtonSmall, styles.deleteButton]}
                        onPress={() => handleDeleteJob(job.id, job.title)}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailItem}>
                      <Text style={styles.jobDetailLabel}>CTC:</Text>
                      <Text style={styles.jobDetailValue}>{formatCTC(job.ctc)}</Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <Text style={styles.jobDetailLabel}>Type:</Text>
                      <Text style={styles.jobDetailValue}>{job.jobType}</Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <Text style={styles.jobDetailLabel}>Posted:</Text>
                      <Text style={styles.jobDetailValue}>{formatDate(job.postedDate)}</Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <Text style={styles.jobDetailLabel}>Status:</Text>
                      <View style={[styles.statusBadge, job.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={[styles.statusText, job.isActive ? styles.activeText : styles.inactiveText]}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.jobApplications}>
                    <Text style={styles.applicationsCount}>
                      {applications.filter(app => app.jobId === job.id).length} Applications
                    </Text>
                  </View>
                </View>
              ))
            )}
            
            {jobs.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => Alert.alert('Coming Soon', 'Full job management interface will be available soon!')}
              >
                <Text style={styles.viewAllButtonText}>View All Jobs ({jobs.length})</Text>
              </TouchableOpacity>
            )}
          </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  universityName: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addJobButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  jobsContainer: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 2,
  },
  jobLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: '#EEF2FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  jobDetailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#065F46',
  },
  inactiveText: {
    color: '#991B1B',
  },
  jobApplications: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applicationsCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
});