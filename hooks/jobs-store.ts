import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, Application, Company } from '@/types/job';
import { mockJobs } from '@/constants/jobs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore';

const APPLICATIONS_STORAGE_KEY = 'placement_applications';

export const [JobsProvider, useJobs] = createContextHook(() => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      console.log('Loading jobs and applications from Firestore...');
      
      // Load jobs from Firestore
      const jobsCollection = collection(db, 'jobs');
      const jobsQuery = query(jobsCollection, orderBy('postedDate', 'desc'));
      const jobsSnapshot = await getDocs(jobsQuery);
      
      if (!jobsSnapshot.empty) {
        const firestoreJobs = jobsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Job[];
        console.log('Loaded jobs from Firestore:', firestoreJobs.length);
        setJobs(firestoreJobs);
      } else {
        console.log('No jobs in Firestore, initializing with mock data');
        // Initialize Firestore with mock jobs
        const batch = mockJobs.map(job => 
          setDoc(doc(db, 'jobs', job.id), job)
        );
        await Promise.all(batch);
        setJobs(mockJobs);
      }

      // Load applications from Firestore
      const applicationsCollection = collection(db, 'applications');
      const applicationsQuery = query(applicationsCollection, orderBy('appliedDate', 'desc'));
      const appSnapshot = await getDocs(applicationsQuery);
      
      if (!appSnapshot.empty) {
        const firestoreApplications = appSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Application[];
        console.log('Loaded applications from Firestore:', firestoreApplications.length);
        setApplications(firestoreApplications);
      } else {
        console.log('No applications in Firestore yet');
        setApplications([]);
      }
    } catch (error) {
      console.log('Error loading data from Firestore:', error);
      // Fallback to mock data if Firestore fails
      setJobs(mockJobs);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Set up real-time listener for jobs
    const jobsCollection = collection(db, 'jobs');
    const jobsQuery = query(jobsCollection, orderBy('postedDate', 'desc'));
    
    const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const updatedJobs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Job[];
      console.log('Real-time update: Jobs count:', updatedJobs.length);
      setJobs(updatedJobs);
    }, (error) => {
      console.log('Error listening to jobs:', error);
    });

    // Set up real-time listener for applications
    const applicationsCollection = collection(db, 'applications');
    const applicationsQuery = query(applicationsCollection, orderBy('appliedDate', 'desc'));
    
    const applicationsUnsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const updatedApplications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          jobId: data.jobId,
          studentId: data.studentId,
          status: data.status,
          appliedDate: data.appliedDate,
          lastUpdated: data.lastUpdated,
          studentName: data.studentName,
          studentEmail: data.studentEmail,
          studentCGPA: data.studentCGPA,
          studentCourse: data.studentCourse,
          studentYear: data.studentYear,
          adminNotes: data.adminNotes
        } as Application;
      });
      console.log('Real-time update: Applications count:', updatedApplications.length);
      setApplications(updatedApplications);
    }, (error) => {
      console.log('Error listening to applications:', error);
    });
    
    // Cleanup both listeners
    return () => {
      jobsUnsubscribe();
      applicationsUnsubscribe();
    };
  }, [loadData]);

  const applyToJob = useCallback(async (
    jobId: string, 
    studentId: string,
    studentData?: {
      name?: string;
      email?: string;
      cgpa?: number;
      course?: string;
      year?: string;
      resume?: string;
    }
  ) => {
    try {
      // Validate inputs
      if (!jobId || !studentId) {
        console.error('Invalid input: jobId or studentId is missing', { jobId, studentId });
        return { success: false, error: 'Missing job ID or student ID' };
      }

      console.log('Attempting to apply to job:', { jobId, studentId });

      const newApplication: Application = {
        id: `${studentId}_${jobId}_${Date.now()}`,
        jobId,
        studentId,
        studentName: studentData?.name,
        studentEmail: studentData?.email,
        studentCGPA: studentData?.cgpa,
        studentCourse: studentData?.course,
        studentYear: studentData?.year,
        studentResume: studentData?.resume,
        status: 'Applied',
        appliedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Save to Firestore
      const docRef = doc(db, 'applications', newApplication.id);
      await setDoc(docRef, newApplication);
      console.log('Application saved to Firestore:', newApplication.id);

      // Update job eligibility status in Firestore (optional, won't fail if this fails)
      try {
        const jobDocRef = doc(db, 'jobs', jobId);
        await updateDoc(jobDocRef, {
          eligibilityStatus: 'Applied'
        });
        console.log('Job eligibility status updated');
      } catch (jobUpdateError) {
        console.warn('Warning: Could not update job status, but application was saved:', jobUpdateError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error applying to job:', error.code, error.message);
      
      let errorMsg = 'Failed to apply to job';
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission denied. Check your Firestore rules.';
      } else if (error.code === 'not-found') {
        errorMsg = 'Job not found in database.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      } else if (error.code === 'unavailable') {
        errorMsg = 'Service temporarily unavailable. Please try again.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const getJobById = useCallback((id: string) => jobs.find(job => job.id === id), [jobs]);

  const getApplicationsForStudent = useCallback((studentId: string) => 
    applications.filter(app => app.studentId === studentId), [applications]);

  const updateApplicationStatus = useCallback(async (applicationId: string, newStatus: Application['status'], adminNotes?: string) => {
    try {
      console.log('Updating application status in Firestore:', applicationId, newStatus);
      
      const docRef = doc(db, 'applications', applicationId);
      
      // Verify the document exists first
      const docSnapshot = await updateDoc(docRef, {
        status: newStatus,
        adminNotes: adminNotes || '',
        lastUpdated: new Date().toISOString()
      });
      console.log('Application status updated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating application status:', error.code, error.message);
      
      let errorMsg = 'Failed to update application status';
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission denied. Check your Firestore rules.';
      } else if (error.code === 'not-found') {
        errorMsg = 'Application not found in database.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const addJob = useCallback(async (jobData: Omit<Job, 'id'> & { id: string }) => {
    try {
      console.log('Adding new job:', jobData.title, 'at', jobData.company);
      console.log('Full job data:', JSON.stringify(jobData, null, 2));
      
      const newJob: Job = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        ctc: jobData.ctc,
        jobType: jobData.jobType,
        industry: jobData.industry,
        requirements: jobData.requirements,
        description: jobData.description,
        skills: jobData.skills,
        eligibilityStatus: jobData.eligibilityStatus,
        registrationDeadline: jobData.registrationDeadline,
        postedDate: jobData.postedDate,
        isActive: jobData.isActive,
        companyLogo: jobData.companyLogo,
        ...(jobData.driveDate && { driveDate: jobData.driveDate }),
        ...(jobData.eligibilityCriteria && { eligibilityCriteria: jobData.eligibilityCriteria }),
        ...(jobData.contactEmail && { contactEmail: jobData.contactEmail }),
        ...(jobData.contactPhone && { contactPhone: jobData.contactPhone })
      };
      
      console.log('Saving job to Firestore...');
      // Save to Firestore
      const docRef = doc(db, 'jobs', jobData.id);
      await setDoc(docRef, newJob);
      console.log('✅ Job saved to Firestore successfully with ID:', jobData.id);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adding job to Firestore:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Failed to add job to database';
      if (error.code === 'permission-denied') {
        errorMsg = '❌ Permission denied. Check Firebase Firestore rules. Only admin can post jobs. Make sure your Firestore rules allow admin writes to jobs collection.';
        console.error('🔐 FIRESTORE SECURITY RULES ISSUE:', errorMsg);
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateJob = useCallback(async (jobId: string, updates: Partial<Job>) => {
    try {
      console.log('Updating job in Firestore:', jobId);
      
      const docRef = doc(db, 'jobs', jobId);
      await updateDoc(docRef, updates);
      console.log('Job updated successfully in Firestore');
      
      return { success: true };
    } catch (error) {
      console.log('Error updating job in Firestore:', error);
      return { success: false, error: 'Failed to update job in database' };
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      console.log('Deleting job from Firestore:', jobId);
      
      const docRef = doc(db, 'jobs', jobId);
      await deleteDoc(docRef);
      console.log('Job deleted successfully from Firestore');
      
      return { success: true };
    } catch (error) {
      console.log('Error deleting job from Firestore:', error);
      return { success: false, error: 'Failed to delete job from database' };
    }
  }, []);

  // Company Management Functions
  const loadCompanies = useCallback(async () => {
    try {
      console.log('Loading companies from Firestore...');
      
      const companiesCollection = collection(db, 'companies');
      const companiesQuery = query(companiesCollection, orderBy('addedDate', 'desc'));
      const companiesSnapshot = await getDocs(companiesQuery);
      
      if (!companiesSnapshot.empty) {
        const firestoreCompanies = companiesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Company[];
        console.log('Loaded companies from Firestore:', firestoreCompanies.length);
        setCompanies(firestoreCompanies);
      } else {
        console.log('No companies in Firestore yet');
        setCompanies([]);
      }
      
      return { success: true };
    } catch (error) {
      console.log('Error loading companies from Firestore:', error);
      return { success: false, error: 'Failed to load companies' };
    }
  }, []);

  const addCompany = useCallback(async (companyData: Omit<Company, 'id' | 'addedDate' | 'isActive'>) => {
    try {
      console.log('Adding new company:', companyData.name);
      
      const newCompany: Company = {
        id: `company_${Date.now()}`,
        ...companyData,
        addedDate: new Date().toISOString(),
        isActive: true
      };
      
      console.log('Saving company to Firestore...');
      const docRef = doc(db, 'companies', newCompany.id);
      await setDoc(docRef, newCompany);
      console.log('Company saved to Firestore successfully:', newCompany.id);
      
      return { success: true, data: newCompany };
    } catch (error: any) {
      console.error('Error adding company to Firestore:', error);
      let errorMsg = 'Failed to add company to database';
      if (error.code === 'permission-denied') {
        errorMsg = '❌ Permission denied. Admin needs to update Firebase Firestore rules.\n\n📋 See FIREBASE_RULES.md for step-by-step instructions on updating rules in Firebase Console.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateCompany = useCallback(async (companyId: string, updates: Partial<Company>) => {
    try {
      console.log('Updating company in Firestore:', companyId);
      
      const docRef = doc(db, 'companies', companyId);
      await updateDoc(docRef, updates);
      console.log('Company updated successfully in Firestore');
      
      return { success: true };
    } catch (error) {
      console.log('Error updating company in Firestore:', error);
      return { success: false, error: 'Failed to update company in database' };
    }
  }, []);

  const deleteCompany = useCallback(async (companyId: string) => {
    try {
      console.log('Deleting company from Firestore:', companyId);
      
      // Also delete all jobs associated with this company
      const jobsCollection = collection(db, 'jobs');
      const jobsSnapshot = await getDocs(jobsCollection);
      const associatedJobs = jobsSnapshot.docs.filter(jobDoc => 
        (jobDoc.data() as any).company === companyId || (jobDoc.data() as any).companyId === companyId
      );
      
      const deleteJobPromises = associatedJobs.map(jobDoc => deleteDoc(jobDoc.ref));
      await Promise.all(deleteJobPromises);
      
      // Delete the company document itself
      const docRef = doc(db, 'companies', companyId);
      await deleteDoc(docRef);
      console.log('Company deleted successfully from Firestore');
      
      return { success: true };
    } catch (error) {
      console.log('Error deleting company from Firestore:', error);
      return { success: false, error: 'Failed to delete company from database' };
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      console.log('Clearing all data from Firestore...');
      
      // Clear applications from Firestore
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const appDeletePromises = applicationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(appDeletePromises);
      
      // Clear jobs from Firestore
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobDeletePromises = jobsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(jobDeletePromises);
      
      setJobs([]);
      setApplications([]);
      console.log('All data cleared from Firestore');
      return { success: true };
    } catch (error) {
      console.log('Error clearing data:', error);
      return { success: false, error: 'Failed to clear data' };
    }
  }, []);

  const getActiveJobs = useCallback(() => jobs.filter(job => job.isActive), [jobs]);
  
  const getJobsByCompany = useCallback((companyName: string) => 
    jobs.filter(job => job.company.toLowerCase().includes(companyName.toLowerCase())), [jobs]);

  return useMemo(() => ({
    jobs,
    applications,
    companies,
    isLoading,
    applyToJob,
    getJobById,
    getApplicationsForStudent,
    updateApplicationStatus,
    addJob,
    updateJob,
    deleteJob,
    clearAllData,
    getActiveJobs,
    getJobsByCompany,
    loadData,
    loadCompanies,
    addCompany,
    updateCompany,
    deleteCompany
  }), [
    jobs,
    applications,
    companies,
    isLoading,
    applyToJob,
    getJobById,
    getApplicationsForStudent,
    updateApplicationStatus,
    addJob,
    updateJob,
    deleteJob,
    clearAllData,
    getActiveJobs,
    getJobsByCompany,
    loadData,
    loadCompanies,
    addCompany,
    updateCompany,
    deleteCompany
  ]);
});