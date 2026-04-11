import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/hooks/auth-store";
import { JobsProvider } from "@/hooks/jobs-store";
import { MessagingProvider } from "@/hooks/messaging-store";
import { NotificationsProvider } from "@/hooks/notifications-store";
import CustomSplashScreen from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
        },
      },
    });
  }
  return queryClient;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, isAdmin, student } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to dashboard if logged in
        if (isAdmin) {
          router.replace("/admin-dashboard");
        } else {
          // Check if student has completed profile setup
          if (!student?.profileCompleted) {
            router.replace("/profile-setup");
          } else {
            router.replace("/(tab)");
          }
        }
      } else {
        // Redirect to login if not logged in
        router.replace("/unified-login");
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, student?.profileCompleted]);

  if (isLoading) {
    return <CustomSplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      {/* Auth Screens */}
      <Stack.Screen name="unified-login" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      
      {/* App Screens */}
      <Stack.Screen name="(tab)" options={{ headerShown: false }} />
      <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin-messaging" options={{ title: "Messaging" }} />
      <Stack.Screen name="admin-manage-companies" options={{ title: "Manage Companies" }} />
      <Stack.Screen name="admin-manage-students" options={{ title: "Manage Students" }} />
      <Stack.Screen name="job/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="applications" options={{ title: "My Applications" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Simulate app initialization time
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAppReady(true);
      SplashScreen.hideAsync();
    };

    initializeApp();
  }, []);

  if (!appReady) {
    return <CustomSplashScreen />;
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Global error caught:', error);
          console.error('Stack:', errorInfo?.componentStack);
          // TODO: Send error to error tracking service (e.g., Sentry, Firebase Crashlytics)
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <JobsProvider>
              <MessagingProvider>
                <NotificationsProvider>
                  <RootLayoutNav />
                </NotificationsProvider>
              </MessagingProvider>
            </JobsProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}