import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, Search } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';

// Safely convert a Firestore Timestamp, JS Date, epoch number or ISO string → JS Date
const toJsDate = (value: any): Date => {
  if (!value) return new Date();
  // Firestore Timestamp object has a toDate() method
  if (typeof value?.toDate === 'function') return value.toDate();
  // Already a JS Date
  if (value instanceof Date) return value;
  // Epoch seconds (Firestore { seconds, nanoseconds })
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  // Number or parseable string
  return new Date(value);
};

const formatTime = (rawTimestamp: any): string => {
  const date = toJsDate(rawTimestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
};

function StudentChatView({ conversation, adminName, onBack }: { conversation: any; adminName: string; onBack: () => void }) {
  const { sendMessageAsAdmin, markMessagesAsRead } = useMessaging();
  const { admin } = useAuth();

  if (!conversation || !conversation.messages) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>No conversation available</Text>
        </View>
      </SafeAreaView>
    );
  }
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim() && admin) {
      sendMessageAsAdmin(conversation.id, admin.id, admin.name, messageText);
      setMessageText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.chatContainer}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View>
          <Text style={styles.chatHeaderTitle}>{conversation.studentName}</Text>
          <Text style={styles.chatHeaderSubtitle}>Student Query</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer}>
        {conversation.messages.map((message: any) => (
          <View
            key={message.id}
            style={[
              styles.messageItem,
              message.senderRole === 'admin' ? styles.adminMessage : styles.studentMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.senderRole === 'admin'
                  ? styles.adminBubble
                  : styles.studentBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.senderRole === 'admin'
                    ? styles.adminMessageText
                    : styles.studentMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.senderRole === 'admin'
                    ? styles.adminMessageTime
                    : styles.studentMessageTime,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your response..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </View>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Send size={20} color={messageText.trim() ? '#E2231A' : '#D1D5DB'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function StudentListView({ students, onSelectStudent }: { students: any[]; onSelectStudent: (student: any) => void }) {
  const [searchText, setSearchText] = useState('');

  const filteredStudents = students.filter((student: any) =>
    student.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Student List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student: any) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentItem}
              onPress={() => onSelectStudent(student)}
            >
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>

              <View style={styles.studentContent}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentId}>ID: {student.id}</Text>
              </View>

              {student.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{student.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

export default function AdminMessagingScreen() {
  const { admin } = useAuth();
  const { conversations, getAdminConversations, getStudentSpecificConversation } = useMessaging();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Set up admin conversations listener on mount
  useEffect(() => {
    if (admin?.id) {
      getAdminConversations(admin.id);
    }
  }, [admin?.id, getAdminConversations]);

  if (!admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Admin Access Required</Text>
          <Text style={styles.emptySubtitle}>Please login as admin to access this section</Text>
        </View>
      </SafeAreaView>
    );
  }

  const students = (conversations as any[])
    .map((conv: any) => ({
      id: conv.studentId,
      name: conv.studentName,
      unreadCount: (conv.messages || []).filter(
        (msg: any) => msg.senderRole === 'student' && !msg.read
      ).length,
    })) || [];

  if (selectedStudent) {
    const conversation = getStudentSpecificConversation(admin?.id || '', selectedStudent?.id || '') || (conversations && conversations[0]) || null;
    return (
      <SafeAreaView style={styles.container}>
        <StudentChatView
          conversation={conversation}
          adminName={admin.name}
          onBack={() => setSelectedStudent(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Queries</Text>
      </View>
      <StudentListView students={students} onSelectStudent={setSelectedStudent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  // Search Section
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    height: 40,
    gap: 8,
  },
  searchIcon: {
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  // Student List
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  studentContent: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#E2231A',
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Chat View
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageItem: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  studentMessage: {
    justifyContent: 'flex-start',
  },
  adminMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  studentBubble: {
    backgroundColor: '#E5E7EB',
  },
  adminBubble: {
    backgroundColor: '#E2231A',
  },
  messageText: {
    fontSize: 14,
  },
  studentMessageText: {
    color: '#1F2937',
  },
  adminMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  studentMessageTime: {
    color: '#9CA3AF',
  },
  adminMessageTime: {
    color: '#FECACA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    maxHeight: 100,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
