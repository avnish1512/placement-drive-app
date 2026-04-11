import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Building2, MapPin, Users, Briefcase, Plus, Trash2, Edit, Mail, Globe, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';
import { Company } from '@/types/job';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function ManageCompanies() {
  const { companies, jobs, isLoading, deleteCompany, addCompany, updateCompany, loadCompanies, loadData } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'addedDate'>('name');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    industry: '',
    location: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refresh data whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const refreshData = async () => {
        console.log('📋 Manage Companies focused - refreshing data');
        try {
          if (isMounted) {
            await loadCompanies();
            await loadData();
            console.log('✅ Data refreshed successfully');
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
      
      refreshData();
      
      return () => {
        isMounted = false;
      };
    }, [loadCompanies, loadData])
  );

  // Validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    setErrorMessage('');
    
    // Required field validation
    if (!newCompanyForm.name.trim()) {
      errors.name = 'Company name is required';
    }
    if (!newCompanyForm.industry.trim()) {
      errors.industry = 'Industry is required';
    }
    if (!newCompanyForm.location.trim()) {
      errors.location = 'Location is required';
    }
    
    // Email validation (optional but if provided must be valid)
    if (newCompanyForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCompanyForm.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }
    
    // Phone validation (optional but if provided must be valid)
    if (newCompanyForm.contactPhone && !/^[\d\s\-\+\(\)]+$/.test(newCompanyForm.contactPhone)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }
    
    // Website validation (optional but if provided must be valid)
    if (newCompanyForm.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(newCompanyForm.website)) {
      errors.website = 'Please enter a valid website URL';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCompanyForm]);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = (companies || [])
    .filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           company.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'addedDate':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleDeleteCompany = useCallback((companyId: string, companyName: string) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete ${companyName}? This will also remove all associated jobs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCompany(companyId);
            if (result.success) {
              Alert.alert('Success', 'Company deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete company');
            }
          }
        }
      ]
    );
  }, [deleteCompany]);

  const handleAddCompany = useCallback(async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      const result = await addCompany({
        name: newCompanyForm.name,
        industry: newCompanyForm.industry,
        location: newCompanyForm.location,
        website: newCompanyForm.website || undefined,
        contactEmail: newCompanyForm.contactEmail || undefined,
        contactPhone: newCompanyForm.contactPhone || undefined,
        description: newCompanyForm.description || undefined
      });
      
      if (result.success) {
        setSuccessMessage(`Company "${newCompanyForm.name}" added successfully!`);
        setNewCompanyForm({
          name: '',
          industry: '',
          location: '',
          website: '',
          contactEmail: '',
          contactPhone: '',
          description: ''
        });
        setShowAddForm(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Failed to add company. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Error adding company:', error);
    }
  }, [newCompanyForm, addCompany, validateForm]);

  const CompanyCard = useCallback(({ company }: { company: Company }) => {
    // Get jobs for this company
    const companyJobs = (jobs || []).filter(job => {
      const matches = job.company === company.name;
      if (matches) {
        console.log(`✅ Job "${job.title}" matches company "${company.name}"`);
      }
      return matches;
    });
    
    console.log(`Company: "${company.name}" - Found ${companyJobs.length} jobs (Total jobs available: ${jobs?.length || 0})`);
    if ((jobs || []).length > 0 && companyJobs.length === 0) {
      console.log(`Debug: Available job companies:`, (jobs || []).map(j => j.company));
    }
    
    return (
      <View style={styles.companyCard}>
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <View style={styles.companyMeta}>
              <View style={styles.metaItem}>
                <Building2 size={14} color="#6B7280" />
                <Text style={styles.metaText}>{company.industry}</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.metaText}>{company.location}</Text>
              </View>
            </View>
            {company.website && (
              <View style={styles.metaItem}>
                <Globe size={14} color="#6B7280" />
                <Text style={styles.metaText}>{company.website}</Text>
              </View>
            )}
          </View>
          <View style={styles.companyActions}>
            <TouchableOpacity 
              style={[styles.actionButtonSmall, styles.deleteButton]}
              onPress={() => handleDeleteCompany(company.id, company.name)}
            >
              <Trash2 size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {company.description && (
          <View style={styles.description}>
            <Text style={styles.descriptionText}>{company.description}</Text>
          </View>
        )}

        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Added: {new Date(company.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</Text>
        </View>

        {company.contactEmail && (
          <View style={styles.contactRow}>
            <Mail size={14} color="#6366F1" />
            <Text style={styles.contactValue}>{company.contactEmail}</Text>
          </View>
        )}

        {/* Associated Jobs Section */}
        {companyJobs.length > 0 && (
          <View style={styles.jobsSection}>
            <View style={styles.jobsSectionHeader}>
              <Briefcase size={16} color="#6366F1" />
              <Text style={styles.jobsSectionTitle}>Posted Jobs ({companyJobs.length})</Text>
            </View>
            {companyJobs.map((job) => (
              <View key={job.id} style={styles.jobItem}>
                <View style={styles.jobItemContent}>
                  <Text style={styles.jobItemTitle}>{job.title}</Text>
                  <View style={styles.jobItemDetails}>
                    <Text style={styles.jobItemDetail}>{job.location}</Text>
                    <Text style={styles.jobItemDetail}>₹{(job.ctc.min / 100000).toFixed(1)}L</Text>
                    <Text style={styles.jobItemDetail}>{job.jobType}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, job.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.statusText, job.isActive ? styles.activeText : styles.inactiveText]}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {companyJobs.length === 0 && (
          <View style={styles.noJobsContainer}>
            <Text style={styles.noJobsText}>No jobs posted yet</Text>
          </View>
        )}
      </View>
    );
  }, [jobs, handleDeleteCompany]);

  const AddCompanyForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Add New Company</Text>
      
      {/* Error Message Display */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#DC2626" style={styles.errorIcon} />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}
      
      {/* Success Message Display */}
      {successMessage ? (
        <View style={styles.successContainer}>
          <CheckCircle size={20} color="#16A34A" style={styles.successIcon} />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Success</Text>
            <Text style={styles.errorMessage}>{successMessage}</Text>
          </View>
        </View>
      ) : null}
      
      {/* Company Name Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.name ? styles.validationInput : (newCompanyForm.name ? styles.validationInputSuccess : {})
          ]}
          placeholder="Company Name *"
          value={newCompanyForm.name}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, name: text }));
            if (validationErrors.name) {
              setValidationErrors(prev => ({ ...prev, name: '' }));
            }
          }}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.name ? (
          <Text style={styles.validationError}>{validationErrors.name}</Text>
        ) : newCompanyForm.name ? (
          <Text style={styles.validationSuccess}>✓ Company name provided</Text>
        ) : null}
      </View>
      
      {/* Industry Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.industry ? styles.validationInput : (newCompanyForm.industry ? styles.validationInputSuccess : {})
          ]}
          placeholder="Industry *"
          value={newCompanyForm.industry}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, industry: text }));
            if (validationErrors.industry) {
              setValidationErrors(prev => ({ ...prev, industry: '' }));
            }
          }}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.industry ? (
          <Text style={styles.validationError}>{validationErrors.industry}</Text>
        ) : newCompanyForm.industry ? (
          <Text style={styles.validationSuccess}>✓ Industry provided</Text>
        ) : null}
      </View>
      
      {/* Location Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.location ? styles.validationInput : (newCompanyForm.location ? styles.validationInputSuccess : {})
          ]}
          placeholder="Location *"
          value={newCompanyForm.location}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, location: text }));
            if (validationErrors.location) {
              setValidationErrors(prev => ({ ...prev, location: '' }));
            }
          }}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.location ? (
          <Text style={styles.validationError}>{validationErrors.location}</Text>
        ) : newCompanyForm.location ? (
          <Text style={styles.validationSuccess}>✓ Location provided</Text>
        ) : null}
      </View>
      
      {/* Website Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.website ? styles.validationInput : (newCompanyForm.website ? styles.validationInputSuccess : {})
          ]}
          placeholder="Website"
          value={newCompanyForm.website}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, website: text }));
            if (validationErrors.website) {
              setValidationErrors(prev => ({ ...prev, website: '' }));
            }
          }}
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.website ? (
          <Text style={styles.validationError}>{validationErrors.website}</Text>
        ) : newCompanyForm.website ? (
          <Text style={styles.validationSuccess}>✓ Valid website</Text>
        ) : null}
      </View>
      
      {/* Contact Email Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.contactEmail ? styles.validationInput : (newCompanyForm.contactEmail ? styles.validationInputSuccess : {})
          ]}
          placeholder="Contact Email"
          value={newCompanyForm.contactEmail}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, contactEmail: text }));
            if (validationErrors.contactEmail) {
              setValidationErrors(prev => ({ ...prev, contactEmail: '' }));
            }
          }}
          keyboardType="email-address"
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.contactEmail ? (
          <Text style={styles.validationError}>{validationErrors.contactEmail}</Text>
        ) : newCompanyForm.contactEmail ? (
          <Text style={styles.validationSuccess}>✓ Valid email</Text>
        ) : null}
      </View>
      
      {/* Contact Phone Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            validationErrors.contactPhone ? styles.validationInput : (newCompanyForm.contactPhone ? styles.validationInputSuccess : {})
          ]}
          placeholder="Contact Phone"
          value={newCompanyForm.contactPhone}
          onChangeText={(text) => {
            setNewCompanyForm(prev => ({ ...prev, contactPhone: text }));
            if (validationErrors.contactPhone) {
              setValidationErrors(prev => ({ ...prev, contactPhone: '' }));
            }
          }}
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
        {validationErrors.contactPhone ? (
          <Text style={styles.validationError}>{validationErrors.contactPhone}</Text>
        ) : newCompanyForm.contactPhone ? (
          <Text style={styles.validationSuccess}>✓ Valid phone number</Text>
        ) : null}
      </View>
      
      {/* Description Input */}
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description"
        value={newCompanyForm.description}
        onChangeText={(text) => setNewCompanyForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={4}
        placeholderTextColor="#9CA3AF"
      />
      
      <View style={styles.formActions}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setShowAddForm(false);
            setNewCompanyForm({
              name: '',
              industry: '',
              location: '',
              website: '',
              contactEmail: '',
              contactPhone: '',
              description: ''
            });
            setValidationErrors({});
            setErrorMessage('');
            setSuccessMessage('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton]}
          onPress={handleAddCompany}
        >
          <Text style={styles.submitButtonText}>Add Company</Text>
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Manage Companies',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827', fontWeight: 'bold' as const }
        }}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Building2 size={24} color="#F59E0B" />
          </View>
          <Text style={styles.headerTitle}>Company Management</Text>
          <Text style={styles.headerSubtitle}>Manage recruiting companies (Real-time)</Text>
        </View>

        {!showAddForm && (
          <>
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                  <FilterButton
                    title="Name"
                    isActive={sortBy === 'name'}
                    onPress={() => setSortBy('name')}
                  />
                  <FilterButton
                    title="Recently Added"
                    isActive={sortBy === 'addedDate'}
                    onPress={() => setSortBy('addedDate')}
                  />
                </View>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{companies?.length || 0}</Text>
                <Text style={styles.statTitle}>Total Companies</Text>
              </View>
            </View>

            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add New Company</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showAddForm && <AddCompanyForm />}

        <View style={styles.companiesListContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredCompanies.length} of {companies?.length || 0} companies
          </Text>
          
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
          
          {filteredCompanies.length === 0 && !showAddForm && (
            <View style={styles.emptyState}>
              <Building2 size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No companies found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your search criteria or add a new company</Text>
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 20,
    fontWeight: 'bold' as const,
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
  sortContainer: {
    marginTop: 8,
  },
  sortLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: 8,
  },
  sortButtons: {
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
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  addButtonContainer: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: isTablet ? 16 : 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600' as const,
  },
  companiesListContainer: {
    paddingBottom: 24,
  },
  resultsText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500' as const,
  },
  companyCard: {
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
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  companyMeta: {
    gap: 4,
    marginBottom: 4,
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
  companyWebsite: {
    fontSize: isTablet ? 12 : 11,
    color: '#6366F1',
    fontWeight: '500' as const,
  },
  companyActions: {
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
  editButton: {
    backgroundColor: '#EEF2FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  companyStats: {
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
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: isTablet ? 12 : 10,
    color: '#6B7280',
  },
  companyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  contactValue: {
    fontSize: isTablet ? 14 : 12,
    color: '#111827',
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold' as const,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Error handling and validation feedback styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    color: '#DC2626',
    width: 20,
    height: 20,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    color: '#16A34A',
    width: 20,
    height: 20,
  },
  warningContainer: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    color: '#D97706',
    width: 20,
    height: 20,
  },
  validationInput: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  validationInputSuccess: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  validationError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
  validationSuccess: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 4,
    marginLeft: 4,
  },
  // Form styles
  formContainer: {
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
  formTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 14 : 12,
    fontSize: isTablet ? 16 : 14,
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'System',
  },
  descriptionInput: {
    minHeight: isTablet ? 120 : 100,
    textAlignVertical: 'top' as const,
    paddingTop: isTablet ? 12 : 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  submitButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    marginTop: 16,
  },
  description: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: isTablet ? 14 : 13,
    color: '#374151',
    lineHeight: 20,
  },
  contactInfo: {
    paddingVertical: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  // Jobs section styles
  jobsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  jobsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  jobsSectionTitle: {
    fontSize: isTablet ? 14 : 13,
    fontWeight: '600' as const,
    color: '#6366F1',
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  jobItemContent: {
    flex: 1,
  },
  jobItemTitle: {
    fontSize: isTablet ? 13 : 12,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  jobItemDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  jobItemDetail: {
    fontSize: isTablet ? 11 : 10,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  activeText: {
    fontSize: isTablet ? 11 : 10,
    fontWeight: '600' as const,
    color: '#1E40AF',
  },
  inactiveText: {
    fontSize: isTablet ? 11 : 10,
    fontWeight: '600' as const,
    color: '#991B1B',
  },
  statusText: {
    fontSize: isTablet ? 11 : 10,
    fontWeight: '600' as const,
  },
  noJobsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  noJobsText: {
    fontSize: isTablet ? 12 : 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
    