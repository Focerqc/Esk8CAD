import { useState, useEffect } from 'react';
import { getSupabaseClient, Part } from '../lib/supabase';

interface UsePartsResult {
    parts: Part[];
    loading: boolean;
    error: Error | null;
}

export const useParts = (): UsePartsResult => {
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchParts = async () => {
            try {
                setLoading(true);
                setError(null);

                const supabase = getSupabaseClient();

                // If supabase is null (e.g., during Gatsby SSR build), we skip fetching
                if (!supabase) {
                    if (typeof window !== 'undefined') {
                        throw new Error('Supabase client failed to initialize on the client.');
                    }
                    setLoading(false);
                    return;
                }

                const { data, error: supabaseError } = await supabase
                    .from('parts')
                    .select('*')
                    .eq('status', 'approved');

                if (supabaseError) {
                    throw new Error(supabaseError.message);
                }

                if (isMounted) {
                    // Cast data as Part array type based on the interface from supabase.ts
                    setParts((data as Part[]) || []);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchParts();

        // Cleanup function to avoid state updates if the component unmounts before fetch completes
        return () => {
            isMounted = false;
        };
    }, []);

    return { parts, loading, error };
};
