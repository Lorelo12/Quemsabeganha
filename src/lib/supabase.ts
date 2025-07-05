import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validates if the given string is a valid URL.
 * @param url The string to validate.
 * @returns True if the URL is valid, false otherwise.
 */
const isValidUrl = (url: string | undefined): url is string => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

// Check that all required Supabase environment variables are set and valid before initializing
if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    // Initialization failed. The UI will handle informing the user.
    supabase = null;
  }
}

export { supabase };
