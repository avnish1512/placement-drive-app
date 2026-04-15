import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, Search, MessageSquare, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { DEFAULT_ADMIN_ID, ADMIN_NAME } from '@/constants/admin';

const toJsDate = (value: any): Date => {
  if (!value) return new Date();
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  return new Date(value);
};

const formatTime = (raw: any): string => {
  const d = toJsDate(raw);
  const diff = Date.now() - d.getTime();
  if (isNaN(diff)) return '';
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

// ── Admin Chat View ────────────────────────────────────────────────────────
function AdminChatView({
  conversationId,
  studentName,
  onBack,
}: {
  conversationId: string;
  studentName: string;
  onBack: () => void;
}) {
  const { admin } = useAuth();
  const { conversations, sendMessageAsAdmin, markMessagesAsRead } = useMessaging();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Always read from live store
  const conversation = conversations.find(c => c.id === conversationId);
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (conversationId) markMessagesAsRead(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !admin) return;
    setMessageText('');
    setIsSending(true);
    try {
      await sendMessageAsAdmin(conversationId, admin.id, admin.name || 'Admin', text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.studentAvatarWrap}>
          <Text style={styles.studentAvatarText}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>{studentName}</Text>
          <Text style={styles.chatHeaderSub}>Student</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <MessageSquare size={40} color="#D1D5DB" />
            <Text style={styles.emptyMsgText}>No messages yet</Text>
            <Text style={styles.emptyMsgSub}>Send a message to start the conversation</Text>
          </View>
        ) : (
          messages.map((msg: any) => {
            const isAdmin = msg.senderRole === 'admin';
            return (
              <View key={msg.id} style={[styles.msgRow, isAdmin ? styles.myRow : styles.theirRow]}>
                <View style={[styles.bubble, isAdmin ? styles.adminBubble : styles.studentBubble]}>
                  <Text style={[styles.bubbleText, isAdmin ? styles.adminBubbleText : styles.studentBubbleText]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isAdmin ? styles.adminBubbleTime : styles.studentBubbleTime]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your reply..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxHeight={100}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!messageText.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
        >
          {isSending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Send size={18} color="#FFFFFF" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Main Admin Messaging Screen ────────────────────────────────────────────
export default function AdminMessagingScreen() {
  const { admin } = useAuth();
  const { conversations, getAdminConversations } = useMessaging();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadConversations = () => {
    // Always use DEFAULT_ADMIN_ID — this is what students write into conversations
    getAdminConversations(DEFAULT_ADMIN_ID);
  };

  useEffect(() => {
    if (!admin) { setIsLoading(false); return; }
    loadConversations();
    // Fallback: stop spinner after 6s if no conversations come in
    const t = setTimeout(() => setIsLoading(false), 6000);
    return () => clearTimeout(t);
  }, [admin?.id]);

  // Stop loading spinner as soon as conversations arrive
  useEffect(() => {
    if (!hasLoadedRef.current && conversations !== undefined) {
      hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [conversations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoadedRef.current = false;
    loadConversations();
    setTimeout(() => setIsRefreshing(false), 3000);
  };

  if (!admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Admin Access Required</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show chat view if a conversation is selected
  if (selectedConvId) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminChatView
          conversationId={selectedConvId}
          studentName={selectedStudentName}
          onBack={() => { setSelectedConvId(null); setSelectedStudentName(''); }}
        />
      </SafeAreaView>
    );
  }

  const filtered = conversations.filter(c =>
    !searchText ||
    (c.studentName || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Student Queries</Text>
          <Text style={styles.headerSub}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <RefreshCw size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      {conversations.length > 0 && (
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <MessageSquare size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {searchText ? 'No results found' : 'No student messages yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText
              ? 'Try a different search'
              : 'When students send messages, they will appear here'}
          </Text>
          {!searchText && (
            <TouchableOpacity style={styles.refreshAction} onPress={handleRefresh}>
              <RefreshCw size={16} color="#6366F1" />
              <Text style={styles.refreshActionText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#6366F1']} />
          }
        >
          {filtered.map(conv => {
            const unread = (conv.messages || []).filter(
              (m: any) => m.senderRole === 'student' && !m.read
            ).length;
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.convItem}
                onPress={() => {
                  setSelectedConvId(conv.id);
                  setSelectedStudentName(conv.studentName || 'Student');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.convAvatar}>
                  <Text style={styles.convAvatarText}>👤</Text>
                </View>
                <View style={styles.convBody}>
                  <View style={styles.convHeader}>
                    <Text style={styles.convName}>{conv.studentName || 'Student'}</Text>
                    <Text style={styles.convTime}>{formatTime(conv.lastMessageTime)}</Text>
                  </View>
                  <View style={styles.convFooter}>
                    <Text style={styles.convLastMsg} numberOfLines={1}>
                      {conv.lastMessage || 'No messages'}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  refreshBtn: { padding: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },

  loadingText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 14, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  refreshAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE', backgroundColor: '#EEF2FF',
  },
  refreshActionText: { color: '#6366F1', fontWeight: '600', fontSize: 14 },

  convItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  convAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EEF2FF', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  convAvatarText: { fontSize: 24 },
  convBody: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  convTime: { fontSize: 12, color: '#9CA3AF' },
  convFooter: { flexDirection: 'row', alignItems: 'center' },
  convLastMsg: { fontSize: 13, color: '#6B7280', flex: 1, marginRight: 6 },
  badge: {
    backgroundColor: '#6366F1', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Chat view
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  studentAvatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 20 },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  chatHeaderSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  messagesContainer: { flex: 1, paddingHorizontal: 14 },
  emptyMessages: { alignItems: 'center', paddingTop: 80 },
  emptyMsgText: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 14 },
  emptyMsgSub: { fontSize: 13, color: '#C4C4C4', marginTop: 6, textAlign: 'center' },

  msgRow: { marginVertical: 3, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14,
    paddingTop: 8, paddingBottom: 6, borderRadius: 16,
  },
  adminBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  studentBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  adminBubbleText: { color: '#FFFFFF' },
  studentBubbleText: { color: '#1F2937' },
  bubbleTime: { fontSize: 10, marginTop: 3 },
  adminBubbleTime: { color: '#C7D2FE', textAlign: 'right' },
  studentBubbleTime: { color: '#9CA3AF' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1F2937', maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});
