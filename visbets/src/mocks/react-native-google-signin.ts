/**
 * Mock for @react-native-google-signin/google-signin
 * Used in Expo Go / web where the native module isn't available
 */

export const GoogleSignin = {
  configure: (_config: any) => {},
  hasPlayServices: async () => true,
  signIn: async () => { throw new Error('Google Sign-In not available in Expo Go'); },
  signOut: async () => {},
  revokeAccess: async () => {},
  isSignedIn: async () => false,
  getCurrentUser: () => null,
  getTokens: async () => { throw new Error('Not available'); },
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};
