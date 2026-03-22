-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Core tables for VisBets
-- Safe to re-run: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Add columns that may be missing on pre-existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url          text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token          text;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ── User Subscriptions ────────────────────────────────────────────────────────
-- Only the backend (service role) may write to this table.
-- Clients may only read their own row.
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier                    text NOT NULL DEFAULT 'free'
                            CHECK (tier IN ('free', 'starter', 'pro')),
  revenuecat_customer_id  text,
  expires_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user
  ON public.user_subscriptions(user_id);

ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS revenuecat_customer_id text;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.user_subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated users —
-- all writes go through the backend with the service role key.


-- ── Saved Picks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_picks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_id       text NOT NULL,
  player_name     text NOT NULL,
  stat_type       text NOT NULL,
  line            numeric NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('over', 'under')),
  visbets_score   numeric,
  game_date       date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_picks_user ON public.saved_picks(user_id);

ALTER TABLE public.saved_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_picks_select_own" ON public.saved_picks;
CREATE POLICY "saved_picks_select_own" ON public.saved_picks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_picks_insert_own" ON public.saved_picks;
CREATE POLICY "saved_picks_insert_own" ON public.saved_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_picks_delete_own" ON public.saved_picks;
CREATE POLICY "saved_picks_delete_own" ON public.saved_picks
  FOR DELETE USING (auth.uid() = user_id);


-- ── Auto-create profile + subscription row on sign-up ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile with data from Google OAuth
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Provision a free-tier subscription row
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Updated-at helpers ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Permissions ───────────────────────────────────────────────────────────────
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.saved_picks TO authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;
