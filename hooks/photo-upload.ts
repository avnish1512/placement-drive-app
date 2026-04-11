import { useState, useCallback } from 'react';
import { storage, db } from '@/config/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Pick image from camera or gallery
  const pickImage = useCallback(async (source: 'camera' | 'gallery' = 'gallery') => {
    try {
      setError(null);

      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          return result.assets[0];
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Gallery permission denied');
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          return result.assets[0];
        }
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Upload photo to Firebase Storage
  const uploadPhoto = useCallback(async (
    studentId: string,
    imageAsset: {
      uri: string;
      width: number;
      height: number;
    }
  ) => {
    try {
      if (!studentId || !imageAsset?.uri) {
        throw new Error('Missing studentId or image URI');
      }

      setUploading(true);
      setError(null);
      setUploadProgress(0);

      console.log('📸 Starting photo upload for student:', studentId);
      console.log('📸 Image URI:', imageAsset.uri);

      // Create file reference with student ID
      const timestamp = Date.now();
      const storagePath = `profile-photos/${studentId}/profile_${timestamp}.jpg`;
      const fileRef = ref(storage, storagePath);

      console.log('📸 Storage path:', storagePath);

      // Convert URI to blob
      let fileBlob: Blob;

      if (imageAsset.uri.startsWith('file://') || imageAsset.uri.startsWith('/')) {
        // Mobile/local file - convert to blob
        console.log('📸 Converting file:// URI to blob');
        try {
          const response = await fetch(imageAsset.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          fileBlob = await response.blob();
          console.log('📸 Blob created from file://, size:', fileBlob.size, 'bytes');
        } catch (fetchError) {
          console.error('📸 File fetch error, trying alternative method:', fetchError);
          // Try alternative method - read as data blob
          throw new Error('Failed to read image file. Please try again.');
        }
      } else if (imageAsset.uri.startsWith('http')) {
        // Network URL
        throw new Error('Please select a local file to upload');
      } else {
        // Web blob or data URL
        console.log('📸 Converting data URL to blob');
        try {
          const response = await fetch(imageAsset.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          fileBlob = await response.blob();
          console.log('📸 Blob created from data URL, size:', fileBlob.size, 'bytes');
        } catch (error) {
          console.error('📸 Blob creation error:', error);
          throw new Error('Failed to process image. Please try again.');
        }
      }


      if (fileBlob.size === 0) {
        throw new Error('Image file is empty');
      }

      // Check file size (max 5MB)
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      if (fileBlob.size > maxFileSize) {
        throw new Error(`Image is too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
      }

      console.log(`📸 File size OK: ${(fileBlob.size / 1024).toFixed(1)}KB`);

      let snapshot;
      try {
        // Set upload timeout (30 seconds)
        const uploadPromise = uploadBytes(fileRef, fileBlob, {
          customMetadata: {
            studentId,
            uploadedBy: studentId,
            type: 'profile-photo'
          }
        });

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout. Please check your internet connection.')), 30000)
        );

        // Race between upload and timeout
        snapshot = await Promise.race([uploadPromise, timeoutPromise as Promise<any>]);
      } catch (uploadError: any) {
        console.error('❌ Firebase upload error:', uploadError);
        if (uploadError.code === 'storage/unauthorized') {
          throw new Error('Upload permission denied. Please contact admin.');
        } else if (uploadError.code === 'storage/invalid-argument') {
          throw new Error('Invalid file format. Please use a valid image.');
        } else if (uploadError.message?.includes('permission')) {
          throw new Error('Storage permission denied. Admin needs to update Firebase rules.');
        }
        throw uploadError;
      }
      
      console.log('📸 Upload complete, getting download URL');

      // Get download URL
      let downloadUrl;
      try {
        downloadUrl = await getDownloadURL(snapshot.ref);
      } catch (urlError) {
        console.error('❌ Failed to get download URL:', urlError);
        throw new Error('Upload succeeded but failed to get image URL.');
      }
      
      console.log('📸 Download URL obtained:', downloadUrl?.substring(0, 50) + '...');

      // Update student profile with photo URL
      console.log('📸 Updating Firestore document...');
      try {
        await updateDoc(doc(db, 'students', studentId), {
          profilePhoto: downloadUrl,
          profilePhotoPath: storagePath,
        });
        console.log('📸 Firestore document updated successfully');
      } catch (firestoreError: any) {
        console.error('❌ Firestore update error:', firestoreError);
        if (firestoreError.code === 'permission-denied') {
          console.warn('⚠️ Warning: Photo uploaded but could not update profile. Please try updating your profile manually.');
        } else {
          throw firestoreError;
        }
      }

      setUploadProgress(100);
      return {
        success: true,
        downloadUrl,
        storagePath,
        message: 'Photo uploaded successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      console.error('❌ Photo upload error:', errorMessage);
      console.error('❌ Error details:', err);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete photo from Firebase Storage
  const deletePhoto = useCallback(async (studentId: string, photoPath: string) => {
    try {
      setError(null);
      const fileRef = ref(storage, photoPath);
      await deleteObject(fileRef);

      // Update student profile to remove photo URL
      await updateDoc(doc(db, 'students', studentId), {
        profilePhoto: null,
        profilePhotoPath: null,
      });

      return {
        success: true,
        message: 'Photo deleted successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    pickImage,
    uploadPhoto,
    deletePhoto,
  };
};
