import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/config/firebase';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'student';
  recipientId: string;
  text: string;
  timestamp: any;
  read: boolean;
}

export interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  adminId: string;
  adminName: string;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversation] = useState<string | null>(null);
  const unsubscriptionRefs = useRef<{ [key: string]: Unsubscribe }>({});
  const parentUnsubscribeRef = useRef<Unsubscribe | null>(null);

  // Generate conversation ID (consistent between two users)
  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  }, []);

  // Real-time listener for messages in a conversation
  const setupMessageListener = useCallback((conversationId: string) => {
    try {
      // Unsubscribe from previous listener if exists
      if (unsubscriptionRefs.current[conversationId]) {
        unsubscriptionRefs.current[conversationId]();
      }

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedMessages = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Sort by timestamp ascending (in-memory, no index needed)
          .sort((a: any, b: any) => {
            const timeA = a.timestamp?.toMillis?.() ?? 0;
            const timeB = b.timestamp?.toMillis?.() ?? 0;
            return timeA - timeB;
          }) as Message[];

        // Update conversation messages in real-time
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { ...conv, messages: loadedMessages }
              : conv
          )
        );
      }, (error) => {
        console.error('Error listening to messages:', error);
      });

      unsubscriptionRefs.current[conversationId] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {};
    }
  }, []);

  // Send message as student
  const sendMessageAsStudent = useCallback(async (
    studentId: string,
    studentName: string,
    text: string,
    adminId?: string  // Optional admin ID parameter
  ) => {
    try {
      // Use provided adminId or default to DEFAULT_ADMIN_ID constant
      const finalAdminId = adminId || DEFAULT_ADMIN_ID;
      const conversationId = getConversationId(studentId, finalAdminId);

      // Ensure listener is set up BEFORE sending message
      setupMessageListener(conversationId);

      // Add message
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: studentId,
        senderName: studentName,
        senderRole: 'student',
        recipientId: finalAdminId,
        text,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation metadata
      const conversationRef = doc(db, 'conversations', conversationId);
      await setDoc(conversationRef, {
        studentId,
        studentName,
        adminId: finalAdminId,
        adminName: 'Admin',
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Message sent:', { conversationId, studentId, text });
    } catch (error) {
      console.error('Error sending message as student:', error);
    }
  }, [getConversationId, setupMessageListener]);

  // Send message as admin
  const sendMessageAsAdmin = useCallback(async (
    conversationId: string,
    adminId: string,
    adminName: string,
    text: string
  ) => {
    try {
      // Extract student ID from conversation
      const parts = conversationId.split('_');
      const studentId = parts[0] === adminId ? parts[1] : parts[0];

      // Add message
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: adminId,
        senderName: adminName,
        senderRole: 'admin',
        recipientId: studentId,
        text,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation metadata
      const conversationRef = doc(db, 'conversations', conversationId);
      await setDoc(conversationRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error sending message as admin:', error);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const querySnapshot = await getDocs(messagesRef);

      querySnapshot.docs.forEach(docSnap => {
        if (!docSnap.data().read) {
          setDoc(
            doc(db, 'conversations', conversationId, 'messages', docSnap.id),
            { read: true },
            { merge: true }
          ).catch(err => console.error('Error marking read:', err));
        }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Get student conversation (for student view)
  const getStudentConversation = useCallback(async (studentId: string, adminId?: string) => {
    try {
      // Use provided adminId or default to DEFAULT_ADMIN_ID constant
      const finalAdminId = adminId || DEFAULT_ADMIN_ID;
      const conversationId = getConversationId(studentId, finalAdminId);

      // Check if conversation already exists in state
      let existingConv = conversations.find(c => c.id === conversationId);
      if (existingConv) {
        // Ensure listener is set up
        if (!existingConv.messages || existingConv.messages.length === 0) {
          setupMessageListener(conversationId);
        }
        return existingConv;
      }

      // Get or create conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      const convSnapshot = await getDocs(collection(db, 'conversations'));
      
      let conversation = convSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((c: any) => c.id === conversationId) as any;

      if (!conversation) {
        // Create conversation if it doesn't exist
        await setDoc(conversationRef, {
          studentId,
          studentName: 'Student',
          adminId: finalAdminId,
          adminName: 'Admin',
          lastMessage: 'No messages yet',
          lastMessageTime: serverTimestamp()
        });

        conversation = {
          id: conversationId,
          studentId,
          studentName: 'Student',
          adminId: finalAdminId,
          adminName: 'Admin',
          lastMessage: 'No messages yet',
          lastMessageTime: new Date()
        };
      }

      // Create conversation object
      const conversationObj: Conversation = {
        id: conversationId,
        studentId: conversation.studentId || studentId,
        studentName: conversation.studentName || 'Student',
        adminId: conversation.adminId || finalAdminId,
        adminName: conversation.adminName || 'Admin',
        messages: [],
        lastMessage: conversation.lastMessage || 'No messages yet',
        lastMessageTime: conversation.lastMessageTime || new Date(),
        unreadCount: 0
      };

      // Add to state
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversationId);
        if (exists) return prev;
        return [...prev, conversationObj];
      });

      // Set up real-time listener
      setupMessageListener(conversationId);

      return conversationObj;
    } catch (error) {
      console.error('Error getting student conversation:', error);
      return null;
    }
  }, [getConversationId, setupMessageListener, conversations]);

  // Get admin conversations with real-time updates (for admin view)
  const getAdminConversations = useCallback(async (adminId: string) => {
    try {
      // Set up real-time listener for admin's conversations
      // NOTE: We avoid combining where() + orderBy() on different fields
      // to prevent requiring a Firestore composite index.
      // Sorting is done in-memory instead.
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('adminId', '==', adminId)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const convs = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Sort in-memory (avoids composite index requirement)
          .sort((a: any, b: any) => {
            const timeA = a.lastMessageTime?.toMillis?.() ?? 0;
            const timeB = b.lastMessageTime?.toMillis?.() ?? 0;
            return timeB - timeA;
          }) as any[];

        // Update conversations with messages subscriptions
        setConversations(prevConvs => {
          const updated = convs.map(c => {
            const existing = prevConvs.find(p => p.id === c.id);
            // Set up listener for this conversation if not already listening
            setupMessageListener(c.id);
            return {
              id: c.id,
              studentId: c.studentId,
              studentName: c.studentName,
              adminId: c.adminId,
              adminName: c.adminName,
              messages: existing?.messages || [],
              lastMessage: c.lastMessage || '',
              lastMessageTime: c.lastMessageTime || new Date(),
              unreadCount: 0
            };
          });
          return updated;
        });
      }, (error) => {
        console.error('Error listening to admin conversations:', error);
      });

      // Store unsubscription
      parentUnsubscribeRef.current = unsubscribe;

      return unsubscribe;
    } catch (error) {
      console.error('Error getting admin conversations:', error);
      return () => {};
    }
  }, [setupMessageListener]);

  // Get specific conversation for admin
  const getStudentSpecificConversation = useCallback((adminId: string, studentId: string) => {
    return conversations.find(c => c.studentId === studentId && c.adminId === adminId) || null;
  }, [conversations]);

  // Get students list for admin
  const getStudentsForAdmin = useCallback((adminId: string) => {
    return conversations
      .filter(c => c.adminId === adminId)
      .map(c => ({
        id: c.studentId,
        name: c.studentName,
        unreadCount: c.messages.filter(m => !m.read && m.recipientId === adminId).length
      }));
  }, [conversations]);

  return {
    conversations,
    currentConversationId,
    getStudentConversation,
    sendMessageAsStudent,
    markMessagesAsRead,
    getAdminConversations,
    getStudentSpecificConversation,
    sendMessageAsAdmin,
    getStudentsForAdmin,
    setCurrentConversation,
    setupMessageListener
  };
});
