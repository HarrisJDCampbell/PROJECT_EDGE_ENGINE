-- VisBets User Preferences Tables
-- Stores user sportsbook and sport preferences
-- Run this in Supabase SQL Editor AFTER 001_profiles.sql

-- Create user_sportsbooks table
CREATE TABLE IF NOT EXISTS user_sportsbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sportsbook TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(user_id, sportsbook)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sportsbooks_user_id ON user_sportsbooks(user_id);

-- Enable RLS
ALTER TABLE user_sportsbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sportsbooks

DROP POLICY IF EXISTS "Users can view own sportsbooks" ON user_sportsbooks;
CREATE POLICY "Users can view own sportsbooks"
  ON user_sportsbooks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sportsbooks" ON user_sportsbooks;
CREATE POLICY "Users can insert own sportsbooks"
  ON user_sportsbooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sportsbooks" ON user_sportsbooks;
CREATE POLICY "Users can delete own sportsbooks"
  ON user_sportsbooks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_sportsbooks TO authenticated;

-- ================================================
-- Create user_sports table
-- ================================================

CREATE TABLE IF NOT EXISTS user_sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(user_id, sport)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sports_user_id ON user_sports(user_id);

-- Enable RLS
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sports

DROP POLICY IF EXISTS "Users can view own sports" ON user_sports;
CREATE POLICY "Users can view own sports"
  ON user_sports
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sports" ON user_sports;
CREATE POLICY "Users can insert own sports"
  ON user_sports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sports" ON user_sports;
CREATE POLICY "Users can delete own sports"
  ON user_sports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_sports TO authenticated;
