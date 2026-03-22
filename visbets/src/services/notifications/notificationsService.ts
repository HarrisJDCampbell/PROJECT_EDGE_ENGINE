/**
 * Notifications Service
 * Handles push notification permissions and token registration.
 * Uses expo-notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationsService = {
  /**
   * Request permissions and register the Expo push token.
   * Stores the token in the user's profile row.
   */
  requestPermissions: async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('[Notifications] Permission denied');
        return null;
      }

      // Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;

      // Persist token to Supabase profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: token } as never)
          .eq('id', user.id);
      }

      if (__DEV__) console.log('[Notifications] Push token:', token);
      return token;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return null;
    }
  },

  /**
   * Add a listener for received notifications.
   * Returns an unsubscribe function.
   */
  addNotificationListener: (
    handler: (notification: Notifications.Notification) => void
  ): (() => void) => {
    const subscription = Notifications.addNotificationReceivedListener(handler);
    return () => subscription.remove();
  },

  /**
   * Add a listener for notification response (tap).
   * Returns an unsubscribe function.
   */
  addResponseListener: (
    handler: (response: Notifications.NotificationResponse) => void
  ): (() => void) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handler);
    return () => subscription.remove();
  },
};
