-- Migration 003: Add subscription tracking columns
-- Extends 001's user_subscriptions table with RevenueCat sync fields.
-- The table and its tier CHECK ('free','starter','pro') are already defined in 001.
-- Safe to re-run: all statements use ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS will_renew boolean NOT NULL DEFAULT false;
