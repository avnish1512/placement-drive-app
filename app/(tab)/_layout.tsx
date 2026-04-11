import { Tabs } from "expo-router";
import { Home, Briefcase, MessageCircle, Grid3X3 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/notifications-store";
import { useMessaging } from "@/hooks/messaging-store";
import { useAuth } from "@/hooks/auth-store";

export default function TabLayout() {
  const { student } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { conversations } = useMessaging();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  // Calculate total unread messages from conversations
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setMessageUnreadCount(total);
    } else {
      setMessageUnreadCount(0);
    }
  }, [conversations]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
          tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          tabBarBadge: messageUnreadCount > 0 ? messageUnreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Grid3X3 color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
