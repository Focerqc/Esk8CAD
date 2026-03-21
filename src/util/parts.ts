import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Database } from '../types/database.types';

type PublicSchema = Database['public'];
type Tables = PublicSchema['Tables'];

// Strictly typed Part interface using DB types
export type Part = Tables['parts']['Row'] & {
  brands?: Pick<Tables['brands']['Row'], 'name' | 'slug'> | null;
  part_categories?: Pick<Tables['part_categories']['Row'], 'name' | 'slug'> | null;
  models?: Pick<Tables['models']['Row'], 'name' | 'slug'> | null;
  fabrication_methods?: Pick<Tables['fabrication_methods']['Row'], 'name' | 'slug'> | null;
  attributes?: Record<string, any> | null;
};

export const useParts = (platform?: string, categorySlug?: string) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchParts = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        // Fetching with explicit foreign key paths to satisfy TypeScript and align with Supabase schema
        let query = supabase
          .from('parts')
          .select(`
            *,
            brands!inner(*),
            part_categories(*),
            models(*),
            fabrication_methods(*)
          `)
          .eq('status', 'approved')
          .is('deleted_at', null);

        // Filter by the brand slug directly
        if (platform && platform !== 'all') {
          query = query.eq('brands.slug', platform.toLowerCase());
        }

        // Filter by the category slug directly
        if (categorySlug && categorySlug !== 'all') {
          query = query.eq('part_categories.slug', categorySlug.toLowerCase());
        }

        const { data, error: sbError } = await query;

        if (sbError) throw sbError;

        if (isMounted && data) {
          setParts(data as unknown as Part[]);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to fetch parts");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchParts();
    return () => { isMounted = false; };
  }, [platform, categorySlug]);

  return { parts, isLoading, error };
};