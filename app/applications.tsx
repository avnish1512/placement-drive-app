import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Calendar, MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RotateCw } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';

export default function ApplicationsScreen() {
  const { student } = useAuth();
  const { getApplicationsForStudent, jobs } = useJobs();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    // Simulate a refresh - the real-time listeners will update automatically
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Applications' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to view applications</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allApplications = getApplicationsForStudent(student.id);
  
  // Separate applications into two sections
  const jobApplications = allApplications.filter(app => 
    app.status !== 'Selected'
  );
  const offers = allApplications.filter(app => 
    app.status === 'Selected'
  );

  console.log('Student applications loaded:', {
    studentId: student.id,
    total: allApplications.length,
    jobApplications: jobApplications.length,
    offers: offers.length,
    statuses: allApplications.map(a => ({ jobId: a.jobId, status: a.status }))
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return '#F59E0B';
      case 'Under Review': return '#3B82F6';
      case 'Shortlisted': return '#8B5CF6';
      case 'Selected': return '#10B981';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied': return AlertCircle;
      case 'Under Review': return Clock;
      case 'Shortlisted': return CheckCircle;
      case 'Selected': return CheckCircle;
      case 'Rejected': return XCircle;
      default: return Clock;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'My Applications' }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Applications & Offers</Text>
          <Text style={styles.subtitle}>
            {jobApplications.length} applications • {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* OFFERS SECTION - Show First */}
        {offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Accepted Offers</Text>
            </View>
            <View style={styles.applicationsList}>
              {offers.map((application) => {
                const job = jobs.find(j => j.id === application.jobId);
                if (!job) return null;
                
                const StatusIcon = getStatusIcon(application.status);
                
                return (
                  <View key={application.id} style={styles.applicationCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{job.company}</Text>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
                        <StatusIcon size={12} color={getStatusColor(application.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                          {application.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{job.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <DollarSign size={14} color="#6B7280" />
                        <Text style={styles.detailText}>₹{job.ctc.min}L - ₹{job.ctc.max}L</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.detailText}>
                          {application.lastUpdated 
                            ? `Selected ${new Date(application.lastUpdated).toLocaleDateString()}`
                            : 'Status pending'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.deadline}>
                      <Text style={styles.deadlineText}>
                        Deadline: {new Date(job.registrationDeadline).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* JOB APPLICATIONS SECTION */}
        {jobApplications.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>Job Applications</Text>
            </View>
            <View style={styles.applicationsList}>
              {jobApplications.map((application) => {
                const job = jobs.find(j => j.id === application.jobId);
                if (!job) return null;
                
                const StatusIcon = getStatusIcon(application.status);
                
                return (
                  <View key={application.id} style={[
                    styles.applicationCard,
                    application.status === 'Rejected' && styles.rejectedCard
                  ]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{job.company}</Text>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
                        <StatusIcon size={12} color={getStatusColor(application.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                          {application.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{job.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <DollarSign size={14} color="#6B7280" />
                        <Text style={styles.detailText}>₹{job.ctc.min}L - ₹{job.ctc.max}L</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.detailText}>Applied {new Date(application.appliedDate).toLocaleDateString()}</Text>
                      </View>
                      {application.adminNotes && (
                        <View style={styles.detailRow}>
                          <AlertCircle size={14} color="#EF4444" />
                          <Text style={[styles.detailText, { color: '#EF4444', fontWeight: '500' }]}>
                            {application.adminNotes}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.deadline}>
                      <Text style={styles.deadlineText}>
                        Deadline: {new Date(job.registrationDeadline).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Job Applications Yet</Text>
            <Text style={styles.emptySubtitle}>Start applying to job opportunities to see them here</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  applicationsList: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rejectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '600',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  deadline: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deadlineText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
});