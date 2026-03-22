-- 009_promo_redeem_function.sql
-- Creates the redeem_promo_code RPC function that the backend calls.
-- This was missing from 006_promo_codes.sql (tables were created but the function was not).

CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_code TEXT,
  p_user_id UUID
) RETURNS TABLE(
  promo_tier TEXT,
  duration_days INT,
  promo_expires_at TIMESTAMPTZ,
  error_code TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Lock the promo code row for update (prevents race conditions)
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'invalid_code'::TEXT;
    RETURN;
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'code_expired'::TEXT;
    RETURN;
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'code_exhausted'::TEXT;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM promo_redemptions WHERE user_id = p_user_id AND code = p_code) THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'already_redeemed'::TEXT;
    RETURN;
  END IF;

  v_expires := NOW() + (v_promo.duration_days || ' days')::INTERVAL;

  INSERT INTO promo_redemptions(user_id, code, promo_tier, promo_expires_at)
  VALUES (p_user_id, p_code, v_promo.promo_tier, v_expires);

  UPDATE promo_codes SET used_count = used_count + 1 WHERE code = p_code;

  RETURN QUERY SELECT v_promo.promo_tier, v_promo.duration_days, v_expires, NULL::TEXT;
END;
$$;
