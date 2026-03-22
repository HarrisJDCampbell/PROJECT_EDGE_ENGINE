# VisBets Launch Setup Checklist

## Prerequisites
- [ ] Xcode 15+ installed (for iOS build)
- [ ] Node.js 20+ / npm 10+
- [ ] EAS CLI: `npm install -g eas-cli`

---

## 1. Supabase (New Project)
> Use a **dedicated** Supabase project for this app, NOT the marketing site.

- [ ] Create project at [supabase.com](https://supabase.com)
- [ ] Copy **Project URL** and **anon public key** → `visbets/.env`
- [ ] Copy **service_role key** → `backend/.env`
- [ ] Run migration: `supabase db push` (or paste `visbets/supabase/migrations/001_profiles.sql` into SQL editor)
- [ ] Enable **Google** provider in Auth → Providers
  - Web Client ID: `919869394014-2igj066gi2buvpc7f694g12kah2h5s8u.apps.googleusercontent.com`
  - Web Client Secret: (from Google Cloud Console)
- [ ] Enable **Phone** provider in Auth → Providers (Twilio or built-in)
- [ ] Set JWT expiry to 3600s (Auth → Settings)

---

## 2. Google OAuth
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com) → project `919869394014`
- [ ] Add iOS OAuth credential:
  - Bundle ID: `com.userrealitylabs.visbets`
  - iOS Client ID: `919869394014-92bb4sotbe9tqttm3vs2ilhto0u8fhg8.apps.googleusercontent.com`
- [ ] Add authorized redirect URI to Web credential:
  - `https://<your-supabase-project>.supabase.co/auth/v1/callback`

---

## 3. RevenueCat
- [ ] Create app at [app.revenuecat.com](https://app.revenuecat.com)
- [ ] Bundle ID: `com.userrealitylabs.visbets`
- [ ] Create entitlements: `starter`, `pro`
- [ ] Create products in App Store Connect:
  - `visbets_starter_monthly` — $14.99/mo
  - `visbets_starter_annual`  — $119.99/yr
  - `visbets_pro_monthly`     — $29.99/mo
  - `visbets_pro_annual`      — $239.99/yr
- [ ] Attach products to entitlements in RevenueCat
- [ ] Copy iOS API key → `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in `visbets/.env`
- [ ] Set up webhook:
  - URL: `https://your-backend-railway-domain/api/subscriptions/webhook`
  - Shared secret → `REVENUECAT_WEBHOOK_SECRET` in `backend/.env`

---

## 4. Backend (Railway)
- [ ] Push `/backend` to a GitHub repo (or Railway Git)
- [ ] Create Railway project → Deploy from repo
- [ ] Set environment variables in Railway dashboard (see `backend/.env.example`):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `API_SPORTS_KEY` — from [api-sports.io](https://api-sports.io) NBA plan
  - `ODDS_API_KEY` — from [the-odds-api.com](https://the-odds-api.com)
  - `REVENUECAT_WEBHOOK_SECRET`
- [ ] Note deployed URL → `EXPO_PUBLIC_API_BASE_URL` in `visbets/.env`

---

## 5. Frontend Environment (`visbets/.env`)
Copy `visbets/.env.example` to `visbets/.env` and fill in:
```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=919869394014-92bb4sotbe9tqttm3vs2ilhto0u8fhg8.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=919869394014-2igj066gi2buvpc7f694g12kah2h5s8u.apps.googleusercontent.com
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<rc ios key>
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<rc android key>
EXPO_PUBLIC_AMPLITUDE_API_KEY=<amplitude key>
EXPO_PUBLIC_API_BASE_URL=https://<railway-domain>.railway.app
```

---

## 6. Amplitude Analytics
- [ ] Create project at [amplitude.com](https://amplitude.com)
- [ ] Copy API key → `EXPO_PUBLIC_AMPLITUDE_API_KEY`

---

## 7. EAS / App Store Connect
- [ ] `eas login`
- [ ] `eas build:configure` (run from `visbets/`)
- [ ] Verify `app.json` bundle ID: `com.userrealitylabs.visbets`
- [ ] Add notification icon at `visbets/assets/notification-icon.png` (96×96 white on transparent)
- [ ] `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios`

---

## 8. Final Verification
- [ ] Google Sign-In works in simulator (TestFlight required for production)
- [ ] Phone OTP works (requires Supabase phone provider configured)
- [ ] Subscription screen shows live RevenueCat packages
- [ ] Backend `/health` responds with `{ status: 'ok' }`
- [ ] RevenueCat webhook fires on test purchase
- [ ] Analytics events appear in Amplitude dashboard

---

## Key IDs Reference
| Key | Value |
|-----|-------|
| Bundle ID | `com.userrealitylabs.visbets` |
| Google iOS Client ID | `919869394014-92bb4sotbe9tqttm3vs2ilhto0u8fhg8.apps.googleusercontent.com` |
| Google Web Client ID | `919869394014-2igj066gi2buvpc7f694g12kah2h5s8u.apps.googleusercontent.com` |
| Starter monthly product | `visbets_starter_monthly` |
| Starter annual product | `visbets_starter_annual` |
| Pro monthly product | `visbets_pro_monthly` |
| Pro annual product | `visbets_pro_annual` |
| RC entitlement (Starter) | `starter` |
| RC entitlement (Pro) | `pro` |
