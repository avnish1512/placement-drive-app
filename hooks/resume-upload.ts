import { useState, useCallback } from 'react';
import { storage, db } from '@/config/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export interface Resume {
  id: string;
  studentId: string;
  fileName: string;
  fileSize: number;
  uploadedDate: Date;
  downloadUrl: string;
  isDefault: boolean;
}

export const useResumeUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);

  // Upload resume
  const uploadResume = useCallback(async (
    studentId: string,
    studentName: string,
    file: {
      uri: string;
      name: string;
      type: string;
    }
  ) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create file reference with student ID and timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `resumes/${studentId}/resume_${timestamp}.${fileExtension}`;
      const fileRef = ref(storage, storagePath);

      // For web, we need to handle file upload differently
      // Convert URI to blob
      let fileBlob: Blob;

      if (file.uri.startsWith('file://') || file.uri.startsWith('/')) {
        // Mobile/local file - convert to blob
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      } else if (file.uri.startsWith('http')) {
        // Already a URL
        throw new Error('Please select a local file to upload');
      } else {
        // Web file
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      }

      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(fileRef, fileBlob, {
        customMetadata: {
          studentId,
          studentName,
          uploadedBy: studentId
        }
      });

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Update student profile with resume URL
      await updateDoc(doc(db, 'students', studentId), {
        resume: downloadUrl,
        resumePath: storagePath,
        resumeFileName: file.name,
        resumeUploadedDate: new Date()
      });

      setUploadProgress(100);
      return {
        success: true,
        downloadUrl,
        message: 'Resume uploaded successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload resume';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Delete resume
  const deleteResume = useCallback(async (
    studentId: string,
    resumePath: string
  ) => {
    try {
      setError(null);

      // Delete from Firebase Storage
      if (resumePath) {
        const fileRef = ref(storage, resumePath);
        await deleteObject(fileRef);
      }

      // Update student profile to remove resume
      await updateDoc(doc(db, 'students', studentId), {
        resume: null,
        resumePath: null,
        resumeFileName: null,
        resumeUploadedDate: null
      });

      return { success: true, message: 'Resume deleted successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get student's resumes
  const getStudentResumes = useCallback(async (studentId: string) => {
    try {
      const folderRef = ref(storage, `resumes/${studentId}`);
      const fileList = await listAll(folderRef);

      const resumesList: Resume[] = [];
      for (const file of fileList.items) {
        const downloadUrl = await getDownloadURL(file);

        resumesList.push({
          id: file.name,
          studentId,
          fileName: file.name.split('_')[1] || file.name,
          fileSize: 0,
          uploadedDate: new Date(),
          downloadUrl,
          isDefault: false
        });
      }

      setResumes(resumesList);
      return resumesList;
    } catch (err) {
      console.error('Error getting resumes:', err);
      return [];
    }
  }, []);

  // Download resume
  const downloadResume = useCallback(async (downloadUrl: string, fileName: string) => {
    try {
      // On mobile, open the download URL
      // On web, trigger download
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.click();
      }
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download resume';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    resumes,
    uploadResume,
    deleteResume,
    getStudentResumes,
    downloadResume
  };
};
