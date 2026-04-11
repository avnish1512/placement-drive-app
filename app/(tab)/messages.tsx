import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';

const formatTime = (date: any) => {
  if (!date) return 'unknown';
  
  // Handle Firestore Timestamp objects
  let dateObj = date;
  if (date && typeof date === 'object') {
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'unknown';
    }
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'unknown';
  }

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return dateObj.toLocaleDateString();
};

function ChatView({ conversation, onBack }: { conversation: any; onBack: () => void }) {
  const { student } = useAuth();
  const { sendMessageAsStudent, markMessagesAsRead } = useMessaging();
  const [messageText, setMessageText] = useState('');
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Update displayed messages when conversation changes
  useEffect(() => {
    if (conversation?.messages) {
      setDisplayedMessages(conversation.messages);
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (conversation?.id) {
      markMessagesAsRead(conversation.id);
    }
  }, [conversation?.id, markMessagesAsRead]);

  const handleSendMessage = () => {
    if (messageText.trim() && student && conversation?.id) {
      // Pass the admin ID from conversation
      sendMessageAsStudent(student.id, student.name || 'Student', messageText, conversation.adminId);
      setMessageText('');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  if (!conversation) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Loading conversation...</Text>
      </View>
    );
  }

  const messages = displayedMessages || [];

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
          <Text style={styles.chatHeaderTitle}>{conversation.adminName || 'Admin'}</Text>
          <Text style={styles.chatHeaderSubtitle}>Placement Admin</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages && messages.length > 0 ? (
          messages.map((message: any) => (
          <View
            key={message.id}
            style={[
              styles.messageItem,
              message.senderRole === 'student' ? styles.studentMessage : styles.adminMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.senderRole === 'student'
                  ? styles.studentBubble
                  : styles.adminBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.senderRole === 'student'
                    ? styles.studentMessageText
                    : styles.adminMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.senderRole === 'student'
                    ? styles.studentMessageTime
                    : styles.adminMessageTime,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))
        ) : (
          <View style={styles.emptyMessagesState}>
            <Text style={styles.emptyMessagesText}>No messages yet</Text>
            <Text style={styles.emptyMessagesSubtext}>Start a conversation with the admin</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          scrollEnabled
        />
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

function ConversationList() {
  const { student } = useAuth();
  const { conversations, getStudentConversation } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);

  useEffect(() => {
    if (!student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Initialize student conversation
    getStudentConversation(student.id)
      .then(conv => {
        console.log('Conversation loaded:', conv);
        if (conv) {
          // Set initial conversation
          setConversation(conv);
        }
      })
      .catch(err => {
        console.error('Error loading conversation:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [student?.id]);

  // Update conversation when store conversations change
  useEffect(() => {
    if (student && conversations.length > 0) {
      // Find the conversation for this student using the default admin ID
      const conversationId = [student.id, DEFAULT_ADMIN_ID].sort().join('_');
      const found = conversations.find(c => c.id === conversationId);
      
      // Always update if found, regardless of message count
      if (found) {
        setConversation(found);
      }
    }
  }, [conversations, student]);

  if (!student) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Please login</Text>
      </View>
    );
  }

  if (selectedConversation) {
    return (
      <ChatView
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {conversation && conversation.adminName ? (
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => setSelectedConversation(conversation)}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👨‍💼</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationName}>{conversation.adminName}</Text>
              <Text style={styles.conversationTime}>
                {formatTime(conversation.lastMessageTime)}
              </Text>
            </View>
            <View style={styles.messageRow}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Your admin conversations will appear here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <ConversationList />
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
  // Chat View Styles
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
    justifyContent: 'flex-end',
  },
  adminMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  studentBubble: {
    backgroundColor: '#E2231A',
  },
  adminBubble: {
    backgroundColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
  },
  studentMessageText: {
    color: '#FFFFFF',
  },
  adminMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  studentMessageTime: {
    color: '#FECACA',
  },
  adminMessageTime: {
    color: '#9CA3AF',
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
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Conversation List Styles
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 28,
  },
  avatarText: {
    fontSize: 28,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#E2231A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
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
  emptyMessagesState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});