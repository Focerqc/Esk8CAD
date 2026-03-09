import { useState, useEffect } from 'react';
import { getSupabaseClient, Model } from '../lib/supabase';

export function useBrandHardware(brandId: string | null) {
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchHardware() {
            if (!brandId) {
                if (isMounted) {
                    setModels([]);
                }
                return;
            }

            const client = getSupabaseClient();
            if (!client) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch from the dedicated 'models' table instead of 'parts'
                let query = client
                    .from('models')
                    .select('*, brands!inner(name)')
                    .order('name', { ascending: true });

                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(brandId);

                if (isUuid) {
                    query = query.eq('brand_id', brandId);
                } else {
                    query = query.ilike('brands.name', brandId);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                if (isMounted && data) {
                    const mapped = (data as any[]).map(m => ({
                        ...m,
                        name: m.name || 'Unnamed Model',
                        description: m.description || m.description_text || m.overview_text || '',
                        image_url: m.image_url || 'https://vupaclakcmrkzmrgmfou.supabase.co/storage/v1/object/public/brand-assets/placeholder.png'
                    }));
                    setModels(mapped);
                }
            } catch (err: any) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchHardware();

        return () => { isMounted = false; };
    }, [brandId]);

    return { models, isLoading, error };
}
