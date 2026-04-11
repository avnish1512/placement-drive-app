import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Search, Filter } from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';
import { useAuth } from '@/hooks/auth-store';
import JobCard from '@/components/JobCard';
import { Job } from '@/types/job';

export default function JobsScreen() {
  const { jobs, isLoading, getApplicationsForStudent, loadData } = useJobs();
  const { student } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'opportunities' | 'applications' | 'offers'>('opportunities');

  // Refresh jobs whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📋 Jobs screen focused - refreshing jobs data');
      loadData();
    }, [loadData])
  );

  // Get current student's applications (cleared per student login)
  const studentApplications = useMemo(() => {
    if (!student?.id) return [];
    return getApplicationsForStudent(student.id);
  }, [student?.id, getApplicationsForStudent]);

  // Filter jobs based on selected tab and search
  const filteredJobs = useMemo(() => {
    let baseJobs: Job[] = [];

    if (selectedTab === 'opportunities') {
      // Show jobs haven't applied to yet
      const appliedJobIds = studentApplications.map(app => app.jobId);
      baseJobs = jobs.filter(job => !appliedJobIds.includes(job.id));
    } else if (selectedTab === 'applications') {
      // Show jobs we applied to (exclude selected ones)
      const applicationJobIds = studentApplications
        .filter(app => app.status !== 'Selected')
        .map(app => app.jobId);
      baseJobs = jobs.filter(job => applicationJobIds.includes(job.id));
    } else if (selectedTab === 'offers') {
      // Show jobs where we got selected
      const selectedJobIds = studentApplications
        .filter(app => app.status === 'Selected')
        .map(app => app.jobId);
      baseJobs = jobs.filter(job => selectedJobIds.includes(job.id));
    }

    // Apply search filter
    return baseJobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, selectedTab, searchQuery, studentApplications]);

  const renderJob = ({ item }: { item: Job }) => <JobCard job={item} />;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'opportunities' && styles.activeTab]}
          onPress={() => setSelectedTab('opportunities')}
        >
          <Text style={[styles.tabText, selectedTab === 'opportunities' && styles.activeTabText]}>
            Opportunities ({jobs.length - studentApplications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'applications' && styles.activeTab]}
          onPress={() => setSelectedTab('applications')}
        >
          <Text style={[styles.tabText, selectedTab === 'applications' && styles.activeTabText]}>
            Applications ({studentApplications.filter(a => a.status !== 'Selected').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'offers' && styles.activeTab]}
          onPress={() => setSelectedTab('offers')}
        >
          <Text style={[styles.tabText, selectedTab === 'offers' && styles.activeTabText]}>
            Offers ({studentApplications.filter(a => a.status === 'Selected').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No opportunities found</Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'opportunities' ? 'You have applied to all available jobs' : 'You have no jobs in this category'}
            </Text>
          </View>
        }
        // Force refresh when student changes
        extraData={student?.id}
      />
    </SafeAreaView>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 16 : 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: isTablet ? 32 : isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    padding: isTablet ? 24 : 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    gap: isTablet ? 16 : 12,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isTablet ? 24 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  tab: {
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 12 : 8,
    marginRight: isTablet ? 32 : isSmallScreen ? 16 : 24,
    marginBottom: isSmallScreen ? 8 : 0,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: isTablet ? 12 : 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isTablet ? 80 : 64,
  },
  emptyText: {
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});