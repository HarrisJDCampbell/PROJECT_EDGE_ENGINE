# OAuth Setup Guide for VisBets

This guide covers the complete setup for Google OAuth to work in development (Expo Go) and production (standalone builds).

## Quick Checklist

- [ ] Google Cloud Console: Create OAuth 2.0 credentials
- [ ] Google Cloud Console: Add Supabase callback URL
- [ ] Supabase: Enable Google provider with client ID/secret
- [ ] Supabase: Add all redirect URLs
- [ ] Test in Expo Go
- [ ] Test in standalone build

---

## Step 1: Google Cloud Console Setup

### 1.1 Create a Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it something like "VisBets"

### 1.2 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: `VisBets`
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (your email) while in testing mode
6. Submit for verification when ready for production

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** (yes, even for mobile - Supabase handles the redirect)
4. Name: `VisBets Web Client`
5. Add **Authorized redirect URIs**:
   ```
   https://iajeabobbjjomjprewhk.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these for Supabase

---

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `iajeabobbjjomjprewhk`
3. Go to **Authentication > Providers**
4. Find **Google** and enable it
5. Enter the **Client ID** and **Client Secret** from Google Cloud Console
6. Save

### 2.2 Configure Redirect URLs
1. Go to **Authentication > URL Configuration**
2. In **Redirect URLs**, add ALL of these:

**For Expo Go (development):**
```
exp://localhost:8081/--/auth/callback
exp://127.0.0.1:8081/--/auth/callback
```

**For your local network IP (check terminal when running `npx expo start`):**
```
exp://192.168.1.XXX:8081/--/auth/callback
```
(Replace XXX with your actual IP - shown in terminal)

**For standalone builds (production):**
```
visbets://auth/callback
visbets-dev://auth/callback
visbets-preview://auth/callback
```

**Supabase callback (required):**
```
https://iajeabobbjjomjprewhk.supabase.co/auth/v1/callback
```

3. Click **Save**

---

## Step 3: Environment-Specific Notes

### Development (Expo Go)
- The redirect URL changes based on your network IP
- Check the console when you tap "Sign in with Google" - it logs the exact URL needed
- Add that URL to Supabase if not already present

### Preview/Staging Builds
- Uses `visbets-preview://auth/callback`
- Build with: `eas build --profile preview`

### Production Builds
- Uses `visbets://auth/callback`
- Build with: `eas build --profile production`

---

## Step 4: iOS-Specific Setup (for standalone builds)

### 4.1 App Store Connect (for production)
1. Your bundle identifier: `com.visbets.app`
2. The OAuth flow uses in-app browser, so no additional Apple setup is needed

### 4.2 Testing on iOS Simulator
- OAuth works in simulator via the in-app browser
- No additional setup required

---

## Step 5: Android-Specific Setup (for standalone builds)

### 5.1 SHA-1 Certificate (if using native Google Sign-In)
The current implementation uses browser-based OAuth, so SHA-1 is NOT required.

If you switch to native Google Sign-In in the future:
1. Get debug SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
2. Get release SHA-1 from EAS: `eas credentials`
3. Add to Google Cloud Console > Credentials > Your OAuth Client

### 5.2 Package Name
- Your package: `com.visbets.app`
- Already configured in `app.json`

---

## Troubleshooting

### "redirect_uri_mismatch" Error
**Cause:** The redirect URL in the app doesn't match what's in Supabase
**Fix:**
1. Check console logs for the exact redirect URL being used
2. Add that exact URL to Supabase > Authentication > URL Configuration

### "OAuth request timed out"
**Cause:** Network issues or Supabase configuration
**Fix:**
1. Check internet connection
2. Verify Supabase URL and anon key in `.env`
3. Ensure Google provider is enabled in Supabase

### "No tokens received"
**Cause:** Callback URL not handling the response correctly
**Fix:**
1. Ensure the redirect URL is in Supabase's allowed list
2. Check that the URL scheme matches (`visbets://` for standalone, `exp://` for Expo Go)

### Sign-in works in Expo Go but not in standalone build
**Fix:**
1. Add `visbets://auth/callback` to Supabase redirect URLs
2. Rebuild the app with `eas build`

### Sign-in opens browser but nothing happens after Google auth
**Fix:**
1. The deep link isn't being captured
2. Verify `scheme` in `app.json` includes your scheme
3. For iOS: rebuild the app
4. For Android: clear app data and rebuild

---

## Current Configuration

**Supabase Project:** `iajeabobbjjomjprewhk`
**Supabase URL:** `https://iajeabobbjjomjprewhk.supabase.co`

**App Schemes (app.json):**
- `visbets` (production)
- `visbets-preview` (preview)
- `visbets-dev` (development)

**Bundle/Package ID:** `com.visbets.app`

---

## Testing Checklist

### Expo Go Testing
1. Run `npx expo start`
2. Note the IP address shown (e.g., `exp://192.168.1.100:8081`)
3. Ensure that IP + `/--/auth/callback` is in Supabase redirect URLs
4. Tap Google sign-in button
5. Complete Google auth
6. Should redirect back and sign you in

### Standalone Build Testing
1. Build: `eas build --profile development --platform ios` (or android)
2. Install on device
3. Tap Google sign-in
4. Complete Google auth
5. Should redirect back via `visbets://auth/callback`

---

## Production Deployment Checklist

Before going live:

1. [ ] Google OAuth consent screen is verified (or at least submitted)
2. [ ] Production Supabase project created (separate from dev)
3. [ ] Update `.env.production` with production Supabase keys
4. [ ] All redirect URLs added to production Supabase
5. [ ] RevenueCat production API keys configured
6. [ ] App submitted to App Store / Play Store
7. [ ] Deep links tested on physical devices
