# VisBets TestFlight Setup Guide

This guide walks you through everything needed to get VisBets ready for TestFlight submission.

---

## 🚨 What You Need to Do (External Tasks)

### 1. Run Database Migrations in Supabase

**Location:** `supabase/migrations/`

You must run these SQL migrations in your Supabase SQL Editor **in order**:

```
1. 001_profiles.sql        (NEW - just created)
2. 002_user_preferences.sql (NEW - just created)
3. 003_user_subscriptions.sql (already exists)
```

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project `iajeabobbjjomjprewhk`
3. Go to SQL Editor
4. Run each migration file in order
5. Verify tables exist: `profiles`, `user_sportsbooks`, `user_sports`, `user_subscriptions`

---

### 2. Set Up EAS Project

**Current:** `app.json` has placeholder `YOUR_EAS_PROJECT_ID`

**Steps:**
```bash
cd visbets
npx eas-cli login
npx eas-cli init
```

This will:
- Create an EAS project linked to your Expo account
- Update `app.json` with your actual project ID

---

### 3. Configure RevenueCat (Production Keys)

**Current:** Using test keys `test_rXjVeyJodrTqbktUDRNsbuFOKmr`

**Steps:**

1. **App Store Connect Setup:**
   - Go to https://appstoreconnect.apple.com
   - Create your app with bundle ID `com.visbets.app`
   - Go to Features > In-App Purchases
   - Create these products:
     | Product ID | Type | Price |
     |------------|------|-------|
     | `visbets_pro_monthly` | Auto-Renewable | $9.99/mo |
     | `visbets_pro_yearly` | Auto-Renewable | $79.99/yr |
     | `visbets_premium_monthly` | Auto-Renewable | $19.99/mo |
     | `visbets_premium_yearly` | Auto-Renewable | $149.99/yr |
   - Create a Subscription Group called "VisBets Premium"
   - Add all products to this group

2. **RevenueCat Setup:**
   - Go to https://app.revenuecat.com
   - Create new project "VisBets"
   - Add iOS app with bundle ID `com.visbets.app`
   - Connect to App Store Connect
   - Create Entitlements: `pro`, `premium`
   - Map products to entitlements
   - Copy your **Public API Key** (not secret!)

3. **Update `.env.production`:**
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_actual_production_key
   ```

---

### 4. Create Privacy Policy

**Required for TestFlight submission**

Create a privacy policy that covers:
- What data you collect (email, phone, username, preferences)
- How you use it (authentication, personalization)
- Third-party services (Supabase, RevenueCat, Ball Don't Lie API)
- User rights (data deletion, export)

**Options:**
- Use a service like Termly, iubenda, or GetTerms
- Host on your website
- Use a GitHub Pages site

**Add URL to App Store Connect** when submitting

---

### 5. (Optional) Create Production Supabase Project

For a real production app, you should use a separate Supabase project:

1. Create new project "visbets-prod" at supabase.com
2. Use paid tier for backups and monitoring
3. Run all migrations on new project
4. Update `.env.production` with new URLs

---

## ✅ What's Already Done (Code Changes)

| Task | Status | File |
|------|--------|------|
| Created profiles migration | ✅ | `supabase/migrations/001_profiles.sql` |
| Created user preferences migration | ✅ | `supabase/migrations/002_user_preferences.sql` |
| Wrapped dev bypass in `__DEV__` | ✅ | `app/_layout.tsx` |
| Wrapped login bypass in `__DEV__` | ✅ | `app/(auth)/login.tsx` |
| Wrapped tier toggle in `__DEV__` | ✅ | `app/(tabs)/profile.tsx` |
| Removed hardcoded API key fallback | ✅ | `src/services/api/ballDontLie.ts` |
| Wrapped debug logging in `__DEV__` | ✅ | `src/services/supabase/auth.ts` |
| Added init timeout (30s) | ✅ | `app/_layout.tsx` |

---

## 🏃 Build & Submit Commands

### Development Build (Testing)
```bash
npx eas build --platform ios --profile development
```

### Preview Build (Internal Testing)
```bash
npx eas build --platform ios --profile preview
```

### Production Build (TestFlight)
```bash
npx eas build --platform ios --profile production
```

### Submit to TestFlight
```bash
npx eas submit --platform ios
```

---

## 📋 Pre-Submission Checklist

Before submitting to TestFlight:

- [ ] All migrations run in Supabase
- [ ] EAS project initialized (`eas init`)
- [ ] RevenueCat production keys in `.env.production`
- [ ] Privacy policy URL ready
- [ ] Production build tested on real device
- [ ] No crashes during auth flow
- [ ] No crashes during onboarding
- [ ] Subscription screen loads correctly
- [ ] Props board displays data

---

## 🔧 Troubleshooting

### "Database error" on signup
→ Migrations not run. Execute `001_profiles.sql` in Supabase SQL Editor.

### "No offerings found" in subscriptions
→ RevenueCat not configured. Check API key and product mappings.

### Infinite loading spinner
→ Check Supabase URL/key in `.env`. Init timeout will show error after 30s.

### Props not loading
→ Ball Don't Lie API key missing. Check `EXPO_PUBLIC_BALL_DONT_LIE_API_KEY` in `.env`.

---

## 📱 App Store Connect Requirements

When you submit, you'll need:

1. **App Information**
   - Name: VisBets
   - Subtitle: NBA Player Props Analytics
   - Category: Sports
   - Privacy Policy URL: (your hosted policy)

2. **Screenshots**
   - 6.7" (iPhone 15 Pro Max): 1290 x 2796
   - 6.5" (iPhone 14 Plus): 1284 x 2778
   - 5.5" (iPhone 8 Plus): 1242 x 2208

3. **App Review Notes**
   - Explain the app's purpose
   - Provide test account if needed
   - Note: This is an analytics/information app, not real gambling

---

## Need Help?

- Expo Docs: https://docs.expo.dev
- RevenueCat Docs: https://docs.revenuecat.com
- Supabase Docs: https://supabase.com/docs
