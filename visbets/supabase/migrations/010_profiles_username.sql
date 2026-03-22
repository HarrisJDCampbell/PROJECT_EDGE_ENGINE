-- 010_profiles_username.sql
-- Add username column to profiles (used by onboarding and profile display)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique index so username checks and lookups are fast
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles(username)
  WHERE username IS NOT NULL;
