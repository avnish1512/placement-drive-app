import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  getDocs,
  updateDoc,
  deleteDoc,
  Unsubscribe
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'job' | 'application' | 'announcement' | 'reminder' | 'message';
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  data?: Record<string, any>; // Additional context data
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubscriptionRefs = useRef<{ [key: string]: Unsubscribe }>({});

  // Initialize notifications listener for a user
  const initializeNotifications = useCallback((userId: string) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      // Unsubscribe from previous listener if exists
      if (unsubscriptionRefs.current[userId]) {
        unsubscriptionRefs.current[userId]();
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        setNotifications(loadedNotifications);

        // Update unread count
        const unread = loadedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }, (error) => {
        console.error('Error loading notifications:', error);
      });

      // Store unsubscription
      unsubscriptionRefs.current[userId] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      return () => {};
    }
  }, []);

  // Create a notification
  const createNotification = useCallback(async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId,
        type,
        title,
        message,
        timestamp: serverTimestamp(),
        read: false,
        data: data || {}
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(docSnap => {
        updateDoc(doc(db, 'notifications', docSnap.id), { read: true }).catch(err =>
          console.error('Error updating notification:', err)
        );
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Delete all read notifications
  const clearReadNotifications = useCallback(async (userId: string) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', true)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(docSnap => {
        deleteDoc(doc(db, 'notifications', docSnap.id)).catch(err =>
          console.error('Error deleting notification:', err)
        );
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Triggers for automatic notifications (to be called from other parts of the app)
  
  // Trigger when a new job is posted
  const triggerNewJobNotification = useCallback(async (
    jobTitle: string,
    companyName: string,
    jobId: string
  ) => {
    try {
      // Get all student IDs and create notification for each
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);

      studentsSnapshot.docs.forEach(studentDoc => {
        createNotification(
          studentDoc.id,
          'job',
          'New Job Opportunity',
          `${companyName} has posted a new position: ${jobTitle}`,
          { jobId, companyName }
        );
      });
    } catch (error) {
      console.error('Error triggering job notification:', error);
    }
  }, [createNotification]);

  // Trigger when application status changes
  const triggerApplicationStatusNotification = useCallback(async (
    studentId: string,
    status: string,
    jobTitle: string,
    companyName: string
  ) => {
    const statusMessages = {
      'Applied': 'Your application has been received.',
      'Under Review': 'Your application is being reviewed.',
      'Shortlisted': '🎉 You have been shortlisted!',
      'Selected': '🎊 Congratulations! You have been selected!',
      'Rejected': 'Your application has been reviewed. Thank you for applying.'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || `Your application status: ${status}`;

    await createNotification(
      studentId,
      'application',
      `Application Status: ${status}`,
      `${companyName} - ${jobTitle}: ${message}`,
      { status, jobTitle, companyName }
    );
  }, [createNotification]);

  // Trigger when student receives a message
  const triggerMessageNotification = useCallback(async (
    studentId: string,
    senderName: string
  ) => {
    await createNotification(
      studentId,
      'message',
      'New Message',
      `You have a new message from ${senderName}`,
      { senderName }
    );
  }, [createNotification]);

  return {
    notifications,
    unreadCount,
    initializeNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    triggerNewJobNotification,
    triggerApplicationStatusNotification,
    triggerMessageNotification
  };
});
