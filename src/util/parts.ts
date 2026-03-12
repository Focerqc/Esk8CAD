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
            brands!parts_platform_id_fkey(name, slug),
            part_categories!parts_category_id_fkey(name, slug),
            models!parts_model_id_fkey(name, slug)
          `)
          .eq('status', 'approved')
          .is('deleted_at', null);

        // Dynamic platform filtering using the 'platform' text array column
        if (platform && platform !== 'all') {
          query = query.contains('platform', [platform]);
        }

        const { data, error: sbError } = await query;

        if (sbError) throw sbError;

        if (isMounted && data) {
          let results = data as unknown as Part[];

          // Filter by the new category slug column
          if (categorySlug && categorySlug !== 'all') {
            results = results.filter(p => p.part_categories?.slug === categorySlug);
          }

          setParts(results);
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