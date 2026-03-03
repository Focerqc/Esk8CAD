import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

export interface Part {
    id?: string;
    title: string;
    image_src?: string | string[] | null;
    external_url?: string | null;
    platform: string[];
    category_id?: string | null;
    fabrication_method_id?: string | null;
    // Legacy arrays used previously; keeping them optional so TS doesn't break if old data is returned
    type_of_part?: string[];
    fabrication_method?: string[];
    specs?: Record<string, any>;
    status?: string;
    is_oem?: boolean;
    author?: string | null;
    submitted_by?: string | null;
    dropbox_url?: string | null;
    release_year?: number | null;
    board_model?: string | null;
    needs_model_review?: boolean;
    is_hidden?: boolean;
    deleted_at?: string | null;
    created_at?: string;
}

export interface PartCategory {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
}

export interface FabricationMethod {
    id: string;
    name: string;
    description?: string;
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

    // Defensive deployment check: Includes length-check to prevent shipping a broken bundle
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '' || supabaseUrl === 'undefined' || supabaseUrl.length < 10 || supabaseAnonKey.length < 10) {
        console.error("FATAL ERROR: Supabase environment variables are missing or invalid! GATSBY_SUPABASE_URL and GATSBY_SUPABASE_ANON_KEY must be defined properly.");
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

// Custom hook to fetch part categories
export function usePartCategories() {
    const [categories, setCategories] = useState<PartCategory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchCategories() {
            try {
                const supabase = getSupabaseClient();
                if (!supabase) {
                    throw new Error("Database connection not available.");
                }

                const { data, error: sbError } = await supabase
                    .from('part_categories')
                    .select('*')
                    .order('name', { ascending: true });

                if (sbError) throw sbError;

                if (isMounted) {
                    setCategories(data as PartCategory[]);
                    setError(null);
                }
            } catch (err: any) {
                console.error("Error fetching part categories:", err);
                if (isMounted) {
                    setError(err.message || "Database connection timed out - Retrying");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    return { categories, isLoading, error };
}

// Custom hook to fetch fabrication methods
export function useFabricationMethods() {
    const [methods, setMethods] = useState<FabricationMethod[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchMethods() {
            try {
                const supabase = getSupabaseClient();
                if (!supabase) {
                    throw new Error("Database connection not available.");
                }

                const { data, error: sbError } = await supabase
                    .from('fabrication_methods')
                    .select('*')
                    .order('name', { ascending: true });

                if (sbError) throw sbError;

                if (isMounted) {
                    setMethods(data as FabricationMethod[]);
                    setError(null);
                }
            } catch (err: any) {
                console.error("Error fetching fabrication methods:", err);
                if (isMounted) {
                    setError(err.message || "Database connection timed out - Retrying");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchMethods();

        return () => {
            isMounted = false;
        };
    }, []);

    return { methods, isLoading, error };
}
