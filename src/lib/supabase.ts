import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Part {
    id?: string;
    title: string;
    image_src: string;
    external_url: string;
    platform: string[];
    type_of_part: string[];
    fabrication_method: string[];
    specs?: Record<string, any>;
    status?: string;
    is_oem?: boolean;
    author?: string;
    submitted_by?: string;
    dropbox_url?: string;
    created_at?: string;
}

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    if (typeof window === 'undefined') {
        return null; // Return null during Gatsby SSR
    }

    const supabaseUrl = process.env.GATSBY_SUPABASE_URL;
    const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY;

    // DIAGNOSTIC LOGGING: Log only the presence of keys, not values.
    console.log("Supabase URL present:", !!supabaseUrl);
    console.log("Supabase Anon Key present:", !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '' || supabaseUrl === 'undefined') {
        console.error("FATAL ERROR: Supabase environment variables are missing! GATSBY_SUPABASE_URL and GATSBY_SUPABASE_ANON_KEY must be defined.");
        return null; // Gracefully handle missing variables by returning null
    }

    // Safely parse URL to prevent Fetch errors
    const sanitizedUrl = supabaseUrl.trim().replace(/\/+$/, '');
    const sanitizedKey = supabaseAnonKey.trim();

    // DEFENSIVE SINGLETON: Ensure it's a real URL
    if (!sanitizedUrl.startsWith('http')) {
        console.error("FATAL ERROR: Supabase URL is invalid.");
        return null;
    }

    supabaseInstance = createClient(sanitizedUrl, sanitizedKey);

    return supabaseInstance;
}
