import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function useFilterUrlSync(
    activeFilters: Record<string, any>, 
    searchTerm: string, 
    setActiveFilters: Dispatch<SetStateAction<Record<string, any>>>, 
    setSearchTerm: Dispatch<SetStateAction<string>>
) {
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. Parse on Mount
    useEffect(() => {
        if (isInitialized) return;
        
        const params = new URLSearchParams(window.location.search);
        const newFilters: Record<string, any> = {};
        let initialSearchTerm = '';

        for (const [key, val] of params.entries()) {
            if (!val) continue;

            if (key === 'search') {
                initialSearchTerm = val;
                continue;
            }

            // Map old 'brand' / 'category' params gracefully if they were passed
            const formattedKey = (key.toLowerCase() === 'brand') ? 'Brand' : 
                                 (key.toLowerCase() === 'category') ? 'Category' : key;

            if (formattedKey.endsWith('_min')) {
                const baseKey = formattedKey.replace('_min', '');
                if (!newFilters[baseKey]) newFilters[baseKey] = {};
                newFilters[baseKey].min = parseFloat(val);
            } else if (formattedKey.endsWith('_max')) {
                const baseKey = formattedKey.replace('_max', '');
                if (!newFilters[baseKey]) newFilters[baseKey] = {};
                newFilters[baseKey].max = parseFloat(val);
            } else if (val.startsWith('{') && val.endsWith('}')) {
                try {
                    newFilters[formattedKey] = JSON.parse(val);
                } catch {
                    newFilters[formattedKey] = [val];
                }
            } else {
                // Split enumerations by comma
                newFilters[formattedKey] = val.split(',');
            }
        }

        if (Object.keys(newFilters).length > 0) {
            setActiveFilters(newFilters);
        }
        if (initialSearchTerm) {
            setSearchTerm(initialSearchTerm);
        }
        
        setIsInitialized(true);
    }, [isInitialized, setActiveFilters, setSearchTerm]);

    // 2 & 3. Update & Clean URL
    useEffect(() => {
        if (!isInitialized) return;

        const params = new URLSearchParams();
        
        if (searchTerm) params.set('search', searchTerm);

        for (const [key, value] of Object.entries(activeFilters)) {
            if (value === undefined || value === null) continue;
            
            if (Array.isArray(value)) {
                if (value.length > 0) params.set(key, value.join(','));
            } else if (typeof value === 'object') {
                if (key === 'Bearing Size' || value._type === 'bearing_size') {
                    params.set(key, JSON.stringify(value));
                } else {
                    if (value.min !== undefined && !isNaN(value.min)) params.set(`${key}_min`, String(value.min));
                    if (value.max !== undefined && !isNaN(value.max)) params.set(`${key}_max`, String(value.max));
                }
            } else {
                params.set(key, String(value));
            }
        }

        const newSearch = params.toString();
        const currentUrl = window.location.pathname;
        const newUrl = newSearch ? `${currentUrl}?${newSearch}` : currentUrl;
        
        window.history.replaceState({}, '', newUrl);
    }, [activeFilters, searchTerm, isInitialized]);
}
