
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Prevent "Acquiring an exclusive Navigator LockManager lock timed out" error
    // by bypassing the lock mechanism. This may happen if the browser's lock manager
    // is stuck or in a conflicting state.
    lock: async (_, __, fn) => {
      return fn();
    },
  },
});
