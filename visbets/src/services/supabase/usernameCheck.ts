/**
 * Username availability check via Supabase profiles table.
 * Drop-in replacement for the removed Firebase implementation.
 */

import { supabase } from '../../lib/supabase';

export async function checkUsernameAvailable(username: string): Promise<{
  available: boolean;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;

    return { available: data === null, error: null };
  } catch (err: any) {
    if (__DEV__) console.error('[UsernameCheck] Supabase error:', err.message);
    return { available: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
