import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy Singleton pattern reference
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
    // Return early if we already initialized
    if (supabaseInstance) return supabaseInstance;

    // SSR Guard - prevents Gatsby build crashes
    if (typeof window === 'undefined') {
        return null;
    }

    const supabaseUrl = process.env.GATSBY_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY || '';

    // Defensive deployment check - length checks to avoid starting a broken bundle
    if (!supabaseUrl || supabaseUrl.length < 10 || !supabaseAnonKey || supabaseAnonKey.length < 10) {
        console.error("FATAL ERROR: Supabase environment variables are missing or invalid!");
        return null; // Gracefully handle missing variables to avoid crashing the client
    }

    // Safely parse URL to prevent Fetch errors
    const sanitizedUrl = supabaseUrl.trim().replace(/\/+$/, '');
    const sanitizedKey = supabaseAnonKey.trim();

    supabaseInstance = createClient(sanitizedUrl, sanitizedKey);
    return supabaseInstance;
};
