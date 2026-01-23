import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "@/lib/notifications";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isDemoMode } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!isAuthenticated || isDemoMode) {
      return;
    }

    // Register for push notifications
    registerForPushNotifications().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        const success = await sendPushTokenToBackend(token);
        setIsRegistered(success);
        console.log("Push notification registration:", success ? "success" : "failed");
      }
    });

    // Listen for incoming notifications
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
      setNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = addNotificationResponseListener((response) => {
      console.log("Notification response:", response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data?.type === "task") {
        // Could navigate to task detail
        console.log("Navigate to task:", data.taskId);
      } else if (data?.type === "badge") {
        // Could navigate to progress screen
        console.log("Navigate to progress for badge");
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, isDemoMode]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        isRegistered,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
