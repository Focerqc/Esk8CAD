import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';

export function useBrandHardware(platformSelected: string[]) {
    const [models, setModels] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchHardware() {
            if (!platformSelected || platformSelected.length === 0) {
                if (isMounted) {
                    setModels([]);
                    setYears([]);
                }
                return;
            }

            const platform = platformSelected[0];
            const genericPlatforms = ["Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "Miscellaneous"];

            if (genericPlatforms.includes(platform)) {
                if (isMounted) {
                    setModels([]);
                    setYears([]);
                }
                return;
            }

            const client = getSupabaseClient();
            if (!client) return;

            setIsLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await client
                    .from('parts')
                    .select('board_model, release_year')
                    .contains('platform', [platform]);

                if (fetchError) throw fetchError;

                if (isMounted && data) {
                    const uniqueModels = Array.from(new Set(data.map(d => d.board_model).filter(Boolean))) as string[];
                    const uniqueYears = Array.from(new Set(data.map(d => d.release_year).filter(Boolean))) as number[];

                    setModels(uniqueModels.sort((a, b) => a.localeCompare(b)));
                    setYears(uniqueYears.sort((a, b) => b - a)); // Descending
                }
            } catch (err: any) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchHardware();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [platformSelected.join(',')]);

    return { models, years, isLoading, error };
}
