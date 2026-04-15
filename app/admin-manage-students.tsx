import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Search, Users, GraduationCap, MapPin,
  RefreshCw, Mail, Phone, Trash2, UserX
} from 'lucide-react-native';
import { db } from '@/config/firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  year?: string;
  cgpa?: number | string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  profileCompleted?: boolean;
  enrollmentNo?: string;
  prnNumber?: string;
  skills?: string[];
};

const STATUS_FILTERS = ['All', 'Active', 'Inactive'] as const;
const SORT_OPTIONS = [
  { key: 'name' as const, label: 'Name' },
  { key: 'cgpa' as const, label: 'CGPA' },
  { key: 'createdAt' as const, label: 'Newest' },
] as const;

export default function AdminManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof STATUS_FILTERS[number]>('All');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]['key']>('name');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const snapshot = await getDocs(collection(db, 'students'));
      const fetched: Student[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Student, 'id'>),
      }));
      setStudents(fetched);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const handleToggleStatus = async (student: Student) => {
    const newStatus = !student.isActive;
    try {
      setUpdatingId(student.id);
      await updateDoc(doc(db, 'students', student.id), { isActive: newStatus });
      setStudents(prev =>
        prev.map(s => s.id === student.id ? { ...s, isActive: newStatus } : s)
      );
      Alert.alert(
        'Success',
        `${student.name} has been ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
    } catch (error) {
      console.error('Error updating student status:', error);
      Alert.alert('Error', 'Failed to update student status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    Alert.alert(
      '⚠️ Delete Student Permanently',
      `Permanently delete "${student.name}"?\n\n📧 ${student.email}\n\nThis removes all their data. They will not be able to log in.\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(student.id);
              // Delete the student Firestore document
              await deleteDoc(doc(db, 'students', student.id));
              // Remove from local state immediately
              setStudents(prev => prev.filter(s => s.id !== student.id));
              Alert.alert('✅ Deleted', `${student.name} has been permanently removed.`);
            } catch (error: any) {
              console.error('Error deleting student:', error);
              const msg = error?.code === 'permission-denied'
                ? 'Permission denied. Check Firestore rules allow admin to delete students.'
                : error?.message || 'Failed to delete student. Please try again.';
              Alert.alert('Error', msg);
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (student: Student) => {
    Alert.alert(
      student.name,
      [
        `📧 ${student.email}`,
        student.phone ? `📞 ${student.phone}` : null,
        student.course ? `🎓 ${student.course}` : null,
        student.year ? `📅 ${student.year}` : null,
        student.cgpa ? `⭐ CGPA: ${student.cgpa}` : null,
        student.enrollmentNo ? `🔢 Enrollment: ${student.enrollmentNo}` : null,
        student.address ? `📍 ${student.address}` : null,
        student.skills?.length ? `🛠️ Skills: ${student.skills.join(', ')}` : null,
        `✅ Status: ${student.isActive !== false ? 'Active' : 'Inactive'}`,
        `📋 Profile: ${student.profileCompleted ? 'Complete' : 'Incomplete'}`,
      ].filter(Boolean).join('\n'),
      [{ text: 'Close' }]
    );
  };

  const filteredStudents = students
    .filter(student => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (student.name || '').toLowerCase().includes(q) ||
        (student.email || '').toLowerCase().includes(q) ||
        (student.course || '').toLowerCase().includes(q) ||
        (student.enrollmentNo || '').toLowerCase().includes(q);
      const isActiveStatus = student.isActive !== false; // treat undefined as active
      const matchesFilter =
        filterStatus === 'All' ||
        (filterStatus === 'Active' && isActiveStatus) ||
        (filterStatus === 'Inactive' && !isActiveStatus);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'cgpa':
          return parseFloat(String(b.cgpa || 0)) - parseFloat(String(a.cgpa || 0));
        case 'createdAt':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

  const stats = {
    total: students.length,
    active: students.filter(s => s.isActive !== false).length,
    inactive: students.filter(s => s.isActive === false).length,
    profileComplete: students.filter(s => s.profileCompleted).length,
  };

  const FilterBtn = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Manage Students', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading students from Firebase...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          headerRight: () => (
            <TouchableOpacity onPress={() => fetchStudents(true)} style={styles.refreshButton}>
              <RefreshCw size={20} color="#10B981" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827', fontWeight: 'bold' }
        }}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchStudents(true)} colors={['#10B981']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Users size={24} color="#10B981" />
          </View>
          <Text style={styles.headerTitle}>Student Management</Text>
          <Text style={styles.headerSubtitle}>Live data from Firebase • {stats.total} registered students</Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, course..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={styles.filtersLabel}>Filter by status:</Text>
          <View style={styles.filterButtons}>
            {STATUS_FILTERS.map(s => (
              <FilterBtn key={s} title={s} isActive={filterStatus === s} onPress={() => setFilterStatus(s)} />
            ))}
          </View>

          <Text style={[styles.filtersLabel, { marginTop: 12 }]}>Sort by:</Text>
          <View style={styles.filterButtons}>
            {SORT_OPTIONS.map(s => (
              <FilterBtn key={s.key} title={s.label} isActive={sortBy === s.key} onPress={() => setSortBy(s.key)} />
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statTitle}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.active}</Text>
            <Text style={styles.statTitle}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.inactive}</Text>
            <Text style={styles.statTitle}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#6366F1' }]}>{stats.profileComplete}</Text>
            <Text style={styles.statTitle}>Complete</Text>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsListContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredStudents.length} of {students.length} students
          </Text>

          {filteredStudents.map(student => {
            const isActive = student.isActive !== false;
            const isUpdating = updatingId === student.id;
            return (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                    {student.course && (
                      <View style={styles.metaItem}>
                        <GraduationCap size={13} color="#6B7280" />
                        <Text style={styles.metaText}>{student.course}{student.year ? ` • ${student.year}` : ''}</Text>
                      </View>
                    )}
                    {student.phone && (
                      <View style={styles.metaItem}>
                        <Phone size={13} color="#6B7280" />
                        <Text style={styles.metaText}>{student.phone}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]}>
                    <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>

                <View style={styles.studentStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{student.cgpa || '—'}</Text>
                    <Text style={styles.statLabel}>CGPA</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{student.year || '—'}</Text>
                    <Text style={styles.statLabel}>Year</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{student.profileCompleted ? '✓' : '✗'}</Text>
                    <Text style={styles.statLabel}>Profile</Text>
                  </View>
                  {student.prnNumber ? (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue} numberOfLines={1}>{student.prnNumber}</Text>
                      <Text style={styles.statLabel}>PRN</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.studentActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewDetails(student)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isActive ? styles.deactivateButton : styles.activateButton,
                      isUpdating && styles.buttonDisabled
                    ]}
                    onPress={() => handleToggleStatus(student)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.toggleButtonText}>
                      {isUpdating ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteStudentBtn, isUpdating && styles.buttonDisabled]}
                    onPress={() => handleDeleteStudent(student)}
                    disabled={isUpdating}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={styles.deleteStudentBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {filteredStudents.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No students found</Text>
              <Text style={styles.emptyStateText}>
                {students.length === 0
                  ? 'No students have registered yet.\nStudents who sign up will appear here automatically.'
                  : 'Try adjusting your search or filter criteria'}
              </Text>
              {students.length === 0 && (
                <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchStudents(true)}>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  backButton: { padding: 8, marginLeft: -8 },
  refreshButton: { padding: 8, marginRight: -8 },
  content: { flex: 1, paddingHorizontal: isTablet ? 24 : 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#6B7280' },

  header: {
    alignItems: 'center',
    paddingVertical: isTablet ? 32 : 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? 0 : -16,
    paddingHorizontal: isTablet ? 24 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  headerIcon: {
    width: isTablet ? 64 : 52,
    height: isTablet ? 64 : 52,
    borderRadius: isTablet ? 32 : 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: isTablet ? 26 : 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  headerSubtitle: { fontSize: isTablet ? 15 : 13, color: '#6B7280', textAlign: 'center' },

  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
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
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', marginLeft: 8 },

  filtersLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  filterButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterButtonText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#FFFFFF' },

  statsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 3 },
  statTitle: { fontSize: 10, color: '#6B7280', textAlign: 'center' },

  studentsListContainer: { paddingBottom: 32 },
  resultsText: { fontSize: 13, color: '#6B7280', marginBottom: 12, fontWeight: '500' },

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
  studentInfo: { flex: 1, marginRight: 8 },
  studentName: { fontSize: isTablet ? 17 : 15, fontWeight: 'bold', color: '#111827', marginBottom: 3 },
  studentEmail: { fontSize: 12, color: '#6B7280', marginBottom: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#6B7280' },

  studentActions: { flexDirection: 'row', gap: 8 },
  viewButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewButtonText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  toggleButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: { backgroundColor: '#10B981' },
  deactivateButton: { backgroundColor: '#F59E0B' },
  buttonDisabled: { opacity: 0.5 },
  toggleButtonText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  deleteStudentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 9, paddingHorizontal: 12,
    borderRadius: 8, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  deleteStudentBtnText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});