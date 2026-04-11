import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, FileText, Building2, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';
import { useNotifications } from '@/hooks/notifications-store';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { student } = useAuth();
  const { jobs, getApplicationsForStudent } = useJobs();
  const { unreadCount, initializeNotifications } = useNotifications();
  const [applicationCount, setApplicationCount] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      if (student?.id) {
        // Load real-time notifications
        initializeNotifications(student.id);
        // Get student applications count
        const apps = getApplicationsForStudent(student.id);
        setApplicationCount(apps.length);
      }
    }, [student?.id, initializeNotifications, getApplicationsForStudent])
  );

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>SGU Placement Portal</Text>
          <Text style={styles.loginSubtitle}>Please login to access opportunities</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://www.sanjayghodawatuniversity.ac.in/assets/images/logo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications' as any)}
        >
          <Bell size={24} color="#6B7280" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.universityName}>Sanjay Ghodawat University</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FileText size={28} color="#E2231A" />
            <Text style={styles.statValue}>{applicationCount}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Building2 size={28} color="#3B82F6" />
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={28} color="#8B5CF6" />
            <Text style={styles.statValue}>{student.cgpa || 0}</Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </View>
        </View>

        {/* Recent Updates Section - Real-time Jobs */}
        <View style={styles.updatesSection}>
          <Text style={styles.sectionTitle}>Recent Job Openings</Text>
          
          {jobs.length > 0 ? (
            jobs.map(job => (
              <TouchableOpacity 
                key={job.id}
                style={styles.updateCard}
                onPress={() => router.push(`/job/${job.id}` as any)}
              >
                <View style={styles.updateIcon}>
                  <Building2 size={24} color="#FFFFFF" />
                </View>
                <View style={styles.updateContent}>
                  <Text style={styles.updateTitle}>{job.title} at {job.company}</Text>
                  <Text style={styles.updateDescription}>{job.description || 'Position available for eligible candidates'}</Text>
                  <View style={styles.jobMetaInfo}>
                    <Text style={styles.location}>📍 {job.location}</Text>
                    <Text style={styles.salary}>💰 ₹{(job.ctc.min / 100000).toFixed(1)} - {(job.ctc.max / 100000).toFixed(1)} LPA</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Job Openings</Text>
              <Text style={styles.emptySubtitle}>Check back soon for new opportunities</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logo: {
    width: 32,
    height: 32,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E2231A',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  universityName: {
    fontSize: 14,
    color: '#E2231A',
    fontWeight: '600',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  updatesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  updateCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  updateIcon: {
    backgroundColor: '#E2231A',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  updateDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  jobMetaInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  location: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  salary: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
