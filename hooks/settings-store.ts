import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { db } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface SettingsState {
  // Notification preferences
  pushNotifications: boolean;
  emailNotifications: boolean;
  jobAlerts: boolean;
  
  // Display preferences
  darkMode: boolean;
  language: string;
  
  // Security preferences
  biometricAuth: boolean;
  
  // app preferences
  appVersion: string;
  
  // Setters
  setPushNotifications: (value: boolean) => void;
  setEmailNotifications: (value: boolean) => void;
  setJobAlerts: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  setLanguage: (value: string) => void;
  setBiometricAuth: (value: boolean) => void;
  
  // Persistence
  loadSettings: (userId?: string) => Promise<void>;
  saveSettings: (userId?: string) => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  // Default values
  pushNotifications: true,
  emailNotifications: true,
  jobAlerts: true,
  darkMode: false,
  language: 'en',
  biometricAuth: false,
  appVersion: '1.0.0',

  setPushNotifications: (value: boolean) => {
    set({ pushNotifications: value });
    get().saveSettings();
  },

  setEmailNotifications: (value: boolean) => {
    set({ emailNotifications: value });
    get().saveSettings();
  },

  setJobAlerts: (value: boolean) => {
    set({ jobAlerts: value });
    get().saveSettings();
  },

  setDarkMode: (value: boolean) => {
    set({ darkMode: value });
    get().saveSettings();
  },

  setLanguage: (value: string) => {
    set({ language: value });
    get().saveSettings();
  },

  setBiometricAuth: (value: boolean) => {
    set({ biometricAuth: value });
    get().saveSettings();
  },

  loadSettings: async (userId?: string) => {
    try {
      // Try loading from Firebase first (real-time)
      if (userId) {
        try {
          const settingsRef = doc(db, 'settings', userId);
          const settingsSnap = await getDoc(settingsRef);
          
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            set({
              pushNotifications: data.pushNotifications ?? true,
              emailNotifications: data.emailNotifications ?? true,
              jobAlerts: data.jobAlerts ?? true,
              darkMode: data.darkMode ?? false,
              language: data.language ?? 'en',
              biometricAuth: data.biometricAuth ?? false,
              appVersion: data.appVersion ?? '1.0.0'
            });
            console.log('✅ Settings loaded from Firebase');
            return;
          }
        } catch (firebaseError) {
          console.log('ℹ️ Firebase settings not available, using local storage');
        }
      }

      // Fallback to AsyncStorage
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        set({
          pushNotifications: parsed.pushNotifications ?? true,
          emailNotifications: parsed.emailNotifications ?? true,
          jobAlerts: parsed.jobAlerts ?? true,
          darkMode: parsed.darkMode ?? false,
          language: parsed.language ?? 'en',
          biometricAuth: parsed.biometricAuth ?? false,
          appVersion: parsed.appVersion ?? '1.0.0'
        });
        console.log('✅ Settings loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  saveSettings: async (userId?: string) => {
    try {
      const state = get();
      const settingsToSave = {
        pushNotifications: state.pushNotifications,
        emailNotifications: state.emailNotifications,
        jobAlerts: state.jobAlerts,
        darkMode: state.darkMode,
        language: state.language,
        biometricAuth: state.biometricAuth,
        appVersion: state.appVersion,
        updatedAt: new Date()
      };

      // Save to Firebase (real-time sync)
      if (userId) {
        try {
          const settingsRef = doc(db, 'settings', userId);
          await setDoc(settingsRef, settingsToSave, { merge: true });
          console.log('✅ Settings saved to Firebase');
        } catch (firebaseError) {
          console.log('ℹ️ Could not save to Firebase, using local storage only');
        }
      }

      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('app_settings', JSON.stringify(settingsToSave));
      console.log('✅ Settings saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  clearCache: async () => {
    try {
      // Clear only cache data, not user data
      await AsyncStorage.removeItem('job_cache');
      await AsyncStorage.removeItem('student_cache');
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}));
