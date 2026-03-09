import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient, Brand, Model } from '../lib/supabase';

export interface OrganizedBrands {
    brands: Brand[];
    models: Model[];
    groupedBrands: {
        group1: Brand[];
        group2: Brand[];
        group3: Brand[];
    };
    special: Brand[];
    groupedModels: Record<string, Model[]>;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useBoardHook(): OrganizedBrands {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error("Supabase client not initialized");

            const [{ data: bData, error: bError }, { data: mData, error: mError }] = await Promise.all([
                supabase.from('brands').select('*').order('name'),
                supabase.from('models').select('*').order('name')
            ]);

            if (bError) throw bError;
            if (mError) throw mError;

            // FORGIVING MAPPER: Brands
            const mappedBrands = (bData || []).map((b: any) => ({
                ...b,
                name: b.name || b.slug || 'Unnamed Brand',
                description: b.description || b.overview_text || b.description_text || '',
                image_url: b.image_url || 'https://vupaclakcmrkzmrgmfou.supabase.co/storage/v1/object/public/brand-assets/placeholder.png',
                safe_slug: b.slug || (b.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            }));

            // FORGIVING MAPPER: Models
            const mappedModels = (mData || []).map((m: any) => ({
                ...m,
                name: m.name || 'Unnamed Model',
                description: m.description || m.description_text || '',
                image_url: m.image_url || 'https://placehold.co/400x300?text=No+Image'
            }));

            setBrands(mappedBrands);
            setModels(mappedModels);
        } catch (err: any) {
            console.error("🚨 Hook Fetch Failure:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const organized = useMemo(() => {
        const specialNames = ["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Default", "Generic"];

        const specialPlatforms = brands
            .filter(b => specialNames.some(sn => b.name.includes(sn)))
            .sort((a, b) => {
                const p = ["Generic", "Default", "Misc"];
                const ai = p.findIndex(s => a.name.includes(s));
                const bi = p.findIndex(s => b.name.includes(s));
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.name.localeCompare(b.name);
            });

        const brandList = brands
            .filter(b => !specialNames.some(sn => b.name.includes(sn)))
            .sort((a, b) => a.name.localeCompare(b.name));

        const group1 = brandList.filter(b => {
            const first = b.name?.[0]?.toUpperCase() || '';
            return (first >= 'A' && first <= 'I') || (first >= '0' && first <= '9');
        });

        const group2 = brandList.filter(b => {
            const first = b.name?.[0]?.toUpperCase() || '';
            return first >= 'J' && first <= 'R';
        });

        const group3 = brandList.filter(b => {
            const first = b.name?.[0]?.toUpperCase() || '';
            return first >= 'S' && first <= 'Z';
        });

        const modelGroups: Record<string, Model[]> = {};
        models.forEach(m => {
            const brand = brands.find(b => b.id === m.brand_id);
            const brandName = brand ? brand.name : "Unknown Brand";
            if (!modelGroups[brandName]) modelGroups[brandName] = [];
            modelGroups[brandName].push(m);
        });

        return {
            special: specialPlatforms,
            groupedBrands: { group1, group2, group3 },
            groupedModels: modelGroups
        };
    }, [brands, models]);

    return {
        ...organized,
        brands,
        models,
        loading: isLoading,
        error,
        refresh: fetchData
    };
}
