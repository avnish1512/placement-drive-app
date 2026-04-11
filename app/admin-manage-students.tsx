import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Search, Users, Mail, Phone, GraduationCap, MapPin, Calendar, Filter, MoreVertical } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

// Constants for UI options
const STUDENT_STATUS_FILTERS = ['All', 'Active', 'Inactive'] as const;
const STUDENT_SORT_OPTIONS = [
  { key: 'name' as const, label: 'Name' },
  { key: 'cgpa' as const, label: 'CGPA' },
  { key: 'applications' as const, label: 'Applications' }
] as const;

// Mock student data
const mockStudents = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@sgu.edu.in',
    phone: '+91 9876543210',
    course: 'B.Tech Computer Science',
    year: '4th Year',
    cgpa: '8.5',
    location: 'Kolhapur',
    registrationDate: '2024-01-15',
    status: 'Active',
    applications: 5
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.patel@sgu.edu.in',
    phone: '+91 9876543211',
    course: 'B.Tech Information Technology',
    year: '3rd Year',
    cgpa: '9.2',
    location: 'Pune',
    registrationDate: '2024-01-20',
    status: 'Active',
    applications: 3
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.kumar@sgu.edu.in',
    phone: '+91 9876543212',
    course: 'B.Tech Mechanical',
    year: '4th Year',
    cgpa: '7.8',
    location: 'Mumbai',
    registrationDate: '2024-01-10',
    status: 'Inactive',
    applications: 1
  },
  {
    id: '4',
    name: 'Sneha Desai',
    email: 'sneha.desai@sgu.edu.in',
    phone: '+91 9876543213',
    course: 'B.Tech Electronics',
    year: '2nd Year',
    cgpa: '8.9',
    location: 'Kolhapur',
    registrationDate: '2024-02-01',
    status: 'Active',
    applications: 2
  },
  {
    id: '5',
    name: 'Vikram Singh',
    email: 'vikram.singh@sgu.edu.in',
    phone: '+91 9876543214',
    course: 'B.Tech Civil',
    year: '4th Year',
    cgpa: '8.1',
    location: 'Bangalore',
    registrationDate: '2024-01-25',
    status: 'Active',
    applications: 4
  }
];

export default function AdminManageStudents() {
  const [students, setStudents] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof STUDENT_STATUS_FILTERS[number]>('All');
  const [sortBy, setSortBy] = useState<typeof STUDENT_SORT_OPTIONS[number]['key']>('name');

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || student.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'cgpa':
          return parseFloat(b.cgpa) - parseFloat(a.cgpa);
        case 'applications':
          return b.applications - a.applications;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleStudentAction = (studentId: string, action: 'view' | 'edit' | 'deactivate' | 'activate') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    switch (action) {
      case 'view':
        Alert.alert('Student Details', `Name: ${student.name}\nEmail: ${student.email}\nCourse: ${student.course}\nCGPA: ${student.cgpa}`);
        break;
      case 'edit':
        Alert.alert('Edit Student', 'Edit student functionality will be available soon!');
        break;
      case 'deactivate':
      case 'activate':
        const newStatus = action === 'activate' ? 'Active' : 'Inactive';
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
        Alert.alert('Success', `Student ${action === 'activate' ? 'activated' : 'deactivated'} successfully!`);
        break;
    }
  };

  const StudentCard = ({ student }: { student: typeof mockStudents[0] }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <View style={styles.studentMeta}>
            <View style={styles.metaItem}>
              <GraduationCap size={14} color="#6B7280" />
              <Text style={styles.metaText}>{student.course}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.metaText}>{student.location}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: student.status === 'Active' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{student.status}</Text>
        </View>
      </View>
      
      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.cgpa}</Text>
          <Text style={styles.statLabel}>CGPA</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.year}</Text>
          <Text style={styles.statLabel}>Year</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.applications}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleStudentAction(student.id, 'view')}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => handleStudentAction(student.id, student.status === 'Active' ? 'deactivate' : 'activate')}
        >
          <Text style={[styles.actionButtonText, styles.primaryActionText]}>
            {student.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Manage Students',
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
            <Users size={24} color="#10B981" />
          </View>
          <Text style={styles.headerTitle}>Student Management</Text>
          <Text style={styles.headerSubtitle}>Manage and monitor student registrations</Text>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersLabel}>Filter by status:</Text>
            <View style={styles.filterButtons}>
              {STUDENT_STATUS_FILTERS.map((status) => (
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
              {STUDENT_SORT_OPTIONS.map((sort) => (
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
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statTitle}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{students.filter(s => s.status === 'Active').length}</Text>
            <Text style={styles.statTitle}>Active Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{students.reduce((sum, s) => sum + s.applications, 0)}</Text>
            <Text style={styles.statTitle}>Total Applications</Text>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsListContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredStudents.length} of {students.length} students
          </Text>
          
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
          
          {filteredStudents.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No students found</Text>
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
    backgroundColor: '#D1FAE5',
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 20 : 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  studentsList: {
    flex: 1,
  },
  studentsListContainer: {
    paddingBottom: 24,
  },
  resultsText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  studentMeta: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: isTablet ? 12 : 10,
    color: '#6B7280',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryAction: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  actionButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    color: '#374151',
  },
  primaryActionText: {
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