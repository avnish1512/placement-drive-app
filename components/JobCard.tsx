import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

import { Job } from '@/types/job';
import { router } from 'expo-router';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
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

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/job/${job.id}` as any)}
      testID={`job-card-${job.id}`}
    >
      <View style={styles.header}>
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
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
            <Text style={styles.postedDate}>{getDaysAgo(job.postedDate)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.eligibilityStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(job.eligibilityStatus) }]}>
            {job.eligibilityStatus}
          </Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        {job.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Job type</Text>
          <Text style={styles.detailValue}>{job.jobType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Industry</Text>
          <Text style={styles.detailValue}>{job.industry}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CTC</Text>
          <Text style={styles.detailValue}>{formatCTC(job.ctc.min, job.ctc.max)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{job.location}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.deadline}>
          Registrations closed on {new Date(job.registrationDeadline).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })} - {new Date(job.registrationDeadline).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </Text>
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => router.push(`/job/${job.id}` as any)}
        >
          <Text style={styles.viewDetailsText}>View details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 24 : 16,
    marginHorizontal: isTablet ? 24 : 16,
    marginVertical: isTablet ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'flex-start',
    marginBottom: isTablet ? 16 : 12,
  },
  companyInfo: {
    flexDirection: 'row',
    flex: isSmallScreen ? 0 : 1,
    width: isSmallScreen ? '100%' : 'auto',
    marginBottom: isSmallScreen ? 12 : 0,
  },
  logoContainer: {
    marginRight: isTablet ? 16 : 12,
  },
  logo: {
    width: isTablet ? 64 : isSmallScreen ? 40 : 48,
    height: isTablet ? 64 : isSmallScreen ? 40 : 48,
    borderRadius: isTablet ? 12 : 8,
  },
  logoPlaceholder: {
    width: isTablet ? 64 : isSmallScreen ? 40 : 48,
    height: isTablet ? 64 : isSmallScreen ? 40 : 48,
    borderRadius: isTablet ? 12 : 8,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    flexShrink: 1,
  },
  company: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  postedDate: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 8 : 6,
    borderRadius: isTablet ? 20 : 16,
    alignSelf: isSmallScreen ? 'flex-start' : 'auto',
  },
  statusText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: isTablet ? 20 : 16,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 8 : 6,
    borderRadius: isTablet ? 20 : 16,
    marginRight: isTablet ? 12 : 8,
    marginBottom: isTablet ? 8 : 4,
  },
  skillText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#374151',
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: isTablet ? 20 : 16,
  },
  detailItem: {
    width: isSmallScreen ? '100%' : '50%',
    marginBottom: isTablet ? 16 : 12,
  },
  detailLabel: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#111827',
    fontWeight: '500',
  },
  footer: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    paddingTop: isTablet ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deadline: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#9CA3AF',
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? 8 : 0,
  },
  viewDetailsButton: {
    marginLeft: isSmallScreen ? 0 : 12,
  },
  viewDetailsText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#6366F1',
    fontWeight: '600',
  },
});