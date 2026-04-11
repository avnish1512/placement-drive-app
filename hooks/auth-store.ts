import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { Student } from '@/types/job';
import { auth, db } from '@/config/firebase';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

type Admin = {
  id: string;
  name: string;
  email: string;
  role: 'admin';
};

type User = Student | Admin;

const mockAdmin: Admin = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@sgu.edu.in',
  role: 'admin'
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Check if it's admin
          if (firebaseUser.email === 'admin@sgu.edu.in') {
            const adminUser: Admin = {
              id: DEFAULT_ADMIN_ID,  // Use the constant admin ID for consistency with messaging
              name: firebaseUser.displayName || 'Admin',
              email: firebaseUser.email || '',
              role: 'admin',
            };
            await AsyncStorage.setItem('user', JSON.stringify(adminUser));
            setUser(adminUser);
          } else {
            // Load student profile from Firestore
            const studentDoc = await getDoc(doc(db, 'students', firebaseUser.uid));
            if (studentDoc.exists()) {
              const studentData = studentDoc.data() as Student;
              await AsyncStorage.setItem('user', JSON.stringify(studentData));
              setUser(studentData);
              console.log('Loaded student profile:', studentData.name);
            } else {
              // Create basic student profile if not exists
              const basicStudent: Student = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Student',
                email: firebaseUser.email || '',
                phone: '',
                course: '',
                year: '',
                cgpa: 0,
                skills: [],
                resume: '',
                address: '',
                profileCompleted: false,
              };
              await setDoc(doc(db, 'students', firebaseUser.uid), basicStudent);
              await AsyncStorage.setItem('user', JSON.stringify(basicStudent));
              setUser(basicStudent);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        await AsyncStorage.removeItem('user');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, userType: 'student' | 'admin' = 'student') => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Login attempt:', { email: trimmedEmail, userType });

      let userCredential;
      
      // Try to sign in with existing account
      userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      
      console.log('Firebase login successful:', userCredential.user.email);
      // Auth state listener will handle the rest
      
      return { success: true, userType };
    } catch (error: any) {
      console.error('Login error:', error.code, error.message);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Student account not found. Please contact admin.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      setUser(null);
      setFirebaseUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Update in Firestore if it's a student
      if ('course' in updatedUser) {
        await setDoc(doc(db, 'students', updatedUser.id), updatedUser, { merge: true });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedStudent));
      setUser(updatedStudent);
      
      // Update in Firestore
      if (firebaseUser) {
        await setDoc(doc(db, 'students', firebaseUser.uid), updatedStudent, { merge: true });
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student profile';
      console.error('Error updating student:', errorMessage);
      throw error;
    }
  };

  const completeProfile = async (profileData: Student) => {
    try {
      const completedProfile = { ...profileData, profileCompleted: true };
      await AsyncStorage.setItem('user', JSON.stringify(completedProfile));
      setUser(completedProfile);
      
      // Update in Firestore
      if (firebaseUser) {
        await setDoc(doc(db, 'students', firebaseUser.uid), completedProfile, { merge: true });
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile';
      console.error('Error completing profile:', errorMessage);
      throw error;
    }
  };

  const getAvailableStudents = useCallback(async () => {
    try {
      const q = query(collection(db, 'students'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }, []);

  return {
    user,
    student: user && 'course' in user ? user : null,
    admin: user && 'role' in user ? user : null,
    firebaseUser,
    isLoading,
    login,
    logout,
    updateUser,
    updateStudent,
    completeProfile,
    getAvailableStudents,
    isAuthenticated: !!user,
    isAdmin: !!user && 'role' in user,
    isStudent: !!user && 'course' in user
  };
});